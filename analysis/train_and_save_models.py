#!/usr/bin/env python3
"""
Train and Save ML Models
Навчання та збереження ML моделей для передбачення якості проекту

Цей скрипт тренує найкращі моделі для кожної цільової змінної
та зберігає їх для використання в CLI інструментах.

Моделі:
- overallScore: Linear Regression
- timeToMarket: Lasso
- communityGrowth: Lasso

Магістерська робота: Outcome-based оцінка якості TypeScript коду
Автор: Слабенко Костянтин Олегович
Група: АС-202
Одеський політехнічний національний університет
"""

import warnings
from pathlib import Path
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression, Lasso
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

warnings.filterwarnings("ignore")

# Directories
REPORTS_DIR = Path("../reports")
ML_DIR = REPORTS_DIR / "ml"
MODELS_DIR = ML_DIR / "saved_models"
MODELS_DIR.mkdir(exist_ok=True)

print("=" * 80)
print("TRAIN AND SAVE ML MODELS")
print("=" * 80)
print()

# ============================================================================
# 1. DATA LOADING
# ============================================================================
print("1. Loading data...")

df = pd.read_csv(REPORTS_DIR / "statistical" / "engineered_features.csv")
print(f"   Loaded: {df.shape[0]} projects x {df.shape[1]} features")

# Remove non-features
if "name" in df.columns:
    project_names = df["name"].copy()
    df = df.drop("name", axis=1)

# Remove non-numeric columns
df = df.select_dtypes(include=[np.number])
print(f"   Numeric features: {df.shape[1]}")

# ============================================================================
# 2. FEATURE SELECTION (same as ml_modeling.py)
# ============================================================================
print("\n2. Feature selection...")

TARGET_VARS = ["overallScore", "bi_timeToMarket", "bi_communityGrowth"]
feature_cols = [col for col in df.columns if col not in TARGET_VARS]

# Remove leaked features
TARGET_PATTERNS = ["timeToMarket", "communityGrowth", "overallScore"]
leaked_features = []
for col in feature_cols:
    for pattern in TARGET_PATTERNS:
        if pattern in col and col not in TARGET_VARS:
            leaked_features.append(col)
            break

feature_cols = [col for col in feature_cols if col not in leaked_features]
print(f"   After removing leaked: {len(feature_cols)} features")

# Remove highly correlated features
corr_matrix = df[feature_cols].corr().abs()
upper_triangle = corr_matrix.where(
    np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
)
to_drop = [
    column for column in upper_triangle.columns if any(upper_triangle[column] > 0.95)
]
feature_cols = [col for col in feature_cols if col not in to_drop]

# Remove scaled duplicates
original_features = []
scaled_features = {"std": [], "norm": []}

for col in feature_cols:
    if col.endswith("_std"):
        scaled_features["std"].append(col)
    elif col.endswith("_norm"):
        scaled_features["norm"].append(col)
    else:
        original_features.append(col)

features_to_keep = original_features.copy()
for std_col in scaled_features["std"]:
    base_name = std_col[:-4]
    if base_name not in original_features:
        features_to_keep.append(std_col)

for norm_col in scaled_features["norm"]:
    base_name = norm_col[:-5]
    if (
        base_name not in original_features
        and base_name + "_std" not in features_to_keep
    ):
        features_to_keep.append(norm_col)

feature_cols = features_to_keep
print(f"   Final features: {len(feature_cols)}")

# Save feature list for prediction script
feature_list_path = MODELS_DIR / "feature_list.json"
import json

with open(feature_list_path, "w") as f:
    json.dump(feature_cols, f, indent=2)
print(f"   Saved feature list to {feature_list_path}")

# ============================================================================
# 3. PREPARE DATA
# ============================================================================
print("\n3. Preparing data...")

X = df[feature_cols].copy()
y_overall = df["overallScore"].copy()
y_time_to_market = df["bi_timeToMarket"].copy()
y_community = df["bi_communityGrowth"].copy()

# Train/test split
random_state = 42
test_size = 0.15

# ============================================================================
# 4. TRAIN AND SAVE MODELS
# ============================================================================
print("\n4. Training and saving models...")

# Model configurations based on best performers from ml_modeling.py
model_configs = {
    "overallScore": {
        "model": LinearRegression(),
        "y": y_overall,
        "needs_scaling": False,
    },
    "timeToMarket": {
        "model": Lasso(alpha=0.1, random_state=random_state),
        "y": y_time_to_market,
        "needs_scaling": True,
    },
    "communityGrowth": {
        "model": Lasso(alpha=0.1, random_state=random_state),
        "y": y_community,
        "needs_scaling": True,
    },
}

# Train and save each model
for target_name, config in model_configs.items():
    print(f"\n   Training {target_name}...")

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, config["y"], test_size=test_size, random_state=random_state
    )

    # Scale if needed
    scaler = None
    if config["needs_scaling"]:
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        X_tr = X_train_scaled
        X_te = X_test_scaled
    else:
        X_tr = X_train
        X_te = X_test

    # Train
    model = config["model"]
    model.fit(X_tr, y_train)

    # Evaluate
    y_pred = model.predict(X_te)
    r2 = r2_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)

    print(f"      Test R²: {r2:.4f}, RMSE: {rmse:.4f}, MAE: {mae:.4f}")

    # Save model
    model_path = MODELS_DIR / f"{target_name}_model.joblib"
    joblib.dump(model, model_path)
    print(f"      Saved model to {model_path}")

    # Save scaler if used
    if scaler is not None:
        scaler_path = MODELS_DIR / f"{target_name}_scaler.joblib"
        joblib.dump(scaler, scaler_path)
        print(f"      Saved scaler to {scaler_path}")

# ============================================================================
# 5. SAVE METADATA
# ============================================================================
print("\n5. Saving metadata...")

metadata = {
    "targets": ["overallScore", "timeToMarket", "communityGrowth"],
    "feature_count": len(feature_cols),
    "training_samples": len(X_train),
    "test_samples": len(X_test),
    "models": {
        "overallScore": {
            "type": "LinearRegression",
            "needs_scaling": False,
        },
        "timeToMarket": {
            "type": "Lasso",
            "needs_scaling": True,
        },
        "communityGrowth": {
            "type": "Lasso",
            "needs_scaling": True,
        },
    },
}

metadata_path = MODELS_DIR / "metadata.json"
with open(metadata_path, "w") as f:
    json.dump(metadata, f, indent=2)
print(f"   Saved metadata to {metadata_path}")

print("\n" + "=" * 80)
print("MODELS SAVED SUCCESSFULLY")
print("=" * 80)
print(f"\nModels saved to: {MODELS_DIR}")
print("Files:")
print("  - feature_list.json")
print("  - metadata.json")
print("  - overallScore_model.joblib")
print("  - timeToMarket_model.joblib")
print("  - timeToMarket_scaler.joblib")
print("  - communityGrowth_model.joblib")
print("  - communityGrowth_scaler.joblib")
