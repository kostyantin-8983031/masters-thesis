#!/usr/bin/env python3
"""
Data Validation & Exploration
Фаза 2.1: Валідація даних та exploratory data analysis

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

# Візуалізація
import matplotlib
import numpy as np
import pandas as pd

import matplotlib.pyplot as plt
import seaborn as sns

from pandas.plotting import scatter_matrix

warnings.filterwarnings("ignore")

matplotlib.use("Agg")  # Без GUI backend

# Налаштування візуалізації
plt.style.use("seaborn-v0_8-darkgrid")
sns.set_palette("husl")
plt.rcParams["figure.figsize"] = (12, 6)
plt.rcParams["font.size"] = 10

# Директорії
FIGURES_DIR = Path("../reports/analysis")
FIGURES_DIR.mkdir(parents=True, exist_ok=True)

print("=" * 80)
print("ПОЧАТОК АНАЛІЗУ ДАНИХ")
print("=" * 80)

#  ЗАВАНТАЖЕННЯ ДАНИХ
print("\n📊 Завантаження даних...")
with open("../reports/metrics_report.json", "r", encoding="utf-8") as f:
    data = json.load(f)

projects_data = data["projects"]
df = pd.DataFrame(projects_data)
print(f"✅ Завантажено {len(df)} проектів")

# РОЗГОРТАННЯ МЕТРИК
print("\n🔄 Розгортання вкладених метрик...")
dx_df = pd.DataFrame(df["developerExperience"].tolist())
dx_df.columns = ["dx_" + col for col in dx_df.columns]

tp_df = pd.DataFrame(df["technicalPerformance"].tolist())
tp_df.columns = ["tp_" + col for col in tp_df.columns]

bi_df = pd.DataFrame(df["businessImpact"].tolist())
bi_df.columns = ["bi_" + col for col in bi_df.columns]

df_metrics = pd.concat(
    [df[["name", "overallScore", "confidence", "collectedAt"]], dx_df, tp_df, bi_df],
    axis=1,
)

numeric_cols = df_metrics.select_dtypes(include=[np.number]).columns.tolist()
print(
    f"✅ Розгорнуто {len(df_metrics.columns)} колонок, {len(numeric_cols)} числових метрик"
)

# MISSING VALUES
print("\n🔍 Перевірка missing values...")
missing_counts = df_metrics.isnull().sum()
total_cells = df_metrics.shape[0] * df_metrics.shape[1]
total_missing = missing_counts.sum()
completeness = (total_cells - total_missing) / total_cells * 100
print(f"✅ Completeness: {completeness:.2f}%")

# КАТЕГОРІЇ МЕТРИК
dx_cols = [col for col in numeric_cols if col.startswith("dx_")]
tp_cols = [col for col in numeric_cols if col.startswith("tp_")]
bi_cols = [col for col in numeric_cols if col.startswith("bi_")]

df_metrics["avg_dx"] = df_metrics[dx_cols].mean(axis=1)
df_metrics["avg_tp"] = df_metrics[tp_cols].mean(axis=1)
df_metrics["avg_bi"] = df_metrics[bi_cols].mean(axis=1)

# 1. OVERALL SCORE DISTRIBUTION
print("\n📊 Генерація візуалізації 1/7: Overall Score Distribution...")
fig, axes = plt.subplots(1, 2, figsize=(15, 5))

axes[0].hist(df_metrics["overallScore"], bins=15, edgecolor="black", alpha=0.7)
axes[0].axvline(
    df_metrics["overallScore"].mean(),
    color="red",
    linestyle="--",
    label=f"Середнє: {df_metrics['overallScore'].mean():.2f}",
)
axes[0].axvline(
    df_metrics["overallScore"].median(),
    color="green",
    linestyle="--",
    label=f"Медіана: {df_metrics['overallScore'].median():.2f}",
)
axes[0].set_xlabel("Overall Score")
axes[0].set_ylabel("Кількість проектів")
axes[0].set_title("Розподіл загальної оцінки проектів")
axes[0].legend()
axes[0].grid(True, alpha=0.3)

axes[1].boxplot(df_metrics["overallScore"], vert=True)
axes[1].set_ylabel("Overall Score")
axes[1].set_title("Box Plot загальної оцінки")
axes[1].grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig(
    FIGURES_DIR / "01_overall_score_distribution.png", dpi=300, bbox_inches="tight"
)
plt.close()
print("✅ Збережено: reports/analysis/01_overall_score_distribution.png")

# 2. CATEGORY SCORES BOXPLOT
print("\n📊 Генерація візуалізації 2/7: Category Scores Boxplot...")
fig, ax = plt.subplots(figsize=(12, 6))

categories_data = [df_metrics["avg_dx"], df_metrics["avg_tp"], df_metrics["avg_bi"]]

bp = ax.boxplot(
    categories_data,
    labels=["Developer\nExperience", "Technical\nPerformance", "Business\nImpact"],
)
ax.set_ylabel("Середнє значення метрик")
ax.set_title("Порівняння метрик по категоріях")
ax.grid(True, alpha=0.3, axis="y")

means = [np.mean(d) for d in categories_data]
for i, mean in enumerate(means, 1):
    ax.plot(i, mean, "r*", markersize=15, label="Середнє" if i == 1 else "")
    ax.text(
        i,
        mean + 2,
        f"{mean:.2f}",
        ha="center",
        va="bottom",
        fontsize=10,
        fontweight="bold",
    )

ax.legend()
plt.tight_layout()
plt.savefig(
    FIGURES_DIR / "02_category_scores_boxplot.png", dpi=300, bbox_inches="tight"
)
plt.close()
print("✅ Збережено: reports/analysis/02_category_scores_boxplot.png")

# 3. CORRELATION MATRIX
print("\n📊 Генерація візуалізації 3/7: Correlation Matrix...")
correlation_matrix = df_metrics[numeric_cols].corr()

fig, ax = plt.subplots(figsize=(16, 14))
sns.heatmap(
    correlation_matrix,
    annot=True,
    fmt=".2f",
    cmap="coolwarm",
    center=0,
    square=True,
    linewidths=0.5,
    cbar_kws={"shrink": 0.8},
    ax=ax,
    annot_kws={"size": 6},
)
ax.set_title("Кореляційна матриця всіх метрик", fontsize=16, pad=20)
plt.tight_layout()
plt.savefig(FIGURES_DIR / "03_correlation_matrix.png", dpi=300, bbox_inches="tight")
plt.close()
correlation_matrix.to_csv(FIGURES_DIR / "correlation_matrix.csv")
print("✅ Збережено: reports/analysis/03_correlation_matrix.png")

# OUTLIERS (IQR)
print("\n🔍 Виявлення outliers (IQR метод)...")
iqr_outliers = []
for col in numeric_cols:
    Q1 = df_metrics[col].quantile(0.25)
    Q3 = df_metrics[col].quantile(0.75)
    IQR = Q3 - Q1

    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR

    outliers = df_metrics[
        (df_metrics[col] < lower_bound) | (df_metrics[col] > upper_bound)
    ]

    if len(outliers) > 0:
        iqr_outliers.append({"Метрика": col, "Кількість outliers": len(outliers)})

if len(iqr_outliers) > 0:
    iqr_df = pd.DataFrame(iqr_outliers)
    iqr_df.to_csv(FIGURES_DIR / "outliers_iqr.csv", index=False)
    print(f"⚠️  Виявлено outliers у {len(iqr_df)} метриках")

    # 4. OUTLIERS VISUALIZATION
    print("\n📊 Генерація візуалізації 4/7: Outliers Detection...")
    top_outlier_metrics = (
        iqr_df.sort_values("Кількість outliers", ascending=False)["Метрика"]
        .head(6)
        .tolist()
    )

    fig, axes = plt.subplots(2, 3, figsize=(18, 10))
    axes = axes.flatten()

    for i, col in enumerate(top_outlier_metrics):
        axes[i].boxplot(df_metrics[col].dropna(), vert=True)
        axes[i].set_ylabel("Значення")
        axes[i].set_title(col.replace("_", " ").title())
        axes[i].grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "04_outliers_detection.png", dpi=300, bbox_inches="tight")
    plt.close()
    print("✅ Збережено: reports/analysis/04_outliers_detection.png")
else:
    print("✅ Outliers не виявлено")

# 5. METRICS DISTRIBUTIONS
print("\n📊 Генерація візуалізації 5/7: Metrics Distributions...")
key_metrics = [
    "overallScore",
    "dx_codeReviewDuration",
    "dx_prIterationRate",
    "tp_testCoverage",
    "tp_typeScriptErrorRate",
    "bi_activeContributors",
    "bi_communityGrowth",
    "bi_issueResolutionRate",
]

fig, axes = plt.subplots(4, 2, figsize=(16, 16))
axes = axes.flatten()

for i, metric in enumerate(key_metrics):
    if metric in df_metrics.columns:
        data = df_metrics[metric].dropna()

        axes[i].hist(data, bins=20, edgecolor="black", alpha=0.7)
        axes[i].axvline(
            data.mean(), color="red", linestyle="--", label=f"μ={data.mean():.2f}"
        )
        axes[i].axvline(
            data.median(),
            color="green",
            linestyle="--",
            label=f"median={data.median():.2f}",
        )
        axes[i].set_xlabel(metric.replace("_", " ").title())
        axes[i].set_ylabel("Частота")
        axes[i].set_title(f"Розподіл: {metric.replace('_', ' ')}")
        axes[i].legend()
        axes[i].grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig(FIGURES_DIR / "05_metrics_distributions.png", dpi=300, bbox_inches="tight")
plt.close()
print("✅ Збережено: reports/analysis/05_metrics_distributions.png")

# 6. TOP/BOTTOM PROJECTS
print("\n📊 Генерація візуалізації 6/7: Top/Bottom Projects...")
top_10 = df_metrics.nlargest(10, "overallScore")
bottom_10 = df_metrics.nsmallest(10, "overallScore")

fig, axes = plt.subplots(1, 2, figsize=(18, 8))

axes[0].barh(range(len(top_10)), top_10["overallScore"], color="green", alpha=0.7)
axes[0].set_yticks(range(len(top_10)))
axes[0].set_yticklabels([name.split("/")[-1] for name in top_10["name"]])
axes[0].set_xlabel("Overall Score")
axes[0].set_title("Топ-10 проектів за Overall Score")
axes[0].invert_yaxis()
axes[0].grid(True, alpha=0.3, axis="x")

axes[1].barh(range(len(bottom_10)), bottom_10["overallScore"], color="red", alpha=0.7)
axes[1].set_yticks(range(len(bottom_10)))
axes[1].set_yticklabels([name.split("/")[-1] for name in bottom_10["name"]])
axes[1].set_xlabel("Overall Score")
axes[1].set_title("Найнижчі 10 проектів за Overall Score")
axes[1].invert_yaxis()
axes[1].grid(True, alpha=0.3, axis="x")

plt.tight_layout()
plt.savefig(FIGURES_DIR / "06_top_bottom_projects.png", dpi=300, bbox_inches="tight")
plt.close()
print("✅ Збережено: reports/analysis/06_top_bottom_projects.png")

# 7. SCATTER MATRIX
print("\n📊 Генерація візуалізації 7/7: Scatter Matrix...")
scatter_metrics = [
    "overallScore",
    "avg_dx",
    "avg_tp",
    "avg_bi",
    "tp_testCoverage",
    "bi_communityGrowth",
]

fig = plt.figure(figsize=(16, 16))
scatter_matrix(
    df_metrics[scatter_metrics], alpha=0.7, figsize=(16, 16), diagonal="kde", grid=True
)
plt.suptitle("Scatter Matrix ключових метрик", y=0.995, fontsize=16)
plt.tight_layout()
plt.savefig(FIGURES_DIR / "07_scatter_matrix.png", dpi=300, bbox_inches="tight")
plt.close()
print("✅ Збережено: reports/analysis/07_scatter_matrix.png")

# ЗБЕРЕЖЕННЯ ДАНИХ
print("\n💾 Збереження результатів...")
df_metrics.to_csv("../reports/processed_metrics.csv", index=False)
df_metrics[numeric_cols].describe().to_csv(FIGURES_DIR / "descriptive_statistics.csv")

# ТОП КОРЕЛЯЦІЇ
corr_pairs = []
for i in range(len(correlation_matrix.columns)):
    for j in range(i + 1, len(correlation_matrix.columns)):
        corr_pairs.append(
            {
                "Метрика 1": correlation_matrix.columns[i],
                "Метрика 2": correlation_matrix.columns[j],
                "Кореляція": correlation_matrix.iloc[i, j],
            }
        )

corr_df = pd.DataFrame(corr_pairs)
corr_df = corr_df.sort_values("Кореляція", key=abs, ascending=False)
corr_df.to_csv(FIGURES_DIR / "top_correlations.csv", index=False)

print("✅ Оброблений датасет збережено: reports/processed_metrics.csv")
print("✅ Описова статистика збережена: reports/analysis/descriptive_statistics.csv")
print("✅ Топ кореляції збережені: reports/analysis/top_correlations.csv")

# ВИСНОВКИ
print("\n" + "=" * 80)
print("ВИСНОВКИ")
print("=" * 80)
print(f"\n✅ Completeness: {completeness:.2f}%")
print(f"✅ Кількість проектів: {len(df_metrics)}")
print(f"✅ Кількість метрик: {len(numeric_cols)}")
print(
    f"\n📊 Overall Score: μ={df_metrics['overallScore'].mean():.2f}, σ={df_metrics['overallScore'].std():.2f}"
)
print(f"📊 Developer Experience: μ={df_metrics['avg_dx'].mean():.2f}")
print(f"📊 Technical Performance: μ={df_metrics['avg_tp'].mean():.2f}")
print(f"📊 Business Impact: μ={df_metrics['avg_bi'].mean():.2f}")

if len(iqr_outliers) > 0:
    print(f"\n⚠️  Виявлено outliers у {len(iqr_outliers)} метриках")
else:
    print("\n✅ Outliers не виявлено")

top_corr = corr_df.iloc[0]
print(
    f"\n🔗 Найсильніша кореляція: {top_corr['Метрика 1']} ↔ {top_corr['Метрика 2']} (r={top_corr['Кореляція']:.3f})"
)

print("\n✅ Дані готові до Feature Engineering та ML моделювання")
print("\n" + "=" * 80)
print("АНАЛІЗ ЗАВЕРШЕНО")
print("=" * 80)

# Список згенерованих файлів
print("\n📁 ЗГЕНЕРОВАНІ ФАЙЛИ:")
print("reports/analysis/:")
for file in sorted(FIGURES_DIR.glob("*")):
    print(f"  • {file.name}")
print("reports/:")
print("  • processed_metrics.csv")
