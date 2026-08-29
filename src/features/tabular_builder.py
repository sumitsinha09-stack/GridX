"""
Tabular Feature Builder Module.

Transforms raw cascade simulation logs and electrical network properties into
flattened tabular feature matrices (X, y) suitable for classical ML models (Random Forest, XGBoost).
"""

from typing import Tuple
import pandas as pd
import numpy as np


def build_tabular_features(
    raw_simulation_df: pd.DataFrame,
    target_column: str = "blackout_occurred",
) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Extract static grid features, pre-contingency line loading, bus voltages,
    and initial outage indicators into tabular X and target y.

    Args:
        raw_simulation_df: Raw simulation events DataFrame.
        target_column: Label to predict (e.g. 'blackout_occurred', 'cascade_size', 'tripped_line_flags').

    Returns:
        Tuple[pd.DataFrame, pd.Series]: (Feature matrix X, Target labels y).
    """
    # Placeholder signature for tabular feature extraction
    raise NotImplementedError("Tabular feature engineering to be implemented.")
