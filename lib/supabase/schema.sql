-- ============================================
-- TAW DELIVERY - Schéma Base de Données
-- ============================================

-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'agent', 'livreur');
CREATE TYPE parcel_status AS ENUM ('ARRIVÉ', 'EN_ATTENTE', 'EN_LIVRAISON', 'RETIRÉ', 'LIVRÉ');
CREATE TYPE confirmation_choice AS ENUM ('retrait', 'livraison');
CREATE TYPE delivery_status AS ENUM ('programmée', 'en_cours', 'terminée', 'annulée');
CREATE TYPE notification_type AS ENUM ('sms', 'email');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- ============================================
-- TABLES
-- ============================================

-- Agences
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Utilisateurs (lié à Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    role user_role NOT NULL DEFAULT 'agent',
    agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Colis
CREATE TABLE parcels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL,
    external_id VARCHAR(255), -- Pour future intégration système source
    description TEXT,
    weight DECIMAL(10, 2),
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255),
    recipient_address TEXT,
    sender_name VARCHAR(255),
    sender_phone VARCHAR(50),
    status parcel_status NOT NULL DEFAULT 'ARRIVÉ',
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE RESTRICT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(code, agency_id)
);

-- Zones de livraison
CREATE TABLE delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    zone_name VARCHAR(255) NOT NULL,
    description TEXT,
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Créneaux de livraison
CREATE TABLE delivery_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Dimanche
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_deliveries INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Confirmations destinataires
CREATE TABLE confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
    choice confirmation_choice NOT NULL,
    delivery_address TEXT,
    zone_id UUID REFERENCES delivery_zones(id) ON DELETE SET NULL,
    slot_id UUID REFERENCES delivery_slots(id) ON DELETE SET NULL,
    preferred_date DATE,
    notes TEXT,
    confirmed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parcel_id)
);

-- Livraisons
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    confirmation_id UUID REFERENCES confirmations(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    slot_id UUID REFERENCES delivery_slots(id) ON DELETE SET NULL,
    status delivery_status NOT NULL DEFAULT 'programmée',
    delivery_address TEXT,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications (SMS/Email)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status notification_status NOT NULL DEFAULT 'pending',
    external_id VARCHAR(255), -- ID du fournisseur SMS/Email
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Événements de tracking (audit trail)
CREATE TABLE tracking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    data JSONB DEFAULT '{}',
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_parcels_code ON parcels(code);
CREATE INDEX idx_parcels_status ON parcels(status);
CREATE INDEX idx_parcels_agency ON parcels(agency_id);
CREATE INDEX idx_parcels_recipient_phone ON parcels(recipient_phone);
CREATE INDEX idx_parcels_created_at ON parcels(created_at DESC);

CREATE INDEX idx_users_agency ON users(agency_id);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX idx_deliveries_date ON deliveries(scheduled_date);
CREATE INDEX idx_deliveries_status ON deliveries(status);

CREATE INDEX idx_notifications_parcel ON notifications(parcel_id);
CREATE INDEX idx_notifications_status ON notifications(status);

CREATE INDEX idx_tracking_parcel ON tracking_events(parcel_id);
CREATE INDEX idx_tracking_type ON tracking_events(event_type);
CREATE INDEX idx_tracking_created ON tracking_events(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;

-- Fonction pour obtenir l'agency_id de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_user_agency_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT agency_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role = 'admin' FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies pour agencies
CREATE POLICY "Users can view their own agency" ON agencies
    FOR SELECT USING (id = get_user_agency_id() OR is_admin());

CREATE POLICY "Admins can manage agencies" ON agencies
    FOR ALL USING (is_admin());

-- Policies pour users
CREATE POLICY "Users can view users in their agency" ON users
    FOR SELECT USING (agency_id = get_user_agency_id() OR is_admin());

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage users" ON users
    FOR ALL USING (is_admin());

-- Policies pour parcels
CREATE POLICY "Users can view parcels in their agency" ON parcels
    FOR SELECT USING (agency_id = get_user_agency_id());

CREATE POLICY "Users can create parcels in their agency" ON parcels
    FOR INSERT WITH CHECK (agency_id = get_user_agency_id());

CREATE POLICY "Users can update parcels in their agency" ON parcels
    FOR UPDATE USING (agency_id = get_user_agency_id());

-- Policies pour delivery_zones
CREATE POLICY "Users can view zones in their agency" ON delivery_zones
    FOR SELECT USING (agency_id = get_user_agency_id());

CREATE POLICY "Admins can manage zones" ON delivery_zones
    FOR ALL USING (is_admin());

-- Policies pour delivery_slots
CREATE POLICY "Users can view slots in their agency" ON delivery_slots
    FOR SELECT USING (agency_id = get_user_agency_id());

CREATE POLICY "Admins can manage slots" ON delivery_slots
    FOR ALL USING (is_admin());

-- Policies pour confirmations (accès public pour lecture via code colis)
CREATE POLICY "Users can view confirmations for their agency parcels" ON confirmations
    FOR SELECT USING (
        parcel_id IN (SELECT id FROM parcels WHERE agency_id = get_user_agency_id())
    );

CREATE POLICY "Anyone can create confirmation" ON confirmations
    FOR INSERT WITH CHECK (true);

-- Policies pour deliveries
CREATE POLICY "Users can view deliveries in their agency" ON deliveries
    FOR SELECT USING (
        parcel_id IN (SELECT id FROM parcels WHERE agency_id = get_user_agency_id())
    );

CREATE POLICY "Users can manage deliveries in their agency" ON deliveries
    FOR ALL USING (
        parcel_id IN (SELECT id FROM parcels WHERE agency_id = get_user_agency_id())
    );

-- Policies pour notifications
CREATE POLICY "Users can view notifications for their agency" ON notifications
    FOR SELECT USING (
        parcel_id IN (SELECT id FROM parcels WHERE agency_id = get_user_agency_id())
    );

CREATE POLICY "Users can create notifications for their agency" ON notifications
    FOR INSERT WITH CHECK (
        parcel_id IN (SELECT id FROM parcels WHERE agency_id = get_user_agency_id())
    );

-- Policies pour tracking_events
CREATE POLICY "Users can view tracking for their agency" ON tracking_events
    FOR SELECT USING (
        parcel_id IN (SELECT id FROM parcels WHERE agency_id = get_user_agency_id())
    );

CREATE POLICY "Anyone can create tracking events" ON tracking_events
    FOR INSERT WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger à toutes les tables avec updated_at
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_parcels_updated_at BEFORE UPDATE ON parcels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_delivery_zones_updated_at BEFORE UPDATE ON delivery_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_delivery_slots_updated_at BEFORE UPDATE ON delivery_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA (Exemple)
-- ============================================

-- Insérer des agences de test (à supprimer en production)
-- INSERT INTO agencies (name, country, city, address, phone) VALUES
--     ('TAW Douala', 'Cameroun', 'Douala', 'Rue de la Liberté, Akwa', '+237 6XX XXX XXX'),
--     ('TAW Paris', 'France', 'Paris', '123 Rue Example', '+33 1 XX XX XX XX'),
--     ('TAW Bruxelles', 'Belgique', 'Bruxelles', '456 Avenue Test', '+32 2 XXX XX XX');
