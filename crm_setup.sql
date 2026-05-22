-- ============================================================
-- CRM SALES PIPELINE — POSTGRESQL SETUP
-- Real Estate Brokerage: Full Database + Business Queries
-- ============================================================

-- Step 1: Create database (run this first in pgAdmin)
-- CREATE DATABASE crm_pipeline;

-- Step 2: Create the leads table
DROP TABLE IF EXISTS leads;

CREATE TABLE leads (
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

-- Step 3: Insert 40 realistic leads
INSERT INTO leads (first_name, last_name, email, phone, lead_source, property_interest, budget, stage, assigned_agent, created_date, last_contact_date, follow_up_needed, estimated_deal_value, outcome) VALUES
('Maria',     'Santos',    'maria.santos@email.com',    '917-555-0101', 'Zillow',        'Condo',  420000, 'Closed Won',         'Alex Chen',    '2024-01-10', '2024-04-01', FALSE, 420000, 'Won'),
('James',     'Carter',    'james.carter@email.com',    '917-555-0102', 'Referral',      'House',  385000, 'Negotiating',        'Brianna Cole', '2024-02-14', '2024-04-10', TRUE,  385000, 'Open'),
('Priya',     'Nair',      'priya.nair@email.com',      '917-555-0103', 'Google Ads',    'House',  510000, 'Qualified',          'Marcus Webb',  '2024-02-20', '2024-04-08', TRUE,  510000, 'Open'),
('Tom',       'Brennan',   'tom.brennan@email.com',     '917-555-0104', 'Walk-In',       'Condo',  275000, 'Showing Scheduled',  'Diana Park',   '2024-03-01', '2024-04-12', FALSE, 275000, 'Open'),
('Linda',     'Okafor',    'linda.okafor@email.com',    '917-555-0105', 'Facebook Ads',  'Rental', 340000, 'Contacted',          'Alex Chen',    '2024-02-05', '2024-03-28', TRUE,  340000, 'Open'),
('Derek',     'Holt',      'derek.holt@email.com',      '917-555-0106', 'Zillow',        'House',  295000, 'New Lead',           'Brianna Cole', '2024-04-10', '2024-04-14', FALSE, 295000, 'Open'),
('Angela',    'Wu',        'angela.wu@email.com',       '917-555-0107', 'Referral',      'House',  625000, 'Closed Won',         'Marcus Webb',  '2024-01-05', '2024-03-20', FALSE, 625000, 'Won'),
('Brian',     'Myles',     'brian.myles@email.com',     '917-555-0108', 'Google Ads',    'Condo',  190000, 'Closed Lost',        'Diana Park',   '2024-01-20', '2024-03-15', FALSE, 190000, 'Lost'),
('Cynthia',   'Park',      'cynthia.park@email.com',    '917-555-0109', 'Referral',      'Condo',  455000, 'Qualified',          'Alex Chen',    '2024-03-05', '2024-04-09', TRUE,  455000, 'Open'),
('Samuel',    'Torres',    'samuel.torres@email.com',   '917-555-0110', 'Facebook Ads',  'House',  310000, 'Closed Won',         'Brianna Cole', '2024-01-15', '2024-03-30', FALSE, 310000, 'Won'),
('Rachel',    'Kim',       'rachel.kim@email.com',      '917-555-0111', 'Zillow',        'House',  540000, 'Negotiating',        'Marcus Webb',  '2024-03-08', '2024-04-11', TRUE,  540000, 'Open'),
('Owen',      'Murray',    'owen.murray@email.com',     '917-555-0112', 'Walk-In',       'Rental', 225000, 'New Lead',           'Diana Park',   '2024-04-12', '2024-04-15', FALSE, 225000, 'Open'),
('Fatima',    'Hassan',    'fatima.hassan@email.com',   '917-555-0113', 'Google Ads',    'Condo',  480000, 'Contacted',          'Alex Chen',    '2024-02-28', '2024-04-02', TRUE,  480000, 'Open'),
('Eric',      'Lawson',    'eric.lawson@email.com',     '917-555-0114', 'Facebook Ads',  'House',  365000, 'Showing Scheduled',  'Brianna Cole', '2024-03-15', '2024-04-13', FALSE, 365000, 'Open'),
('Nadia',     'Bloom',     'nadia.bloom@email.com',     '917-555-0115', 'Referral',      'House',  710000, 'Closed Won',         'Marcus Webb',  '2024-01-08', '2024-03-25', FALSE, 710000, 'Won'),
('Kevin',     'Yates',     'kevin.yates@email.com',     '917-555-0116', 'Zillow',        'Condo',  260000, 'Closed Lost',        'Diana Park',   '2024-01-25', '2024-03-18', FALSE, 260000, 'Lost'),
('Isabel',    'Cruz',      'isabel.cruz@email.com',     '917-555-0117', 'Walk-In',       'Rental', 398000, 'Qualified',          'Alex Chen',    '2024-03-10', '2024-04-07', TRUE,  398000, 'Open'),
('Marcus',    'Bell',      'marcus.bell@email.com',     '917-555-0118', 'Facebook Ads',  'House',  320000, 'New Lead',           'Brianna Cole', '2024-04-11', '2024-04-16', FALSE, 320000, 'Open'),
('Tasha',     'Green',     'tasha.green@email.com',     '917-555-0119', 'Referral',      'House',  590000, 'Negotiating',        'Marcus Webb',  '2024-03-01', '2024-04-10', TRUE,  590000, 'Open'),
('Hiro',      'Tanaka',    'hiro.tanaka@email.com',     '917-555-0120', 'Google Ads',    'Condo',  445000, 'Closed Won',         'Diana Park',   '2024-01-18', '2024-03-22', FALSE, 445000, 'Won'),
('Sofia',     'Reyes',     'sofia.reyes@email.com',     '917-555-0121', 'Instagram',     'Condo',  620000, 'Qualified',          'Alex Chen',    '2024-03-12', '2024-04-08', TRUE,  620000, 'Open'),
('Nathan',    'Brooks',    'nathan.brooks@email.com',   '917-555-0122', 'Realtor.com',   'House',  285000, 'Contacted',          'Brianna Cole', '2024-02-20', '2024-04-05', TRUE,  285000, 'Open'),
('Aisha',     'Patel',     'aisha.patel@email.com',     '917-555-0123', 'Instagram',     'House',  730000, 'Negotiating',        'Marcus Webb',  '2024-03-05', '2024-04-12', FALSE, 730000, 'Open'),
('Carlos',    'Vega',      'carlos.vega@email.com',     '917-555-0124', 'Referral',      'Condo',  415000, 'Showing Scheduled',  'Diana Park',   '2024-03-18', '2024-04-11', FALSE, 415000, 'Open'),
('Elena',     'Moreau',    'elena.moreau@email.com',    '917-555-0125', 'Realtor.com',   'House',  560000, 'Closed Won',         'Alex Chen',    '2024-01-22', '2024-03-28', FALSE, 560000, 'Won'),
('David',     'Kim',       'david.kim@email.com',       '917-555-0126', 'Zillow',        'Rental', 310000, 'New Lead',           'Brianna Cole', '2024-04-13', '2024-04-16', FALSE, 310000, 'Open'),
('Jasmine',   'Ford',      'jasmine.ford@email.com',    '917-555-0127', 'Facebook Ads',  'House',  490000, 'Qualified',          'Marcus Webb',  '2024-03-08', '2024-04-09', TRUE,  490000, 'Open'),
('Ryan',      'Nakamura',  'ryan.nakamura@email.com',   '917-555-0128', 'Instagram',     'Condo',  375000, 'Closed Lost',        'Diana Park',   '2024-02-01', '2024-03-20', FALSE, 375000, 'Lost'),
('Camille',   'Dubois',    'camille.dubois@email.com',  '917-555-0129', 'Referral',      'House',  840000, 'Closed Won',         'Alex Chen',    '2024-01-12', '2024-04-01', FALSE, 840000, 'Won'),
('Trevor',    'Shaw',      'trevor.shaw@email.com',     '917-555-0130', 'Realtor.com',   'Rental', 255000, 'Contacted',          'Brianna Cole', '2024-02-25', '2024-04-03', TRUE,  255000, 'Open'),
('Mei',       'Lin',       'mei.lin@email.com',         '917-555-0131', 'Google Ads',    'House',  520000, 'Showing Scheduled',  'Marcus Webb',  '2024-03-20', '2024-04-13', FALSE, 520000, 'Open'),
('Jordan',    'Hayes',     'jordan.hayes@email.com',    '917-555-0132', 'Walk-In',       'Condo',  445000, 'Negotiating',        'Diana Park',   '2024-03-10', '2024-04-10', TRUE,  445000, 'Open'),
('Valentina', 'Cruz',      'valentina.cruz@email.com',  '917-555-0133', 'Instagram',     'House',  675000, 'Qualified',          'Alex Chen',    '2024-03-15', '2024-04-07', TRUE,  675000, 'Open'),
('Darius',    'King',      'darius.king@email.com',     '917-555-0134', 'Zillow',        'House',  390000, 'Closed Won',         'Brianna Cole', '2024-01-30', '2024-03-25', FALSE, 390000, 'Won'),
('Lena',      'Hoffman',   'lena.hoffman@email.com',    '917-555-0135', 'Realtor.com',   'Rental', 280000, 'New Lead',           'Marcus Webb',  '2024-04-14', '2024-04-15', FALSE, 280000, 'Open'),
('Phoebe',    'Grant',     'phoebe.grant@email.com',    '917-555-0136', 'Google Ads',    'Condo',  465000, 'Qualified',          'Diana Park',   '2024-03-12', '2024-04-07', TRUE,  465000, 'Open'),
('Omar',      'Siddiqi',   'omar.siddiqi@email.com',    '917-555-0137', 'Referral',      'House',  780000, 'Closed Won',         'Alex Chen',    '2024-01-08', '2024-04-01', FALSE, 780000, 'Won'),
('Claire',    'Fontaine',  'claire.fontaine@email.com', '917-555-0138', 'Walk-In',       'Rental', 230000, 'New Lead',           'Brianna Cole', '2024-04-14', '2024-04-15', FALSE, 230000, 'Open'),
('Felix',     'Wagner',    'felix.wagner@email.com',    '917-555-0139', 'Instagram',     'House',  550000, 'Showing Scheduled',  'Marcus Webb',  '2024-03-22', '2024-04-13', FALSE, 550000, 'Open'),
('Simone',    'Obi',       'simone.obi@email.com',      '917-555-0140', 'Zillow',        'Condo',  320000, 'Contacted',          'Diana Park',   '2024-03-01', '2024-04-03', TRUE,  320000, 'Open');


-- ============================================================
-- BUSINESS QUERIES
-- Each query answers a real business question
-- ============================================================

-- ─────────────────────────────────────────
-- QUERY 1: Total Active Pipeline Value
-- Business question: How much revenue potential is currently open?
-- ─────────────────────────────────────────
SELECT
    SUM(estimated_deal_value)           AS total_pipeline_value,
    COUNT(*)                            AS open_deals,
    ROUND(AVG(estimated_deal_value), 0) AS avg_deal_size
FROM leads
WHERE outcome = 'Open';


-- ─────────────────────────────────────────
-- QUERY 2: Lead Volume by Source
-- Business question: Which channel drives the most leads?
-- ─────────────────────────────────────────
SELECT
    lead_source,
    COUNT(*)                                AS total_leads,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS pct_of_total
FROM leads
GROUP BY lead_source
ORDER BY total_leads DESC;


-- ─────────────────────────────────────────
-- QUERY 3: Conversion Rate by Lead Source
-- Business question: Which channels produce actual customers?
-- ─────────────────────────────────────────
SELECT
    lead_source,
    COUNT(*)                                                          AS total_leads,
    COUNT(CASE WHEN outcome = 'Won' THEN 1 END)                       AS deals_won,
    COUNT(CASE WHEN outcome = 'Lost' THEN 1 END)                      AS deals_lost,
    ROUND(COUNT(CASE WHEN outcome = 'Won' THEN 1 END) * 100.0
        / NULLIF(COUNT(CASE WHEN outcome IN ('Won','Lost') THEN 1 END), 0), 1) AS conversion_rate_pct
FROM leads
GROUP BY lead_source
ORDER BY conversion_rate_pct DESC NULLS LAST;


-- ─────────────────────────────────────────
-- QUERY 4: Pipeline Stage Breakdown
-- Business question: Where are deals getting stuck?
-- ─────────────────────────────────────────
SELECT
    stage,
    COUNT(*)                              AS lead_count,
    SUM(estimated_deal_value)             AS stage_value,
    ROUND(AVG(estimated_deal_value), 0)   AS avg_deal_value
FROM leads
GROUP BY stage
ORDER BY
    CASE stage
        WHEN 'New Lead'            THEN 1
        WHEN 'Contacted'           THEN 2
        WHEN 'Qualified'           THEN 3
        WHEN 'Showing Scheduled'   THEN 4
        WHEN 'Negotiating'         THEN 5
        WHEN 'Closed Won'          THEN 6
        WHEN 'Closed Lost'         THEN 7
    END;


-- ─────────────────────────────────────────
-- QUERY 5: Follow-Up Gap Report
-- Business question: Which high-value leads are at risk of going cold?
-- ─────────────────────────────────────────
SELECT
    lead_id,
    first_name || ' ' || last_name        AS full_name,
    stage,
    estimated_deal_value,
    assigned_agent,
    last_contact_date,
    CURRENT_DATE - last_contact_date       AS days_since_contact
FROM leads
WHERE follow_up_needed = TRUE
  AND outcome = 'Open'
ORDER BY estimated_deal_value DESC;


-- ─────────────────────────────────────────
-- QUERY 6: Agent Performance Leaderboard
-- Business question: Who is closing the most revenue?
-- ─────────────────────────────────────────
SELECT
    assigned_agent,
    COUNT(*)                                                      AS total_leads,
    COUNT(CASE WHEN outcome = 'Won'  THEN 1 END)                  AS deals_won,
    COUNT(CASE WHEN outcome = 'Lost' THEN 1 END)                  AS deals_lost,
    SUM(CASE WHEN outcome = 'Won' THEN estimated_deal_value END)  AS revenue_closed,
    ROUND(COUNT(CASE WHEN outcome = 'Won' THEN 1 END) * 100.0
        / NULLIF(COUNT(CASE WHEN outcome IN ('Won','Lost') THEN 1 END), 0), 1) AS close_rate_pct
FROM leads
GROUP BY assigned_agent
ORDER BY revenue_closed DESC NULLS LAST;


-- ─────────────────────────────────────────
-- QUERY 7: Revenue by Property Type
-- Business question: Which property segment drives the most revenue?
-- ─────────────────────────────────────────
SELECT
    property_interest,
    COUNT(*)                                                      AS total_leads,
    COUNT(CASE WHEN outcome = 'Won' THEN 1 END)                   AS closed_won,
    SUM(CASE WHEN outcome = 'Won' THEN estimated_deal_value END)  AS revenue_closed,
    ROUND(AVG(CASE WHEN outcome = 'Won' THEN estimated_deal_value END), 0) AS avg_closed_value
FROM leads
GROUP BY property_interest
ORDER BY revenue_closed DESC NULLS LAST;


-- ─────────────────────────────────────────
-- QUERY 8: Monthly New Lead Volume
-- Business question: Is our lead generation growing month over month?
-- ─────────────────────────────────────────
SELECT
    TO_CHAR(created_date, 'YYYY-MM')  AS month,
    COUNT(*)                          AS new_leads,
    SUM(estimated_deal_value)         AS potential_value
FROM leads
GROUP BY TO_CHAR(created_date, 'YYYY-MM')
ORDER BY month;


-- ─────────────────────────────────────────
-- QUERY 9: Full Executive Summary View
-- Business question: Give me the complete pipeline snapshot
-- ─────────────────────────────────────────
SELECT
    COUNT(*)                                                             AS total_leads,
    COUNT(CASE WHEN outcome = 'Won'  THEN 1 END)                         AS total_won,
    COUNT(CASE WHEN outcome = 'Lost' THEN 1 END)                         AS total_lost,
    COUNT(CASE WHEN outcome = 'Open' THEN 1 END)                         AS total_open,
    SUM(CASE WHEN outcome = 'Open' THEN estimated_deal_value END)         AS active_pipeline_value,
    SUM(CASE WHEN outcome = 'Won'  THEN estimated_deal_value END)         AS total_revenue_closed,
    ROUND(AVG(CASE WHEN outcome = 'Won' THEN estimated_deal_value END),0) AS avg_won_deal_size,
    ROUND(COUNT(CASE WHEN outcome = 'Won' THEN 1 END) * 100.0
        / NULLIF(COUNT(CASE WHEN outcome IN ('Won','Lost') THEN 1 END),0),1) AS overall_close_rate_pct,
    COUNT(CASE WHEN follow_up_needed = TRUE AND outcome = 'Open' THEN 1 END) AS follow_ups_needed
FROM leads;
