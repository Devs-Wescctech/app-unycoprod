CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(20) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(255),
  cep VARCHAR(15),
  birth_date DATE,
  address TEXT,
  numero VARCHAR(20),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(5),
  password VARCHAR(255),
  is_admin INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  price NUMERIC DEFAULT 0,
  billing_period VARCHAR(50) DEFAULT 'mensal',
  description TEXT,
  perks TEXT,
  active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  plan_id INTEGER REFERENCES plans(id),
  status VARCHAR(50) NOT NULL,
  started_at TIMESTAMP,
  ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  booking_locator VARCHAR(50),
  hotel_name VARCHAR(255),
  guest_name VARCHAR(255),
  guest_cpf VARCHAR(20),
  guest_email VARCHAR(255),
  amount NUMERIC NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  vindi_bill_id INTEGER,
  vindi_charge_id INTEGER,
  vindi_customer_id INTEGER,
  status VARCHAR(30) DEFAULT 'pending',
  print_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  hotel_id INTEGER,
  hotel_name VARCHAR(255),
  hotel_city VARCHAR(255),
  hotel_state VARCHAR(50),
  hotel_image TEXT,
  apartment_type VARCHAR(255),
  apartment_description VARCHAR(255),
  booking_code VARCHAR(100),
  localizador VARCHAR(50),
  check_in DATE,
  check_out DATE,
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  total_price NUMERIC,
  status VARCHAR(30) DEFAULT 'confirmed',
  payment_id INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'true',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS season_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  high_season_months INTEGER[] NOT NULL DEFAULT '{1,2,7,12}',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS category_rates (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  low_season_rate NUMERIC NOT NULL DEFAULT 0,
  high_season_rate NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_flows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_event VARCHAR(100) NOT NULL,
  message_template TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  delay_minutes INTEGER DEFAULT 0,
  conditions JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  send_count INTEGER DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id SERIAL PRIMARY KEY,
  flow_id INTEGER REFERENCES whatsapp_flows(id),
  flow_name VARCHAR(255),
  phone VARCHAR(50),
  message TEXT,
  status VARCHAR(50) DEFAULT 'sent',
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_config (key, value) VALUES ('plans_enabled', 'true') ON CONFLICT (key) DO NOTHING;
INSERT INTO season_config (id, high_season_months) VALUES (1, '{1,2,7,12}') ON CONFLICT (id) DO NOTHING;
