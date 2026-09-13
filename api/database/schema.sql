-- Habilita a extensão PostGIS para os dados de localização (Lat/Lng)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Criação dos Esquemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS reports;
CREATE SCHEMA IF NOT EXISTS telemetry;
CREATE SCHEMA IF NOT EXISTS notifications;

-- ==========================================
-- ESQUEMA: AUTH (Identidade e Personalização)
-- ==========================================
-- Tabela base de autenticação
CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- user, agent (defesa civil), admin
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Perfil estendido (separado do core de auth por organização)
CREATE TABLE auth.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150),
    phone_number VARCHAR(20),
    avatar_url VARCHAR(1024),
    reputation_score INT DEFAULT 0, -- Gamificação/Confiabilidade
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Locais de interesse (Para alertas baseados onde o usuário mora/trabalha)
CREATE TABLE auth.user_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100), -- Ex: "Casa", "Trabalho"
    location GEOMETRY(Point, 4326) NOT NULL,
    alert_radius_meters INT DEFAULT 5000, -- Raio de interesse para receber alertas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_locations_geom ON auth.user_locations USING GIST (location);

-- ==========================================
-- ESQUEMA: CATALOG (Domínios)
-- ==========================================
CREATE TABLE catalog.event_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    severity_level INT DEFAULT 1, -- 1(Baixo) a 4(Crítico)
    icon_name VARCHAR(50), 
    is_active BOOLEAN DEFAULT TRUE
);

-- Inserindo os eventos solicitados para o catálogo inicial
INSERT INTO catalog.event_types (name, severity_level, icon_name) VALUES 
('Chuva Forte', 2, 'heavy-rain'), 
('Alagamento', 3, 'flood'), 
('Risco de Choque Elétrico', 4, 'electric-shock'), 
('Ondas Fortes', 2, 'strong-waves'), 
('Vento Forte', 2, 'strong-wind'), 
('Risco de Deslizamento de Terra', 4, 'landslide');

-- ==========================================
-- ESQUEMA: REPORTS (O Core Colaborativo)
-- ==========================================
CREATE TABLE reports.occurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL, -- Chave Estrangeira ligando quem reportou
    event_type_id INT NOT NULL REFERENCES catalog.event_types(id), -- Ligação com o tipo de evento
    
    location GEOMETRY(Point, 4326) NOT NULL,
    address_text VARCHAR(255),
    
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected, resolved
    
    upvotes INT DEFAULT 0,
    downvotes INT DEFAULT 0,
    
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_reports_location ON reports.occurrences USING GIST (location);
CREATE INDEX idx_reports_status ON reports.occurrences(status);

CREATE TABLE reports.media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    occurrence_id UUID NOT NULL REFERENCES reports.occurrences(id) ON DELETE CASCADE, -- Ligação com a ocorrência
    media_url VARCHAR(1024) NOT NULL,
    media_type VARCHAR(50) DEFAULT 'image', -- image, video
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Auditoria e validação crowdsourced (O "Eu também vi")
CREATE TABLE reports.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    occurrence_id UUID NOT NULL REFERENCES reports.occurrences(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL, -- upvote (confirma), downvote (nega)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(occurrence_id, user_id) -- Usuário só pode votar uma vez na mesma ocorrência
);

-- ==========================================
-- ESQUEMA: NOTIFICATIONS (Comunicação)
-- ==========================================
CREATE TABLE notifications.push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_type VARCHAR(50), 
    token VARCHAR(255) NOT NULL UNIQUE,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications.inbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    reference_url VARCHAR(1024), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- ESQUEMA: TELEMETRY (Métricas de App)
-- ==========================================
CREATE TABLE telemetry.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    app_version VARCHAR(50), 
    device_os VARCHAR(50), 
    login_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INT,
    login_location GEOMETRY(Point, 4326),
    ip_address INET
);

CREATE TABLE telemetry.events (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES telemetry.sessions(id) ON DELETE CASCADE,
    event_name VARCHAR(100) NOT NULL, 
    event_data JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
