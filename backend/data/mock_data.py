"""Mock data for hackathon MVP — replace with live APIs in production."""

from datetime import datetime, timedelta
import random

CROPS = ["Tomato", "Onion", "Chilli", "Cotton", "Paddy", "Maize"]

MANDIS = [
    {"id": "hyd-01", "name": "Gaddiannaram", "district": "Hyderabad", "state": "Telangana"},
    {"id": "hyd-02", "name": "Bowenpally", "district": "Hyderabad", "state": "Telangana"},
    {"id": "wgl-01", "name": "Warangal APMC", "district": "Warangal", "state": "Telangana"},
    {"id": "nzb-01", "name": "Nizamabad APMC", "district": "Nizamabad", "state": "Telangana"},
    {"id": "kdp-01", "name": "Kadapa APMC", "district": "Kadapa", "state": "Andhra Pradesh"},
    {"id": "vzg-01", "name": "Vizag APMC", "district": "Visakhapatnam", "state": "Andhra Pradesh"},
]

COLD_STORAGE_FACILITIES = [
    {"id": "cs-01", "name": "Telangana Cold Chain Hub", "location": "Shamshabad", "capacity_tons": 500, "rate_per_ton_day": 45},
    {"id": "cs-02", "name": "Warangal Agri Storage", "location": "Warangal", "capacity_tons": 200, "rate_per_ton_day": 38},
    {"id": "cs-03", "name": "Nizamabad Fresh Store", "location": "Nizamabad", "capacity_tons": 150, "rate_per_ton_day": 42},
]

BUYERS = [
    {"id": "buy-01", "name": "FreshMart Retail", "type": "retailer", "crop_interest": ["Tomato", "Onion"], "min_qty_tons": 2},
    {"id": "buy-02", "name": "SpiceCo Processors", "type": "processor", "crop_interest": ["Chilli", "Onion"], "min_qty_tons": 5},
    {"id": "buy-03", "name": "Gulf Agri Exports", "type": "exporter", "crop_interest": ["Cotton", "Chilli"], "min_qty_tons": 10},
    {"id": "buy-04", "name": "Metro Wholesale", "type": "retailer", "crop_interest": ["Tomato", "Paddy", "Maize"], "min_qty_tons": 3},
]

TRANSPORT_VEHICLES = [
    {"id": "tv-01", "type": "tractor_trailer", "capacity_tons": 5, "location": "Hyderabad", "rate_per_km": 12},
    {"id": "tv-02", "type": "cold_van", "capacity_tons": 3, "location": "Warangal", "rate_per_km": 18},
    {"id": "tv-03", "type": "refrigerated_truck", "capacity_tons": 10, "location": "Shamshabad", "rate_per_km": 22},
]


def get_iot_sensor_data(farmer_id: str, crop: str) -> dict:
    base_moisture = random.uniform(35, 65)
    base_temp = random.uniform(24, 34)
    days_to_harvest = random.randint(5, 21)
    return {
        "farmer_id": farmer_id,
        "crop": crop,
        "soil_moisture_pct": round(base_moisture, 1),
        "soil_temperature_c": round(base_temp, 1),
        "humidity_pct": round(random.uniform(55, 85), 1),
        "ndvi_index": round(random.uniform(0.55, 0.85), 2),
        "estimated_days_to_harvest": days_to_harvest,
        "optimal_harvest_window": {
            "start": (datetime.now() + timedelta(days=days_to_harvest - 2)).strftime("%Y-%m-%d"),
            "end": (datetime.now() + timedelta(days=days_to_harvest + 3)).strftime("%Y-%m-%d"),
        },
        "timestamp": datetime.now().isoformat(),
    }


def get_satellite_ndvi(farmer_id: str) -> dict:
    ndvi = round(random.uniform(0.5, 0.9), 2)
    health = "excellent" if ndvi > 0.75 else "good" if ndvi > 0.6 else "moderate"
    return {
        "farmer_id": farmer_id,
        "source": "Sentinel-2",
        "ndvi_mean": ndvi,
        "crop_health": health,
        "field_area_acres": round(random.uniform(2, 15), 1),
        "anomaly_detected": ndvi < 0.55,
        "capture_date": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
    }


def get_mandi_prices(crop: str) -> list[dict]:
    prices = []
    base = {"Tomato": 2200, "Onion": 1800, "Chilli": 8500, "Cotton": 6200, "Paddy": 2100, "Maize": 1900}.get(crop, 2000)
    for mandi in MANDIS:
        variation = random.uniform(0.75, 1.25)
        price = round(base * variation)
        trend = random.choice(["rising", "stable", "falling"])
        prices.append({
            "mandi_id": mandi["id"],
            "mandi_name": mandi["name"],
            "district": mandi["district"],
            "crop": crop,
            "price_per_quintal_inr": price,
            "trend": trend,
            "updated_at": datetime.now().isoformat(),
        })
    return sorted(prices, key=lambda x: x["price_per_quintal_inr"], reverse=True)


def get_price_forecast(crop: str, mandi_id: str) -> dict:
    current = next((p for p in get_mandi_prices(crop) if p["mandi_id"] == mandi_id), None)
    if not current:
        return {}
    forecast_7d = round(current["price_per_quintal_inr"] * random.uniform(0.95, 1.15))
    forecast_14d = round(current["price_per_quintal_inr"] * random.uniform(0.9, 1.2))
    return {
        "mandi_id": mandi_id,
        "crop": crop,
        "current_price": current["price_per_quintal_inr"],
        "forecast_7d": forecast_7d,
        "forecast_14d": forecast_14d,
        "recommendation": "sell_now" if forecast_7d < current["price_per_quintal_inr"] else "hold_1_week",
        "confidence": round(random.uniform(0.72, 0.92), 2),
    }


def get_storage_availability(harvest_date: str) -> list[dict]:
    results = []
    for facility in COLD_STORAGE_FACILITIES:
        available = random.randint(20, facility["capacity_tons"] // 2)
        negotiated_rate = round(facility["rate_per_ton_day"] * random.uniform(0.85, 1.0))
        results.append({
            **facility,
            "available_tons": available,
            "negotiated_rate_per_ton_day": negotiated_rate,
            "booking_status": "available" if available > 30 else "limited",
        })
    return results


def get_matching_buyers(crop: str, quantity_tons: float) -> list[dict]:
    matches = []
    for buyer in BUYERS:
        if crop in buyer["crop_interest"] and quantity_tons >= buyer["min_qty_tons"]:
            base_price = get_mandi_prices(crop)[0]["price_per_quintal_inr"]
            offered = round(base_price * random.uniform(1.02, 1.12))
            matches.append({
                **buyer,
                "offered_price_per_quintal": offered,
                "negotiation_status": "ready",
                "estimated_deal_value_inr": round(offered * quantity_tons * 10),
            })
    return sorted(matches, key=lambda x: x["offered_price_per_quintal"], reverse=True)


def get_weather_alert() -> dict:
    risks = ["heat_wave", "heavy_rain", "none", "none"]
    risk = random.choice(risks)
    return {
        "condition": "partly_cloudy" if risk == "none" else risk,
        "temp_c": round(random.uniform(28, 38), 1),
        "rain_chance_pct": round(random.uniform(10, 60), 0) if risk == "heavy_rain" else round(random.uniform(5, 25), 0),
        "alert": "Heavy rain expected in 48h — harvest early" if risk == "heavy_rain" else (
            "Heat stress risk — increase irrigation" if risk == "heat_wave" else "Favorable conditions"
        ),
        "risk_level": "high" if risk != "none" else "low",
    }


def get_ndvi_grid(size: int = 8) -> list[list[float]]:
    base = random.uniform(0.55, 0.85)
    return [[round(max(0.3, min(0.95, base + random.uniform(-0.15, 0.15))), 2) for _ in range(size)] for _ in range(size)]


def get_transport_options(origin: str, destination: str, quantity_tons: float) -> list[dict]:
    options = []
    distance_km = random.randint(80, 350)
    for vehicle in TRANSPORT_VEHICLES:
        if vehicle["capacity_tons"] >= quantity_tons:
            cost = round(distance_km * vehicle["rate_per_km"])
            eta_hours = round(distance_km / random.uniform(35, 55), 1)
            options.append({
                **vehicle,
                "origin": origin,
                "destination": destination,
                "distance_km": distance_km,
                "estimated_cost_inr": cost,
                "eta_hours": eta_hours,
                "tracking_id": f"KM-{random.randint(100000, 999999)}",
            })
    return sorted(options, key=lambda x: x["estimated_cost_inr"])
