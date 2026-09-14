from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

Stage = Literal["New Lead", "Contacted", "Qualified", "Showing Scheduled", "Negotiating", "Closed Won", "Closed Lost"]
Name = Annotated[str, Field(min_length=1, max_length=50)]
Money = Annotated[Decimal, Field(gt=0, max_digits=12, decimal_places=2)]


def today() -> date:
    return datetime.now(timezone.utc).date()


class LeadCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    first_name: Name
    last_name: Name
    email: Annotated[EmailStr, Field(max_length=100)] | None = None
    phone: Annotated[str, Field(max_length=20)] | None = None
    lead_source: Annotated[str, Field(min_length=1, max_length=50)] | None = None
    property_interest: Annotated[str, Field(min_length=1, max_length=50)] | None = None
    budget: Money | None = None
    stage: Stage = "New Lead"
    assigned_agent: Annotated[str, Field(min_length=1, max_length=100)] | None = None
    created_date: date = Field(default_factory=today)
    last_contact_date: date | None = None
    follow_up_needed: bool = False
    estimated_deal_value: Money | None = None

    @model_validator(mode="after")
    def dates_are_consistent(self):
        if self.created_date > today():
            raise ValueError("Created date cannot be in the future")
        if self.last_contact_date:
            if self.last_contact_date < self.created_date:
                raise ValueError("Last contact cannot precede created date")
            if self.last_contact_date > today():
                raise ValueError("Last contact cannot be in the future")
        return self


class LeadPatch(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    first_name: Name | None = None
    last_name: Name | None = None
    email: Annotated[EmailStr, Field(max_length=100)] | None = None
    phone: Annotated[str, Field(max_length=20)] | None = None
    lead_source: Annotated[str, Field(min_length=1, max_length=50)] | None = None
    property_interest: Annotated[str, Field(min_length=1, max_length=50)] | None = None
    budget: Money | None = None
    stage: Stage | None = None
    assigned_agent: Annotated[str, Field(min_length=1, max_length=100)] | None = None
    created_date: date | None = None
    last_contact_date: date | None = None
    follow_up_needed: bool | None = None
    estimated_deal_value: Money | None = None

    @model_validator(mode="after")
    def required_fields_cannot_be_cleared(self):
        if not self.model_fields_set:
            raise ValueError("Provide at least one field to update")
        for field in ("first_name", "last_name", "stage", "created_date", "follow_up_needed"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class LeadOut(BaseModel):
    lead_id: int
    first_name: str
    last_name: str
    email: str | None
    phone: str | None
    lead_source: str | None
    property_interest: str | None
    budget: Decimal | None
    stage: str | None
    assigned_agent: str | None
    created_date: date | None
    last_contact_date: date | None
    follow_up_needed: bool | None
    estimated_deal_value: Decimal | None
    outcome: str | None


class LeadPage(BaseModel):
    items: list[LeadOut]
    total: int
    limit: int
    offset: int


def outcome_for(stage: str) -> str:
    return {"Closed Won": "Won", "Closed Lost": "Lost"}.get(stage, "Open")
