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

import socket
print("\n=== Remote Diagnostics ===")
try:
    print("DNS lookup for router.huggingface.co:")
    print(socket.getaddrinfo('router.huggingface.co', 80))
except Exception as e:
    print(f"DNS failed for router.huggingface.co: {e}")

try:
    import urllib.request
    import json
    print("Trying to fetch Hugging Face response from router via urllib:")
    url = "https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.3"
    import os
    hf_key = os.getenv("HUGGINGFACE_API_KEY")
    headers = {
        "Authorization": f"Bearer {hf_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "inputs": "<s>[INST] You are a helpful assistant.\n\ngive me a high protein diet plan for muscle gain [/INST]",
        "parameters": {
            "max_new_tokens": 100,
            "temperature": 0.7,
            "return_full_text": False
        }
    }
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=15) as res:
        print(f"Status: {res.status}")
        print("Response body:")
        print(res.read().decode())
except Exception as e:
    print(f"Urllib request failed: {e}")

