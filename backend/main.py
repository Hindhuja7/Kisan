import socket

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
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
from services.voice import transcribe_audio
from data.mock_data import CROPS, MANDIS, get_mandi_prices, get_iot_sensor_data, get_satellite_ndvi, get_weather_alert, get_ndvi_grid

app = FastAPI(
    title="KisanMitra AI",
    description="Hackathon MVP — CrewAI + GPT-4o + Supabase",
    version="1.0.0",
)

# Allow local dev on any port (3000, 3001, etc.) — fixes CORS 400 on OPTIONS preflight
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?|https://.*\.vercel\.app",
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
        "agents": 5,
    }


def _lan_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"


@app.get("/api/network/info")
def network_info(frontend_port: int = 3000, api_port: int = 8001):
    ip = _lan_ip()
    return {
        "lan_ip": ip,
        "frontend_port": frontend_port,
        "api_port": api_port,
        "phone_login_url": f"http://{ip}:{frontend_port}/login",
        "phone_dashboard_url": f"http://{ip}:{frontend_port}/dashboard",
        "api_url": f"http://{ip}:{api_port}",
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


@app.post("/api/voice/transcribe")
async def voice_transcribe(
    audio: UploadFile = File(...),
    language: str = Form("te"),
):
    data = await audio.read()
    if not data:
        raise HTTPException(400, "Empty audio")
    text = transcribe_audio(data, audio.filename or "recording.webm", language)
    return {"text": text}


@app.get("/api/dashboard/overview")
def dashboard_overview(crop: str = "Tomato", farmer_id: str = "farmer-001"):
    iot = get_iot_sensor_data(farmer_id, crop)
    satellite = get_satellite_ndvi(farmer_id)
    prices = get_mandi_prices(crop)
    best = prices[0]
    weather = get_weather_alert()
    health_score = round(satellite["ndvi_mean"] * 100)
    return {
        "farmer": DEMO_FARMER.model_dump(),
        "crop": crop,
        "health_score": health_score,
        "ndvi": satellite["ndvi_mean"],
        "ndvi_grid": get_ndvi_grid(),
        "harvest_window": iot["optimal_harvest_window"],
        "days_to_harvest": iot["estimated_days_to_harvest"],
        "best_mandi": best,
        "expected_uplift_pct": 40,
        "weather": weather,
        "iot": iot,
        "satellite": satellite,
        "storage_status": "ready_to_book",
        "logistics_status": "awaiting_harvest",
    }


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
        "crop_loss_prevented_pct": 38.5,
        "ai_confidence_score": 91.2,
        "deal_success_rate": 94.0,
        "logistics_efficiency_pct": 87.0,
        "farmers_assisted": 1284 + len(workflows) * 3,
        "openai_enabled": bool(settings.openai_api_key),
        "supabase_enabled": supabase_client.is_connected(),
        "agents_active": 5,
    }
