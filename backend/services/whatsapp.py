"""WhatsApp farmer interaction — mock Twilio layer with GPT-4o replies."""

from services.llm import gpt_text
from services import supabase_client
from data.mock_data import CROPS, get_mandi_prices, get_iot_sensor_data

FARMER_INTENTS = {
    "price": ["price", "rate", "mandi", "ధర", "भाव", "quintal"],
    "harvest": ["harvest", "ready", "crop", "పంట", "कटाई", "ndvi"],
    "deal": ["sell", "buyer", "deal", "అమ్మ", "बेच", "negotiate"],
    "help": ["help", "hi", "hello", "namaste", "నమస్కారం"],
}


def detect_intent(message: str) -> str:
    lower = message.lower()
    for intent, keywords in FARMER_INTENTS.items():
        if any(k in lower for k in keywords):
            return intent
    return "general"


def build_mock_reply(intent: str, crop: str, language: str) -> str:
    if intent == "price":
        prices = get_mandi_prices(crop)
        best = prices[0]
        if language == "te":
            return f"🌾 {crop} ఉత్తమ ధర: {best['mandi_name']} లో ₹{best['price_per_quintal_inr']}/క్వింటాల్. స్థానిక వ్యాపారి కంటే 35% ఎక్కువ!"
        if language == "hi":
            return f"🌾 {crop} सर्वोत्तम मंडी: {best['mandi_name']} — ₹{best['price_per_quintal_inr']}/क्विंटल। स्थानीय व्यापारी से 35% अधिक!"
        return f"🌾 Best {crop} price: ₹{best['price_per_quintal_inr']}/quintal at {best['mandi_name']}. That's ~35% above local trader rates."

    if intent == "harvest":
        iot = get_iot_sensor_data("farmer-001", crop)
        w = iot["optimal_harvest_window"]
        if language == "te":
            return f"🌾 మీ {crop} పంట {w['start']}–{w['end']} మధ్య కోయడానికి సిద్ధం. NDVI: {iot['ndvi_index']}"
        if language == "hi":
            return f"🌾 आपकी {crop} फसल {w['start']}–{w['end']} के बीच कटाई के लिए तैयार। NDVI: {iot['ndvi_index']}"
        return f"🌾 Your {crop} is ready to harvest between {w['start']} and {w['end']}. NDVI index: {iot['ndvi_index']}"

    if intent == "deal":
        if language == "te":
            return "🤝 బయర్ ఏజెంట్ FreshMart Retail తో ₹2,400/క్వింటాల్ ధరకు చర్చలు ప్రారంభించాము. 'negotiate' అని టైప్ చేసి పూర్తి సిమ్యులేషన్ చూడండి."
        if language == "hi":
            return "🤝 बायर एजेंट FreshMart Retail के साथ ₹2,400/क्विंटल पर बातचीत शुरू की। पूरा सिमुलेशन देखने के लिए 'negotiate' टाइप करें।"
        return "🤝 Buyer agent started negotiation with FreshMart Retail at ₹2,400/quintal. Type 'negotiate' in the app for full simulation."

    if language == "te":
        return "🙏 నమస్కారం! KisanMitra AI — ధర, పంట, లేదా అమ్మకం గురించి అడగండి."
    if language == "hi":
        return "🙏 नमस्ते! KisanMitra AI — कीमत, फसल या बिक्री के बारे में पूछें।"
    return "🙏 Namaste! I'm KisanMitra AI. Ask about mandi prices, crop readiness, or selling your harvest."


def handle_farmer_message(phone: str, message: str, crop: str = "Tomato", language: str = "te") -> dict:
    intent = detect_intent(message)
    mock = build_mock_reply(intent, crop, language)

    system = (
        "You are KisanMitra AI, a WhatsApp assistant for Indian smallholder farmers. "
        "Reply in the farmer's language (te=Telugu, hi=Hindi, en=English). "
        "Keep responses under 3 sentences. Use emojis sparingly. Be practical and encouraging."
    )
    user = f"Language: {language}\nCrop: {crop}\nIntent: {intent}\nFarmer message: {message}\nContext hint: {mock}"

    reply = gpt_text(system, user, mock)

    inbound = supabase_client.save_whatsapp_message({
        "phone": phone,
        "direction": "inbound",
        "message": message,
        "intent": intent,
        "crop": crop,
        "language": language,
    })
    outbound = supabase_client.save_whatsapp_message({
        "phone": phone,
        "direction": "outbound",
        "message": reply,
        "intent": intent,
        "crop": crop,
        "language": language,
    })

    return {
        "phone": phone,
        "intent": intent,
        "reply": reply,
        "inbound_id": inbound.get("id"),
        "outbound_id": outbound.get("id"),
        "channel": "whatsapp_mock",
    }
