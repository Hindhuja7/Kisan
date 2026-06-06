from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models.schemas import (
    FarmerProfile,
    CropReadinessRequest,
    PriceIntelRequest,
    NegotiationRequest,
    WhatsAppRequest,
    DemoWorkflowRequest,
    AgentResult,
)
from agents.crew import run_crop_readiness, run_price_intelligence, run_buyer_negotiation, run_demo_workflow, CREWAI_AVAILABLE
from services import supabase_client
from services.whatsapp import handle_farmer_message
from data.mock_data import CROPS, MANDIS, get_mandi_prices, get_iot_sensor_data, get_satellite_ndvi

app = FastAPI(
    title="KisanMitra AI",
    description="Hackathon MVP — CrewAI + GPT-4o + Supabase",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEMO_FARMER = FarmerProfile(
    id="farmer-001",
    name="Ramesh Kumar",
    phone="+919876543210",
    village="Hanamkonda",
    district="Warangal",
    crops=["Tomato", "Cotton"],
    land_acres=8.5,
)


@app.get("/")
def root():
    return {
        "platform": "KisanMitra AI",
        "mvp_features": ["crop_readiness", "mandi_prices", "buyer_negotiation", "whatsapp"],
        "crewai": CREWAI_AVAILABLE,
        "supabase": supabase_client.is_connected(),
        "llm": settings.openai_model if settings.openai_api_key else "mock",
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "openai": bool(settings.openai_api_key),
        "supabase": supabase_client.is_connected(),
        "agents": 4,
    }


@app.get("/api/farmer/{farmer_id}", response_model=FarmerProfile)
def get_farmer(farmer_id: str):
    if farmer_id != DEMO_FARMER.id:
        raise HTTPException(404, "Farmer not found")
    return DEMO_FARMER


@app.get("/api/crops")
def list_crops():
    return {"crops": CROPS}


@app.get("/api/mandis")
def list_mandis():
    return {"mandis": MANDIS}


@app.get("/api/mandi-prices/{crop}")
def mandi_prices(crop: str):
    if crop not in CROPS:
        raise HTTPException(400, f"Unknown crop. Choose: {CROPS}")
    return {"crop": crop, "prices": get_mandi_prices(crop)}


@app.get("/api/sensors/{farmer_id}")
def sensors(farmer_id: str, crop: str = "Tomato"):
    return {"iot": get_iot_sensor_data(farmer_id, crop), "satellite": get_satellite_ndvi(farmer_id)}


@app.post("/api/agents/crop-readiness", response_model=AgentResult)
def crop_readiness(req: CropReadinessRequest):
    result = run_crop_readiness(req)
    supabase_client.save_workflow({"type": "crop_readiness", "crop": req.crop, "result": result.model_dump()})
    return result


@app.post("/api/agents/price-intelligence", response_model=AgentResult)
def price_intelligence(req: PriceIntelRequest):
    result = run_price_intelligence(req)
    supabase_client.save_workflow({"type": "price_intelligence", "crop": req.crop, "result": result.model_dump()})
    return result


@app.post("/api/agents/negotiate", response_model=AgentResult)
def negotiate(req: NegotiationRequest):
    result = run_buyer_negotiation(req)
    if result.status == "completed":
        supabase_client.save_deal({
            "crop": req.crop,
            "quantity_tons": req.quantity_tons,
            "buyer": result.data.get("buyer"),
            "final_price": result.data.get("final_price"),
            "deal_value_inr": result.data.get("deal_value_inr"),
        })
    return result


@app.post("/api/workflow/run")
def run_workflow(req: DemoWorkflowRequest):
    result = run_demo_workflow(req)
    supabase_client.save_workflow({"type": "full_workflow", **result})
    return result


@app.get("/api/workflow/history")
def workflow_history():
    return {"workflows": supabase_client.list_workflows()}


@app.get("/api/deals")
def deals():
    return {"deals": supabase_client.list_deals()}


@app.post("/api/whatsapp/chat")
def whatsapp_chat(req: WhatsAppRequest):
    return handle_farmer_message(req.phone, req.message, req.crop, req.language.value)


@app.get("/api/whatsapp/messages")
def whatsapp_messages(phone: str = "+919876543210"):
    return {"messages": supabase_client.list_whatsapp_messages(phone)}


@app.get("/api/dashboard/stats")
def dashboard_stats():
    workflows = supabase_client.list_workflows(50)
    deals = supabase_client.list_deals(50)
    messages = supabase_client.list_whatsapp_messages(limit=100)
    uplifts = [
        w.get("income_uplift_pct") or w.get("result", {}).get("data", {}).get("uplift_pct")
        for w in workflows
        if w.get("income_uplift_pct") or w.get("type") == "full_workflow"
    ]
    uplifts = [u for u in uplifts if u]
    return {
        "workflows_run": len(workflows),
        "deals_closed": len(deals),
        "whatsapp_messages": len(messages),
        "mandis_monitored": len(MANDIS),
        "avg_income_uplift_pct": round(sum(uplifts) / len(uplifts), 1) if uplifts else 40.0,
        "openai_enabled": bool(settings.openai_api_key),
        "supabase_enabled": supabase_client.is_connected(),
    }
