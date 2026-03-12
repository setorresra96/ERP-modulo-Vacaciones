const crypto = require('crypto');
const vacacionesRepository = require('./vacaciones.repository');
const empleadoService = require('../rh/services/empleado.service');
const ruleEngine = require('../rh/rule-engine/RuleEngineService');

class VacacionesService {
    _esAdminAprobador(usuarioSesion) {
        const permisos = usuarioSesion.permisos || [];
        const roles = usuarioSesion.roles || [];
        return roles.includes('SUPER_ADMIN') || permisos.includes('RH_ADMIN');
    }

    async puedeAprobar(usuarioSesion) {
        if (!usuarioSesion.company_id) return false;
        const totalSubordinados = await vacacionesRepository.countSubordinados(usuarioSesion.id, usuarioSesion.company_id);
        return totalSubordinados > 0;
    }

    async obtenerSaldo(usuarioSesion, options = {}) {
        const permisos = usuarioSesion.permisos || [];
        const roles = usuarioSesion.roles || [];
        const puedeConsultarOtros = roles.includes('SUPER_ADMIN') || permisos.includes('RH_VER') || permisos.includes('RH_ADMIN');

        const empleadoId = options.empleadoId || usuarioSesion.id;
        if (empleadoId !== usuarioSesion.id && !puedeConsultarOtros) {
            throw new Error('No tienes permisos para consultar el saldo de otro empleado');
        }

        const empleado = await empleadoService.obtener(empleadoId);

        if (usuarioSesion.company_id && empleado.company_id !== usuarioSesion.company_id) {
            throw new Error('No puedes consultar saldo de empleados de otra empresa');
        }

        const anio = options.anio || new Date().getFullYear();
        return this._calcularSaldoInterno(empleado, anio, { soloConfirmadas: true });
    }

    async listar(companyId, esSuperAdmin = false, usuarioSesion, scope = 'mis') {
        if (scope === 'aprobaciones') {
            const autorizado = await this.puedeAprobar(usuarioSesion);
            if (autorizado) {
                return vacacionesRepository.findAllByJefe(usuarioSesion.id, usuarioSesion.company_id);
            }

            if (this._esAdminAprobador(usuarioSesion)) {
                return vacacionesRepository.findAllSinJefe(usuarioSesion.company_id);
            }

            return [];
        }

        if (!usuarioSesion?.id && !esSuperAdmin) {
            throw new Error('Usuario no válido');
        }

        if (usuarioSesion?.id) {
            return vacacionesRepository.findAllByEmpleado(usuarioSesion.id);
        }

        if (!companyId && esSuperAdmin) {
            return vacacionesRepository.findAll();
        }

        if (!companyId) {
            throw new Error('Company ID es requerido');
        }

        return vacacionesRepository.findAllByCompany(companyId);
    }

    async solicitar(data, usuarioSesion) {
        const empleadoId = data.empleado_id || usuarioSesion.id;
        const empleado = await empleadoService.obtener(empleadoId);

        if (usuarioSesion.company_id && empleado.company_id !== usuarioSesion.company_id) {
            throw new Error('No puedes solicitar vacaciones para un empleado de otra empresa');
        }

        if (!data.fecha_inicio || !data.fecha_fin || !data.dias_solicitados) {
            throw new Error('Faltan datos obligatorios para la solicitud');
        }

        const anioActual = new Date(data.fecha_inicio).getFullYear();
        const saldo = await this._calcularSaldoInterno(empleado, anioActual, { soloConfirmadas: false });
        const saldoDisponible = saldo.dias_disponibles;
        if (data.dias_solicitados > saldoDisponible) {
            throw new Error(`Días insuficientes. Tienes ${saldoDisponible} días disponibles y solicitaste ${data.dias_solicitados}`);
        }

        const solicitud = {
            id: crypto.randomUUID(),
            company_id: empleado.company_id,
            empleado_id: empleado.id,
            fecha_inicio: data.fecha_inicio,
            fecha_fin: data.fecha_fin,
            dias_solicitados: data.dias_solicitados,
            comentarios: data.comentarios,
        };

        return vacacionesRepository.create(solicitud);
    }

    async responder(id, estado, comentariosAprobador, usuarioSesion) {
        const permitidos = ['Aprobada', 'Rechazada', 'Cancelada'];
        if (!permitidos.includes(estado)) {
            throw new Error('Estado no válido');
        }

        const solicitud = await vacacionesRepository.findById(id);
        if (!solicitud) {
            throw new Error('Solicitud no encontrada');
        }

        const empleadoSolicitante = await empleadoService.obtener(solicitud.empleado_id);
        const esJefeInmediato = empleadoSolicitante.jefe_inmediato_id === usuarioSesion.id;
        const esAdminFallback = !empleadoSolicitante.jefe_inmediato_id && this._esAdminAprobador(usuarioSesion);
        if (!esJefeInmediato && !esAdminFallback) {
            throw new Error('Solo el jefe inmediato del empleado puede autorizar esta solicitud');
        }

        if (usuarioSesion.company_id && solicitud.company_id !== usuarioSesion.company_id) {
            throw new Error('No puedes aprobar solicitudes de otra empresa');
        }

        return vacacionesRepository.updateEstado(id, estado, usuarioSesion.id, comentariosAprobador);
    }

    async _calcularSaldoInterno(empleado, anio, options = {}) {
        const { soloConfirmadas = false } = options;
        const diasAsignados = await ruleEngine.calcularVacacionesDisponibles(empleado);
        const diasConsumidos = soloConfirmadas
            ? await vacacionesRepository.getDiasConsumidosConfirmados(empleado.id, anio)
            : await vacacionesRepository.getDiasConsumidos(empleado.id, anio);
        const diasDisponibles = Math.max(0, diasAsignados - diasConsumidos);
        const antiguedadAnios = ruleEngine.calcularAntiguedad(empleado.fecha_ingreso);

        return {
            empleado_id: empleado.id,
            company_id: empleado.company_id,
            anio,
            antiguedad_anios: antiguedadAnios,
            dias_asignados: diasAsignados,
            dias_consumidos: diasConsumidos,
            dias_disponibles: diasDisponibles,
        };
    }
}

module.exports = new VacacionesService();
