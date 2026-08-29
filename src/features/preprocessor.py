"""
Feature Preprocessor Module.

Handles data scaling (StandardScaler, MinMaxScaler), handling of missing values,
and splitting datasets into reproducible train/val/test partitions.
"""

from typing import Tuple, Optional
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler


class FeaturePreprocessor:
    """
    Standard preprocessor for tabular features across training and inference.
    """

    def __init__(self):
        self.scaler = StandardScaler()
        self.is_fitted = False

    def fit_transform(self, X: pd.DataFrame) -> np.ndarray:
        """
        Fit scaler to training data and return scaled features.
        """
        self.is_fitted = True
        return self.scaler.fit_transform(X)

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        """
        Transform unseen feature matrix using fitted scaler parameters.
        """
        if not self.is_fitted:
            raise RuntimeError("FeaturePreprocessor must be fitted before transform.")
        return self.scaler.transform(X)
