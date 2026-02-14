from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
import uvicorn
import asyncio

app = FastAPI()

# CORS allow karna zaroori hai browser ke liye
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = "-VLoVkZcvaCR9xhQcuJRxf_o44CEjKTub7hSQUnSItP3NxBr"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}
RECIPE_URL = "https://api.foodoscope.com/recipe2-api/recipes-calories/calories"

recipes_cache = {}

async def fetch_data(client, page):
    params = {"minCalories": 0, "maxCalories": 2000, "limit": 10, "page": page}
    try:
        res = await client.get(RECIPE_URL, headers=HEADERS, params=params, timeout=10.0)
        return res.json().get("data", []) if res.status_code == 200 else []
    except: return []

@app.get("/get-menu")
async def get_menu():
    global recipes_cache
    async with httpx.AsyncClient() as client:
        tasks = [fetch_data(client, p) for p in range(1, 4)]
        results = await asyncio.gather(*tasks)
        all_data = [item for sublist in results for item in sublist]
        recipes_cache = {r["Recipe_title"]: r for r in all_data if "Recipe_title" in r}
        return list(recipes_cache.keys())

@app.post("/analyze")
async def analyze(data: dict):
    dish = data.get("dish_name")
    price = float(data.get("vendor_price", 0))
    recipe = recipes_cache.get(dish)

    if not recipe: return {"error": "Dish not found"}

    cals = float(recipe.get("Calories") or 400)
    time = float(recipe.get("cook_time") or 15) + float(recipe.get("prep_time") or 10)
    
    raw_cost = round(cals * 0.22, 2)
    labor = round(time * 0.85, 2)
    honest_cost = round((raw_cost + labor + 35) * 1.35, 2)
    status = "SAFE" if price >= (honest_cost * 0.85) else "DANGER"

    return {
        "status": status,
        "honest_cost": honest_cost,
        "suggestions": [
            {"original": "Butter", "substitute": "Diacetyl Compound", "science": "High shared molecular profile."}
        ] if status == "DANGER" else [],
        "breakdown": [
            {"item": "Raw Material", "cost": raw_cost},
            {"item": "Labor/Time", "cost": labor},
            {"item": "Fixed Overheads", "cost": 35.0}
        ]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8080)