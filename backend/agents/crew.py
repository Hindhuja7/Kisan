"""CrewAI multi-agent crew — crop, price, negotiation + orchestrator."""

import uuid
from datetime import datetime

from config import settings

try:
    from crewai import Agent, Task, Crew, Process
    from langchain_openai import ChatOpenAI
    _CREWAI_INSTALLED = True
except ImportError:
    _CREWAI_INSTALLED = False
from data.mock_data import (
    get_iot_sensor_data,
    get_satellite_ndvi,
    get_mandi_prices,
    get_price_forecast,
    get_matching_buyers,
)
from services.llm import gpt_json, gpt_text
from models.schemas import AgentResult, DemoWorkflowRequest

CREWAI_AVAILABLE = bool(settings.openai_api_key) and _CREWAI_INSTALLED


class _Req:
    def __init__(self, farmer_id, crop, language):
        self.farmer_id = farmer_id or "farmer-001"
        self.crop = crop
        self.language = language


class _Neg:
    def __init__(self, crop, quantity_tons, language):
        self.crop = crop
        self.quantity_tons = quantity_tons
        self.language = language


CropReadinessRequestLike = _Req
PriceIntelRequestLike = _Req
NegotiationRequestLike = _Neg


def _llm():
    return ChatOpenAI(model=settings.openai_model, api_key=settings.openai_api_key, temperature=0.4)


def run_crop_readiness(req: CropReadinessRequestLike) -> AgentResult:
    iot = get_iot_sensor_data(req.farmer_id, req.crop)
    satellite = get_satellite_ndvi(req.farmer_id)
    lang = req.language.value

    fallback = {
        "summary": f"Harvest window: {iot['optimal_harvest_window']['start']} – {iot['optimal_harvest_window']['end']}",
        "advisory": _template_advisory("crop", req.crop, iot, satellite, lang),
        "days_to_harvest": iot["estimated_days_to_harvest"],
        "ndvi": satellite["ndvi_mean"],
        "health": satellite["crop_health"],
    }

    if CREWAI_AVAILABLE:
        try:
            agent = Agent(
                role="Crop Readiness Specialist",
                goal="Predict optimal harvest window using IoT and satellite NDVI data",
                backstory="Expert agronomist for Telangana smallholder farmers using Sentinel-2 and field sensors.",
                llm=_llm(),
                verbose=False,
            )
            task = Task(
                description=(
                    f"Analyze crop readiness for {req.crop}. IoT: {iot}. Satellite: {satellite}. "
                    f"Respond in JSON with keys: summary, advisory (in {lang}), days_to_harvest, ndvi, health."
                ),
                expected_output="JSON with harvest advisory in farmer's language",
                agent=agent,
            )
            crew = Crew(agents=[agent], tasks=[task], process=Process.sequential, verbose=False)
            raw = crew.kickoff()
            parsed = gpt_json(
                "Extract JSON from this crop readiness analysis.",
                str(raw),
                fallback,
            )
            return AgentResult(
                agent="Crop Readiness Agent",
                status="completed",
                summary=parsed.get("summary", fallback["summary"]),
                advisory=parsed.get("advisory", fallback["advisory"]),
                data={"iot": iot, "satellite": satellite, **parsed},
            )
        except Exception:
            pass

    enhanced = gpt_json(
        "You are a crop readiness AI. Return JSON: summary, advisory, days_to_harvest, ndvi, health.",
        f"Crop: {req.crop}, IoT: {iot}, Satellite: {satellite}, Language: {lang}",
        fallback,
    )
    return AgentResult(
        agent="Crop Readiness Agent",
        status="completed",
        summary=enhanced.get("summary", fallback["summary"]),
        advisory=enhanced.get("advisory", fallback["advisory"]),
        data={"iot": iot, "satellite": satellite, **enhanced},
    )


def run_price_intelligence(req: PriceIntelRequestLike) -> AgentResult:
    prices = get_mandi_prices(req.crop)
    best = prices[0]
    forecast = get_price_forecast(req.crop, best["mandi_id"])
    lang = req.language.value
    local = round(best["price_per_quintal_inr"] * 0.65)

    fallback = {
        "summary": f"Best: ₹{best['price_per_quintal_inr']}/qtl at {best['mandi_name']}",
        "advisory": _template_advisory("price", req.crop, {"best": best, "forecast": forecast, "local": local}, {}, lang),
        "best_mandi": best["mandi_name"],
        "best_price": best["price_per_quintal_inr"],
        "uplift_per_quintal": best["price_per_quintal_inr"] - local,
    }

    if CREWAI_AVAILABLE:
        try:
            agent = Agent(
                role="Mandi Price Intelligence Analyst",
                goal="Find best mandi price and forecast trends across Telangana markets",
                backstory="Agri commodity analyst tracking 120+ mandis with weather and demand signals.",
                llm=_llm(),
                verbose=False,
            )
            task = Task(
                description=(
                    f"Analyze mandi prices for {req.crop}: {prices[:4]}. Forecast: {forecast}. "
                    f"Local trader pays ~₹{local}/qtl. JSON keys: summary, advisory ({lang}), best_mandi, best_price, uplift_per_quintal."
                ),
                expected_output="JSON price intelligence report",
                agent=agent,
            )
            crew = Crew(agents=[agent], tasks=[task], process=Process.sequential, verbose=False)
            raw = crew.kickoff()
            parsed = gpt_json("Extract JSON.", str(raw), fallback)
            return AgentResult(
                agent="Price Intelligence Agent",
                status="completed",
                summary=parsed.get("summary", fallback["summary"]),
                advisory=parsed.get("advisory", fallback["advisory"]),
                data={"prices": prices[:6], "forecast": forecast, **parsed},
            )
        except Exception:
            pass

    enhanced = gpt_json(
        "Return JSON: summary, advisory, best_mandi, best_price, uplift_per_quintal.",
        f"Crop: {req.crop}, Prices: {prices[:4]}, Forecast: {forecast}, Lang: {lang}",
        fallback,
    )
    return AgentResult(
        agent="Price Intelligence Agent",
        status="completed",
        summary=enhanced.get("summary", fallback["summary"]),
        advisory=enhanced.get("advisory", fallback["advisory"]),
        data={"prices": prices[:6], "forecast": forecast, **enhanced},
    )


def run_buyer_negotiation(req: NegotiationRequestLike) -> AgentResult:
    prices = get_mandi_prices(req.crop)
    local = round(prices[0]["price_per_quintal_inr"] * 0.65)
    buyers = get_matching_buyers(req.crop, req.quantity_tons)
    best = buyers[0] if buyers else None
    lang = req.language.value

    if not best:
        return AgentResult(
            agent="Buyer Negotiation Agent",
            status="no_match",
            summary="No buyers matched quantity",
            advisory="Try reducing quantity or changing crop.",
            data={"buyers": []},
        )

    log = [
        {"round": 1, "party": "buyer", "offer": round(best["offered_price_per_quintal"] * 0.92)},
        {"round": 2, "party": "agent", "offer": round(best["offered_price_per_quintal"] * 0.97)},
        {"round": 3, "party": "buyer", "offer": best["offered_price_per_quintal"], "status": "accepted"},
    ]
    deal_value = round(best["offered_price_per_quintal"] * req.quantity_tons * 10)
    uplift = round(((best["offered_price_per_quintal"] - local) / local) * 100, 1)

    fallback = {
        "summary": f"Deal closed with {best['name']} at ₹{best['offered_price_per_quintal']}/qtl",
        "advisory": _template_advisory("deal", req.crop, {"buyer": best, "uplift": uplift, "value": deal_value}, {}, lang),
        "buyer": best["name"],
        "final_price": best["offered_price_per_quintal"],
        "deal_value_inr": deal_value,
        "uplift_pct": uplift,
        "negotiation_log": log,
    }

    if CREWAI_AVAILABLE:
        try:
            agent = Agent(
                role="Buyer Negotiation Agent",
                goal="Negotiate optimal deal on farmer's behalf with verified buyers",
                backstory="AI procurement negotiator protecting farmer margins against middlemen.",
                llm=_llm(),
                verbose=False,
            )
            task = Task(
                description=(
                    f"Simulate 3-round negotiation for {req.quantity_tons}t {req.crop}. "
                    f"Buyer: {best}. Local trader: ₹{local}/qtl. "
                    f"JSON: summary, advisory ({lang}), buyer, final_price, deal_value_inr, uplift_pct, negotiation_log."
                ),
                expected_output="JSON negotiation result with round-by-round log",
                agent=agent,
            )
            crew = Crew(agents=[agent], tasks=[task], process=Process.sequential, verbose=False)
            raw = crew.kickoff()
            parsed = gpt_json("Extract JSON.", str(raw), fallback)
            return AgentResult(
                agent="Buyer Negotiation Agent",
                status="completed",
                summary=parsed.get("summary", fallback["summary"]),
                advisory=parsed.get("advisory", fallback["advisory"]),
                data={**fallback, **parsed},
            )
        except Exception:
            pass

    enhanced = gpt_json(
        "Return JSON negotiation result with negotiation_log array.",
        f"Buyer: {best}, Local: {local}, Lang: {lang}",
        fallback,
    )
    return AgentResult(
        agent="Buyer Negotiation Agent",
        status="completed",
        summary=enhanced.get("summary", fallback["summary"]),
        advisory=enhanced.get("advisory", fallback["advisory"]),
        data={**fallback, **enhanced},
    )


def run_demo_workflow(req: DemoWorkflowRequest) -> dict:
    workflow_id = str(uuid.uuid4())[:8].upper()
    crop_req = _Req(req.farmer_id, req.crop, req.language)
    price_req = _Req(None, req.crop, req.language)
    neg_req = _Neg(req.crop, req.quantity_tons, req.language)

    steps = [
        run_crop_readiness(crop_req),
        run_price_intelligence(price_req),
        run_buyer_negotiation(neg_req),
    ]

    deal_step = steps[2]
    deal_value = deal_step.data.get("deal_value_inr", 0)
    uplift = deal_step.data.get("uplift_pct", 40.0)

    return {
        "workflow_id": workflow_id,
        "farmer_id": req.farmer_id,
        "crop": req.crop,
        "status": "completed",
        "steps": [s.model_dump() for s in steps],
        "deal_value_inr": deal_value,
        "income_uplift_pct": uplift,
        "completed_at": datetime.now().isoformat(),
    }


def _template_advisory(kind: str, crop: str, primary: dict, secondary: dict, lang: str) -> str:
    if kind == "crop":
        w = primary["optimal_harvest_window"]
        if lang == "te":
            return f"మీ {crop} {w['start']}–{w['end']} మధ్య కోయండి. NDVI {secondary.get('ndvi_mean', primary.get('ndvi_index'))}."
        if lang == "hi":
            return f"{crop} को {w['start']}–{w['end']} के बीच काटें। NDVI {secondary.get('ndvi_mean', primary.get('ndvi_index'))}।"
        return f"Harvest {crop} between {w['start']} and {w['end']}. NDVI: {secondary.get('ndvi_mean', primary.get('ndvi_index'))}."

    if kind == "price":
        best = primary["best"]
        uplift = primary.get("uplift_per_quintal", best["price_per_quintal_inr"] - primary.get("local", 0))
        if lang == "te":
            return f"{best['mandi_name']} లో ₹{best['price_per_quintal_inr']}/క్వింటాల్ — స్థానిక వ్యాపారి కంటే ₹{uplift} ఎక్కువ."
        if lang == "hi":
            return f"{best['mandi_name']} में ₹{best['price_per_quintal_inr']}/क्विंटल — स्थानीय व्यापारी से ₹{uplift} अधिक।"
        return f"Sell at {best['mandi_name']}: ₹{best['price_per_quintal_inr']}/qtl vs local trader (+₹{uplift}/qtl)."

    if kind == "deal":
        buyer = primary["buyer"]
        if lang == "te":
            return f"{buyer['name']} తో ₹{buyer['offered_price_per_quintal']}/క్వింటాల్ ఒప్పందం. మొత్తం ₹{primary['value']:,}."
        if lang == "hi":
            return f"{buyer['name']} के साथ ₹{buyer['offered_price_per_quintal']}/क्विंटल पर सौदा। कुल ₹{primary['value']:,}।"
        return f"Deal with {buyer['name']} at ₹{buyer['offered_price_per_quintal']}/qtl. Total: ₹{primary['value']:,} (+{primary['uplift']}%)."

    return "KisanMitra AI advisory ready."
