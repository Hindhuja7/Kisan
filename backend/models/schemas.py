from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional


class Language(str, Enum):
    EN = "en"
    TE = "te"
    HI = "hi"


class FarmerProfile(BaseModel):
    id: str
    name: str
    phone: str
    village: str
    district: str
    state: str = "Telangana"
    crops: list[str] = []
    land_acres: float = 5.0


class CropReadinessRequest(BaseModel):
    farmer_id: str = "farmer-001"
    crop: str = "Tomato"
    language: Language = Language.TE


class PriceIntelRequest(BaseModel):
    crop: str = "Tomato"
    language: Language = Language.TE


class NegotiationRequest(BaseModel):
    crop: str = "Tomato"
    quantity_tons: float = Field(default=5.0, ge=0.5)
    language: Language = Language.TE


class WhatsAppRequest(BaseModel):
    phone: str = "+919876543210"
    message: str
    crop: str = "Tomato"
    language: Language = Language.TE


class AgentResult(BaseModel):
    agent: str
    status: str
    summary: str
    advisory: str
    data: dict = {}
    reasoning: list[str] = []
    confidence: float = 0.85
    completed_at: Optional[str] = None


class DemoWorkflowRequest(BaseModel):
    farmer_id: str = "farmer-001"
    crop: str = "Tomato"
    quantity_tons: float = Field(default=5.0, ge=0.5)
    language: Language = Language.TE
