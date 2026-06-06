import os
import httpx
from typing import Dict, Any

class WorkoutPlanner:
    def __init__(self):
        pass

    async def generate_plan(self, level: str, goal: str) -> Dict[str, Any]:
        prompt = (
            f"Act as a certified personal fitness trainer. Generate a personalized weekly workout program "
            f"for a person at an '{level}' fitness level with the primary goal of '{goal}'. "
            f"Include structural warm-ups, specific resistance exercises (like squats, push-ups, lateral raises), "
            f"sets, reps, and guidance on target joint ranges of motion (e.g. elbow extension, squat knee flexion). "
            f"Please format your output in HTML structure with sections <h3>Weekly Schedule</h3> and <h3>Trainer Form Advice</h3>. "
            f"Keep it concise, encouraging, and premium."
        )

        llm_response = await self._call_llms(prompt)
        if llm_response:
            return {
                "level": level,
                "goal": goal,
                "plan_html": llm_response
            }

        # Fallback to high-quality rule-based program
        plan_html = self._generate_fallback_plan(level, goal)
        return {
            "level": level,
            "goal": goal,
            "plan_html": plan_html
        }

    async def _call_llms(self, prompt: str) -> str:
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
                        {"role": "system", "content": "You are a professional fitness trainer."},
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
                url = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta"
                payload = {
                    "inputs": f"<|system|>\nYou are a professional fitness trainer. Respond in HTML.</s>\n<|user|>\n{prompt}</s>\n<|assistant|>\n",
                    "parameters": {"max_new_tokens": 600}
                }
                async with httpx.AsyncClient() as client:
                    res = await client.post(url, headers=headers, json=payload, timeout=10.0)
                    if res.status_code == 200:
                        resp_json = res.json()
                        if isinstance(resp_json, list) and len(resp_json) > 0:
                            gen_text = resp_json[0].get("generated_text", "")
                            if "<|assistant|>\n" in gen_text:
                                gen_text = gen_text.split("<|assistant|>\n")[-1]
                            return gen_text
                        elif isinstance(resp_json, dict) and "generated_text" in resp_json:
                            return resp_json["generated_text"]
            except Exception as e:
                print(f"[LLM] Hugging Face Inference failed: {e}")

        return ""

    def _generate_fallback_plan(self, level: str, goal: str) -> str:
        if goal == "strength":
            routine = (
                "• <strong>Day 1 (Lower Body Strength)</strong>: Squats (4 sets × 6 reps, target 85° knee angle) + Calf Raises (3 sets × 10 reps).<br>"
                "• <strong>Day 2 (Upper Body Push)</strong>: Shoulder Press (4 sets × 6 reps, target 145° arm extension) + Push-Ups (3 sets × max reps).<br>"
                "• <strong>Day 3 (Rest & Mobility)</strong>: 15-minute active stretching and shoulder rotational flows.<br>"
                "• <strong>Day 4 (Lower Body & Core)</strong>: Lunges (3 sets × 8 reps per leg) + Sit-Ups (3 sets × 12 reps).<br>"
                "• <strong>Day 5 (Upper Body Pull)</strong>: Bicep Curls (4 sets × 8 reps, target 75° peak contraction) + Tricep Dips (3 sets × 10 reps)."
            )
        elif goal == "weight-loss":
            routine = (
                "• <strong>Day 1 (HIIT Conditioning)</strong>: Jumping Jacks (4 sets × 45 secs) + Squats (4 sets × 15 reps, fast cadence).<br>"
                "• <strong>Day 2 (Core & Fat Burn)</strong>: Sit-Ups (4 sets × 20 reps) + Push-Ups (3 sets × 12 reps) + 20-min smart treadmill walk.<br>"
                "• <strong>Day 3 (Rest & Recover)</strong>: Light walking and foam rolling.<br>"
                "• <strong>Day 4 (Lower Body HIIT)</strong>: Lunges (4 sets × 12 reps) + Jumping Jacks (3 sets × 1 min).<br>"
                "• <strong>Day 5 (Full Body Integration)</strong>: Tricep Dips (3 sets × 12 reps) + Squats (3 sets × 15 reps) + Bicep Curls (3 sets × 12 reps)."
            )
        else:  # muscle-tone / hypertrophy
            routine = (
                "• <strong>Day 1 (Leg Definition)</strong>: Squats (3 sets × 12 reps, focus on slow eccentric phase) + Calf Raises (3 sets × 15 reps).<br>"
                "• <strong>Day 2 (Shoulders & Arms)</strong>: Lateral Raises (4 sets × 12 reps, target 105° peak raise) + Bicep Curls (3 sets × 12 reps).<br>"
                "• <strong>Day 3 (Rest Day)</strong>: Walk 5,000 steps, focus on hydration.<br>"
                "• <strong>Day 4 (Chest & Core)</strong>: Push-Ups (4 sets × 12 reps) + Sit-Ups (3 sets × 15 reps).<br>"
                "• <strong>Day 5 (Arms & Triceps)</strong>: Tricep Dips (3 sets × 12 reps) + Lateral Raises (3 sets × 12 reps)."
            )

        advice = (
            "• <strong>Squat Depth</strong>: Aim for at least 85-90 degrees knee flexion. Keep your heels glued to the floor.<br>"
            "• <strong>Elbow Stability</strong>: In Bicep Curls, do not swing the elbow forward. Lock the humerus by your side.<br>"
            "• <strong>Press Alignment</strong>: Push overhead in a straight vertical bar path, locking out elbows safely at 145 degrees."
        )

        html = (
            f"<div class='plan-card'>"
            f"  <h4>Routine Specs ({level.upper()} - {goal.upper()})</h4>"
            f"  <h3>Weekly Schedule</h3>"
            f"  <p>{routine}</p>"
            f"  <h3>Trainer Form Advice</h3>"
            f"  <p>{advice}</p>"
            f"</div>"
        )
        return html
