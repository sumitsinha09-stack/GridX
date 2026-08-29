"""
Baseline Machine Learning Models Module.

Implements scikit-learn and XGBoost model wrappers for:
1. Binary cascade/blackout risk classification.
2. Multiclass / Multilabel line failure prediction.
3. Cascade size regression (number of tripped lines / MW lost).
"""

from typing import Optional, Dict, Any
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from xgboost import XGBClassifier, XGBRegressor


class RandomForestCascadeModel:
    """
    Random Forest baseline model for predicting cascade outcomes from tabular features.
    """

    def __init__(self, n_estimators: int = 100, max_depth: Optional[int] = 15, random_state: int = 42):
        self.model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=random_state,
        )

    def fit(self, X: np.ndarray, y: np.ndarray):
        """Train the Random Forest model."""
        self.model.fit(X, y)

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict cascade outcome labels."""
        return self.model.predict(X)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Predict probability of cascade / blackout."""
        return self.model.predict_proba(X)


class XGBoostCascadeModel:
    """
    XGBoost baseline model for gradient-boosted tree cascade prediction.
    """

    def __init__(self, n_estimators: int = 100, learning_rate: float = 0.1, max_depth: int = 6):
        self.model = XGBClassifier(
            n_estimators=n_estimators,
            learning_rate=learning_rate,
            max_depth=max_depth,
            eval_metric="logloss",
        )

    def fit(self, X: np.ndarray, y: np.ndarray):
        """Train the XGBoost model."""
        self.model.fit(X, y)

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict cascade outcome labels."""
        return self.model.predict(X)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Predict probability of cascade / blackout."""
        return self.model.predict_proba(X)
