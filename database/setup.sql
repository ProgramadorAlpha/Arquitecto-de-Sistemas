-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    google_id TEXT UNIQUE,
    name TEXT,
    current_streak INTEGER DEFAULT 0,
    last_streak_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de hábitos diarios
CREATE TABLE IF NOT EXISTS daily_habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    movement BOOLEAN DEFAULT 0,
    meditation BOOLEAN DEFAULT 0,
    reflection BOOLEAN DEFAULT 0,
    green_juice BOOLEAN DEFAULT 0,
    tv_limit BOOLEAN DEFAULT 0,
    plan_tomorrow BOOLEAN DEFAULT 0,
    environment_prep BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, date)
);

-- Crear tabla de sistemas
CREATE TABLE IF NOT EXISTS systems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    area TEXT NOT NULL,
    title TEXT NOT NULL,
    goal TEXT,
    identity TEXT,
    action TEXT,
    trigger TEXT,
    environment TEXT,
    plan_b TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Crear tabla de log de sistemas (cumplimiento diario)
CREATE TABLE IF NOT EXISTS systems_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    system_id INTEGER NOT NULL,
    date DATE NOT NULL,
    status BOOLEAN DEFAULT 0,
    FOREIGN KEY (system_id) REFERENCES systems(id),
    UNIQUE(system_id, date)
);

-- Crear tabla de planes semanales
CREATE TABLE IF NOT EXISTS weekly_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    week_start_date DATE NOT NULL,
    brain_dump TEXT,
    priority_1 TEXT, -- El Dinosaurio
    priority_2 TEXT, -- Tarea Clave
    priority_3 TEXT, -- Personal
    checklist_json TEXT, -- JSON con {finances: bool, delegation: bool...}
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, week_start_date)
);

-- Crear tabla de revisiones mensuales
CREATE TABLE IF NOT EXISTS monthly_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    month_year TEXT NOT NULL, -- Format: YYYY-MM
    wins TEXT,
    drains TEXT,
    intention TEXT,
    revenue_last REAL,
    revenue_goal REAL,
    celebration TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, month_year)
);

-- Crear tabla de red de contactos (Tribu)
CREATE TABLE IF NOT EXISTS network_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    relationship TEXT,
    personal_reminder TEXT,
    avatar_color TEXT DEFAULT 'blue',
    display_order INTEGER DEFAULT 0,
    last_connect_date DATE,
    action_plan TEXT,
    rule TEXT,
    status TEXT DEFAULT 'good', -- good, warning
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Crear tabla de banners diarios (Tribu)
CREATE TABLE IF NOT EXISTS daily_banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE UNIQUE NOT NULL,
    rule_text TEXT,
    quote_text TEXT,
    question_text TEXT
);
