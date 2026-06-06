import os
import httpx
from typing import Dict, Any

class DietPlanner:
    def __init__(self):
        pass

    async def generate_plan(self, weight: float, height: float, age: int, gender: str, goal: str) -> Dict[str, Any]:
        # 1. Scientific Calculations (Harris-Benedict Formula)
        # BMR
        if gender.lower() == 'female':
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
        else:
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)

        # TDEE assuming moderate activity (1.55 multiplier)
        tdee = bmr * 1.55

        # Calories target
        if goal == "weight-loss":
            target_calories = int(tdee - 500)
            protein_pct, carb_pct, fat_pct = 40, 30, 30
        elif goal == "muscle-gain":
            target_calories = int(tdee + 300)
            protein_pct, carb_pct, fat_pct = 30, 50, 20
        else:  # maintenance
            target_calories = int(tdee)
            protein_pct, carb_pct, fat_pct = 30, 40, 30

        # Grams of macros
        # Protein: 4 kcal/g, Carbs: 4 kcal/g, Fats: 9 kcal/g
        protein_g = int((target_calories * (protein_pct / 100)) / 4)
        carbs_g = int((target_calories * (carb_pct / 100)) / 4)
        fats_g = int((target_calories * (fat_pct / 100)) / 9)

        bmi = round(weight / ((height / 100) ** 2), 1)

        # Try to use LLM first
        prompt = (
            f"Act as a professional sports dietitian. Generate a personalized 1-day meal plan and grocery list "
            f"for a {gender}, age {age}, weight {weight}kg, height {height}cm, with a BMI of {bmi} and goal of {goal}. "
            f"The nutritional targets are: Calories {target_calories} kcal, Protein {protein_g}g, Carbs {carbs_g}g, Fats {fats_g}g. "
            f"Please structure your response in HTML format with sections <h3>Daily Meal Plan</h3> and <h3>Weekly Grocery List</h3>. "
            f"Keep it concise, premium, and clean, highlighting macronutrient distributions."
        )

        llm_response = await self._call_llms(prompt)
        if llm_response:
            return {
                "bmi": bmi,
                "target_calories": target_calories,
                "protein_g": protein_g,
                "carbs_g": carbs_g,
                "fats_g": fats_g,
                "plan_html": llm_response
            }

        # Fallback to high-quality scientific rule-based system
        plan_html = self._generate_fallback_plan(goal, target_calories, protein_g, carbs_g, fats_g)
        return {
            "bmi": bmi,
            "target_calories": target_calories,
            "protein_g": protein_g,
            "carbs_g": carbs_g,
            "fats_g": fats_g,
            "plan_html": plan_html
        }

    async def _call_llms(self, prompt: str) -> str:
        # Check API Keys
        gemini_key = os.getenv("GEMINI_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")
        hf_key = os.getenv("HUGGINGFACE_API_KEY") or os.getenv("HF_API_KEY")

        # 1. Gemini
        if gemini_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={gemini_key}"
                payload = {
                    "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                    "generationConfig": {"maxOutputTokens": 600}
                }
                async with httpx.AsyncClient() as client:
                    res = await client.post(url, json=payload, timeout=8.0)
                    if res.status_code == 200:
                        return res.json()["candidates"][0]["content"]["parts"][0]["text"]
            except Exception as e:
                print(f"[LLM] Gemini request failed: {e}")

        # 2. OpenAI
        if openai_key:
            try:
                headers = {"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
                payload = {
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {"role": "system", "content": "You are a professional sports nutritionist."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 500
                }
                async with httpx.AsyncClient() as client:
                    res = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=8.0)
                    if res.status_code == 200:
                        return res.json()["choices"][0]["message"]["content"]
            except Exception as e:
                print(f"[LLM] OpenAI request failed: {e}")

        # 3. Hugging Face Inference API
        if hf_key:
            try:
                headers = {"Authorization": f"Bearer {hf_key}", "Content-Type": "application/json"}
                # Using Zephyr or Mistral
                url = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta"
                payload = {
                    "inputs": f"<|system|>\nYou are a professional sports nutritionist. Respond in HTML.</s>\n<|user|>\n{prompt}</s>\n<|assistant|>\n",
                    "parameters": {"max_new_tokens": 600}
                }
                async with httpx.AsyncClient() as client:
                    res = await client.post(url, headers=headers, json=payload, timeout=10.0)
                    if res.status_code == 200:
                        resp_json = res.json()
                        if isinstance(resp_json, list) and len(resp_json) > 0:
                            gen_text = resp_json[0].get("generated_text", "")
                            # Clean up system wrapper if present
                            if "<|assistant|>\n" in gen_text:
                                gen_text = gen_text.split("<|assistant|>\n")[-1]
                            return gen_text
                        elif isinstance(resp_json, dict) and "generated_text" in resp_json:
                            return resp_json["generated_text"]
            except Exception as e:
                print(f"[LLM] Hugging Face Inference failed: {e}")

        return ""

    def _generate_fallback_plan(self, goal: str, calories: int, protein: int, carbs: int, fats: int) -> str:
        if goal == "weight-loss":
            meals = (
                "• <strong>Breakfast (08:00 AM)</strong>: Scrambled Egg White Medley (4 egg whites, 1 whole egg, spinach, tomatoes) + green tea.<br>"
                "• <strong>Lunch (01:00 PM)</strong>: Grilled Chicken Breast salad with cucumbers, olives, and a light lemon-olive oil dressing.<br>"
                "• <strong>Snack (04:30 PM)</strong>: Fat-free Greek yogurt (150g) with a handful of fresh blueberries.<br>"
                "• <strong>Dinner (08:00 PM)</strong>: Pan-seared Wild Salmon (150g) with steamed asparagus and broccoli."
            )
            groceries = (
                "• Liquid egg whites & free-range eggs<br>"
                "• Skinless chicken breast & wild salmon filet<br>"
                "• Fresh spinach, tomatoes, cucumbers, broccoli, asparagus, lemons<br>"
                "• Extra virgin olive oil & Greek yogurt (0% fat)"
            )
        elif goal == "muscle-gain":
            meals = (
                "• <strong>Breakfast (08:00 AM)</strong>: Steel-cut oats (80g) made with almond milk, topped with banana slices, honey, and 1 scoop whey protein.<br>"
                "• <strong>Lunch (01:00 PM)</strong>: Lean ground turkey (180g) with white rice (150g) and mixed steamed veggies.<br>"
                "• <strong>Snack (04:30 PM)</strong>: Rice cakes (2) with peanut butter (2 tbsp) and sliced apples.<br>"
                "• <strong>Dinner (08:00 PM)</strong>: Grilled sirloin steak (150g) with baked sweet potato (1 medium) and green beans."
            )
            groceries = (
                "• Steel-cut oats, white rice, sweet potatoes<br>"
                "• Lean ground turkey, sirloin steak, whey protein isolate<br>"
                "• Bananas, apples, peanut butter, honey, almond milk<br>"
                "• Mixed veggies, green beans"
            )
        else:  # maintenance
            meals = (
                "• <strong>Breakfast (08:00 AM)</strong>: Oatmeal cooked with milk, sliced almonds, and a drizzle of maple syrup + 2 boiled eggs.<br>"
                "• <strong>Lunch (01:00 PM)</strong>: Grilled chicken wrap in a whole-wheat tortilla with avocado, lettuce, and tomatoes.<br>"
                "• <strong>Snack (04:30 PM)</strong>: Mixed raw nuts (30g) and a medium orange.<br>"
                "• <strong>Dinner (08:00 PM)</strong>: Baked cod fillet with quinoa (100g) and roasted zucchini/bell peppers."
            )
            groceries = (
                "• Whole-wheat wraps, quinoa, oats<br>"
                "• Chicken breast, cod fillet, eggs<br>"
                "• Avocados, lettuce, tomatoes, zucchini, bell peppers, oranges<br>"
                "• Almonds, mixed nuts, maple syrup"
            )

        html = (
            f"<div class='plan-card'>"
            f"<h4>Macro Targets</h4>"
            f"<div class='macro-pill-row' style='display:flex; gap: 10px; margin-bottom:15px;'>"
            f"  <span class='badge bg-red'>Calories: {calories} kcal</span>"
            f"  <span class='badge bg-green'>Protein: {protein}g</span>"
            f"  <span class='badge bg-orange'>Carbs: {carbs}g</span>"
            f"  <span class='badge bg-purple'>Fats: {fats}g</span>"
            f"</div>"
            f"<h3>Daily Meal Plan</h3>"
            f"<p>{meals}</p>"
            f"<h3>Weekly Grocery List</h3>"
            f"<p>{groceries}</p>"
            f"</div>"
        )
        return html
