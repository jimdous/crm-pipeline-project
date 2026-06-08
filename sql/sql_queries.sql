-- ============================================================
-- CRM Pipeline Dashboard — Business Analysis Queries
-- Database: crm_pipeline (PostgreSQL 17)
-- Author: Jim Ferdous | github.com/jimdous
-- ============================================================
-- Tables: leads (30), contacts (15), deals (15), activities (25)
-- Total pipeline: $21,495,000 across 30 leads
-- ============================================================


-- QUERY 1: Total Pipeline Value
-- Business Question: What is the total value of all deals in the pipeline?
-- Result: $21,495,000
SELECT SUM(deal_value) AS total_pipeline_value
FROM leads;


-- QUERY 2: Lead Count by Source
-- Business Question: Which lead sources are generating the most leads?
SELECT lead_source,
       COUNT(*) AS lead_count
FROM leads
GROUP BY lead_source
ORDER BY lead_count DESC;


-- QUERY 3: Revenue by Lead Source
-- Business Question: Which source is driving the most deal value?
-- Result: Zillow $4.31M | Facebook $3.89M | Referral $3.67M
SELECT lead_source,
       COUNT(*) AS lead_count,
       SUM(deal_value) AS total_revenue,
       ROUND(AVG(deal_value), 0) AS avg_deal_value
FROM leads
GROUP BY lead_source
ORDER BY total_revenue DESC;


-- QUERY 4: Leads Needing Follow-Up
-- Business Question: Which leads require immediate follow-up action?
SELECT lead_id,
       customer_name,
       email,
       stage,
       assigned_agent,
       last_contact_date
FROM leads
WHERE follow_up_needed = TRUE
ORDER BY last_contact_date ASC;


-- QUERY 5: Pipeline Value by Agent
-- Business Question: How is pipeline value distributed across agents?
-- Result: Jim Ferdous $7.29M | Sarah Kim $5.60M | Mike Patel $5.06M | Emily Chen $3.54M
SELECT assigned_agent,
       COUNT(*) AS lead_count,
       SUM(deal_value) AS total_pipeline_value,
       ROUND(AVG(deal_value), 0) AS avg_deal_value
FROM leads
GROUP BY assigned_agent
ORDER BY total_pipeline_value DESC;


-- QUERY 6: Lead Distribution by Stage
-- Business Question: How many leads are in each stage of the funnel?
SELECT stage,
       COUNT(*) AS lead_count,
       ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS percentage
FROM leads
GROUP BY stage
ORDER BY lead_count DESC;


-- QUERY 7: Largest Deals
-- Business Question: What are the top deals by value in the pipeline?
SELECT lead_id,
       customer_name,
       city,
       property_interest,
       deal_value,
       stage,
       assigned_agent,
       lead_score
FROM leads
ORDER BY deal_value DESC
LIMIT 10;


-- QUERY 8: Win/Loss Rate by Agent
-- Business Question: Which agents have the highest close rate?
SELECT assigned_agent,
       COUNT(*) AS total_leads,
       SUM(CASE WHEN stage = 'Closed Won' THEN 1 ELSE 0 END) AS won,
       SUM(CASE WHEN stage = 'Closed Lost' THEN 1 ELSE 0 END) AS lost,
       ROUND(
           SUM(CASE WHEN stage = 'Closed Won' THEN 1 ELSE 0 END) * 100.0
           / NULLIF(SUM(CASE WHEN stage IN ('Closed Won', 'Closed Lost') THEN 1 ELSE 0 END), 0),
           1
       ) AS win_rate_pct
FROM leads
GROUP BY assigned_agent
ORDER BY win_rate_pct DESC;


-- QUERY 9: Average Lead Score by Property Type
-- Business Question: Which property types attract the most engaged buyers?
SELECT property_interest,
       COUNT(*) AS lead_count,
       ROUND(AVG(lead_score), 1) AS avg_lead_score,
       ROUND(AVG(deal_value), 0) AS avg_deal_value
FROM leads
GROUP BY property_interest
ORDER BY avg_lead_score DESC;


-- QUERY 10: Active Deals with Weighted Probability
-- Business Question: What is the expected revenue from open deals?
-- Uses JOIN across leads and deals tables
SELECT l.customer_name,
       l.lead_source,
       l.assigned_agent,
       d.deal_name,
       d.deal_value,
       d.probability,
       ROUND(d.deal_value * d.probability / 100.0, 0) AS weighted_value,
       d.stage,
       d.expected_close_date
FROM deals d
JOIN leads l ON d.lead_id = l.lead_id
WHERE d.stage NOT IN ('Closed Won', 'Closed Lost')
ORDER BY weighted_value DESC;
