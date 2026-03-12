const db = require('../../config/database');

class VacacionesRepository {
    async findAllByEmpleado(empleadoId) {
        const [rows] = await db.query(
            `SELECT v.*, e.nombres, e.apellido_paterno, e.numero_empleado
             FROM rh_vacaciones v
             JOIN empleados e ON v.empleado_id = e.id
             WHERE v.empleado_id = ? AND v.activo = true
             ORDER BY v.fecha_creacion DESC`,
            [empleadoId]
        );
        return rows;
    }

    async findAllByJefe(jefeId, companyId) {
        const [rows] = await db.query(
            `SELECT v.*, e.nombres, e.apellido_paterno, e.numero_empleado
             FROM rh_vacaciones v
             JOIN empleados e ON v.empleado_id = e.id
             WHERE e.jefe_inmediato_id = ?
               AND e.company_id = ?
               AND v.activo = true
             ORDER BY v.fecha_creacion DESC`,
            [jefeId, companyId]
        );
        return rows;
    }

    async findAllSinJefe(companyId) {
        const [rows] = await db.query(
            `SELECT v.*, e.nombres, e.apellido_paterno, e.numero_empleado
             FROM rh_vacaciones v
             JOIN empleados e ON v.empleado_id = e.id
             WHERE e.jefe_inmediato_id IS NULL
               AND e.company_id = ?
               AND v.activo = true
             ORDER BY v.fecha_creacion DESC`,
            [companyId]
        );
        return rows;
    }

    async countSubordinados(jefeId, companyId) {
        const [rows] = await db.query(
            `SELECT COUNT(*) as total
             FROM empleados
             WHERE jefe_inmediato_id = ?
               AND company_id = ?
               AND activo = true`,
            [jefeId, companyId]
        );
        return rows[0]?.total || 0;
    }

    async findAll() {
        const [rows] = await db.query(
            `SELECT v.*, e.nombres, e.apellido_paterno, e.numero_empleado
             FROM rh_vacaciones v
             JOIN empleados e ON v.empleado_id = e.id
             WHERE v.activo = true
             ORDER BY v.fecha_creacion DESC`
        );
        return rows;
    }

    async findAllByCompany(companyId) {
        const [rows] = await db.query(
            `SELECT v.*, e.nombres, e.apellido_paterno, e.numero_empleado
             FROM rh_vacaciones v
             JOIN empleados e ON v.empleado_id = e.id
             WHERE v.company_id = ? AND v.activo = true
             ORDER BY v.fecha_creacion DESC`,
            [companyId]
        );
        return rows;
    }

    async findById(id) {
        const [rows] = await db.query('SELECT * FROM rh_vacaciones WHERE id = ? AND activo = true', [id]);
        return rows[0];
    }

    async create(solicitud) {
        const query = `
            INSERT INTO rh_vacaciones (id, company_id, empleado_id, fecha_inicio, fecha_fin, dias_solicitados, comentarios)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            solicitud.id,
            solicitud.company_id,
            solicitud.empleado_id,
            solicitud.fecha_inicio,
            solicitud.fecha_fin,
            solicitud.dias_solicitados,
            solicitud.comentarios,
        ];

        await db.query(query, values);
        return this.findById(solicitud.id);
    }

    async updateEstado(id, estado, aprobadorId, comentariosAprobador) {
        const query = `
            UPDATE rh_vacaciones
            SET estado = ?, aprobador_id = ?, comentarios_aprobador = ?
            WHERE id = ? AND activo = true
        `;

        await db.query(query, [estado, aprobadorId, comentariosAprobador, id]);
        return this.findById(id);
    }

    async getDiasConsumidos(empleadoId, year) {
        const query = `
            SELECT SUM(dias_solicitados) as consumidos
            FROM rh_vacaciones
            WHERE empleado_id = ?
              AND estado IN ('Pendiente', 'Aprobada')
              AND YEAR(fecha_inicio) = ?
              AND activo = true
        `;

        const [rows] = await db.query(query, [empleadoId, year]);
        return rows[0].consumidos || 0;
    }

    async getDiasConsumidosConfirmados(empleadoId, year) {
        const query = `
            SELECT SUM(dias_solicitados) as consumidos
            FROM rh_vacaciones
            WHERE empleado_id = ?
              AND estado = 'Aprobada'
              AND YEAR(fecha_inicio) = ?
              AND activo = true
        `;

        const [rows] = await db.query(query, [empleadoId, year]);
        return rows[0].consumidos || 0;
    }
}

module.exports = new VacacionesRepository();
