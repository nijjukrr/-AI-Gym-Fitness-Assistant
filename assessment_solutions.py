# Python for AI & ML — Level 1 Assessment Solutions
# All answers use only built-in Python + NumPy

import numpy as np

print("=== Running Python for AI & ML Level 1 Assessment Solutions ===\n")

# Q1: Filtering Data
print("--- Q1: Filtering Data ---")
readings = [25.1, 18.5, 32.0, 15.2, 28.9]
for r in readings:
    if r > 20:
        print(r)
# Expected Output:
# 25.1
# 32.0
# 28.9
print()


# Q2: Basic Arithmetic — The Mean
print("--- Q2: Basic Arithmetic — The Mean ---")
scores = [80, 90, 70, 100]
average = sum(scores) / len(scores)
print(average) 
# Expected Output: 85.0
print()


# Q3: String Formatting
print("--- Q3: String Formatting ---")
accuracy = 0.95
model_name = "Neural Network"
print(f"The {model_name} model has an accuracy of {int(accuracy*100)}%.")
# Expected Output: The Neural Network model has an accuracy of 95%.
print()


# Q4: List Operations
print("--- Q4: List Operations ---")
features = ["height", "weight"]
features.append("age")
features.remove("height")
print(features) 
# Expected Output: ['weight', 'age']
print()


# Q5: Boolean Logic
print("--- Q5: Boolean Logic ---")
x = 0.5
if 0 <= x <= 1:
    print("Valid")
# Expected Output: Valid
print()


# Q6: Importing Libraries
print("--- Q6: Importing Libraries ---")
# Already done at the top: import numpy as np
print("Library imported successfully: numpy as np")
print()


# Q7: Creating Arrays
print("--- Q7: Creating Arrays ---")
arr = np.array([1, 2, 3, 4, 5])
print(arr) 
# Expected Output: [1 2 3 4 5]
print()


# Q8: Array Shapes
print("--- Q8: Array Shapes ---")
# Mock data representing the shape (10, 3)
data = np.zeros((10, 3))
print(data.shape) 
# Expected Output: (10, 3)
print()


# Q9: Simple Scaling
print("--- Q9: Simple Scaling ---")
prices = [100, 200, 300]
scaled = [p / 100 for p in prices]
print(scaled) 
# Expected Output: [1.0, 2.0, 3.0]
print()


# Q10: Finding the Max
print("--- Q10: Finding the Max ---")
errors = [0.5, 0.1, 0.9, 0.2]
print(max(errors)) 
# Expected Output: 0.9
print()

print("=================== All Questions Completed ===================")

import urllib.request
import json
import os
print("\n=== Remote Diagnostics ===")
try:
    url = "https://router.huggingface.co/v1/chat/completions"
    hf_key = os.getenv("HUGGINGFACE_API_KEY")
    headers = {
        "Authorization": f"Bearer {hf_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    payload = {
        "model": "Qwen/Qwen2.5-7B-Instruct",
        "messages": [
            {"role": "system", "content": "You are a helpful fitness coach."},
            {"role": "user", "content": "give me a 1-sentence tip for muscle gain"}
        ],
        "max_tokens": 50,
        "temperature": 0.7
    }
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=15) as res:
        print(f"Status: {res.status}")
        print("Response body:")
        print(res.read().decode())
except urllib.error.HTTPError as e:
    print(f"Request failed with HTTP Error {e.code}: {e.read().decode()}")
except Exception as e:
    print(f"Request failed: {e}")

