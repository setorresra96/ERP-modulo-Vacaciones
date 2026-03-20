-- =======================================================
--  ERP Grupo Comunicalo - Base de Datos Completa
--  Ejecutar este script para recrear la base de datos.
-- =======================================================

-- -------------------------------------------------------
-- MÓDULO: CONFIGURACIÓN - Catálogos base
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS cfg_areas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id CHAR(36) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES rh_empresas(id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- MÓDULO: AUTH - Empleados, Roles y Permisos
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_empleado VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    fecha_nacimiento DATE NOT NULL,
    fecha_ingreso DATE NOT NULL,
    company_id CHAR(36),
    paquete_compensacion_id CHAR(36),
    salario_bruto_mensual DECIMAL(15,2),
    salario_diario_integrado DECIMAL(15,2),
    numero_seguridad_social VARCHAR(50),
    esquema_beneficios_personalizados JSON,
    telefono VARCHAR(30),
    extension VARCHAR(10),
    correo_corporativo VARCHAR(150),
    puesto VARCHAR(150),
    area_id INT,
    rfc VARCHAR(13),
    curp VARCHAR(18),
    jefe_inmediato_id INT,
    tipo_contrato VARCHAR(100),
    modalidad VARCHAR(50),
    fecha_baja DATE,
    motivo_baja VARCHAR(255),
    salario_base DECIMAL(15,2),
    frecuencia_pago VARCHAR(50),
    banco VARCHAR(100),
    cuenta_bancaria VARCHAR(50),
    clabe VARCHAR(50),
    bono_variable DECIMAL(15,2),
    estatus ENUM('ACTIVO','INACTIVO','BLOQUEADO') DEFAULT 'ACTIVO',
    intentos_fallidos INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (jefe_inmediato_id) REFERENCES empleados(id) ON DELETE SET NULL
);

-- =======================================================
-- MIGRACIÓN PARA BASES DE DATOS EXISTENTES
-- Como usamos `mysql -f`, los errores por columnas o llaves existentes se ignoran
-- =======================================================
ALTER TABLE empleados ADD COLUMN company_id CHAR(36) AFTER fecha_ingreso;
ALTER TABLE empleados ADD COLUMN paquete_compensacion_id CHAR(36) AFTER company_id;
ALTER TABLE empleados ADD COLUMN salario_bruto_mensual DECIMAL(15,2) AFTER paquete_compensacion_id;
ALTER TABLE empleados ADD COLUMN salario_diario_integrado DECIMAL(15,2) AFTER salario_bruto_mensual;
ALTER TABLE empleados ADD COLUMN numero_seguridad_social VARCHAR(50) AFTER salario_diario_integrado;
ALTER TABLE empleados ADD COLUMN esquema_beneficios_personalizados JSON AFTER numero_seguridad_social;
ALTER TABLE empleados ADD COLUMN telefono VARCHAR(30) AFTER esquema_beneficios_personalizados;
ALTER TABLE empleados ADD COLUMN extension VARCHAR(10) AFTER telefono;
ALTER TABLE empleados ADD COLUMN correo_corporativo VARCHAR(150) AFTER extension;
ALTER TABLE rh_empresas ADD COLUMN pais VARCHAR(100) DEFAULT 'México' AFTER regimen_fiscal;
ALTER TABLE rh_empresas ADD COLUMN moneda_base VARCHAR(10) DEFAULT 'MXN' AFTER pais;
ALTER TABLE rh_empresas ADD COLUMN logo_url LONGTEXT AFTER moneda_base;
ALTER TABLE rh_empresas MODIFY logo_url LONGTEXT;
ALTER TABLE empleados ADD COLUMN puesto VARCHAR(150) AFTER esquema_beneficios_personalizados;
ALTER TABLE empleados DROP COLUMN area; -- Drop the old 'area' column
ALTER TABLE empleados ADD COLUMN area_id INT AFTER puesto;
ALTER TABLE empleados ADD COLUMN rfc VARCHAR(13) AFTER area_id;
ALTER TABLE empleados ADD COLUMN curp VARCHAR(18) AFTER rfc;
ALTER TABLE empleados ADD COLUMN jefe_inmediato_id INT AFTER curp;
ALTER TABLE empleados ADD COLUMN tipo_contrato VARCHAR(100) AFTER jefe_inmediato_id;
ALTER TABLE empleados ADD COLUMN modalidad VARCHAR(50) AFTER tipo_contrato;
ALTER TABLE empleados ADD COLUMN fecha_baja DATE AFTER modalidad;
ALTER TABLE empleados ADD COLUMN motivo_baja VARCHAR(255) AFTER fecha_baja;
ALTER TABLE empleados ADD COLUMN salario_base DECIMAL(15,2) AFTER motivo_baja;
ALTER TABLE empleados ADD COLUMN frecuencia_pago VARCHAR(50) AFTER salario_base;
ALTER TABLE empleados ADD COLUMN banco VARCHAR(100) AFTER frecuencia_pago;
ALTER TABLE empleados ADD COLUMN cuenta_bancaria VARCHAR(50) AFTER banco;
ALTER TABLE empleados ADD COLUMN clabe VARCHAR(50) AFTER cuenta_bancaria;
ALTER TABLE empleados ADD COLUMN bono_variable DECIMAL(15,2) AFTER clabe;
ALTER TABLE empleados ADD CONSTRAINT fk_empleados_jefe_inmediato FOREIGN KEY (jefe_inmediato_id) REFERENCES empleados(id) ON DELETE SET NULL;

-- Migración para Expediente Digital
ALTER TABLE rh_expedientes ADD COLUMN tipo_documento_id INT AFTER empleado_id;
ALTER TABLE rh_expedientes ADD CONSTRAINT fk_expediente_tipo FOREIGN KEY (tipo_documento_id) REFERENCES cfg_tipos_documento(id) ON DELETE CASCADE;
ALTER TABLE rh_expedientes DROP COLUMN tipo_documento;

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permisos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(modulo, accion)
);

CREATE TABLE IF NOT EXISTS rol_permisos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rol_id INT NOT NULL,
    permiso_id INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id),
    FOREIGN KEY (permiso_id) REFERENCES permisos(id),
    UNIQUE(rol_id, permiso_id)
);

CREATE TABLE IF NOT EXISTS usuario_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    rol_id INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES empleados(id),
    FOREIGN KEY (rol_id) REFERENCES roles(id),
    UNIQUE(usuario_id, rol_id)
);

-- -------------------------------------------------------
-- MÓDULO: LANDING - Secciones del portal público
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS landing_secciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT,
    imagen_url VARCHAR(500),
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP
);

-- =======================================================
--  DATOS SEMILLA
-- =======================================================

-- Roles base del sistema
INSERT IGNORE INTO roles (nombre, descripcion) VALUES
    ('SUPER_ADMIN', 'Acceso total al sistema, gestión de usuarios y seguridad'),
    ('ADMIN', 'Administrador general de módulos operativos'),
    ('EMPLEADO', 'Usuario empleado estándar');

-- Permisos base
INSERT IGNORE INTO permisos (modulo, accion) VALUES
    ('LANDING', 'VER'),
    ('LANDING', 'CREAR'),
    ('LANDING', 'EDITAR'),
    ('LANDING', 'DESACTIVAR'),
    ('AUTH', 'VER'),
    ('SEGURIDAD', 'VER'),
    ('SEGURIDAD', 'GESTIONAR');


-- Empleado administrador de prueba
-- Password: Admin123! (hash bcrypt generado con saltRounds=10)
INSERT IGNORE INTO empleados (numero_empleado, password, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_ingreso, estatus)
VALUES (
    'EMP001',
    '$2b$10$eu7d9PcvhlGMp58qMuqzhefgmdnHWIuRdKMODORg80OOu0lq.vjEq',
    'Administrador',
    'Sistema',
    'ERP',
    '1990-01-01',
    '2024-01-01',
    'ACTIVO'
);

-- -------------------------------------------------------
-- MÓDULO: INTRANET - Dashboard central
-- -------------------------------------------------------

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
);

CREATE TABLE IF NOT EXISTS favoritos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES empleados(id),
    UNIQUE(usuario_id, modulo)
);

-- -------------------------------------------------------
-- MÓDULO: DIRECTORIO - Directorio de personal
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS directorio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_empleado VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    area VARCHAR(100) NOT NULL,
    oficina VARCHAR(100),
    telefono VARCHAR(20),
    extension VARCHAR(10),
    celular VARCHAR(20),
    jefe_inmediato VARCHAR(150),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP
);

-- -------------------------------------------------------
-- PERMISOS SEMILLA - Módulos Intranet, Comunicados, Directorio
-- -------------------------------------------------------

INSERT IGNORE INTO permisos (modulo, accion) VALUES
    ('INTRANET', 'VER'),
    ('COMUNICADOS', 'VER'),
    ('COMUNICADOS', 'CREAR'),
    ('COMUNICADOS', 'EDITAR'),
    ('COMUNICADOS', 'DESACTIVAR'),
    ('DIRECTORIO', 'LEER'),
    ('DIRECTORIO', 'CREAR'),
    ('DIRECTORIO', 'EDITAR'),
    ('DIRECTORIO', 'DESACTIVAR'),
    ('FAVORITOS', 'VER');

-- Permisos de acceso a apps (formato app:modulo)
INSERT IGNORE INTO permisos (modulo, accion) VALUES
    ('app', 'intranet'),
    ('app', 'directorio'),
    ('app', 'documentos'),
    ('app', 'finanzas'),
    ('app', 'reportes');

-- -------------------------------------------------------
-- DATOS SEMILLA - Comunicados de ejemplo
-- -------------------------------------------------------

INSERT IGNORE INTO comunicados (titulo, descripcion, activo) VALUES
    ('Bienvenido al ERP Grupo Comunicalo', 'Sistema de gestión empresarial en línea. Accede a todos tus módulos desde este panel.', TRUE),
    ('Mantenimiento programado', 'El próximo viernes de 10pm a 11pm habrá mantenimiento preventivo del sistema.', TRUE);

-- -------------------------------------------------------
-- MÓDULO: ELEARNING - Centro de Conocimiento Corporativo
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS contenido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomenclatura VARCHAR(50) UNIQUE NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    resumen TEXT NOT NULL,
    tipo_contenido ENUM(
        'MANUAL',
        'PROCEDIMIENTO',
        'DIAGRAMA',
        'FORMATO',
        'REGISTRO',
        'DOCUMENTO_ESTRATEGICO'
    ) NOT NULL,
    area VARCHAR(100) NOT NULL,
    formato ENUM('PDF','WORD','EXCEL','IMAGEN','VIDEO','AUDIO','URL_EXTERNA') NOT NULL,
    archivo_url VARCHAR(500) NOT NULL,
    version INT DEFAULT 1,
    estatus ENUM('ACTIVO','INACTIVO') DEFAULT 'ACTIVO',
    justificacion_inactivacion TEXT,
    fecha_inactivacion DATETIME,
    subido_por INT NOT NULL,
    autorizado_fecha DATETIME,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subido_por) REFERENCES empleados(id)
);

CREATE TABLE IF NOT EXISTS contenido_autorizadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contenido_id INT NOT NULL,
    empleado_id INT NOT NULL,
    fecha_autorizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contenido_id) REFERENCES contenido(id),
    FOREIGN KEY (empleado_id) REFERENCES empleados(id),
    UNIQUE(contenido_id, empleado_id)
);

CREATE TABLE IF NOT EXISTS contenido_relacionados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contenido_id INT NOT NULL,
    relacionado_id INT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contenido_id) REFERENCES contenido(id) ON DELETE CASCADE,
    FOREIGN KEY (relacionado_id) REFERENCES contenido(id) ON DELETE CASCADE,
    UNIQUE(contenido_id, relacionado_id)
);

CREATE TABLE IF NOT EXISTS contenido_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contenido_id INT NOT NULL,
    accion VARCHAR(100) NOT NULL,
    descripcion TEXT,
    usuario_id INT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contenido_id) REFERENCES contenido(id)
);

-- -------------------------------------------------------
-- PERMISOS SEMILLA - Módulo E-Learning
-- -------------------------------------------------------

INSERT IGNORE INTO permisos (modulo, accion) VALUES
    ('ELEARNING', 'VER'),
    ('ELEARNING', 'GESTIONAR');

-- Permiso de acceso a la app e-learning
INSERT IGNORE INTO permisos (modulo, accion) VALUES
    ('app', 'elearning');

-- -------------------------------------------------------
-- MÓDULO: CALCULADORA ROI
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS roi_verticales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roi_portafolios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    id_vertical INT NOT NULL,
    FOREIGN KEY (id_vertical) REFERENCES roi_verticales(id)
);

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
);

CREATE TABLE IF NOT EXISTS roi_paquete_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_paquete INT NOT NULL,
    id_item INT NOT NULL,
    cantidad DECIMAL(10,2) DEFAULT 1,
    FOREIGN KEY (id_paquete) REFERENCES roi_conceptos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_item) REFERENCES roi_conceptos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS roi_clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    contacto VARCHAR(150),
    email VARCHAR(150),
    telefono VARCHAR(30),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roi_empresas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    rfc VARCHAR(20),
    direccion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roi_cotizaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    id_empresa INT,
    id_vendedor INT,
    fecha DATE DEFAULT (CURDATE()),
    vigencia_dias INT DEFAULT 30,
    tipo_cambio DECIMAL(10,4) DEFAULT 18.50,
    margen DECIMAL(5,2) DEFAULT 30.00,
    moneda VARCHAR(3) DEFAULT 'MXN',
    total_capex DECIMAL(15,2) DEFAULT 0.00,
    total_opex_mensual DECIMAL(15,2) DEFAULT 0.00,
    total_general DECIMAL(15,2) DEFAULT 0.00,
    estado VARCHAR(20) DEFAULT 'BORRADOR',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES roi_clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (id_empresa) REFERENCES roi_empresas(id) ON DELETE SET NULL,
    FOREIGN KEY (id_vendedor) REFERENCES empleados(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS roi_cotizacion_partidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cotizacion INT NOT NULL,
    id_concepto INT,
    descripcion_manual VARCHAR(255),
    cantidad DECIMAL(10,2) DEFAULT 1,
    precio_unitario DECIMAL(15,2) DEFAULT 0.00,
    tipo_costo VARCHAR(20) DEFAULT 'CAPEX',
    subtotal DECIMAL(15,2) DEFAULT 0.00,
    FOREIGN KEY (id_cotizacion) REFERENCES roi_cotizaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (id_concepto) REFERENCES roi_conceptos(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS roi_proyectos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_proyecto VARCHAR(200),
    id_cotizacion INT,
    id_paquete INT,
    id_usuario INT,
    tipo_cambio DECIMAL(10,4) DEFAULT 18.50,
    margen DECIMAL(5,2) DEFAULT 30.00,
    costo_financiero DECIMAL(5,2) DEFAULT 0.00,
    meses_recuperacion INT DEFAULT 12,
    pago_inicial DECIMAL(15,2) DEFAULT 0.00,
    precio_servicio_calculado DECIMAL(15,2) DEFAULT 0.00,
    estado VARCHAR(20) DEFAULT 'BORRADOR',
    escenarios_data JSON,
    indice_seleccionado INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cotizacion) REFERENCES roi_cotizaciones(id) ON DELETE SET NULL,
    FOREIGN KEY (id_paquete) REFERENCES roi_conceptos(id) ON DELETE SET NULL,
    FOREIGN KEY (id_usuario) REFERENCES empleados(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS roi_proyecto_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_proyecto INT NOT NULL,
    id_concepto INT NOT NULL,
    cantidad DECIMAL(10,2) DEFAULT 1,
    precio_usd DECIMAL(15,2) DEFAULT 0.00,
    categoria VARCHAR(20) DEFAULT 'KAPEX',
    amortizar BOOLEAN DEFAULT FALSE,
    pago_contado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_proyecto) REFERENCES roi_proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_concepto) REFERENCES roi_conceptos(id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- PERMISOS SEMILLA - Módulo ROI
-- -------------------------------------------------------

INSERT IGNORE INTO permisos (modulo, accion) VALUES
    ('ROI', 'VER'),
    ('ROI', 'CREAR'),
    ('ROI', 'EDITAR'),
    ('ROI', 'AUTORIZAR'),
    ('ROI', 'DESACTIVAR'),
    ('ROI', 'ADMIN');

-- Permiso de acceso a la app ROI
INSERT IGNORE INTO permisos (modulo, accion) VALUES
    ('app', 'roi');

-- -------------------------------------------------------
-- MÓDULO: CRM (Customer Relationship Management)
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS crm_clientes (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tipo_persona ENUM('Física', 'Moral') DEFAULT 'Moral',
    razon_social VARCHAR(255) NOT NULL,
    rfc VARCHAR(20),
    regimen_fiscal VARCHAR(100),
    direccion_fiscal TEXT,
    condiciones_pago TEXT,
    forma_pago VARCHAR(50),
    metodo_pago VARCHAR(50),
    uso_cfdi VARCHAR(50),
    moneda VARCHAR(10) DEFAULT 'MXN',
    limite_credito DECIMAL(15,2) DEFAULT 0.00,
    nombre_representante_legal VARCHAR(255),
    id_identificacion_pdf VARCHAR(500),
    id_acta_pdf VARCHAR(500),
    id_poderes_pdf VARCHAR(500),
    id_csf_pdf VARCHAR(500),
    id_contratos_pdf VARCHAR(500),
    owner_id INT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES empleados(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS crm_prospectos (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
);

CREATE TABLE IF NOT EXISTS crm_contactos (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    prospecto_id CHAR(36),
    cliente_id CHAR(36),
    nombre VARCHAR(150) NOT NULL,
    cargo VARCHAR(100),
    telefono VARCHAR(30),
    celular VARCHAR(30),
    correo VARCHAR(150),
    es_principal BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (prospecto_id) REFERENCES crm_prospectos(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES crm_clientes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS crm_oportunidades (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
);

CREATE TABLE IF NOT EXISTS crm_sitios (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
);

CREATE TABLE IF NOT EXISTS crm_notas (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    entidad_tipo VARCHAR(50) NOT NULL,
    entidad_id CHAR(36) NOT NULL,
    contenido TEXT NOT NULL,
    creado_por INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creado_por) REFERENCES empleados(id)
);



-- Permisos de acceso al sistema
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
    ('RH_VER',     'VER_RH'),
    ('RH_CREAR',   'CREAR_RH'),
    ('RH_EDITAR',  'EDITAR_RH'),
    ('RH_APROBAR', 'APROBAR_RH'),
    ('RH_EMPRESA_ADMIN', 'ADMIN_RH_EMPRESA'),
    ('app',        'rh'),
    ('CONFIGURACION', 'VER'),
    ('CONFIGURACION', 'CREAR'),
    ('CONFIGURACION', 'EDITAR'),
    ('CONFIGURACION', 'DESACTIVAR'),
    ('app',        'configuracion');

-- -------------------------------------------------------
-- MÓDULO: RECURSOS HUMANOS (RH Enterprise)
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS rh_empresas (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    razon_social VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255) NOT NULL,
    rfc VARCHAR(20) NOT NULL,
    direccion_fiscal TEXT,
    regimen_fiscal VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'México',
    moneda_base VARCHAR(10) DEFAULT 'MXN',
    logo_url LONGTEXT,
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cfg_areas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id CHAR(36) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES rh_empresas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cfg_tipos_documento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id CHAR(36) NOT NULL,
    clasificacion ENUM('Generales', 'Certificaciones y Cursos', 'Sensibles') NOT NULL DEFAULT 'Generales',
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    requiere_vigencia BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES rh_empresas(id) ON DELETE CASCADE
);

-- Agregar FK a la tabla empleados ya existente
ALTER TABLE empleados ADD CONSTRAINT fk_empleado_empresa FOREIGN KEY (company_id) REFERENCES rh_empresas(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS rh_paquetes_compensacion (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES rh_empresas(id) ON DELETE CASCADE
);

-- FK a paquete de compensacion en empleados
ALTER TABLE empleados ADD CONSTRAINT fk_empleado_paquete FOREIGN KEY (paquete_compensacion_id) REFERENCES rh_paquetes_compensacion(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS rh_paquete_atributos (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    paquete_id CHAR(36) NOT NULL,
    tipo_parametro VARCHAR(100) NOT NULL,
    valor JSON,
    formula TEXT,
    obligatorio BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paquete_id) REFERENCES rh_paquetes_compensacion(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rh_historial_laboral (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
);

CREATE TABLE IF NOT EXISTS rh_vacaciones (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
);

CREATE TABLE IF NOT EXISTS rh_incidencias (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
);

CREATE TABLE IF NOT EXISTS rh_expedientes (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,
    empleado_id INT NOT NULL,
    tipo_documento_id INT NOT NULL,
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
    FOREIGN KEY (tipo_documento_id) REFERENCES cfg_tipos_documento(id) ON DELETE CASCADE,
    FOREIGN KEY (subido_por) REFERENCES empleados(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS rh_prestamos (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
);

CREATE TABLE IF NOT EXISTS rh_auditoria (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,
    entidad_modificada VARCHAR(100) NOT NULL,
    entidad_id VARCHAR(50) NOT NULL,
    accion VARCHAR(100) NOT NULL,
    detalles JSON,
    usuario_id INT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES rh_empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES empleados(id) ON DELETE SET NULL
);



-- DATOS SEMILLA EMPRESA PRINCIPAL
INSERT IGNORE INTO rh_empresas (id, razon_social, nombre_comercial, rfc) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Grupo Comunicalo SA de CV', 'Grupo Comunicalo', 'GCO123456789');

-- ACTUALIZAR EMPLEADO ADMIN CON LA EMPRESA PRINCIPAL
UPDATE empleados SET company_id = '00000000-0000-0000-0000-000000000001' WHERE numero_empleado = 'EMP001';

-- -------------------------------------------------------
-- ASIGNACIÓN DE ROLES Y PERMISOS AUTOMÁTICA
-- -------------------------------------------------------

-- 1. Asignar el rol SUPER_ADMIN al empleado EMP001
INSERT IGNORE INTO usuario_roles (usuario_id, rol_id)
SELECT e.id, r.id FROM empleados e, roles r
WHERE e.numero_empleado = 'EMP001' AND r.nombre = 'SUPER_ADMIN';

-- 2. Asignar TODOS los permisos existentes al rol SUPER_ADMIN
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'SUPER_ADMIN' AND p.activo = TRUE;
