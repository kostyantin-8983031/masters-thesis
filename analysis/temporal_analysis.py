#!/usr/bin/env python3
"""
Temporal Data Analysis & Time Series Exploration
Фаза 2.3: Temporal validation та time-series аналіз

Магістерська робота: Outcome-based оцінка якості TypeScript коду
Автор: Слабенко Костянтин Олегович
Група: АС-202
Одеський політехнічний національний університет
"""

# Вимкнути попередження
import warnings

# Імпорт основних бібліотек
import json
from pathlib import Path

# Data processing
import numpy as np
import pandas as pd

# Візуалізація
import matplotlib
import matplotlib.pyplot as plt
import seaborn as sns

# Time series analysis
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from statsmodels.tsa.stattools import adfuller

warnings.filterwarnings("ignore")

matplotlib.use("Agg")  # Без GUI backend

# Налаштування візуалізації
plt.style.use("seaborn-v0_8-darkgrid")
sns.set_palette("husl")
plt.rcParams["figure.figsize"] = (14, 8)
plt.rcParams["font.size"] = 10

# Директорії
FIGURES_DIR = Path("../reports/temporal")
FIGURES_DIR.mkdir(parents=True, exist_ok=True)

print("=" * 80)
print("TEMPORAL DATA ANALYSIS")
print("Фаза 2.3: Time-Series Exploration & Trend Analysis")
print("=" * 80)

# ============================================================================
# 1. DATA LOADING
# ============================================================================
print("\n📊 Завантаження temporal даних...")
with open("../reports/metrics_report_temporal_long.csv", "r", encoding="utf-8") as f:
    df = pd.read_csv(f)

# Convert date column to datetime
df["date"] = pd.to_datetime(df["date"])

print(f"✅ Завантажено {len(df)} temporal records")
print(f"   Projects: {df['project'].nunique()}")
print(f"   Date range: {df['date'].min().date()} → {df['date'].max().date()}")
print(f"   Snapshots per project: {len(df) // df['project'].nunique()}")

# ============================================================================
# 2. DATA QUALITY CHECK
# ============================================================================
print("\n🔍 Перевірка якості temporal data...")

# Missing values per metric
missing_summary = []
for col in df.columns:
    if col not in ["project", "date"]:
        missing_count = df[col].isnull().sum()
        missing_pct = (missing_count / len(df)) * 100
        if missing_count > 0:
            missing_summary.append(
                {
                    "Metric": col,
                    "Missing Count": missing_count,
                    "Missing %": missing_pct,
                }
            )

if missing_summary:
    missing_df = pd.DataFrame(missing_summary)
    missing_df.to_csv(FIGURES_DIR / "missing_values_temporal.csv", index=False)
    print(f"⚠️  Missing values знайдено у {len(missing_df)} metrics")
else:
    print("✅ Жодних missing values")

# ============================================================================
# 3. DESCRIPTIVE STATISTICS BY TIME PERIOD
# ============================================================================
print("\n📈 Descriptive statistics по періодах...")

# Calculate stats for each month
numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

monthly_stats = df.groupby("date")[numeric_cols].agg(["mean", "std", "min", "max"])
monthly_stats.to_csv(FIGURES_DIR / "monthly_statistics.csv")

print(f"✅ Збережено monthly statistics для {len(numeric_cols)} метрик")

# ============================================================================
# 4. TREND ANALYSIS
# ============================================================================
print("\n📊 Генерація візуалізації 1: Overall Trends Over Time...")

# Key metrics to visualize
key_metrics = [
    "dx_codeReviewDuration",
    "tp_testCoverage",
    "tp_typeScriptErrorRate",
    "bi_timeToMarket",
    "bi_communityGrowth",
    "bi_activeContributors",
]

# Calculate monthly averages across all projects
monthly_avg = df.groupby("date")[key_metrics].mean()

fig, axes = plt.subplots(3, 2, figsize=(16, 14))
axes = axes.flatten()

for i, metric in enumerate(key_metrics):
    ax = axes[i]

    # Plot trend line
    monthly_avg[metric].plot(ax=ax, marker="o", linewidth=2, markersize=8)

    # Add trend line (linear regression)
    x = np.arange(len(monthly_avg))
    y = monthly_avg[metric].values
    z = np.polyfit(x, y, 1)
    p = np.poly1d(z)
    ax.plot(
        monthly_avg.index, p(x), "r--", alpha=0.7, label=f"Trend (slope={z[0]:.2f})"
    )

    ax.set_xlabel("Date")
    ax.set_ylabel(metric.replace("_", " ").title())
    ax.set_title(f"Trend: {metric.replace('_', ' ')}")
    ax.legend()
    ax.grid(True, alpha=0.3)
    ax.tick_params(axis="x", rotation=45)

plt.tight_layout()
plt.savefig(FIGURES_DIR / "22_overall_trends.png", dpi=300, bbox_inches="tight")
plt.close()
print("✅ Збережено: reports/temporal/22_overall_trends.png")

# ============================================================================
# 5. PROJECT TRAJECTORIES
# ============================================================================
print("\n📊 Генерація візуалізації 2: Top Projects Trajectories...")

# Select top 10 projects by average overall score
# NOTE: Need to calculate overallScore from metrics
# Simplified: use bi_communityGrowth as proxy for success
top_projects = (
    df.groupby("project")["bi_communityGrowth"].mean().nlargest(10).index.tolist()
)

fig, axes = plt.subplots(2, 2, figsize=(16, 12))
axes = axes.flatten()

trajectory_metrics = [
    "dx_codeReviewDuration",
    "tp_testCoverage",
    "bi_timeToMarket",
    "bi_communityGrowth",
]

for i, metric in enumerate(trajectory_metrics):
    ax = axes[i]

    for project in top_projects:
        project_data = df[df["project"] == project]
        project_short = project.split("/")[-1]
        ax.plot(
            project_data["date"],
            project_data[metric],
            marker="o",
            label=project_short,
            alpha=0.7,
        )

    ax.set_xlabel("Date")
    ax.set_ylabel(metric.replace("_", " ").title())
    ax.set_title(f"Top 10 Projects: {metric.replace('_', ' ')}")
    ax.legend(fontsize=8, loc="best")
    ax.grid(True, alpha=0.3)
    ax.tick_params(axis="x", rotation=45)

plt.tight_layout()
plt.savefig(
    FIGURES_DIR / "23_top_projects_trajectories.png", dpi=300, bbox_inches="tight"
)
plt.close()
print("✅ Збережено: reports/temporal/23_top_projects_trajectories.png")

# ============================================================================
# 6. TIME SERIES DECOMPOSITION
# ============================================================================
print("\n📊 Генерація візуалізації 3: Time Series Decomposition...")

# Perform seasonal decomposition for key metrics
decomposition_metrics = [
    "dx_codeReviewDuration",
    "bi_timeToMarket",
    "bi_communityGrowth",
]

for metric in decomposition_metrics:
    monthly_avg_metric = df.groupby("date")[metric].mean()

    # Need at least 2 periods for decomposition
    if len(monthly_avg_metric) >= 6:
        try:
            # Seasonal decomposition (period=2 for bimonthly pattern)
            decomposition = seasonal_decompose(
                monthly_avg_metric, model="additive", period=2, extrapolate_trend="freq"
            )

            fig, axes = plt.subplots(4, 1, figsize=(14, 10))

            # Original
            axes[0].plot(monthly_avg_metric, marker="o", label="Original")
            axes[0].set_ylabel("Original")
            axes[0].legend(loc="best")
            axes[0].grid(True, alpha=0.3)

            # Trend
            axes[1].plot(decomposition.trend, marker="o", color="orange", label="Trend")
            axes[1].set_ylabel("Trend")
            axes[1].legend(loc="best")
            axes[1].grid(True, alpha=0.3)

            # Seasonal
            axes[2].plot(
                decomposition.seasonal, marker="o", color="green", label="Seasonal"
            )
            axes[2].set_ylabel("Seasonal")
            axes[2].legend(loc="best")
            axes[2].grid(True, alpha=0.3)

            # Residual
            axes[3].plot(decomposition.resid, marker="o", color="red", label="Residual")
            axes[3].set_ylabel("Residual")
            axes[3].set_xlabel("Date")
            axes[3].legend(loc="best")
            axes[3].grid(True, alpha=0.3)

            fig.suptitle(
                f"Time Series Decomposition: {metric.replace('_', ' ')}",
                fontsize=14,
                y=1.00,
            )
            plt.tight_layout()

            filename = f"24_decomposition_{metric}.png"
            plt.savefig(FIGURES_DIR / filename, dpi=300, bbox_inches="tight")
            plt.close()
            print(f"✅ Збережено: reports/temporal/{filename}")

        except Exception as e:
            print(f"⚠️  Decomposition failed for {metric}: {e}")

# ============================================================================
# 7. AUTOCORRELATION ANALYSIS
# ============================================================================
print("\n📊 Генерація візуалізації 4: Autocorrelation Analysis...")

acf_metrics = ["dx_codeReviewDuration", "bi_timeToMarket", "tp_testCoverage"]

for metric in acf_metrics:
    monthly_avg_metric = df.groupby("date")[metric].mean().dropna()

    if len(monthly_avg_metric) >= 5:
        fig, axes = plt.subplots(1, 2, figsize=(14, 5))

        # ACF (can use more lags)
        acf_lags = min(5, len(monthly_avg_metric) - 1)
        plot_acf(monthly_avg_metric, lags=acf_lags, ax=axes[0])
        axes[0].set_title(f"Autocorrelation Function (ACF): {metric.replace('_', ' ')}")
        axes[0].grid(True, alpha=0.3)

        # PACF (needs < 50% of sample size)
        pacf_lags = min(3, len(monthly_avg_metric) // 2 - 1)
        if pacf_lags >= 1:
            plot_pacf(monthly_avg_metric, lags=pacf_lags, ax=axes[1])
            axes[1].set_title(
                f"Partial Autocorrelation Function (PACF): {metric.replace('_', ' ')}"
            )
            axes[1].grid(True, alpha=0.3)
        else:
            axes[1].text(
                0.5,
                0.5,
                f"Insufficient data for PACF\n({len(monthly_avg_metric)} points)",
                ha="center",
                va="center",
                transform=axes[1].transAxes,
            )

        plt.tight_layout()
        filename = f"25_acf_pacf_{metric}.png"
        plt.savefig(FIGURES_DIR / filename, dpi=300, bbox_inches="tight")
        plt.close()
        print(f"✅ Збережено: reports/temporal/{filename}")

# ============================================================================
# 8. STATIONARITY TESTING (Augmented Dickey-Fuller)
# ============================================================================
print("\n📊 Stationarity Testing (ADF)...")

stationarity_results = []

for metric in numeric_cols:
    monthly_avg_metric = df.groupby("date")[metric].mean().dropna()

    if len(monthly_avg_metric) >= 3:
        try:
            adf_result = adfuller(monthly_avg_metric, autolag="AIC")

            stationarity_results.append(
                {
                    "Metric": metric,
                    "ADF Statistic": adf_result[0],
                    "p-value": adf_result[1],
                    "Stationary": "Yes" if adf_result[1] < 0.05 else "No",
                    "Critical Value (5%)": adf_result[4]["5%"],
                }
            )
        except Exception as e:
            print(f"   ⚠️  ADF test failed for {metric}: {e}")

stationarity_df = pd.DataFrame(stationarity_results)
stationarity_df.to_csv(FIGURES_DIR / "stationarity_adf_results.csv", index=False)

stationary_count = (stationarity_df["Stationary"] == "Yes").sum()
print(
    f"✅ ADF testing завершено: {stationary_count}/{len(stationarity_df)} metrics stationary"
)

# ============================================================================
# 9. CHANGE DETECTION
# ============================================================================
print("\n📊 Генерація візуалізації 5: Change Detection (Improving vs Declining)...")

# Calculate rate of change (slope) for each project
change_analysis = []

for project in df["project"].unique():
    project_data = df[df["project"] == project].sort_values("date")

    for metric in ["dx_codeReviewDuration", "tp_testCoverage", "bi_timeToMarket"]:
        if metric in project_data.columns:
            x = np.arange(len(project_data))
            y = project_data[metric].values

            if not np.isnan(y).all() and len(y) > 1:
                z = np.polyfit(x, y, 1)
                slope = z[0]

                change_analysis.append(
                    {"Project": project, "Metric": metric, "Slope": slope}
                )

change_df = pd.DataFrame(change_analysis)
change_df.to_csv(FIGURES_DIR / "change_analysis.csv", index=False)

# Visualize top improving and declining projects
for metric in ["dx_codeReviewDuration", "tp_testCoverage", "bi_timeToMarket"]:
    metric_changes = change_df[change_df["Metric"] == metric].sort_values("Slope")

    fig, axes = plt.subplots(1, 2, figsize=(16, 6))

    # Top improving (positive slope for testCoverage, negative for duration/timeToMarket)
    if metric == "tp_testCoverage":
        improving = metric_changes.nlargest(10, "Slope")
        declining = metric_changes.nsmallest(10, "Slope")
    else:
        improving = metric_changes.nsmallest(10, "Slope")  # Lower is better
        declining = metric_changes.nlargest(10, "Slope")  # Higher is worse

    # Improving projects
    axes[0].barh(
        range(len(improving)),
        improving["Slope"],
        color="green",
        alpha=0.7,
    )
    axes[0].set_yticks(range(len(improving)))
    axes[0].set_yticklabels([p.split("/")[-1] for p in improving["Project"]])
    axes[0].set_xlabel("Slope (Rate of Change)")
    axes[0].set_title(f"Top 10 Improving: {metric.replace('_', ' ')}")
    axes[0].invert_yaxis()
    axes[0].grid(True, alpha=0.3, axis="x")

    # Declining projects
    axes[1].barh(range(len(declining)), declining["Slope"], color="red", alpha=0.7)
    axes[1].set_yticks(range(len(declining)))
    axes[1].set_yticklabels([p.split("/")[-1] for p in declining["Project"]])
    axes[1].set_xlabel("Slope (Rate of Change)")
    axes[1].set_title(f"Top 10 Declining: {metric.replace('_', ' ')}")
    axes[1].invert_yaxis()
    axes[1].grid(True, alpha=0.3, axis="x")

    plt.tight_layout()
    filename = f"26_change_detection_{metric}.png"
    plt.savefig(FIGURES_DIR / filename, dpi=300, bbox_inches="tight")
    plt.close()
    print(f"✅ Збережено: reports/temporal/{filename}")

# ============================================================================
# 10. VOLATILITY ANALYSIS
# ============================================================================
print("\n📊 Volatility Analysis...")

# Calculate rolling std for each project
volatility_metrics = ["dx_codeReviewDuration", "bi_timeToMarket", "tp_testCoverage"]

volatility_results = []

for project in df["project"].unique():
    project_data = df[df["project"] == project].sort_values("date")

    for metric in volatility_metrics:
        if metric in project_data.columns:
            values = project_data[metric].values
            if len(values) > 1:
                volatility = np.std(values)
                mean_value = np.mean(values)
                cv = (volatility / mean_value * 100) if mean_value != 0 else 0

                volatility_results.append(
                    {
                        "Project": project,
                        "Metric": metric,
                        "Volatility (Std)": volatility,
                        "Mean": mean_value,
                        "CV %": cv,
                    }
                )

volatility_df = pd.DataFrame(volatility_results)
volatility_df.to_csv(FIGURES_DIR / "volatility_analysis.csv", index=False)

print(f"✅ Volatility analysis завершено для {len(volatility_df)} project-metric pairs")

# ============================================================================
# 11. SUMMARY STATISTICS
# ============================================================================
print("\n" + "=" * 80)
print("SUMMARY STATISTICS")
print("=" * 80)

print(f"\n📊 Dataset Info:")
print(f"   Total records: {len(df)}")
print(f"   Projects: {df['project'].nunique()}")
print(f"   Time periods: {df['date'].nunique()}")
print(f"   Metrics tracked: {len(numeric_cols)}")

print(f"\n📈 Trend Analysis:")
stationary_pct = (
    (stationary_count / len(stationarity_df) * 100) if len(stationarity_df) > 0 else 0
)
print(
    f"   Stationary metrics: {stationary_count}/{len(stationarity_df)} ({stationary_pct:.1f}%)"
)

improving_count = len(change_df[change_df["Slope"] < 0])
print(f"   Improving trends detected: {improving_count}")

print("\n✅ Temporal analysis завершено!")
print(f"✅ Згенеровано візуалізації в: {FIGURES_DIR}")

print("\n" + "=" * 80)
print("TEMPORAL ANALYSIS COMPLETE")
print("=" * 80)

# List generated files
print("\n📁 ЗГЕНЕРОВАНІ ФАЙЛИ:")
for file in sorted(FIGURES_DIR.glob("*")):
    print(f"  • {file.name}")
