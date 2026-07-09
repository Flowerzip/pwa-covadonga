-- ============================================================
-- Hospital Covadonga — Base de Datos (PostgreSQL)
-- Script Completo de Estructura (Schema) y Datos Iniciales (Seed)
-- ============================================================

-- Habilitar extensión para generar UUIDs si es necesario
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- 1. TABLA: usuarios (Pacientes registrados en el sistema)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo VARCHAR(150) NOT NULL,
    telefono VARCHAR(10) NOT NULL UNIQUE,
    es_admin BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas rápidas por teléfono (usado en login/registro)
CREATE INDEX IF NOT EXISTS idx_usuarios_telefono ON usuarios(telefono);

-- ------------------------------------------------------------
-- 2. TABLA: medicos (Catálogo de personal médico)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medicos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    especialidad VARCHAR(100) NOT NULL,
    consultorio VARCHAR(50) NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 3. TABLA: horarios_laborales (Turnos asignados a cada médico)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS horarios_laborales (
    id SERIAL PRIMARY KEY,
    medico_id INT NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7), -- 1=Lunes, 2=Martes, ..., 7=Domingo
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Validaciones: La hora de inicio debe ser anterior a la hora de fin
    CONSTRAINT chk_horas_coherentes CHECK (hora_inicio < hora_fin),
    -- Evitar turnos duplicados para el mismo médico en el mismo día
    CONSTRAINT uq_medico_dia UNIQUE (medico_id, dia_semana)
);

-- Índice para búsqueda de horarios por médico
CREATE INDEX IF NOT EXISTS idx_horarios_medico ON horarios_laborales(medico_id);

-- ------------------------------------------------------------
-- 4. TABLA: citas (Reservaciones de consultas médicas)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS citas (
    id SERIAL PRIMARY KEY,
    medico_id INT NOT NULL REFERENCES medicos(id) ON DELETE RESTRICT,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL, -- Si se borra el usuario, la cita persiste como histórico
    nombre_paciente VARCHAR(150) NOT NULL, -- Respeta que el usuario pueda agendar para un familiar
    telefono_paciente VARCHAR(20) NOT NULL,
    motivo_consulta TEXT NOT NULL,
    fecha_hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'confirmada' 
        CHECK (estado IN ('pendiente', 'confirmada', 'cancelada')),
    recordatorio_enviado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices optimizados
CREATE INDEX IF NOT EXISTS idx_citas_medico ON citas(medico_id);
CREATE INDEX IF NOT EXISTS idx_citas_usuario ON citas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_citas_telefono ON citas(telefono_paciente);

-- REGLA ESTRICTA: Evitar solapamiento de citas (única cita por médico en una misma fecha/hora).
-- IMPORTANTE: Si la cita está cancelada, el horario se libera. Usamos un índice único parcial.
CREATE UNIQUE INDEX IF NOT EXISTS uq_citas_medico_fecha_activo 
ON citas (medico_id, fecha_hora_inicio) 
WHERE estado != 'cancelada';


-- ------------------------------------------------------------
-- 5. TRIGGERS: Actualización automática de 'actualizado_en'
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_usuarios_actualizado
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER tg_citas_actualizado
    BEFORE UPDATE ON citas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();


-- ------------------------------------------------------------
-- 5. TABLA: codigos_otp (Verificación en dos pasos)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codigos_otp (
    id SERIAL PRIMARY KEY,
    telefono VARCHAR(10) NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('login', 'registro')),
    verificado BOOLEAN DEFAULT FALSE,
    expira_en TIMESTAMP WITH TIME ZONE NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas rápidas por teléfono y tipo
CREATE INDEX IF NOT EXISTS idx_codigos_otp_telefono_tipo ON codigos_otp(telefono, tipo);


-- ============================================================
-- DATOS SEMILLA (Seed Data)
-- Carga inicial idéntica a la estructura de mock-data.ts
-- ============================================================

-- ============================================================
-- DATOS SEMILLA (Seed Data) - CORREGIDO
-- ============================================================

-- 1. Insertar Médicos
INSERT INTO medicos (id, nombre, especialidad, consultorio) VALUES
(1, 'Dra. Elena Rostova', 'Alergología', 'A-101'),
(2, 'Dr. Alejandro Rossi', 'Algología', 'B-203'),
(3, 'Dra. Carmen Villarreal', 'Cardiología', 'C-105'),
(4, 'Dr. Miguel Ángel Torres', 'Dermatología', 'A-202'),
(5, 'Dra. Sofía Nakamura', 'Neurología', 'D-301'),
(6, 'Dr. Ricardo Mendoza', 'Oftalmología', 'B-110'),
(7, 'Dra. Lucía Fernández', 'Pediatría', 'C-208'),
(8, 'Dr. Emilio Gutiérrez', 'Traumatología', 'D-102'),
(9, 'Dra. Amairani Ortíz', 'Cirugía Laparoscópica', 'E-109'),
(10, 'Dr. Javier Méndez', 'Cirugía Plástica y Estética', 'C-110'),
(11, 'Dra. Beatriz Herrera', 'Dermatología', 'D-111'),
(12, 'Dr. Fernando Castro', 'Electrofisiología', 'D-112'),
(13, 'Dra. Isabel Ríos', 'Endocrinología', 'D-113'),
(14, 'Dr. Roberto Vargas', 'Fisitría y Rehabilitación', 'D-114'),
(15, 'Dra. Mariana López', 'Gastroenterología', 'D-115'),
(16, 'Dr. Alberto Ruiz', 'Ginecología y Obstetricia', 'G-116'),
(17, 'Dra. Cecilia Paredes', 'Ginecología Oncológica', 'G-117'),
(18, 'Dr. Hugo Sánchez', 'Neumología', 'N-118'),
(19, 'Dra. Patricia Domínguez', 'Medicina Interna', 'N-119'),
(20, 'Dr. Luis Ortega', 'Medicina crítica', 'N-120'),
(21, 'Dra. Sofía Mendoza', 'Neonatología', 'N-121'),
(22, 'Dr. Jorge Luna', 'Neurocirugía Adulto y Pediatrica', 'N-122'),
(23, 'Dra. Adriana Silva', 'Neuro Radiología e Intervencionista', 'N-123'),
(24, 'Dr. Oscar Castillo', 'Nutriología', 'N-124'),
(25, 'Dra. Laura Flores', 'Odontología, Endodoncia, Cir. Maxilofacial', 'O-125'),
(26, 'Dr. Manuel Rojas', 'Oftalmología Retinología y Glaucoma', 'O-126'),
(27, 'Dra. Elena Gómez', 'Oncología', 'O-127'),
(28, 'Dr. Ricardo Núñez', 'Otorrinolaringología', 'O-128'),
(29, 'Dra. Tania Soto', 'Psiquiatría Adulto y Pediatrica', 'P-129'),
(30, 'Dr. Carlos Mendoza', 'Pediatría', 'P-130'),
(31, 'Dra. Valentina Paz', 'Proctología', 'P-131'),
(32, 'Dr. Héctor Solís', 'Radiología', 'R-132'),
(33, 'Dra. Ximena Blanco', 'Reumatología', 'R-133'),
(34, 'Dr. Esteban Rey', 'Traumatología y Ortopedia Adulto y Pediátrico', 'T-134'),
(35, 'Dra. Natalia Torres', 'Urología', 'U-135')
ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    especialidad = EXCLUDED.especialidad,
    consultorio = EXCLUDED.consultorio;



-- 2. Insertar Administrador
INSERT INTO usuarios (nombre_completo, telefono, es_admin)
VALUES ('Mariana Flores', '8124803891', TRUE)
ON CONFLICT (telefono) DO UPDATE SET es_admin = TRUE, nombre_completo = EXCLUDED.nombre_completo;
-- Reiniciar secuencia de IDs en Postgres para evitar conflictos futuros
SELECT setval('medicos_id_seq', (SELECT MAX(id) FROM medicos));

-- 3. Insertar Horarios Laborales (Lunes a Viernes = 1 a 5)
INSERT INTO horarios_laborales (medico_id, dia_semana, hora_inicio, hora_fin) VALUES
-- Dra. Elena Rostova (Alergología) L-V 09:00 - 16:00
(1, 1, '09:00:00', '16:00:00'),
(1, 2, '09:00:00', '16:00:00'),
(1, 3, '09:00:00', '16:00:00'),
(1, 4, '09:00:00', '16:00:00'),
(1, 5, '09:00:00', '16:00:00'),

-- Dr. Alejandro Rossi (Algología) L-V 08:00 - 14:00
(2, 1, '08:00:00', '14:00:00'),
(2, 2, '08:00:00', '14:00:00'),
(2, 3, '08:00:00', '14:00:00'),
(2, 4, '08:00:00', '14:00:00'),
(2, 5, '08:00:00', '14:00:00'),

-- Dra. Carmen Villarreal (Cardiología) L-V 10:00 - 18:00
(3, 1, '10:00:00', '18:00:00'),
(3, 2, '10:00:00', '18:00:00'),
(3, 3, '10:00:00', '18:00:00'),
(3, 4, '10:00:00', '18:00:00'),
(3, 5, '10:00:00', '18:00:00'),

-- Dr. Miguel Ángel Torres (Dermatología) L-Mi 09:00 - 15:00
(4, 1, '09:00:00', '15:00:00'),
(4, 2, '09:00:00', '15:00:00'),
(4, 3, '09:00:00', '15:00:00'),

-- Dra. Sofía Nakamura (Neurología) L-V 07:00 - 13:00
(5, 1, '07:00:00', '13:00:00'),
(5, 2, '07:00:00', '13:00:00'),
(5, 3, '07:00:00', '13:00:00'),
(5, 4, '07:00:00', '13:00:00'),
(5, 5, '07:00:00', '13:00:00'),

-- Dr. Ricardo Mendoza (Oftalmología) L-J 11:00 - 17:00
(6, 1, '11:00:00', '17:00:00'),
(6, 2, '11:00:00', '17:00:00'),
(6, 3, '11:00:00', '17:00:00'),
(6, 4, '11:00:00', '17:00:00'),

-- Dra. Lucía Fernández (Pediatría) L-V 08:00 - 16:00
(7, 1, '08:00:00', '16:00:00'),
(7, 2, '08:00:00', '16:00:00'),
(7, 3, '08:00:00', '16:00:00'),
(7, 4, '08:00:00', '16:00:00'),
(7, 5, '08:00:00', '16:00:00'),

-- Dr. Emilio Gutiérrez (Traumatología) L-V 09:00 - 17:00
(8, 1, '09:00:00', '17:00:00'),
(8, 2, '09:00:00', '17:00:00'),
(8, 3, '09:00:00', '17:00:00'),
(8, 4, '09:00:00', '17:00:00'),
(8, 5, '09:00:00', '17:00:00'),
-- 10. Dr. Javier Méndez (Cirugía Plástica y Estética) L-V 09:00 - 17:00
(10, 1, '09:00:00', '17:00:00'), 
(10, 2, '09:00:00', '17:00:00'), 
(10, 3, '09:00:00', '17:00:00'), 
(10, 4, '09:00:00', '17:00:00'), 
(10, 5, '09:00:00', '17:00:00'),

-- 11. Dra. Beatriz Herrera (Dermatología) L-V 09:00 - 17:00
(11, 1, '09:00:00', '17:00:00'), (11, 2, '09:00:00', '17:00:00'), (11, 3, '09:00:00', '17:00:00'), (11, 4, '09:00:00', '17:00:00'), (11, 5, '09:00:00', '17:00:00'),
-- 12. Dr. Fernando Castro (Electrofisiología) L-V 09:00 - 17:00
(12, 1, '09:00:00', '17:00:00'), (12, 2, '09:00:00', '17:00:00'), (12, 3, '09:00:00', '17:00:00'), (12, 4, '09:00:00', '17:00:00'), (12, 5, '09:00:00', '17:00:00'),
-- 13. Dra. Isabel Ríos (Endocrinología) L-V 09:00 - 17:00
(13, 1, '09:00:00', '17:00:00'), (13, 2, '09:00:00', '17:00:00'), (13, 3, '09:00:00', '17:00:00'), (13, 4, '09:00:00', '17:00:00'), (13, 5, '09:00:00', '17:00:00'),
-- 14. Dr. Roberto Vargas (Fisitría y Rehabilitación) L-V 09:00 - 17:00
(14, 1, '09:00:00', '17:00:00'), (14, 2, '09:00:00', '17:00:00'), (14, 3, '09:00:00', '17:00:00'), (14, 4, '09:00:00', '17:00:00'), (14, 5, '09:00:00', '17:00:00'),
-- 15. Dra. Mariana López (Gastroenterología) L-V 09:00 - 17:00
(15, 1, '09:00:00', '17:00:00'), (15, 2, '09:00:00', '17:00:00'), (15, 3, '09:00:00', '17:00:00'), (15, 4, '09:00:00', '17:00:00'), (15, 5, '09:00:00', '17:00:00'),
-- 16. Dr. Alberto Ruiz (Ginecología y Obstetricia) L-V 09:00 - 17:00
(16, 1, '09:00:00', '17:00:00'), (16, 2, '09:00:00', '17:00:00'), (16, 3, '09:00:00', '17:00:00'), (16, 4, '09:00:00', '17:00:00'), (16, 5, '09:00:00', '17:00:00'),
-- 17. Dra. Cecilia Paredes (Ginecología Oncológica) L-V 09:00 - 17:00
(17, 1, '09:00:00', '17:00:00'), (17, 2, '09:00:00', '17:00:00'), (17, 3, '09:00:00', '17:00:00'), (17, 4, '09:00:00', '17:00:00'), (17, 5, '09:00:00', '17:00:00'),
-- 18. Dr. Hugo Sánchez (Neumología) L-V 09:00 - 17:00
(18, 1, '09:00:00', '17:00:00'), (18, 2, '09:00:00', '17:00:00'), (18, 3, '09:00:00', '17:00:00'), (18, 4, '09:00:00', '17:00:00'), (18, 5, '09:00:00', '17:00:00'),
-- 19. Dra. Patricia Domínguez (Medicina Interna) L-V 09:00 - 17:00
(19, 1, '09:00:00', '17:00:00'), (19, 2, '09:00:00', '17:00:00'), (19, 3, '09:00:00', '17:00:00'), (19, 4, '09:00:00', '17:00:00'), (19, 5, '09:00:00', '17:00:00'),
-- 20. Dr. Luis Ortega (Medicina crítica) L-V 09:00 - 17:00
(20, 1, '09:00:00', '17:00:00'), (20, 2, '09:00:00', '17:00:00'), (20, 3, '09:00:00', '17:00:00'), (20, 4, '09:00:00', '17:00:00'), (20, 5, '09:00:00', '17:00:00'),
-- 21. Dra. Sofía Mendoza (Neonatología) L-V 09:00 - 17:00
(21, 1, '09:00:00', '17:00:00'), (21, 2, '09:00:00', '17:00:00'), (21, 3, '09:00:00', '17:00:00'), (21, 4, '09:00:00', '17:00:00'), (21, 5, '09:00:00', '17:00:00'),
-- 22. Dr. Jorge Luna (Neurocirugía Adulto y Pediatrica) L-V 09:00 - 17:00
(22, 1, '09:00:00', '17:00:00'), (22, 2, '09:00:00', '17:00:00'), (22, 3, '09:00:00', '17:00:00'), (22, 4, '09:00:00', '17:00:00'), (22, 5, '09:00:00', '17:00:00'),
-- 23. Dra. Adriana Silva (Neuro Radiología e Intervencionista) L-V 09:00 - 17:00
(23, 1, '09:00:00', '17:00:00'), (23, 2, '09:00:00', '17:00:00'), (23, 3, '09:00:00', '17:00:00'), (23, 4, '09:00:00', '17:00:00'), (23, 5, '09:00:00', '17:00:00'),
-- 24. Dr. Oscar Castillo (Nutriología) L-V 09:00 - 17:00
(24, 1, '09:00:00', '17:00:00'), (24, 2, '09:00:00', '17:00:00'), (24, 3, '09:00:00', '17:00:00'), (24, 4, '09:00:00', '17:00:00'), (24, 5, '09:00:00', '17:00:00'),
-- 25. Dra. Laura Flores (Odontología, Endodoncia, Cir. Maxilofacial) L-V 09:00 - 17:00
(25, 1, '09:00:00', '17:00:00'), (25, 2, '09:00:00', '17:00:00'), (25, 3, '09:00:00', '17:00:00'), (25, 4, '09:00:00', '17:00:00'), (25, 5, '09:00:00', '17:00:00'),
-- 26. Dr. Manuel Rojas (Oftalmología Retinología y Glaucoma) L-V 09:00 - 17:00
(26, 1, '09:00:00', '17:00:00'), (26, 2, '09:00:00', '17:00:00'), (26, 3, '09:00:00', '17:00:00'), (26, 4, '09:00:00', '17:00:00'), (26, 5, '09:00:00', '17:00:00'),
-- 27. Dra. Elena Gómez (Oncología) L-V 09:00 - 17:00
(27, 1, '09:00:00', '17:00:00'), (27, 2, '09:00:00', '17:00:00'), (27, 3, '09:00:00', '17:00:00'), (27, 4, '09:00:00', '17:00:00'), (27, 5, '09:00:00', '17:00:00'),
-- 28. Dr. Ricardo Núñez (Otorrinolaringología) L-V 09:00 - 17:00
(28, 1, '09:00:00', '17:00:00'), (28, 2, '09:00:00', '17:00:00'), (28, 3, '09:00:00', '17:00:00'), (28, 4, '09:00:00', '17:00:00'), (28, 5, '09:00:00', '17:00:00'),
-- 29. Dra. Tania Soto (Psiquiatría Adulto y Pediatrica) L-V 09:00 - 17:00
(29, 1, '09:00:00', '17:00:00'), (29, 2, '09:00:00', '17:00:00'), (29, 3, '09:00:00', '17:00:00'), (29, 4, '09:00:00', '17:00:00'), (29, 5, '09:00:00', '17:00:00'),
-- 30. Dr. Carlos Mendoza (Pediatría) L-V 09:00 - 17:00
(30, 1, '09:00:00', '17:00:00'), (30, 2, '09:00:00', '17:00:00'), (30, 3, '09:00:00', '17:00:00'), (30, 4, '09:00:00', '17:00:00'), (30, 5, '09:00:00', '17:00:00'),
-- 31. Dra. Valentina Paz (Proctología) L-V 09:00 - 17:00
(31, 1, '09:00:00', '17:00:00'), (31, 2, '09:00:00', '17:00:00'), (31, 3, '09:00:00', '17:00:00'), (31, 4, '09:00:00', '17:00:00'), (31, 5, '09:00:00', '17:00:00'),
-- 32. Dr. Héctor Solís (Radiología) L-V 09:00 - 17:00
(32, 1, '09:00:00', '17:00:00'), (32, 2, '09:00:00', '17:00:00'), (32, 3, '09:00:00', '17:00:00'), (32, 4, '09:00:00', '17:00:00'), (32, 5, '09:00:00', '17:00:00'),
-- 33. Dra. Ximena Blanco (Reumatología) L-V 09:00 - 17:00
(33, 1, '09:00:00', '17:00:00'), (33, 2, '09:00:00', '17:00:00'), (33, 3, '09:00:00', '17:00:00'), (33, 4, '09:00:00', '17:00:00'), (33, 5, '09:00:00', '17:00:00'),
-- 34. Dr. Esteban Rey (Traumatología y Ortopedia Adulto y Pediátrico) L-V 09:00 - 17:00
(34, 1, '09:00:00', '17:00:00'), (34, 2, '09:00:00', '17:00:00'), (34, 3, '09:00:00', '17:00:00'), (34, 4, '09:00:00', '17:00:00'), (34, 5, '09:00:00', '17:00:00'),
-- 35. Dra. Natalia Torres (Urología) L-V 09:00 - 17:00
(35, 1, '09:00:00', '17:00:00'), (35, 2, '09:00:00', '17:00:00'), (35, 3, '09:00:00', '17:00:00'), (35, 4, '09:00:00', '17:00:00'), (35, 5, '09:00:00', '17:00:00');
ON CONFLICT (medico_id, dia_semana) DO UPDATE SET
    hora_inicio = EXCLUDED.hora_inicio,
    hora_fin = EXCLUDED.hora_fin;

-- 3. Insertar Administrador Semilla
INSERT INTO usuarios (nombre_completo, telefono, es_admin)
VALUES ('Mariana Flores', '8124803891', TRUE)
ON CONFLICT (telefono) DO UPDATE SET es_admin = TRUE, nombre_completo = EXCLUDED.nombre_completo;
