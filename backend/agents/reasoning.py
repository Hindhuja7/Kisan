"""AI reasoning steps for demo agents."""

from datetime import datetime


def stamp() -> str:
    return datetime.now().isoformat()


CROP_REASONING = [
    "Pulling IoT soil moisture & temperature from field sensors",
    "Fetching Sentinel-2 NDVI satellite imagery",
    "Cross-referencing crop growth models for Telangana",
    "Calculating optimal harvest window with 92% confidence",
]

PRICE_REASONING = [
    "Scanning 120+ mandi price feeds in real-time",
    "Analyzing 5-year historical price patterns",
    "Evaluating weather impact on supply chain",
    "Predicting demand surge from festival season",
    "Ranking mandis by net farmer profit after transport",
]

STORAGE_REASONING = [
    "Querying registered cold storage facilities nearby",
    "Checking capacity for predicted harvest volume",
    "Negotiating rates autonomously via API",
    "Pre-booking slot before harvest to prevent 40% loss",
]

NEGOTIATION_REASONING = [
    "Matching verified buyers in buyer network",
    "Analyzing local trader baseline price",
    "Running AI negotiation strategy — protect farmer margin",
    "Closing deal at optimal price point",
]

LOGISTICS_REASONING = [
    "Comparing transport cost across vehicle types",
    "Optimizing multi-modal route: farm → storage → buyer",
    "Matching cold van for perishable cargo",
    "Generating live tracking link for farmer",
]
