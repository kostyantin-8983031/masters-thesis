#!/usr/bin/env python3
"""
Statistical Analysis & Feature Engineering
Фаза 2.2: Поглиблений статистичний аналіз та feature engineering

Магістерська робота: Outcome-based оцінка якості TypeScript коду
Автор: Слабенко Костянтин Олегович
Група: АС-202
Одеський політехнічний національний університет
"""

import warnings

from pathlib import Path
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from scipy.cluster.hierarchy import dendrogram, linkage
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import statsmodels.api as sm
from statsmodels.stats.outliers_influence import variance_inflation_factor
from statsmodels.stats.multitest import multipletests
import itertools
import json

warnings.filterwarnings("ignore")

# Налаштування візуалізації
plt.style.use("seaborn-v0_8-darkgrid")
sns.set_palette("husl")
plt.rcParams["figure.figsize"] = (12, 8)
plt.rcParams["font.size"] = 10
plt.rcParams["axes.titlesize"] = 14
plt.rcParams["axes.labelsize"] = 12

# Шляхи до файлів
BASE_DIR = Path(__file__).parent
REPORTS_DIR = BASE_DIR / "../reports"
ANALYSIS_DIR = REPORTS_DIR / "analysis"
STATISTICAL_DIR = REPORTS_DIR / "statistical"

# Створити директорії якщо не існують
STATISTICAL_DIR.mkdir(parents=True, exist_ok=True)

# Завантажити дані
print("=" * 80)
print("ФАЗА 2.2: STATISTICAL ANALYSIS & FEATURE ENGINEERING")
print("=" * 80)
print()

df = pd.read_csv(REPORTS_DIR / "processed_metrics.csv")
print(f"✓ Завантажено датасет: {df.shape[0]} проектів × {df.shape[1]} колонок")
print()

# Список числових метрик (без avg_* колонок та metadata)
numeric_cols = [
    col for col in df.columns if col.startswith(("dx_", "tp_", "bi_", "overallScore"))
]
print(f"✓ Числові метрики: {len(numeric_cols)}")
print()

# ============================================================================
# SECTION 1: HYPOTHESIS TESTING & STATISTICAL SIGNIFICANCE
# ============================================================================

print("=" * 80)
print("SECTION 1: HYPOTHESIS TESTING & STATISTICAL SIGNIFICANCE")
print("=" * 80)
print()


def perform_hypothesis_testing(df, metrics_list, alpha=0.05):
    """
    Виконує hypothesis testing для кореляцій між метриками.

    Returns:
        DataFrame з результатами: correlation, p-value, significant, CI_lower, CI_upper
    """
    results = []

    n = len(df)

    for metric1, metric2 in itertools.combinations(metrics_list, 2):
        # Pearson correlation
        r, p_value = stats.pearsonr(df[metric1], df[metric2])

        # Fisher's Z transformation для confidence interval
        z = np.arctanh(r)
        se = 1 / np.sqrt(n - 3)
        ci_lower_z = z - 1.96 * se
        ci_upper_z = z + 1.96 * se
        ci_lower = np.tanh(ci_lower_z)
        ci_upper = np.tanh(ci_upper_z)

        # Статистична значущість
        significant = p_value < alpha

        results.append(
            {
                "Метрика 1": metric1,
                "Метрика 2": metric2,
                "Кореляція": r,
                "p-value": p_value,
                "Значуща (α=0.05)": significant,
                "CI_lower (95%)": ci_lower,
                "CI_upper (95%)": ci_upper,
                "Сила зв'язку": get_correlation_strength(abs(r)),
            }
        )

    results_df = pd.DataFrame(results)
    results_df = results_df.sort_values("Кореляція", key=abs, ascending=False)

    return results_df


def get_correlation_strength(r):
    """Визначає силу кореляції за Cohen's guidelines"""
    r = abs(r)
    if r < 0.1:
        return "Дуже слабка"
    elif r < 0.3:
        return "Слабка"
    elif r < 0.5:
        return "Середня"
    elif r < 0.7:
        return "Сильна"
    else:
        return "Дуже сильна"


# Виконати hypothesis testing
hypothesis_results = perform_hypothesis_testing(df, numeric_cols)

# Benjamini-Hochberg FDR correction для multiple testing
reject, pvals_corrected, _, _ = multipletests(
    hypothesis_results["p-value"], alpha=0.05, method="fdr_bh"
)
hypothesis_results["FDR corrected p-value"] = pvals_corrected
hypothesis_results["Значуща (FDR)"] = reject

# Зберегти результати
hypothesis_results.to_csv(STATISTICAL_DIR / "hypothesis_tests.csv", index=False)
print(f"✓ Hypothesis testing завершено: {len(hypothesis_results)} пар метрик")

# Статистика значущих кореляцій
significant_uncorrected = hypothesis_results["Значуща (α=0.05)"].sum()
significant_fdr = hypothesis_results["Значуща (FDR)"].sum()
print(f"  - Значущих кореляцій (p < 0.05): {significant_uncorrected}")
print(f"  - Значущих кореляцій (FDR corrected): {significant_fdr}")
print(f"  - Збережено: {STATISTICAL_DIR / 'hypothesis_tests.csv'}")
print()

# Топ-10 найсильніших значущих кореляцій
print("Топ-10 найсильніших значущих кореляцій (FDR corrected):")
top_significant = hypothesis_results[hypothesis_results["Значуща (FDR)"]].head(10)
for idx, row in top_significant.iterrows():
    print(
        f"  {row['Метрика 1']:30} ↔ {row['Метрика 2']:30} r={row['Кореляція']:6.3f} (p={row['p-value']:.2e})"
    )
print()

# ============================================================================
# SECTION 2: REGRESSION ANALYSIS
# ============================================================================

print("=" * 80)
print("SECTION 2: REGRESSION ANALYSIS")
print("=" * 80)
print()


def perform_regression_analysis(df, target, predictors, analysis_name):
    """
    Виконує множинну регресію та зберігає результати.
    """
    # Підготовка даних
    X = df[predictors].copy()
    y = df[target].copy()

    # Додати константу для intercept
    X_with_const = sm.add_constant(X)

    # OLS regression
    model = sm.OLS(y, X_with_const)
    results = model.fit()

    # VIF для multicollinearity
    vif_data = pd.DataFrame()
    vif_data["Метрика"] = X.columns
    vif_data["VIF"] = [
        variance_inflation_factor(X.values, i) for i in range(X.shape[1])
    ]

    # Збережемо результати
    summary_dict = {
        "Аналіз": analysis_name,
        "Target": target,
        "N Predictors": len(predictors),
        "R²": results.rsquared,
        "Adjusted R²": results.rsquared_adj,
        "F-statistic": results.fvalue,
        "F p-value": results.f_pvalue,
        "AIC": results.aic,
        "BIC": results.bic,
    }

    # Coefficients
    coef_df = pd.DataFrame(
        {
            "Метрика": results.params.index.tolist(),
            "Coefficient": results.params.values,
            "Std Error": results.bse.values,
            "t-value": results.tvalues.values,
            "p-value": results.pvalues.values,
            "CI_lower": results.conf_int()[0].values,
            "CI_upper": results.conf_int()[1].values,
        }
    )

    return results, summary_dict, coef_df, vif_data


# Аналіз 1: Predict overallScore від category scores
print("Аналіз 1: Overall Score ~ Category Scores (DX, TP, BI)")
category_predictors = ["avg_dx", "avg_tp", "avg_bi"]
results_1, summary_1, coef_1, vif_1 = perform_regression_analysis(
    df, "overallScore", category_predictors, "Overall Score from Categories"
)
print(results_1.summary())
print(f"  R² = {summary_1['R²']:.4f}, Adjusted R² = {summary_1['Adjusted R²']:.4f}")
print(f"  VIF values:\n{vif_1}")
print()

# Аналіз 2: Predict Business Impact від Developer Experience
print("Аналіз 2: Business Impact (timeToMarket) ~ Developer Experience")
dx_predictors = [col for col in numeric_cols if col.startswith("dx_")]
results_2, summary_2, coef_2, vif_2 = perform_regression_analysis(
    df, "bi_timeToMarket", dx_predictors, "Business Impact from DX"
)
print(f"  R² = {summary_2['R²']:.4f}, Adjusted R² = {summary_2['Adjusted R²']:.4f}")
print("  Significant predictors (p < 0.05):")
sig_coefs = coef_2[coef_2["p-value"] < 0.05]
for _, row in sig_coefs.iterrows():
    if row["Метрика"] != "const":
        print(
            f"    {row['Метрика']:30} β={row['Coefficient']:7.3f} (p={row['p-value']:.3f})"
        )
print()

# Аналіз 3: Predict communityGrowth від Technical Performance
print("Аналіз 3: Community Growth ~ Technical Performance")
tp_predictors = [col for col in numeric_cols if col.startswith("tp_")]
results_3, summary_3, coef_3, vif_3 = perform_regression_analysis(
    df, "bi_communityGrowth", tp_predictors, "Community Growth from TP"
)
print(f"  R² = {summary_3['R²']:.4f}, Adjusted R² = {summary_3['Adjusted R²']:.4f}")
print()

# Зберегти regression results
regression_summary = pd.DataFrame([summary_1, summary_2, summary_3])
regression_summary.to_csv(STATISTICAL_DIR / "regression_summary.csv", index=False)

# Зберегти coefficients
pd.concat(
    [
        coef_1.assign(Аналіз="Overall Score"),
        coef_2.assign(Аналіз="Business Impact"),
        coef_3.assign(Аналіз="Community Growth"),
    ],
    ignore_index=True,
).to_csv(STATISTICAL_DIR / "regression_coefficients.csv", index=False)

print("✓ Regression analysis збережено:")
print(f"  - {STATISTICAL_DIR / 'regression_summary.csv'}")
print(f"  - {STATISTICAL_DIR / 'regression_coefficients.csv'}")
print()

# Візуалізація regression plots
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle("Regression Analysis: Key Relationships", fontsize=16, fontweight="bold")

# Plot 1: Overall Score vs avg_tp (strongest predictor)
ax = axes[0, 0]
ax.scatter(df["avg_tp"], df["overallScore"], alpha=0.6, s=100)
z = np.polyfit(df["avg_tp"], df["overallScore"], 1)
p = np.poly1d(z)
ax.plot(df["avg_tp"].sort_values(), p(df["avg_tp"].sort_values()), "r--", linewidth=2)
ax.set_xlabel("Average Technical Performance")
ax.set_ylabel("Overall Score")
ax.set_title(f"Overall Score ~ TP (R² = {summary_1['R²']:.3f})")
ax.grid(True, alpha=0.3)

# Plot 2: timeToMarket vs codeReviewDuration
ax = axes[0, 1]
ax.scatter(
    df["dx_codeReviewDuration"], df["bi_timeToMarket"], alpha=0.6, s=100, c="green"
)
z = np.polyfit(df["dx_codeReviewDuration"], df["bi_timeToMarket"], 1)
p = np.poly1d(z)
ax.plot(
    df["dx_codeReviewDuration"].sort_values(),
    p(df["dx_codeReviewDuration"].sort_values()),
    "r--",
    linewidth=2,
)
ax.set_xlabel("Code Review Duration (hours)")
ax.set_ylabel("Time to Market (days)")
r, _ = stats.pearsonr(df["dx_codeReviewDuration"], df["bi_timeToMarket"])
ax.set_title(f"Time to Market ~ Code Review Duration (r = {r:.3f})")
ax.grid(True, alpha=0.3)

# Plot 3: communityGrowth vs testCoverage
ax = axes[1, 0]
ax.scatter(
    df["tp_testCoverage"], df["bi_communityGrowth"], alpha=0.6, s=100, c="purple"
)
z = np.polyfit(df["tp_testCoverage"], df["bi_communityGrowth"], 1)
p = np.poly1d(z)
ax.plot(
    df["tp_testCoverage"].sort_values(),
    p(df["tp_testCoverage"].sort_values()),
    "r--",
    linewidth=2,
)
ax.set_xlabel("Test Coverage (%)")
ax.set_ylabel("Community Growth (stars/month)")
r, _ = stats.pearsonr(df["tp_testCoverage"], df["bi_communityGrowth"])
ax.set_title(f"Community Growth ~ Test Coverage (r = {r:.3f})")
ax.grid(True, alpha=0.3)

# Plot 4: Residuals plot для model 1
ax = axes[1, 1]
predictions = results_1.predict()
residuals = df["overallScore"] - predictions
ax.scatter(predictions, residuals, alpha=0.6, s=100)
ax.axhline(y=0, color="r", linestyle="--", linewidth=2)
ax.set_xlabel("Fitted Values")
ax.set_ylabel("Residuals")
ax.set_title("Residuals Plot (Overall Score Model)")
ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig(
    STATISTICAL_DIR / "08_regression_analysis.png", dpi=300, bbox_inches="tight"
)
plt.close()
print("✓ Візуалізація regression analysis збережена: 08_regression_analysis.png")
print()

# ============================================================================
# SECTION 3: CLUSTER ANALYSIS
# ============================================================================

print("=" * 80)
print("SECTION 3: CLUSTER ANALYSIS")
print("=" * 80)
print()

# Підготовка даних для кластеризації
X_cluster = df[numeric_cols].copy()
scaler_cluster = StandardScaler()
X_scaled = scaler_cluster.fit_transform(X_cluster)

# Визначення оптимальної кількості кластерів (Elbow method + Silhouette)
print("Визначення оптимальної кількості кластерів...")
inertias = []
silhouette_scores = []
K_range = range(2, 9)

for k in K_range:
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(X_scaled)
    inertias.append(kmeans.inertia_)
    silhouette_scores.append(silhouette_score(X_scaled, kmeans.labels_))

# Візуалізація Elbow та Silhouette
fig, axes = plt.subplots(1, 2, figsize=(14, 5))
fig.suptitle("Optimal Number of Clusters", fontsize=16, fontweight="bold")

ax = axes[0]
ax.plot(K_range, inertias, "bo-", linewidth=2, markersize=8)
ax.set_xlabel("Number of Clusters (k)")
ax.set_ylabel("Inertia (Within-cluster sum of squares)")
ax.set_title("Elbow Method")
ax.grid(True, alpha=0.3)
ax.set_xticks(K_range)

ax = axes[1]
ax.plot(K_range, silhouette_scores, "ro-", linewidth=2, markersize=8)
ax.set_xlabel("Number of Clusters (k)")
ax.set_ylabel("Silhouette Score")
ax.set_title("Silhouette Analysis")
ax.grid(True, alpha=0.3)
ax.set_xticks(K_range)

plt.tight_layout()
plt.savefig(STATISTICAL_DIR / "09_optimal_clusters.png", dpi=300, bbox_inches="tight")
plt.close()
print("✓ Elbow & Silhouette analysis збережено: 09_optimal_clusters.png")

# Обрати оптимальну кількість кластерів (найвищий silhouette score)
optimal_k = K_range[np.argmax(silhouette_scores)]
optimal_silhouette = max(silhouette_scores)
print(f"  Оптимальна кількість кластерів: k = {optimal_k}")
print(f"  Silhouette Score: {optimal_silhouette:.3f}")
print()

# K-means з оптимальним k
kmeans_final = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
df["Cluster"] = kmeans_final.fit_predict(X_scaled)

print("Розподіл проектів по кластерам:")
for cluster_id in range(optimal_k):
    count = (df["Cluster"] == cluster_id).sum()
    print(f"  Кластер {cluster_id}: {count} проектів")
print()

# Профілювання кластерів (середні значення метрик)
profile_metrics = [
    "overallScore",
    "dx_codeReviewDuration",
    "tp_testCoverage",
    "bi_communityGrowth",
]
cluster_profiles = df.groupby("Cluster")[profile_metrics].mean()
cluster_profiles["Count"] = df.groupby("Cluster").size()

print("Профілі кластерів:")
print(cluster_profiles.round(2))
print()

# Зберегти cluster assignments
cluster_cols = ["name", "Cluster", "overallScore"]
if "avg_dx" in df.columns:
    cluster_cols.extend(["avg_dx", "avg_tp", "avg_bi"])
cluster_assignments = df[cluster_cols].copy()
cluster_assignments.to_csv(STATISTICAL_DIR / "cluster_assignments.csv", index=False)
print("✓ Cluster assignments збережено: cluster_assignments.csv")
print()

# Hierarchical clustering для dendrogram
print("Виконання hierarchical clustering...")
linkage_matrix = linkage(X_scaled, method="ward")

fig, ax = plt.subplots(figsize=(14, 8))
dendrogram(
    linkage_matrix, labels=df["name"].values, leaf_rotation=90, leaf_font_size=8, ax=ax
)
ax.set_title("Hierarchical Clustering Dendrogram", fontsize=16, fontweight="bold")
ax.set_xlabel("Projects")
ax.set_ylabel("Distance (Ward)")
plt.tight_layout()
plt.savefig(
    STATISTICAL_DIR / "10_hierarchical_dendrogram.png", dpi=300, bbox_inches="tight"
)
plt.close()
print("✓ Hierarchical dendrogram збережено: 10_hierarchical_dendrogram.png")
print()

# ============================================================================
# SECTION 4: PCA ANALYSIS
# ============================================================================

print("=" * 80)
print("SECTION 4: PCA ANALYSIS")
print("=" * 80)
print()

# PCA для dimensionality reduction
pca = PCA()
X_pca = pca.fit_transform(X_scaled)

# Explained variance
explained_variance = pca.explained_variance_ratio_
cumulative_variance = np.cumsum(explained_variance)

print("PCA: Пояснена варіація по компонентах:")
for i, (var, cum_var) in enumerate(
    zip(explained_variance[:10], cumulative_variance[:10]), 1
):
    print(f"  PC{i}: {var * 100:.2f}% (кумулятивна: {cum_var * 100:.2f}%)")
print()

# Скільки компонент потрібно для 90% variance?
n_components_90 = np.argmax(cumulative_variance >= 0.90) + 1
print(f"Кількість компонент для 90% variance: {n_components_90}")
print()

# Візуалізація explained variance
fig, axes = plt.subplots(1, 2, figsize=(14, 5))
fig.suptitle("PCA: Explained Variance", fontsize=16, fontweight="bold")

ax = axes[0]
ax.bar(range(1, len(explained_variance) + 1), explained_variance * 100, alpha=0.7)
ax.set_xlabel("Principal Component")
ax.set_ylabel("Explained Variance (%)")
ax.set_title("Scree Plot")
ax.grid(True, alpha=0.3, axis="y")

ax = axes[1]
ax.plot(
    range(1, len(cumulative_variance) + 1),
    cumulative_variance * 100,
    "bo-",
    linewidth=2,
)
ax.axhline(y=90, color="r", linestyle="--", linewidth=2, label="90% variance")
ax.set_xlabel("Number of Components")
ax.set_ylabel("Cumulative Explained Variance (%)")
ax.set_title("Cumulative Explained Variance")
ax.legend()
ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig(
    STATISTICAL_DIR / "11_pca_explained_variance.png", dpi=300, bbox_inches="tight"
)
plt.close()
print("✓ PCA explained variance збережено: 11_pca_explained_variance.png")
print()

# PCA biplot (PC1 vs PC2) з кластерами
fig, ax = plt.subplots(figsize=(14, 10))
scatter = ax.scatter(
    X_pca[:, 0],
    X_pca[:, 1],
    c=df["Cluster"],
    cmap="viridis",
    s=200,
    alpha=0.7,
    edgecolors="black",
    linewidth=1.5,
)

# Додати labels для проектів
for i, name in enumerate(df["name"]):
    ax.annotate(
        name.split("/")[-1],
        (X_pca[i, 0], X_pca[i, 1]),
        fontsize=7,
        alpha=0.7,
        ha="center",
    )

ax.set_xlabel(f"PC1 ({explained_variance[0] * 100:.1f}% variance)")
ax.set_ylabel(f"PC2 ({explained_variance[1] * 100:.1f}% variance)")
ax.set_title("PCA Biplot: Projects Colored by Cluster", fontsize=16, fontweight="bold")
ax.grid(True, alpha=0.3)

# Colorbar для кластерів
cbar = plt.colorbar(scatter, ax=ax)
cbar.set_label("Cluster ID")

plt.tight_layout()
plt.savefig(
    STATISTICAL_DIR / "12_pca_biplot_clusters.png", dpi=300, bbox_inches="tight"
)
plt.close()
print("✓ PCA biplot збережено: 12_pca_biplot_clusters.png")
print()

# Feature loadings для PC1 та PC2
loadings = pd.DataFrame(
    pca.components_[:2].T, columns=["PC1", "PC2"], index=numeric_cols
)
loadings["PC1_abs"] = loadings["PC1"].abs()
loadings["PC2_abs"] = loadings["PC2"].abs()
loadings = loadings.sort_values("PC1_abs", ascending=False)

print("Топ-10 features з найбільшим впливом на PC1:")
print(loadings[["PC1", "PC2"]].head(10).round(3))
print()

loadings.to_csv(STATISTICAL_DIR / "pca_loadings.csv")
print("✓ PCA loadings збережено: pca_loadings.csv")
print()

# ============================================================================
# SECTION 5: FEATURE ENGINEERING
# ============================================================================

print("=" * 80)
print("SECTION 5: FEATURE ENGINEERING")
print("=" * 80)
print()

df_engineered = df.copy()

# 1. Interaction features
print("1. Створення interaction features...")
df_engineered["dx_tp_interaction"] = df_engineered["avg_dx"] * df_engineered["avg_tp"]
df_engineered["tp_bi_interaction"] = df_engineered["avg_tp"] * df_engineered["avg_bi"]
df_engineered["dx_bi_interaction"] = df_engineered["avg_dx"] * df_engineered["avg_bi"]

# Specific interactions
df_engineered["testCov_x_codeReview"] = (
    df_engineered["tp_testCoverage"] * df_engineered["dx_codeReviewDuration"]
)
df_engineered["bundleSize_x_buildTime"] = (
    df_engineered["tp_bundleSize"] * df_engineered["tp_buildTime"]
)
print("  ✓ Створено 5 interaction features")

# 2. Polynomial features (degree 2) для ключових метрик
print("2. Створення polynomial features...")
key_metrics_poly = [
    "avg_dx",
    "avg_tp",
    "avg_bi",
    "tp_testCoverage",
    "dx_codeReviewDuration",
]
for metric in key_metrics_poly:
    df_engineered[f"{metric}_squared"] = df_engineered[metric] ** 2
print(f"  ✓ Створено {len(key_metrics_poly)} polynomial (^2) features")

# 3. Log transformations для highly skewed metrics
print("3. Log transformations для skewed metrics...")
# NOTE: Excluded bi_communityGrowth - це target variable (data leakage!)
skewed_metrics = [
    "tp_bundleSize",
    "tp_bundleLoadTime",
    "dx_codeReviewDuration",
]
for metric in skewed_metrics:
    # log(x + 1) щоб уникнути log(0)
    df_engineered[f"{metric}_log"] = np.log1p(df_engineered[metric])
print(f"  ✓ Створено {len(skewed_metrics)} log-transformed features")

# 4. Ratios та composite metrics
print("4. Створення ratio та composite features...")
df_engineered["testCov_per_errorRate"] = df_engineered["tp_testCoverage"] / (
    df_engineered["tp_typeScriptErrorRate"] + 0.01
)
df_engineered["performance_efficiency"] = df_engineered["tp_performanceScore"] / (
    df_engineered["tp_buildTime"] + 1
)
df_engineered["dx_efficiency"] = df_engineered["avg_dx"] / (
    df_engineered["dx_debuggingTime"] + 1
)
# NOTE: Removed bi_effectiveness - містило обидва targets (data leakage!)
# було: df_engineered["bi_effectiveness"] = df_engineered["bi_communityGrowth"] / (df_engineered["bi_timeToMarket"] + 0.1)
print("  ✓ Створено 3 ratio features")

# 5. Binning для категоризації
print("5. Binning continuous metrics...")
df_engineered["overallScore_category"] = pd.cut(
    df_engineered["overallScore"],
    bins=[0, 60, 70, 80, 100],
    labels=["Low", "Medium", "High", "Very High"],
)
df_engineered["testCoverage_category"] = pd.cut(
    df_engineered["tp_testCoverage"],
    bins=[0, 70, 85, 95, 100],
    labels=["Low", "Medium", "High", "Excellent"],
)
print("  ✓ Створено 2 categorical features")

# 6. Standardization та Normalization
print("6. Feature scaling...")
# NOTE: Excluded target variables to prevent data leakage
TARGET_VARS = ["overallScore", "bi_timeToMarket", "bi_communityGrowth"]
numeric_features = [
    col
    for col in df_engineered.columns
    if df_engineered[col].dtype in ["float64", "int64"]
]
numeric_features = [
    col for col in numeric_features if col not in ["Cluster"] + TARGET_VARS
]

# StandardScaler (mean=0, std=1)
scaler_standard = StandardScaler()
df_standardized = pd.DataFrame(
    scaler_standard.fit_transform(df_engineered[numeric_features]),
    columns=[f"{col}_std" for col in numeric_features],
    index=df_engineered.index,
)

# MinMaxScaler (0-1)
scaler_minmax = MinMaxScaler()
df_normalized = pd.DataFrame(
    scaler_minmax.fit_transform(df_engineered[numeric_features]),
    columns=[f"{col}_norm" for col in numeric_features],
    index=df_engineered.index,
)

print(f"  ✓ StandardScaler: {len(numeric_features)} features")
print(f"  ✓ MinMaxScaler: {len(numeric_features)} features")

# Combine original + engineered + scaled
df_full_engineered = pd.concat([df_engineered, df_standardized, df_normalized], axis=1)

print()
print("✓ Feature engineering завершено!")
print(f"  Початкових features: {len(numeric_cols)}")
print(f"  Engineered features: {df_full_engineered.shape[1] - df.shape[1]}")
print(f"  Загальна кількість features: {df_full_engineered.shape[1]}")
print()

# Зберегти engineered dataset
df_full_engineered.to_csv(STATISTICAL_DIR / "engineered_features.csv", index=False)
print("✓ Engineered features збережено: engineered_features.csv")
print()

# Feature importance based on correlation with overallScore
feature_importance = []
for col in df_full_engineered.columns:
    if df_full_engineered[col].dtype in ["float64", "int64"] and col != "overallScore":
        try:
            corr, p_value = stats.pearsonr(
                df_full_engineered[col], df_full_engineered["overallScore"]
            )
            feature_importance.append(
                {
                    "Feature": col,
                    "Correlation": corr,
                    "Abs Correlation": abs(corr),
                    "p-value": p_value,
                }
            )
        except Exception:
            pass

feature_importance_df = pd.DataFrame(feature_importance)
feature_importance_df = feature_importance_df.sort_values(
    "Abs Correlation", ascending=False
)
feature_importance_df.to_csv(STATISTICAL_DIR / "feature_importance.csv", index=False)

print("Топ-15 найважливіших features (correlation з overallScore):")
print(
    feature_importance_df.head(15)[["Feature", "Correlation", "p-value"]].to_string(
        index=False
    )
)
print()
print("✓ Feature importance збережено: feature_importance.csv")
print()

# ============================================================================
# SECTION 6: ADVANCED STATISTICAL ANALYSIS
# ============================================================================

print("=" * 80)
print("SECTION 6: ADVANCED STATISTICAL ANALYSIS")
print("=" * 80)
print()

# 1. Mediation Analysis: DX -> TP -> BI
print("1. Mediation Analysis: DX → TP → BI")
print(
    "   Hypothesis: Developer Experience впливає на Business Impact через Technical Performance"
)
print()

# Path c: Total effect (DX -> BI)
X_dx = sm.add_constant(df["avg_dx"])
model_c = sm.OLS(df["avg_bi"], X_dx).fit()
beta_c = model_c.params["avg_dx"]
print(
    f"   Path c (total effect): DX → BI, β = {beta_c:.4f}, p = {model_c.pvalues['avg_dx']:.4f}"
)

# Path a: DX -> TP
model_a = sm.OLS(df["avg_tp"], X_dx).fit()
beta_a = model_a.params["avg_dx"]
print(f"   Path a: DX → TP, β = {beta_a:.4f}, p = {model_a.pvalues['avg_dx']:.4f}")

# Path b: TP -> BI (controlling for DX)
X_dx_tp = sm.add_constant(df[["avg_dx", "avg_tp"]])
model_b = sm.OLS(df["avg_bi"], X_dx_tp).fit()
beta_b = model_b.params["avg_tp"]
beta_c_prime = model_b.params["avg_dx"]
print(
    f"   Path b: TP → BI (controlling DX), β = {beta_b:.4f}, p = {model_b.pvalues['avg_tp']:.4f}"
)
print(
    f"   Path c': DX → BI (controlling TP), β = {beta_c_prime:.4f}, p = {model_b.pvalues['avg_dx']:.4f}"
)

# Indirect effect
indirect_effect = beta_a * beta_b
direct_effect = beta_c_prime
total_effect = beta_c
proportion_mediated = indirect_effect / total_effect if total_effect != 0 else 0

print("\n   Результати медіації:")
print(f"     - Indirect effect (a × b): {indirect_effect:.4f}")
print(f"     - Direct effect (c'): {direct_effect:.4f}")
print(f"     - Total effect (c): {total_effect:.4f}")
print(f"     - Proportion mediated: {proportion_mediated:.2%}")
print()

# 2. Partial correlations (controlling for confounders)
print("2. Partial Correlations (controlling for confounders)")
print()


def partial_correlation(df, x, y, control_vars):
    """
    Обчислює partial correlation між x та y, контролюючи control_vars.
    """
    # Residualize x
    X_control = sm.add_constant(df[control_vars])
    model_x = sm.OLS(df[x], X_control).fit()
    resid_x = model_x.resid

    # Residualize y
    model_y = sm.OLS(df[y], X_control).fit()
    resid_y = model_y.resid

    # Correlation of residuals
    r, p = stats.pearsonr(resid_x, resid_y)
    return r, p


# Приклад: correlation між testCoverage та communityGrowth, контролюючи codeReviewDuration
r_partial, p_partial = partial_correlation(
    df, "tp_testCoverage", "bi_communityGrowth", ["dx_codeReviewDuration"]
)
r_zero_order, _ = stats.pearsonr(df["tp_testCoverage"], df["bi_communityGrowth"])

print("   testCoverage ↔ communityGrowth:")
print(f"     - Zero-order correlation: r = {r_zero_order:.3f}")
print(
    f"     - Partial (controlling codeReviewDuration): r = {r_partial:.3f}, p = {p_partial:.4f}"
)
print()

# 3. Variance decomposition
print(
    "3. Variance Decomposition: скільки variance в overallScore пояснюють різні категорії?"
)
print()

# Model з усіма категоріями
X_all = sm.add_constant(df[["avg_dx", "avg_tp", "avg_bi"]])
model_full = sm.OLS(df["overallScore"], X_all).fit()

# Sequential R² для кожної категорії
models_seq = [
    ("DX only", ["avg_dx"]),
    ("DX + TP", ["avg_dx", "avg_tp"]),
    ("DX + TP + BI", ["avg_dx", "avg_tp", "avg_bi"]),
]

r2_values = []
for name, vars_list in models_seq:
    X = sm.add_constant(df[vars_list])
    model = sm.OLS(df["overallScore"], X).fit()
    r2_values.append({"Model": name, "R²": model.rsquared})
    print(f"   {name:20} R² = {model.rsquared:.4f}")

# Incremental R²
print("\n   Incremental R² contributions:")
print(f"     - DX alone: {r2_values[0]['R²']:.4f}")
print(f"     - TP added: {r2_values[1]['R²'] - r2_values[0]['R²']:.4f}")
print(f"     - BI added: {r2_values[2]['R²'] - r2_values[1]['R²']:.4f}")
print()

# Зберегти mediation та advanced results
advanced_results = {
    "Mediation Analysis (DX → TP → BI)": {
        "Total Effect (c)": total_effect,
        "Direct Effect (c')": direct_effect,
        "Indirect Effect (a×b)": indirect_effect,
        "Proportion Mediated": proportion_mediated,
        "Path a (DX→TP)": beta_a,
        "Path b (TP→BI)": beta_b,
    },
    "Partial Correlation Example": {
        "Variables": "testCoverage ↔ communityGrowth | codeReviewDuration",
        "Zero-order r": r_zero_order,
        "Partial r": r_partial,
        "p-value": p_partial,
    },
    "Variance Decomposition": {
        "R² (DX only)": r2_values[0]["R²"],
        "R² (DX + TP)": r2_values[1]["R²"],
        "R² (DX + TP + BI)": r2_values[2]["R²"],
        "Incremental R² (TP)": r2_values[1]["R²"] - r2_values[0]["R²"],
        "Incremental R² (BI)": r2_values[2]["R²"] - r2_values[1]["R²"],
    },
}

with open(
    STATISTICAL_DIR / "advanced_analysis_results.json", "w", encoding="utf-8"
) as f:
    json.dump(advanced_results, f, indent=2, ensure_ascii=False)

print("✓ Advanced analysis results збережено: advanced_analysis_results.json")
print()

# ============================================================================
# SUMMARY
# ============================================================================

print("=" * 80)
print("ПІДСУМОК ФАЗИ 2.2: STATISTICAL ANALYSIS & FEATURE ENGINEERING")
print("=" * 80)
print()

print("✓ ЗАВЕРШЕНО:")
print()
print("1. Hypothesis Testing:")
print(f"   - Перевірено {len(hypothesis_results)} пар метрик")
print(f"   - Знайдено {significant_fdr} значущих кореляцій (FDR corrected)")
print("   - Збережено: hypothesis_tests.csv")
print()

print("2. Regression Analysis:")
print("   - 3 regression models побудовано")
print(f"   - Best R²: {max(summary_1['R²'], summary_2['R²'], summary_3['R²']):.3f}")
print("   - Збережено: regression_summary.csv, regression_coefficients.csv")
print()

print("3. Cluster Analysis:")
print(f"   - Optimal clusters: k = {optimal_k}")
print(f"   - Silhouette score: {optimal_silhouette:.3f}")
print("   - Збережено: cluster_assignments.csv")
print()

print("4. PCA Analysis:")
print(f"   - {n_components_90} компонент для 90% variance")
print(f"   - PC1 пояснює {explained_variance[0] * 100:.1f}% variance")
print("   - Збережено: pca_loadings.csv")
print()

print("5. Feature Engineering:")
print(f"   - Початкових features: {len(numeric_cols)}")
print(f"   - Engineered features: {df_full_engineered.shape[1] - df.shape[1]}")
print("   - Збережено: engineered_features.csv, feature_importance.csv")
print()

print("6. Advanced Analysis:")
print(f"   - Mediation: DX → TP → BI (proportion mediated: {proportion_mediated:.2%})")
print("   - Partial correlations виконано")
print("   - Variance decomposition виконано")
print("   - Збережено: advanced_analysis_results.json")
print()

print("📊 ЗГЕНЕРОВАНІ ФАЙЛИ:")
print()
files_generated = [
    "hypothesis_tests.csv",
    "regression_summary.csv",
    "regression_coefficients.csv",
    "cluster_assignments.csv",
    "pca_loadings.csv",
    "engineered_features.csv",
    "feature_importance.csv",
    "advanced_analysis_results.json",
    "08_regression_analysis.png",
    "09_optimal_clusters.png",
    "10_hierarchical_dendrogram.png",
    "11_pca_explained_variance.png",
    "12_pca_biplot_clusters.png",
]

for i, file in enumerate(files_generated, 1):
    print(f"   {i:2}. {file}")

print()
print(f"📁 Всі файли збережено у: {STATISTICAL_DIR}")
print()
print("=" * 80)
print("✅ ФАЗА 2.2 ЗАВЕРШЕНА УСПІШНО!")
print("=" * 80)
