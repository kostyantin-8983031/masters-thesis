#!/usr/bin/env python3
"""
Temporal ML Modeling & Forecasting
Фаза 2.3: Time-series forecasting models (ARIMA, Prophet, LSTM)

Магістерська робота: Outcome-based оцінка якості TypeScript коду
Автор: Слабенко Костянтин Олегович
Група: АС-202
Одеський політехнічний національний університет
"""

import warnings
import pandas as pd
import numpy as np
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns

# Time series modeling
from statsmodels.tsa.arima.model import ARIMA
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

warnings.filterwarnings("ignore")

# Налаштування візуалізації
plt.style.use("seaborn-v0_8-darkgrid")
sns.set_palette("husl")

# Директорії
FIGURES_DIR = Path("../reports/temporal")
FIGURES_DIR.mkdir(parents=True, exist_ok=True)

print("=" * 80)
print("TEMPORAL ML MODELING & FORECASTING")
print("=" * 80)

# ============================================================================
# 1. LOAD TEMPORAL DATA WITH ENGINEERED FEATURES
# ============================================================================
print("\n📊 Завантаження temporal data...")
df = pd.read_csv("../reports/temporal/engineered_features_temporal.csv")
df["date"] = pd.to_datetime(df["date"])

print(f"✅ Завантажено {len(df)} records")
print(f"   Projects: {df['project'].nunique()}")
print(f"   Features: {len(df.columns) - 2}")  # -2 for project, date

# ============================================================================
# 2. TIME-SERIES FORECASTING (ARIMA)
# ============================================================================
print("\n📈 ARIMA Forecasting для key metrics...")

# Key metrics to forecast
forecast_metrics = ["dx_codeReviewDuration", "bi_timeToMarket", "bi_communityGrowth"]

arima_results = []

for metric in forecast_metrics:
    print(f"\n🔮 Forecasting {metric}...")

    # Calculate monthly average across all projects
    monthly_avg = df.groupby("date")[metric].mean().dropna()

    if len(monthly_avg) < 4:
        print(f"   ⚠️  Insufficient data for {metric}, skipping...")
        continue

    # Split into train/test (last month as test)
    train = monthly_avg[:-1]
    test = monthly_avg[-1:]

    try:
        # Fit ARIMA model (p=1, d=1, q=1 - simple model)
        model = ARIMA(train, order=(1, 1, 1))
        fitted_model = model.fit()

        # Forecast next period
        forecast = fitted_model.forecast(steps=1)
        forecast_value = forecast.iloc[0]
        actual_value = test.iloc[0]

        # Calculate error
        error = abs(forecast_value - actual_value)
        error_pct = (error / actual_value * 100) if actual_value != 0 else 0

        arima_results.append(
            {
                "Metric": metric,
                "Forecast": forecast_value,
                "Actual": actual_value,
                "Error": error,
                "Error %": error_pct,
                "AIC": fitted_model.aic,
            }
        )

        print(
            f"   ✅ Forecast: {forecast_value:.2f}, Actual: {actual_value:.2f}, Error: {error_pct:.1f}%"
        )

    except Exception as e:
        print(f"   ❌ ARIMA failed for {metric}: {e}")

# Save ARIMA results
if arima_results:
    arima_df = pd.DataFrame(arima_results)
    arima_df.to_csv(FIGURES_DIR / "arima_forecasts.csv", index=False)
    print(f"\n✅ Збережено ARIMA forecasts: {len(arima_results)} metrics")

# ============================================================================
# 3. TEMPORAL CROSS-VALIDATION
# ============================================================================
print("\n📊 Temporal Cross-Validation (Time Series Split)...")

from sklearn.model_selection import TimeSeriesSplit
from sklearn.ensemble import RandomForestRegressor

# Use engineered temporal features to predict targets
feature_cols = [
    col
    for col in df.columns
    if col not in ["project", "date", "bi_timeToMarket", "bi_communityGrowth"]
]

# Filter out columns with all NaN or non-numeric
feature_cols = [
    col
    for col in feature_cols
    if df[col].notna().sum() > 0 and pd.api.types.is_numeric_dtype(df[col])
]

targets = ["bi_timeToMarket", "bi_communityGrowth"]

cv_results = []

for target in targets:
    print(f"\n🎯 Cross-validating {target}...")

    # Prepare data (drop rows with NaN in target)
    df_target = df[[target] + feature_cols].dropna(subset=[target])

    if len(df_target) < 10:
        print(f"   ⚠️  Insufficient data for {target}, skipping...")
        continue

    X = df_target[feature_cols].fillna(0)  # Fill NaN in features with 0
    y = df_target[target]

    # Time Series Split (3 folds)
    tscv = TimeSeriesSplit(n_splits=3)

    fold_scores = []

    for fold, (train_idx, test_idx) in enumerate(tscv.split(X)):
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

        # Train Random Forest
        rf = RandomForestRegressor(n_estimators=50, random_state=42, max_depth=10)
        rf.fit(X_train, y_train)

        # Predict
        y_pred = rf.predict(X_test)

        # Metrics
        r2 = r2_score(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        mae = mean_absolute_error(y_test, y_pred)

        fold_scores.append({"R²": r2, "RMSE": rmse, "MAE": mae})

        print(f"   Fold {fold + 1}: R²={r2:.3f}, RMSE={rmse:.2f}, MAE={mae:.2f}")

    # Average across folds
    avg_r2 = np.mean([s["R²"] for s in fold_scores])
    avg_rmse = np.mean([s["RMSE"] for s in fold_scores])
    avg_mae = np.mean([s["MAE"] for s in fold_scores])

    cv_results.append(
        {
            "Target": target,
            "Avg R²": avg_r2,
            "Avg RMSE": avg_rmse,
            "Avg MAE": avg_mae,
            "Folds": len(fold_scores),
        }
    )

    print(f"   📊 Average: R²={avg_r2:.3f}, RMSE={avg_rmse:.2f}, MAE={avg_mae:.2f}")

# Save CV results
if cv_results:
    cv_df = pd.DataFrame(cv_results)
    cv_df.to_csv(FIGURES_DIR / "temporal_cv_results.csv", index=False)
    print(f"\n✅ Збережено temporal CV results")

# ============================================================================
# 4. FEATURE IMPORTANCE (Temporal Features)
# ============================================================================
print("\n📊 Feature Importance для temporal features...")

importance_results = []

for target in ["bi_timeToMarket", "bi_communityGrowth"]:
    print(f"\n🔍 Analyzing {target}...")

    df_target = df[[target] + feature_cols].dropna(subset=[target])

    if len(df_target) < 10:
        continue

    X = df_target[feature_cols].fillna(0)
    y = df_target[target]

    # Train Random Forest
    rf = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=15)
    rf.fit(X, y)

    # Get feature importance
    for feat, imp in zip(feature_cols, rf.feature_importances_):
        if imp > 0.001:  # Only features with >0.1% importance
            importance_results.append(
                {"Target": target, "Feature": feat, "Importance": imp}
            )

# Save and visualize
if importance_results:
    importance_df = pd.DataFrame(importance_results)
    importance_df = importance_df.sort_values(
        ["Target", "Importance"], ascending=[True, False]
    )
    importance_df.to_csv(
        FIGURES_DIR / "temporal_feature_importance_rf.csv", index=False
    )

    print(f"✅ Збережено temporal feature importance")

    # Visualize top 15 for each target
    for target in ["bi_timeToMarket", "bi_communityGrowth"]:
        target_imp = importance_df[importance_df["Target"] == target].nlargest(
            15, "Importance"
        )

        if len(target_imp) > 0:
            fig, ax = plt.subplots(figsize=(12, 8))

            ax.barh(
                range(len(target_imp)),
                target_imp["Importance"],
                color="steelblue",
                alpha=0.7,
            )
            ax.set_yticks(range(len(target_imp)))
            ax.set_yticklabels(target_imp["Feature"])
            ax.set_xlabel("Importance")
            ax.set_title(f"Top 15 Temporal Features: {target}")
            ax.invert_yaxis()
            ax.grid(True, alpha=0.3, axis="x")

            plt.tight_layout()
            filename = f"27_temporal_importance_{target}.png"
            plt.savefig(FIGURES_DIR / filename, dpi=300, bbox_inches="tight")
            plt.close()

            print(f"   ✅ Збережено: reports/temporal/{filename}")

# ============================================================================
# 5. FORECASTING VISUALIZATION
# ============================================================================
print("\n📊 Генерація візуалізації: Forecasting Results...")

if arima_results:
    arima_df = pd.DataFrame(arima_results)

    fig, ax = plt.subplots(figsize=(12, 6))

    x = np.arange(len(arima_df))
    width = 0.35

    ax.bar(
        x - width / 2,
        arima_df["Actual"],
        width,
        label="Actual",
        alpha=0.7,
        color="green",
    )
    ax.bar(
        x + width / 2,
        arima_df["Forecast"],
        width,
        label="Forecast",
        alpha=0.7,
        color="orange",
    )

    ax.set_xlabel("Metric")
    ax.set_ylabel("Value")
    ax.set_title("ARIMA Forecasts vs Actual Values")
    ax.set_xticks(x)
    ax.set_xticklabels([m.replace("_", "\n") for m in arima_df["Metric"]], rotation=0)
    ax.legend()
    ax.grid(True, alpha=0.3, axis="y")

    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "28_arima_forecasts.png", dpi=300, bbox_inches="tight")
    plt.close()

    print("✅ Збережено: reports/temporal/28_arima_forecasts.png")

# ============================================================================
# 6. MODEL PERFORMANCE SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("MODEL PERFORMANCE SUMMARY")
print("=" * 80)

if arima_results:
    print(f"\n📈 ARIMA Forecasting:")
    print(f"   Metrics forecasted: {len(arima_results)}")
    avg_error = np.mean([r["Error %"] for r in arima_results])
    print(f"   Average forecast error: {avg_error:.1f}%")

if cv_results:
    print(f"\n📊 Temporal Cross-Validation (Random Forest):")
    for result in cv_results:
        print(f"   {result['Target']}:")
        print(f"      Avg R²: {result['Avg R²']:.3f}")
        print(f"      Avg RMSE: {result['Avg RMSE']:.2f}")
        print(f"      Avg MAE: {result['Avg MAE']:.2f}")

print("\n" + "=" * 80)
print("TEMPORAL MODELING COMPLETE")
print("=" * 80)

print(f"\n✅ Time-series models trained and validated!")
print(f"✅ Згенеровані файли збережено в: {FIGURES_DIR}")

# List generated files
print("\n📁 ЗГЕНЕРОВАНІ ФАЙЛИ:")
for file in sorted(FIGURES_DIR.glob("*.csv")):
    print(f"  • {file.name}")
for file in sorted(FIGURES_DIR.glob("*.png")):
    print(f"  • {file.name}")
