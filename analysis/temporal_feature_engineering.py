#!/usr/bin/env python3
"""
Temporal Feature Engineering
Фаза 2.3: Створення temporal features для ML modeling

Магістерська робота: Outcome-based оцінка якості TypeScript коду
Автор: Слабенко Костянтин Олегович
Група: АС-202
Одеський політехнічний національний університет
"""

import warnings
import pandas as pd
import numpy as np
from pathlib import Path

warnings.filterwarnings("ignore")

print("=" * 80)
print("TEMPORAL FEATURE ENGINEERING")
print("=" * 80)

# ============================================================================
# 1. LOAD TEMPORAL DATA
# ============================================================================
print("\n📊 Завантаження temporal data...")
df = pd.read_csv("../reports/metrics_report_temporal_long.csv")
df["date"] = pd.to_datetime(df["date"])

# Sort by project and date
df = df.sort_values(["project", "date"])

print(f"✅ Завантажено {len(df)} records")
print(f"   Projects: {df['project'].nunique()}")
print(f"   Time periods: {df['date'].nunique()}")

# Numeric columns (exclude project, date)
numeric_cols = [col for col in df.columns if col not in ["project", "date"]]

# ============================================================================
# 2. LAG FEATURES
# ============================================================================
print("\n🔄 Створення lag features...")

lag_periods = [1, 2, 3]  # 1, 2, 3 months ago
lag_count = 0

for col in numeric_cols:
    for lag in lag_periods:
        lag_col = f"{col}_lag_{lag}m"
        df[lag_col] = df.groupby("project")[col].shift(lag)
        lag_count += 1

print(
    f"✅ Створено {lag_count} lag features ({len(numeric_cols)} metrics × {len(lag_periods)} lags)"
)

# ============================================================================
# 3. ROLLING STATISTICS
# ============================================================================
print("\n📊 Створення rolling statistics...")

rolling_windows = [2, 3]  # 2-month, 3-month windows
rolling_stats = ["mean", "std", "min", "max"]
rolling_count = 0

for col in numeric_cols:
    for window in rolling_windows:
        # Mean
        df[f"{col}_rolling_{window}m_mean"] = (
            df.groupby("project")[col]
            .rolling(window=window, min_periods=1)
            .mean()
            .reset_index(level=0, drop=True)
        )

        # Std
        df[f"{col}_rolling_{window}m_std"] = (
            df.groupby("project")[col]
            .rolling(window=window, min_periods=1)
            .std()
            .reset_index(level=0, drop=True)
        )

        # Min
        df[f"{col}_rolling_{window}m_min"] = (
            df.groupby("project")[col]
            .rolling(window=window, min_periods=1)
            .min()
            .reset_index(level=0, drop=True)
        )

        # Max
        df[f"{col}_rolling_{window}m_max"] = (
            df.groupby("project")[col]
            .rolling(window=window, min_periods=1)
            .max()
            .reset_index(level=0, drop=True)
        )

        rolling_count += 4

print(
    f"✅ Створено {rolling_count} rolling features ({len(numeric_cols)} metrics × {len(rolling_windows)} windows × 4 stats)"
)

# ============================================================================
# 4. TREND FEATURES (Linear Regression Slopes)
# ============================================================================
print("\n📈 Створення trend features...")

trend_windows = [2, 3]  # 2-month, 3-month trends
trend_count = 0


def calculate_trend(series):
    """Calculate linear trend slope"""
    if len(series) < 2 or series.isna().all():
        return np.nan

    x = np.arange(len(series))
    y = series.values

    # Remove NaN
    mask = ~np.isnan(y)
    if mask.sum() < 2:
        return np.nan

    try:
        slope = np.polyfit(x[mask], y[mask], 1)[0]
        return slope
    except:
        return np.nan


for col in numeric_cols:
    for window in trend_windows:
        trend_col = f"{col}_trend_{window}m"
        df[trend_col] = (
            df.groupby("project")[col]
            .rolling(window=window, min_periods=2)
            .apply(calculate_trend, raw=False)
            .reset_index(level=0, drop=True)
        )
        trend_count += 1

print(
    f"✅ Створено {trend_count} trend features ({len(numeric_cols)} metrics × {len(trend_windows)} windows)"
)

# ============================================================================
# 5. MOMENTUM FEATURES (Rate of Change)
# ============================================================================
print("\n⚡ Створення momentum features...")

momentum_periods = [1, 2]  # 1-month, 2-month momentum
momentum_count = 0

for col in numeric_cols:
    for period in momentum_periods:
        momentum_col = f"{col}_momentum_{period}m"

        # Momentum = (current - previous) / previous * 100
        df[momentum_col] = df.groupby("project")[col].pct_change(periods=period) * 100
        momentum_count += 1

print(
    f"✅ Створено {momentum_count} momentum features ({len(numeric_cols)} metrics × {len(momentum_periods)} periods)"
)

# ============================================================================
# 6. VOLATILITY FEATURES (Rolling Coefficient of Variation)
# ============================================================================
print("\n📉 Створення volatility features...")

volatility_windows = [3]  # 3-month volatility
volatility_count = 0

for col in numeric_cols:
    for window in volatility_windows:
        volatility_col = f"{col}_volatility_{window}m"

        # CV = (std / mean) * 100
        rolling_mean = (
            df.groupby("project")[col]
            .rolling(window=window, min_periods=2)
            .mean()
            .reset_index(level=0, drop=True)
        )

        rolling_std = (
            df.groupby("project")[col]
            .rolling(window=window, min_periods=2)
            .std()
            .reset_index(level=0, drop=True)
        )

        # Avoid division by zero
        df[volatility_col] = np.where(
            rolling_mean != 0, (rolling_std / rolling_mean) * 100, np.nan
        )

        volatility_count += 1

print(
    f"✅ Створено {volatility_count} volatility features ({len(numeric_cols)} metrics × {len(volatility_windows)} windows)"
)

# ============================================================================
# 7. TEMPORAL INTERACTION FEATURES
# ============================================================================
print("\n🔗 Створення temporal interaction features...")

interaction_count = 0

# Trend × Current value interactions
for col in ["dx_codeReviewDuration", "tp_testCoverage", "bi_timeToMarket"]:
    if col in df.columns and f"{col}_trend_3m" in df.columns:
        df[f"{col}_trend_value_interaction"] = df[col] * df[f"{col}_trend_3m"]
        interaction_count += 1

# Momentum × Volatility
for col in ["dx_codeReviewDuration", "bi_communityGrowth"]:
    if f"{col}_momentum_1m" in df.columns and f"{col}_volatility_3m" in df.columns:
        df[f"{col}_momentum_volatility"] = (
            df[f"{col}_momentum_1m"] * df[f"{col}_volatility_3m"]
        )
        interaction_count += 1

print(f"✅ Створено {interaction_count} temporal interaction features")

# ============================================================================
# 8. TIME-BASED FEATURES
# ============================================================================
print("\n📅 Створення time-based features...")

# Month number (1-6 for 6 months)
df["month_number"] = df.groupby("project").cumcount() + 1

# Days since first snapshot
df["days_since_start"] = df.groupby("project")["date"].transform(
    lambda x: (x - x.min()).dt.days
)

# Quarter (if applicable)
df["quarter"] = df["date"].dt.quarter

# Is last month (binary)
df["is_last_month"] = (
    df.groupby("project")["month_number"].transform("max") == df["month_number"]
).astype(int)

print("✅ Створено 4 time-based features")

# ============================================================================
# 9. FEATURE SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("FEATURE SUMMARY")
print("=" * 80)

original_features = len(numeric_cols)
new_features = len(df.columns) - original_features - 2  # -2 for project, date

print(f"\n✅ Original features: {original_features}")
print(f"✅ New temporal features: {new_features}")
print(f"✅ Total features: {original_features + new_features}")

print(f"\nBreakdown:")
print(f"  • Lag features: {lag_count}")
print(f"  • Rolling statistics: {rolling_count}")
print(f"  • Trend features: {trend_count}")
print(f"  • Momentum features: {momentum_count}")
print(f"  • Volatility features: {volatility_count}")
print(f"  • Interaction features: {interaction_count}")
print(f"  • Time-based features: 4")

# ============================================================================
# 10. SAVE ENGINEERED FEATURES
# ============================================================================
print("\n💾 Збереження engineered features...")

# Save full temporal dataset with all features
output_path = "../reports/temporal/engineered_features_temporal.csv"
df.to_csv(output_path, index=False)

print(f"✅ Збережено: {output_path}")
print(f"   Shape: {df.shape}")

# Save feature list
feature_list = [col for col in df.columns if col not in ["project", "date"]]
feature_df = pd.DataFrame({"Feature": feature_list})
feature_df.to_csv("../reports/temporal/feature_list_temporal.csv", index=False)

print(f"✅ Збережено feature list: reports/temporal/feature_list_temporal.csv")

# Save feature importance (correlation with targets)
print("\n📊 Calculating feature importance (correlation with targets)...")

targets = ["bi_timeToMarket", "bi_communityGrowth"]
importance_results = []

for target in targets:
    if target in df.columns:
        for feat in feature_list:
            if feat != target and feat in df.columns:
                # Calculate correlation
                corr = df[[feat, target]].corr().iloc[0, 1]
                if not np.isnan(corr):
                    importance_results.append(
                        {"Target": target, "Feature": feat, "Correlation": corr}
                    )

importance_df = pd.DataFrame(importance_results)
importance_df = importance_df.sort_values(
    ["Target", "Correlation"],
    key=lambda x: abs(x) if x.name == "Correlation" else x,
    ascending=[True, False],
)
importance_df.to_csv("../reports/temporal/temporal_feature_importance.csv", index=False)

print(f"✅ Збережено feature importance analysis")

print("\n" + "=" * 80)
print("TEMPORAL FEATURE ENGINEERING COMPLETE")
print("=" * 80)

print(f"\n✅ Dataset готовий для temporal ML modeling!")
print(f"✅ Next step: python temporal_modeling.py")
