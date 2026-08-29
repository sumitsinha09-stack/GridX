"""
Tests for feature extraction and preprocessing modules.
"""

import pytest
import numpy as np
import pandas as pd
from src.features.preprocessor import FeaturePreprocessor


def test_feature_preprocessor():
    preprocessor = FeaturePreprocessor()
    df = pd.DataFrame({
        "feat1": [1.0, 2.0, 3.0, 4.0],
        "feat2": [10.0, 20.0, 30.0, 40.0],
    })
    scaled = preprocessor.fit_transform(df)
    assert scaled.shape == (4, 2)
    assert np.allclose(scaled.mean(axis=0), [0.0, 0.0])
