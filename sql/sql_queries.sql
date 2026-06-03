-- CRM Pipeline Dashboard - Business Analysis Queries
-- Database: crm_pipeline (PostgreSQL)
-- Author: Jim Ferdous

-- QUERY 1: Total Pipeline Value
SELECT SUM(deal_value) AS total_pipeline_value FROM leads;

-- QUERY 2: Lead Count by Source
SELECT lead_source, COUNT(*) AS lead_count
FROM leads GROUP BY lead_source ORDER BY lead_count DESC;

-- QUERY 3: Revenue by Lead Source
SELECT lead_source, SUM(deal_value) AS total_revenue
FROM leads GROUP BY lead_source ORDER BY total_revenue DESC;

-- QUERY 4: Leads Needing Follow-Up
SELECT lead_id, customer_name, email, stage, assigned_agent, last_contact_date
FROM leads WHERE follow_up_needed = TRUE ORDER BY last_contact_date ASC;

-- QUERY 5: Pipeline Value by Agent
SELECT assigned_agent, COUNT(*) AS lead_count,
       SUM(deal_value) AS total_pipeline_value,
       ROUND(AVG(deal_value), 0) AS avg_deal_value
FROM leads GROUP BY assigned_agent ORDER BY total_pipeline_value DESC;

-- QUERY 6: Lead Distribution by Stage
SELECT stage, COUNT(*) AS lead_count,
       ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS percentage
FROM leads GROUP BY stage ORDER BY lead_count DESC;

-- QUERY 7: Largest Deals
SELECT lead_id, customer_name, city, property_interest,
       deal_value, stage, assigned_agent, lead_score
FROM leads ORDER BY deal_value DESC LIMIT 10;

-- BONUS: Win/Loss Rate by Agent
SELECT assigned_agent, COUNT(*) AS total_leads,
       SUM(CASE WHEN stage = 'Closed Won' THEN 1 ELSE 0 END) AS won,
       ROUND(SUM(CASE WHEN stage = 'Closed Won' THEN 1 ELSE 0 END) * 100.0
             / NULLIF(SUM(CASE WHEN stage IN ('Closed Won','Closed Lost') THEN 1 ELSE 0 END),0),1) AS win_pct
FROM leads GROUP BY assigned_agent ORDER BY win_pct DESC;
