const pool = require('./database');

/**
 * Inicializa la base de datos al arrancar el backend.
 * Crea las tablas si no existen (CREATE TABLE IF NOT EXISTS).
 * Inserta datos semilla si las tablas están vacías.
 * Nunca destruye datos existentes.
 */
const inicializarBaseDeDatos = async () => {
    const conn = await pool.getConnection();

    try {
        console.log('🔧 Verificando estructura de base de datos...');

        // ────────────────────────────────────────────────
        // TABLAS DE AUTENTICACIÓN
        // ────────────────────────────────────────────────

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS empleados (
                id INT AUTO_INCREMENT PRIMARY KEY,
                numero_empleado VARCHAR(20) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                nombres VARCHAR(100) NOT NULL,
                apellido_paterno VARCHAR(100) NOT NULL,
                apellido_materno VARCHAR(100),
                fecha_nacimiento DATE NOT NULL,
                fecha_ingreso DATE NOT NULL,
                estatus ENUM('ACTIVO','INACTIVO','BLOQUEADO') DEFAULT 'ACTIVO',
                intentos_fallidos INT DEFAULT 0,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(50) UNIQUE NOT NULL,
                descripcion TEXT,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS permisos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                modulo VARCHAR(50) NOT NULL,
                accion VARCHAR(50) NOT NULL,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uk_modulo_accion (modulo, accion)
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS rol_permisos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                rol_id INT NOT NULL,
                permiso_id INT NOT NULL,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (rol_id) REFERENCES roles(id),
                FOREIGN KEY (permiso_id) REFERENCES permisos(id),
                UNIQUE KEY uk_rol_permiso (rol_id, permiso_id)
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS usuario_roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                rol_id INT NOT NULL,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES empleados(id),
                FOREIGN KEY (rol_id) REFERENCES roles(id),
                UNIQUE KEY uk_usuario_rol (usuario_id, rol_id)
            )
        `);

        // ────────────────────────────────────────────────
        // TABLAS DE LANDING
        // ────────────────────────────────────────────────

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS landing_secciones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                contenido TEXT,
                imagen_url VARCHAR(500),
                orden INT DEFAULT 0,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // ────────────────────────────────────────────────
        // TABLAS DE INTRANET
        // ────────────────────────────────────────────────

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS comunicados (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(150) NOT NULL,
                descripcion TEXT,
                imagen_url VARCHAR(255),
                fecha_inicio DATE,
                fecha_fin DATE,
                activo BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS favoritos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                modulo VARCHAR(50) NOT NULL,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES empleados(id),
                UNIQUE KEY uk_usuario_modulo (usuario_id, modulo)
            )
        `);

        // ────────────────────────────────────────────────
        // TABLAS DE DIRECTORIO
        // ────────────────────────────────────────────────

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS directorio (
                id INT AUTO_INCREMENT PRIMARY KEY,
                numero_empleado VARCHAR(20) UNIQUE NOT NULL,
                nombre VARCHAR(150) NOT NULL,
                area VARCHAR(100) NOT NULL,
                oficina VARCHAR(100),
                telefono VARCHAR(20),
                extension VARCHAR(10),
                celular VARCHAR(20),
                correo VARCHAR(150),
                jefe_id INT NULL,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Agregar correo si la tabla ya existía sin esa columna
        try {
            await conn.execute('ALTER TABLE directorio ADD COLUMN correo VARCHAR(150) NULL AFTER celular');
        } catch (e) { if (e.errno !== 1060) throw e; }

        // Agregar jefe_id si la tabla ya existía sin esa columna
        try {
            await conn.execute(`
                ALTER TABLE directorio
                ADD COLUMN jefe_id INT NULL,
                ADD CONSTRAINT fk_directorio_jefe FOREIGN KEY (jefe_id) REFERENCES directorio(id) ON DELETE SET NULL
            `);
        } catch (e) {
            if (e.errno !== 1060 && e.errno !== 1826 && e.errno !== 1061) throw e;
        }

        // ────────────────────────────────────────────────
        // TABLAS DE E-LEARNING
        // ────────────────────────────────────────────────

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS contenido (
                id                        INT AUTO_INCREMENT PRIMARY KEY,
                nomenclatura              VARCHAR(50) UNIQUE NOT NULL,
                titulo                    VARCHAR(255) NOT NULL,
                resumen                   TEXT,
                tipo_contenido            ENUM('MANUAL','PROCEDIMIENTO','DIAGRAMA','FORMATO','REGISTRO','DOCUMENTO_ESTRATEGICO') NOT NULL,
                area                      VARCHAR(100) NOT NULL,
                formato                   ENUM('PDF','WORD','EXCEL','IMAGEN','VIDEO','AUDIO','URL_EXTERNA') DEFAULT 'PDF',
                archivo_url               VARCHAR(500),
                version                   INT DEFAULT 1,
                estatus                   ENUM('ACTIVO','INACTIVO') DEFAULT 'ACTIVO',
                subido_por                INT,
                justificacion_inactivacion TEXT,
                fecha_inactivacion        DATETIME,
                activo                    BOOLEAN DEFAULT TRUE,
                created_at                DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion       DATETIME ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (subido_por) REFERENCES empleados(id) ON DELETE SET NULL
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS contenido_autorizadores (
                id             INT AUTO_INCREMENT PRIMARY KEY,
                contenido_id   INT NOT NULL,
                empleado_id    INT NOT NULL,
                fecha_autorizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                activo         BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (contenido_id) REFERENCES contenido(id) ON DELETE CASCADE,
                FOREIGN KEY (empleado_id)  REFERENCES empleados(id) ON DELETE CASCADE
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS contenido_log (
                id           INT AUTO_INCREMENT PRIMARY KEY,
                contenido_id INT NOT NULL,
                usuario_id   INT,
                accion       ENUM('CREACION','VERSION','INACTIVACION','REACTIVACION','DESCARGA','RELACION') NOT NULL,
                descripcion  TEXT,
                fecha        DATETIME DEFAULT CURRENT_TIMESTAMP,
                activo       BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (contenido_id) REFERENCES contenido(id) ON DELETE CASCADE,
                FOREIGN KEY (usuario_id)   REFERENCES empleados(id) ON DELETE SET NULL
            )
        `);

        // Migración: Asegurarse de que el enum acepta RELACION y REACTIVACION para las tablas existentes
        try {
            await conn.execute("ALTER TABLE contenido_log MODIFY COLUMN accion ENUM('CREACION','VERSION','INACTIVACION','REACTIVACION','DESCARGA','RELACION') NOT NULL");
        } catch (e) {
            console.warn('  ⚠️ No se pudo migrar el enum de contenido_log:', e.message);
        }

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS contenido_relacionados (
                id INT AUTO_INCREMENT PRIMARY KEY,
                contenido_id INT NOT NULL,
                relacionado_id INT NOT NULL,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (contenido_id) REFERENCES contenido(id) ON DELETE CASCADE,
                FOREIGN KEY (relacionado_id) REFERENCES contenido(id) ON DELETE CASCADE,
                UNIQUE(contenido_id, relacionado_id)
            )
        `);

        // Migración: Asegurarse de que el enum acepta URL_EXTERNA para las tablas existentes
        try {
            await conn.execute("ALTER TABLE contenido MODIFY COLUMN formato ENUM('PDF','WORD','EXCEL','IMAGEN','VIDEO','AUDIO','URL_EXTERNA') NOT NULL DEFAULT 'PDF'");
        } catch (e) {
            // Ignorar errores en caso de que la tabla esté bloqueada o ya esté migrado, 
            // aunque el alter de un enum suele ser seguro si no eliminamos opciones.
        }

        // ────────────────────────────────────────────────
        // TABLAS DE CALCULADORA ROI
        // ────────────────────────────────────────────────

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS roi_verticales (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL UNIQUE,
                descripcion TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS roi_portafolios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                descripcion TEXT,
                id_vertical INT NOT NULL,
                FOREIGN KEY (id_vertical) REFERENCES roi_verticales(id)
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS roi_conceptos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                descripcion TEXT,
                unidad_medicion VARCHAR(20),
                tipo_costo_default VARCHAR(20) DEFAULT 'CAPEX',
                costo_unitario_default DECIMAL(15,2) DEFAULT 0.00,
                precio_unitario_default DECIMAL(15,2) DEFAULT 0.00,
                moneda VARCHAR(3) DEFAULT 'USD',
                es_paquete BOOLEAN DEFAULT FALSE,
                id_vertical INT,
                id_portafolio INT,
                activo BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (id_vertical) REFERENCES roi_verticales(id) ON DELETE SET NULL,
                FOREIGN KEY (id_portafolio) REFERENCES roi_portafolios(id) ON DELETE SET NULL
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS roi_paquete_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_paquete INT NOT NULL,
                id_item INT NOT NULL,
                cantidad DECIMAL(10,2) DEFAULT 1.00,
                FOREIGN KEY (id_paquete) REFERENCES roi_conceptos(id) ON DELETE CASCADE,
                FOREIGN KEY (id_item) REFERENCES roi_conceptos(id)
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS roi_clientes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                empresa VARCHAR(100),
                email VARCHAR(100),
                telefono VARCHAR(20),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS roi_empresas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                rfc VARCHAR(20),
                direccion TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS roi_cotizaciones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_cliente INT,
                id_empresa INT,
                id_vendedor INT,
                fecha DATE DEFAULT NULL,
                vigencia_dias INT DEFAULT 30,
                margen_pct DECIMAL(5,2) DEFAULT 0.00,
                tipo_cambio DECIMAL(10,4) DEFAULT 1.0000,
                moneda VARCHAR(3) DEFAULT 'MXN',
                notas TEXT,
                estatus VARCHAR(20) DEFAULT 'borrador',
                total_capex DECIMAL(15,2) DEFAULT 0.00,
                total_opex_mensual DECIMAL(15,2) DEFAULT 0.00,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_cliente) REFERENCES roi_clientes(id),
                FOREIGN KEY (id_empresa) REFERENCES roi_empresas(id)
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS roi_cotizacion_partidas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_cotizacion INT NOT NULL,
                id_concepto INT,
                descripcion TEXT,
                cantidad DECIMAL(10,2) DEFAULT 1.00,
                costo_unitario DECIMAL(15,2) DEFAULT 0.00,
                precio_unitario DECIMAL(15,2) DEFAULT 0.00,
                tipo_costo VARCHAR(20),
                periodo_meses INT DEFAULT 1,
                FOREIGN KEY (id_cotizacion) REFERENCES roi_cotizaciones(id) ON DELETE CASCADE,
                FOREIGN KEY (id_concepto) REFERENCES roi_conceptos(id)
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS roi_proyectos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre_proyecto VARCHAR(255),
                id_paquete INT,
                tipo_cambio DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
                margen DECIMAL(5,2) NOT NULL DEFAULT 0.00,
                costo_financiero DECIMAL(5,2) NOT NULL DEFAULT 0.00,
                meses_recuperacion INT NOT NULL DEFAULT 12,
                pago_inicial DECIMAL(15,2) DEFAULT 0.00,
                estado VARCHAR(20) DEFAULT 'BORRADOR',
                observaciones TEXT,
                id_usuario_creador INT,
                id_usuario_autoriza INT,
                escenarios_data JSON,
                fecha_autorizacion DATETIME,
                indice_seleccionado INT DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (id_paquete) REFERENCES roi_conceptos(id) ON DELETE SET NULL
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS roi_proyecto_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_proyecto_roi INT NOT NULL,
                id_concepto INT NOT NULL,
                cantidad INT NOT NULL DEFAULT 1,
                precio_usd DECIMAL(10,2),
                categoria VARCHAR(20) NOT NULL,
                amortizar BOOLEAN NOT NULL DEFAULT FALSE,
                pago_contado BOOLEAN NOT NULL DEFAULT FALSE,
                FOREIGN KEY (id_proyecto_roi) REFERENCES roi_proyectos(id) ON DELETE CASCADE,
                FOREIGN KEY (id_concepto) REFERENCES roi_conceptos(id)
            )
        `);

        console.log('  ✅ Tablas verificadas');

        // ────────────────────────────────────────────────
        // TABLAS DE CRM
        // ────────────────────────────────────────────────

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS crm_clientes (
                id CHAR(36) PRIMARY KEY ,
                razon_social VARCHAR(255) NOT NULL,
                rfc VARCHAR(20),
                regimen_fiscal VARCHAR(100),
                direccion_fiscal TEXT,
                condiciones_pago TEXT,
                forma_pago VARCHAR(50),
                metodo_pago VARCHAR(50),
                moneda VARCHAR(10) DEFAULT 'MXN',
                limite_credito DECIMAL(15,2) DEFAULT 0.00,
                nombre_representante_legal VARCHAR(255),
                id_identificacion_pdf VARCHAR(500),
                id_acta_pdf VARCHAR(500),
                id_poderes_pdf VARCHAR(500),
                id_csf_pdf VARCHAR(500),
                id_contratos_pdf VARCHAR(500),
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS crm_prospectos (
                id CHAR(36) PRIMARY KEY ,
                tipo ENUM('nuevo', 'cliente_existente') DEFAULT 'nuevo',
                empresa_nombre VARCHAR(255) NOT NULL,
                origen VARCHAR(100),
                industria VARCHAR(100),
                tamano_empresa VARCHAR(50),
                estado_funnel ENUM('Lead', 'Calificado', 'Diagnóstico', 'Propuesta Enviada', 'Negociación', 'Cierre Ganado', 'Cierre Perdido') DEFAULT 'Lead',
                valor_estimado DECIMAL(15,2) DEFAULT 0.00,
                probabilidad_cierre DECIMAL(5,2) DEFAULT 0.00,
                owner_id INT,
                cliente_id CHAR(36),
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES empleados(id) ON DELETE SET NULL,
                FOREIGN KEY (cliente_id) REFERENCES crm_clientes(id) ON DELETE SET NULL
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS crm_contactos (
                id CHAR(36) PRIMARY KEY ,
                prospecto_id CHAR(36) NOT NULL,
                nombre VARCHAR(150) NOT NULL,
                cargo VARCHAR(100),
                telefono VARCHAR(30),
                celular VARCHAR(30),
                correo VARCHAR(150),
                es_principal BOOLEAN DEFAULT FALSE,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (prospecto_id) REFERENCES crm_prospectos(id) ON DELETE CASCADE
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS crm_oportunidades (
                id CHAR(36) PRIMARY KEY ,
                prospecto_id CHAR(36) NOT NULL,
                tipo ENUM('paquete', 'proyecto') NOT NULL,
                descripcion TEXT,
                monto DECIMAL(15,2) DEFAULT 0.00,
                margen_estimado DECIMAL(5,2) DEFAULT 0.00,
                fecha_cierre_estimada DATE,
                estado ENUM('Borrador', 'Propuesta', 'Negociación', 'Aceptada', 'Rechazada') DEFAULT 'Borrador',
                contrato_generado BOOLEAN DEFAULT FALSE,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (prospecto_id) REFERENCES crm_prospectos(id) ON DELETE CASCADE
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS crm_sitios (
                id CHAR(36) PRIMARY KEY ,
                cliente_id CHAR(36) NOT NULL,
                nombre_sitio VARCHAR(150) NOT NULL,
                linea_negocio VARCHAR(100),
                identificador_interno VARCHAR(50),
                identificador_cliente VARCHAR(50),
                direccion TEXT,
                latitud DECIMAL(10,8),
                longitud DECIMAL(11,8),
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (cliente_id) REFERENCES crm_clientes(id) ON DELETE CASCADE
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS crm_notas (
                id CHAR(36) PRIMARY KEY ,
                entidad_tipo VARCHAR(50) NOT NULL,
                entidad_id CHAR(36) NOT NULL,
                contenido TEXT NOT NULL,
                creado_por INT NOT NULL,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (creado_por) REFERENCES empleados(id)
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS crm_audit_log (
                id CHAR(36) PRIMARY KEY ,
                entidad VARCHAR(50) NOT NULL,
                entidad_id CHAR(36) NOT NULL,
                campo_modificado VARCHAR(100) NOT NULL,
                valor_anterior TEXT,
                valor_nuevo TEXT,
                modificado_por INT NOT NULL,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (modificado_por) REFERENCES empleados(id)
            )
        `);



        // ────────────────────────────────────────────────
        // DATOS SEMILLA (solo si las tablas están vacías)
        // ────────────────────────────────────────────────

        // Roles base
        const [rolesExistentes] = await conn.execute('SELECT COUNT(*) as total FROM roles');
        if (rolesExistentes[0].total === 0) {
            await conn.execute(`
                INSERT INTO roles (nombre, descripcion) VALUES
                    ('SUPER_ADMIN', 'Acceso total al sistema, gestión de usuarios y seguridad'),
                    ('ADMIN', 'Administrador general de módulos operativos'),
                    ('EMPLEADO', 'Usuario empleado estándar')
            `);
            console.log('  📦 Roles semilla insertados');
        }

        // Permisos base – INSERT IGNORE para no duplicar si ya existen
        // Formato estándar: MODULO_ACCION (mayúsculas, guión bajo)
        await conn.execute(`
            INSERT IGNORE INTO permisos (modulo, accion) VALUES
                ('LANDING',    'VER'),
                ('LANDING',    'CREAR'),
                ('LANDING',    'EDITAR'),
                ('LANDING',    'DESACTIVAR'),
                ('AUTH',       'VER'),
                ('SEGURIDAD',  'VER'),
                ('SEGURIDAD',  'GESTIONAR'),
                ('DIRECTORIO', 'VER'),
                ('DIRECTORIO', 'CREAR'),
                ('DIRECTORIO', 'EDITAR'),
                ('DIRECTORIO', 'DESACTIVAR'),
                ('COMUNICADOS','VER'),
                ('COMUNICADOS','CREAR'),
                ('COMUNICADOS','EDITAR'),
                ('COMUNICADOS','DESACTIVAR'),
                ('INTRANET',   'VER'),
                ('ELEARNING',  'VER'),
                ('ELEARNING',  'GESTIONAR'),
                ('app',        'elearning'),
                ('ROI',        'VER'),
                ('ROI',        'CREAR'),
                ('ROI',        'EDITAR'),
                ('ROI',        'AUTORIZAR'),
                ('ROI',        'DESACTIVAR'),
                ('ROI',        'ADMIN'),
                ('app',        'roi'),
                ('CRM',        'VER'),
                ('CRM',        'CREAR'),
                ('CRM',        'EDITAR'),
                ('CRM',        'DESACTIVAR'),
                ('app',        'crm'),
                ('RH',         'VER'),
                ('RH',         'CREAR'),
                ('RH',         'EDITAR'),
                ('RH',         'APROBAR'),
                ('RH',         'EMPRESA_ADMIN'),
                ('app',        'rh'),
                ('CONFIGURACION', 'VER'),
                ('CONFIGURACION', 'CREAR'),
                ('CONFIGURACION', 'EDITAR'),
                ('CONFIGURACION', 'DESACTIVAR'),
                ('app',        'configuracion')
        `);


        // Empleado administrador de prueba
        const [empExistentes] = await conn.execute('SELECT COUNT(*) as total FROM empleados');
        if (empExistentes[0].total === 0) {
            // Hash bcrypt verificado de 'Admin123!' con saltRounds=10 (60 chars exactos)
            await conn.execute(`
                INSERT INTO empleados
                    (numero_empleado, password, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_ingreso, estatus)
                VALUES
                    ('EMP001', '$2b$10$vAn6EwSH2kTSJDbfm0dvJevk4qjX.J0fA9d.efjcAueq.p2jvYC5a',
                     'Administrador', 'Sistema', 'ERP', '1990-01-01', '2024-01-01', 'ACTIVO')
            `);

            // Asignar rol SUPER_ADMIN al empleado semilla
            const [rolAdmin] = await conn.execute("SELECT id FROM roles WHERE nombre = 'SUPER_ADMIN' LIMIT 1");
            if (rolAdmin.length > 0) {
                await conn.execute(
                    'INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (LAST_INSERT_ID(), ?)',
                    [rolAdmin[0].id]
                );
            }
            console.log('  📦 Empleado admin semilla insertado (EMP001 / Admin123!)');
        }

        // Asignar TODOS los permisos al rol SUPER_ADMIN en rol_permisos
        // (así se incluyen en el JWT via obtenerRolesYPermisos → rol_permisos JOIN)
        try {
            const [[rolSA]] = await conn.execute("SELECT id FROM roles WHERE nombre = 'SUPER_ADMIN' LIMIT 1");
            if (rolSA) {
                const [todosPermisos] = await conn.execute('SELECT id FROM permisos WHERE activo = TRUE');
                for (const p of todosPermisos) {
                    await conn.execute(
                        'INSERT IGNORE INTO rol_permisos (rol_id, permiso_id) VALUES (?, ?)',
                        [rolSA.id, p.id]
                    );
                }
                console.log('  🖑 Permisos asignados al rol SUPER_ADMIN');
            }
        } catch (e) {
            console.warn('  ⚠️  No se pudieron asignar permisos al rol:', e.message);
        }

        // ────────────────────────────────────────────────
        // TABLAS DE RECURSOS HUMANOS (RH Enterprise)
        // ────────────────────────────────────────────────

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS rh_empresas (
                id CHAR(36) PRIMARY KEY ,
                razon_social VARCHAR(255) NOT NULL,
                nombre_comercial VARCHAR(255) NOT NULL,
                rfc VARCHAR(20) NOT NULL,
                direccion_fiscal TEXT,
                regimen_fiscal VARCHAR(150),
                pais VARCHAR(100) DEFAULT 'México',
                moneda_base VARCHAR(10) DEFAULT 'MXN',
                logo_url LONGTEXT,
                activa BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Migración por si ya existe pero con logo_url corto
        try {
            await conn.execute('ALTER TABLE rh_empresas MODIFY COLUMN logo_url LONGTEXT');
        } catch (e) { }

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS cfg_areas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                company_id CHAR(36) NOT NULL,
                nombre VARCHAR(100) NOT NULL,
                descripcion TEXT,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES rh_empresas(id) ON DELETE CASCADE
            )
        `);

        // Migración por si ya existe pero con logo_url corto
        try {
            await conn.execute('ALTER TABLE rh_empresas MODIFY COLUMN logo_url LONGTEXT');
        } catch (e) { }

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS rh_paquetes_compensacion (
                id CHAR(36) PRIMARY KEY ,
                company_id CHAR(36) NOT NULL,
                nombre VARCHAR(150) NOT NULL,
                descripcion TEXT,
                activa BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES rh_empresas(id) ON DELETE CASCADE
            )
        `);

        // Migración de la tabla empleados para RH
        const rhColumns = [
            { name: 'company_id', type: 'CHAR(36) NULL' },
            { name: 'paquete_compensacion_id', type: 'CHAR(36) NULL' },
            { name: 'salario_bruto_mensual', type: 'DECIMAL(15,2) NULL' },
            { name: 'salario_diario_integrado', type: 'DECIMAL(15,2) NULL' },
            { name: 'numero_seguridad_social', type: 'VARCHAR(50) NULL' },
            { name: 'fecha_nacimiento', type: 'DATE NULL' },
            { name: 'rfc', type: 'VARCHAR(13) NULL' },
            { name: 'curp', type: 'VARCHAR(18) NULL' },
            { name: 'estatus', type: 'ENUM("ACTIVO", "INACTIVO", "BLOQUEADO") DEFAULT "ACTIVO"' },
            { name: 'puesto', type: 'VARCHAR(150) NULL' },
            { name: 'area_id', type: 'INT NULL' },
            { name: 'jefe_inmediato_id', type: 'INT NULL' },
            { name: 'tipo_contrato', type: 'VARCHAR(100) NULL' },
            { name: 'modalidad', type: 'VARCHAR(50) NULL' },
            { name: 'fecha_baja', type: 'DATE NULL' },
            { name: 'motivo_baja', type: 'VARCHAR(255) NULL' },
            { name: 'salario_base', type: 'DECIMAL(15,2) NULL' },
            { name: 'frecuencia_pago', type: 'VARCHAR(50) NULL' },
            { name: 'banco', type: 'VARCHAR(100) NULL' },
            { name: 'cuenta_bancaria', type: 'VARCHAR(50) NULL' },
            { name: 'clabe', type: 'VARCHAR(50) NULL' },
            { name: 'bono_variable', type: 'DECIMAL(15,2) NULL' },
            { name: 'esquema_beneficios_personalizados', type: 'JSON NULL' },
            { name: 'correo_corporativo', type: 'VARCHAR(150) NULL' },
            { name: 'telefono_personal', type: 'VARCHAR(50) NULL' },
            { name: 'telefono_emergencia', type: 'VARCHAR(50) NULL' },
            { name: 'contacto_emergencia', type: 'VARCHAR(150) NULL' },
            { name: 'celular_empresa', type: 'VARCHAR(50) NULL' },
            { name: 'telefono_oficina', type: 'VARCHAR(50) NULL' },
            { name: 'extension', type: 'VARCHAR(20) NULL' }
        ];

        for (const col of rhColumns) {
            try {
                await conn.execute(`ALTER TABLE empleados ADD COLUMN ${col.name} ${col.type}`);
            } catch (e) { if (e.errno !== 1060) throw e; }
        }

        // Constraints para empleados
        try {
            await conn.execute('ALTER TABLE empleados ADD CONSTRAINT fk_empleado_empresa FOREIGN KEY (company_id) REFERENCES rh_empresas(id) ON DELETE SET NULL');
        } catch (e) { if (e.errno !== 1826 && e.errno !== 1061 && e.errno !== 1022) throw e; }

        try {
            await conn.execute('ALTER TABLE empleados ADD CONSTRAINT fk_empleado_paquete FOREIGN KEY (paquete_compensacion_id) REFERENCES rh_paquetes_compensacion(id) ON DELETE SET NULL');
        } catch (e) { if (e.errno !== 1826 && e.errno !== 1061 && e.errno !== 1022) throw e; }

        try {
            await conn.execute('ALTER TABLE empleados ADD CONSTRAINT fk_empleados_jefe_inmediato FOREIGN KEY (jefe_inmediato_id) REFERENCES empleados(id) ON DELETE SET NULL');
        } catch (e) { if (e.errno !== 1826 && e.errno !== 1061 && e.errno !== 1022) throw e; }

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS rh_paquete_atributos (
                id CHAR(36) PRIMARY KEY ,
                paquete_id CHAR(36) NOT NULL,
                tipo_parametro VARCHAR(100) NOT NULL,
                valor JSON,
                formula TEXT,
                obligatorio BOOLEAN DEFAULT FALSE,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (paquete_id) REFERENCES rh_paquetes_compensacion(id) ON DELETE CASCADE
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS rh_historial_laboral (
                id CHAR(36) PRIMARY KEY ,
                company_id CHAR(36) NOT NULL,
                empleado_id INT NOT NULL,
                tipo_cambio VARCHAR(100) NOT NULL,
                valor_anterior TEXT,
                valor_nuevo TEXT,
                usuario_modifico INT,
                fecha_cambio DATETIME DEFAULT CURRENT_TIMESTAMP,
                activo BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (company_id) REFERENCES rh_empresas(id) ON DELETE CASCADE,
                FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
                FOREIGN KEY (usuario_modifico) REFERENCES empleados(id) ON DELETE SET NULL
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS rh_vacaciones (
                id CHAR(36) PRIMARY KEY ,
                company_id CHAR(36) NOT NULL,
                empleado_id INT NOT NULL,
                fecha_inicio DATE NOT NULL,
                fecha_fin DATE NOT NULL,
                dias_solicitados INT NOT NULL,
                estado ENUM('Pendiente', 'Aprobada', 'Rechazada', 'Cancelada') DEFAULT 'Pendiente',
                aprobador_id INT,
                comentarios TEXT,
                comentarios_aprobador TEXT,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES rh_empresas(id) ON DELETE CASCADE,
                FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
                FOREIGN KEY (aprobador_id) REFERENCES empleados(id) ON DELETE SET NULL
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS rh_incidencias (
                id CHAR(36) PRIMARY KEY ,
                company_id CHAR(36) NOT NULL,
                empleado_id INT NOT NULL,
                tipo_incidencia VARCHAR(100) NOT NULL,
                fecha_inicio DATE NOT NULL,
                fecha_fin DATE NOT NULL,
                dias INT,
                motivo TEXT,
                estado ENUM('Pendiente', 'Aprobada', 'Rechazada') DEFAULT 'Pendiente',
                aprobador_id INT,
                documento_url VARCHAR(500),
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES rh_empresas(id) ON DELETE CASCADE,
                FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
                FOREIGN KEY (aprobador_id) REFERENCES empleados(id) ON DELETE SET NULL
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS rh_expedientes (
                id CHAR(36) PRIMARY KEY ,
                company_id CHAR(36) NOT NULL,
                empleado_id INT NOT NULL,
                tipo_documento VARCHAR(100) NOT NULL,
                nombre_archivo VARCHAR(255) NOT NULL,
                archivo_url VARCHAR(500) NOT NULL,
                fecha_emision DATE,
                fecha_vencimiento DATE,
                alertas_activas BOOLEAN DEFAULT FALSE,
                subido_por INT,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES rh_empresas(id) ON DELETE CASCADE,
                FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
                FOREIGN KEY (subido_por) REFERENCES empleados(id) ON DELETE SET NULL
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS rh_prestamos (
                id CHAR(36) PRIMARY KEY ,
                company_id CHAR(36) NOT NULL,
                empleado_id INT NOT NULL,
                monto_solicitado DECIMAL(15,2) NOT NULL,
                plazo_quincenas INT NOT NULL,
                descuento_quincenal DECIMAL(15,2) NOT NULL,
                saldo_restante DECIMAL(15,2) NOT NULL,
                motivo TEXT,
                estado ENUM('Pendiente', 'Aprobado', 'Rechazado', 'Liquidado') DEFAULT 'Pendiente',
                aprobador_id INT,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES rh_empresas(id) ON DELETE CASCADE,
                FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
                FOREIGN KEY (aprobador_id) REFERENCES empleados(id) ON DELETE SET NULL
            )
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS rh_auditoria (
                id CHAR(36) PRIMARY KEY ,
                company_id CHAR(36) NOT NULL,
                entidad_modificada VARCHAR(100) NOT NULL,
                entidad_id VARCHAR(50) NOT NULL,
                accion VARCHAR(100) NOT NULL,
                detalles JSON,
                usuario_id INT,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES rh_empresas(id) ON DELETE CASCADE,
                FOREIGN KEY (usuario_id) REFERENCES empleados(id) ON DELETE SET NULL
            )
        `);

        // Datos semilla - Empresa Principal
        const [empresaPrincipal] = await conn.execute('SELECT COUNT(*) as total FROM rh_empresas WHERE id = "00000000-0000-0000-0000-000000000001"');
        if (empresaPrincipal[0].total === 0) {
            await conn.execute(`
                INSERT INTO rh_empresas (id, razon_social, nombre_comercial, rfc)
                VALUES ('00000000-0000-0000-0000-000000000001', 'Grupo Comunicalo SA de CV', 'Grupo Comunicalo', 'GCO123456789')
            `);
            console.log('  🏢 Empresa principal insertada');
        }

        // Vincular admin a empresa principal
        await conn.execute(`
            UPDATE empleados SET company_id = '00000000-0000-0000-0000-000000000001'
            WHERE numero_empleado = 'EMP001' AND company_id IS NULL
        `);

        console.log('✅ Base de datos lista\n');


    } catch (error) {
        console.error('❌ Error al inicializar la base de datos:', error.message);
        throw error;
    } finally {
        conn.release();
    }
};

module.exports = inicializarBaseDeDatos;
