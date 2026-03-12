const vacacionesService = require('./vacaciones.service');

class VacacionesController {
    async puedeAprobar(req, res) {
        try {
            const puedeAprobar = await vacacionesService.puedeAprobar(req.usuario);
            res.json({ success: true, data: { puede_aprobar: puedeAprobar } });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async saldo(req, res) {
        try {
            const empleadoId = req.query.empleado_id;
            const anio = req.query.anio ? parseInt(req.query.anio, 10) : undefined;
            const saldo = await vacacionesService.obtenerSaldo(req.usuario, { empleadoId, anio });
            res.json({ success: true, data: saldo });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async listar(req, res) {
        try {
            const companyId = req.usuario.company_id || req.query.company_id;
            const esSuperAdmin = (req.usuario.roles || []).includes('SUPER_ADMIN');
            const scope = req.query.scope || 'mis';
            const solicitudes = await vacacionesService.listar(companyId, esSuperAdmin, req.usuario, scope);
            res.json({ success: true, data: solicitudes });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async solicitar(req, res) {
        try {
            const solicitud = await vacacionesService.solicitar(req.body, req.usuario);
            res.status(201).json({ success: true, data: solicitud });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async responder(req, res) {
        try {
            const { estado, comentarios_aprobador } = req.body;
            const solicitud = await vacacionesService.responder(req.params.id, estado, comentarios_aprobador, req.usuario);
            res.json({ success: true, data: solicitud });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = new VacacionesController();
