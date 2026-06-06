# Level 1 Assessment solutions - AI/ML Coding Module

This document explains the purpose, structure, and execution of `assessment_solutions.py` in the **AI Gym Fitness Assistant** project.

## Purpose of the Module
The `assessment_solutions.py` script serves as a verification and grading script designed for Level 1 AI & ML Python programming. It validates key analytical operations using only built-in Python constructs and the NumPy library.

Exposing this script to the admin console adds educational support to track fitness assistant logic structures (like moving averages, range thresholds, and array shapes) which are also used internally by our pose analyzer and habit models.

## Questions & Code Explanations

### Q1: Filtering Data
Filters a list of sensor/temperature readings, returning only values greater than 20.
```python
readings = [25.1, 18.5, 32.0, 15.2, 28.9]
for r in readings:
    if r > 20:
        print(r)
```
*Purpose*: Simulates filtering invalid or noisy accelerometer/gyroscope readings below a certain threshold.

### Q2: Basic Arithmetic — The Mean
Calculates the average (mean) of a list of fitness scores.
```python
scores = [80, 90, 70, 100]
average = sum(scores) / len(scores)
print(average) # Expected Output: 85.0
```
*Purpose*: Simulates tracking average daily caloric intake or weekly workout performance score.

### Q3: String Formatting
Formats model outputs using python f-strings.
```python
accuracy = 0.95
model_name = "Neural Network"
print(f"The {model_name} model has an accuracy of {int(accuracy*100)}%.")
```
*Purpose*: Format prediction percentages for risk badges and motivating buddy responses.

### Q4: List Operations
Manipulates list elements (appending and removing items).
```python
features = ["height", "weight"]
features.append("age")
features.remove("height")
print(features) # Expected Output: ['weight', 'age']
```
*Purpose*: Manages feature lists loaded into the Scikit-Learn Logistic Regression model.

### Q5: Boolean Logic
Validates if a numeric variable lies within a range.
```python
x = 0.5
if 0 <= x <= 1:
    print("Valid")
```
*Purpose*: Validates probability scores output by the Logistic Regression skipping risk classifier.

### Q6: Importing Libraries
Demonstrates standard library aliasing.
```python
import numpy as np
```
*Purpose*: Loads NumPy arrays to store pose landmarks and calculate angles.

### Q7: Creating Arrays
Instantiates a 1D NumPy array.
```python
arr = np.array([1, 2, 3, 4, 5])
```
*Purpose*: Represents sets, reps, or sensor coordinate vectors.

### Q8: Array Shapes
Retrieves shapes of multi-dimensional arrays.
```python
data = np.zeros((10, 3))
print(data.shape) # Expected Output: (10, 3)
```
*Purpose*: Represents coordinate logs for 10 frames of 3D landmarks (x, y, visibility).

### Q9: Simple Scaling
Normalizes numeric lists to the [0.0, 1.0] scale.
```python
prices = [100, 200, 300]
scaled = [p / 100 for p in prices]
```
*Purpose*: Normalizes coordinates or calorie counts for neural network layers.

### Q10: Finding the Max
Retrieves the maximum element from a list.
```python
errors = [0.5, 0.1, 0.9, 0.2]
print(max(errors)) # Expected Output: 0.9
```
*Purpose*: Locates peak angles for range-of-motion metrics in gym trainers.

---

## Real-Time Verification
This script is executed dynamically on the admin dashboard at `/admin.html` under the **AI/ML Grading Module** panel. The panel fetches the stdout logs directly from `/api/assessment/solutions` to guarantee operational integrity.
