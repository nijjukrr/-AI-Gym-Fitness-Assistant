import json, os
import httpx

API_KEY = "rnd_JljznP2OiN2In556weQXXmkT3MIM"
payload_path = r"C:\Users\Nishanth.KR\Downloads\ai gym\payload.json"
with open(payload_path, "r", encoding="utf-8") as f:
    payload = json.load(f)

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

url = "https://api.render.com/v1/services"

resp = httpx.post(url, json=payload, headers=headers)
print("Status:", resp.status_code)
print("Response:")
print(resp.text)
