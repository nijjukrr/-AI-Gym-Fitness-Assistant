import numpy as np

# Safe imports for AI/ML frameworks
try:
    from sklearn.linear_model import LogisticRegression
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

class HabitPredictor:
    def __init__(self):
        self.ml_model = None
        self.train_model()

    def train_model(self):
        if not HAS_SKLEARN:
            print("[AI/ML] scikit-learn not installed. Using mathematical heuristic.")
            return

        try:
            # Generate synthetic training data
            # X: [Sleep, Stress, Energy, DaysSinceLast]
            X_train = np.array([
                [8.0, 2, 9, 1], # Active/No Skip (0)
                [7.5, 3, 8, 1], # Active/No Skip (0)
                [5.0, 8, 4, 3], # Skip (1)
                [6.0, 7, 5, 2], # Skip (1)
                [8.5, 1, 9, 0], # Active/No Skip (0)
                [4.5, 9, 3, 4], # Skip (1)
                [7.0, 4, 7, 2], # Active/No Skip (0)
                [5.5, 6, 5, 3], # Skip (1)
                [9.0, 2, 8, 1], # Active/No Skip (0)
                [6.5, 8, 4, 2]  # Skip (1)
            ])
            y_train = np.array([0, 0, 1, 1, 0, 1, 0, 1, 0, 1]) # 0 = go, 1 = skip

            self.ml_model = LogisticRegression()
            self.ml_model.fit(X_train, y_train)
            print("[AI/ML] scikit-learn Logistic Regression Model trained successfully!")
        except Exception as e:
            print(f"[AI/ML WARNING] Failed to train scikit-learn model: {e}. Falling back to heuristic.")
            self.ml_model = None

    def predict(self, sleep: float, stress: int, energy: int, days_since_workout: int):
        risk_percentage = 30
        
        if HAS_SKLEARN and self.ml_model is not None:
            try:
                features = np.array([[sleep, stress, energy, days_since_workout]])
                # Probabilities of skipping (class 1)
                prob = self.ml_model.predict_proba(features)[0][1]
                risk_percentage = int(prob * 100)
            except Exception as e:
                print(f"[AI/ML Error] Prediction failed: {e}. Using heuristic fallback.")
                risk_percentage = self._heuristic_predict(sleep, stress, energy, days_since_workout)
        else:
            risk_percentage = self._heuristic_predict(sleep, stress, energy, days_since_workout)

        advice = "You're in the optimal zone! Keep moving."
        if risk_percentage >= 60:
            advice = "Skipping likelihood is high. AI recommends a light 15-minute home stretch to maintain habit triggers."
        elif risk_percentage >= 25:
            advice = "Energy index is low. Focus on a simple bodyweight or resistance routine today."

        return {
            "risk_probability": risk_percentage,
            "advice": advice
        }

    def _heuristic_predict(self, sleep: float, stress: int, energy: int, days_since_workout: int) -> int:
        risk = 30
        risk += (8.0 - sleep) * 12
        risk += stress * 8
        risk += (8 - energy) * 10
        risk += days_since_workout * 15
        return max(5, min(98, int(risk)))
