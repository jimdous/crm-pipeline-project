ALTER TABLE leads
    ALTER COLUMN stage SET NOT NULL,
    ALTER COLUMN created_date SET NOT NULL,
    ALTER COLUMN follow_up_needed SET NOT NULL,
    ALTER COLUMN outcome SET NOT NULL,
    ADD CONSTRAINT leads_first_name_present CHECK (length(btrim(first_name)) > 0),
    ADD CONSTRAINT leads_last_name_present CHECK (length(btrim(last_name)) > 0),
    ADD CONSTRAINT leads_budget_positive CHECK (budget > 0),
    ADD CONSTRAINT leads_value_positive CHECK (estimated_deal_value > 0),
    ADD CONSTRAINT leads_stage_allowed CHECK (stage IN (
        'New Lead', 'Contacted', 'Qualified', 'Showing Scheduled',
        'Negotiating', 'Closed Won', 'Closed Lost'
    )),
    ADD CONSTRAINT leads_outcome_matches_stage CHECK (
        outcome = CASE stage
            WHEN 'Closed Won' THEN 'Won'
            WHEN 'Closed Lost' THEN 'Lost'
            ELSE 'Open'
        END
    ),
    ADD CONSTRAINT leads_contact_after_creation CHECK (last_contact_date >= created_date);

CREATE INDEX leads_created_order ON leads (created_date DESC NULLS LAST, lead_id DESC);
CREATE INDEX leads_open_contact_order ON leads (last_contact_date ASC NULLS FIRST, lead_id)
    WHERE outcome = 'Open';
