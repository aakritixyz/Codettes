- Project Annadata: Forensic Food Audit Engine
Annadata is a high-integrity food analysis dashboard that cross-references market pricing with molecular flavor profiles. By integrating RecipeDB and FlavorDB APIs, the engine calculates the "Honest Cost" of a dish and detects potential adulteration or "Molecular Twins" (artificial substitutes).

- Key Features
Forensic Integrity Score: A dynamic algorithm that calculates food safety based on price variance.

Molecular Twin Detection: Identifies lab-synthesized chemical substitutes (e.g., Margarine vs. Butter) based on the dish category.

Market Inflation Guard: Real-time simulation of operational overheads vs. vendor pricing.

Flavor Profile Mapping: Uses the FlavorDB API to fetch specific molecular structures of ingredients.

🛠️ Tech Stack
Backend: FastAPI (Python 3.14+)

Frontend: HTML5, Tailwind CSS, Vanilla JavaScript

Libraries: httpx (Async API calls), uvicorn (Server), asyncio

APIs: RecipeDB (Foodoscope), FlavorDB
