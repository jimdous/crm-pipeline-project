-- Non-destructive V2 initialization. Existing tables and data are retained.
CREATE TABLE IF NOT EXISTS leads (
    lead_id          SERIAL PRIMARY KEY,
    first_name       VARCHAR(50)  NOT NULL,
    last_name        VARCHAR(50)  NOT NULL,
    email            VARCHAR(100),
    phone            VARCHAR(20),
    lead_source      VARCHAR(50),
    property_interest VARCHAR(50),
    budget           NUMERIC(12,2),
    stage            VARCHAR(50),
    assigned_agent   VARCHAR(100),
    created_date     DATE,
    last_contact_date DATE,
    follow_up_needed BOOLEAN,
    estimated_deal_value NUMERIC(12,2),
    outcome          VARCHAR(20)
);

