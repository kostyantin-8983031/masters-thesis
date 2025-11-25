#!/usr/bin/env python3
"""
ML Modeling & Predictive Analysis
Фаза 3: Machine Learning моделювання для prediction outcome-based метрик

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

# Machine Learning
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    r2_score,
    mean_squared_error,
    mean_absolute_error,
)
import xgboost as xgb
import lightgbm as lgb
import shap

warnings.filterwarnings("ignore")

# Налаштування візуалізації
plt.style.use("seaborn-v0_8-darkgrid")
sns.set_palette("husl")
plt.rcParams["figure.dpi"] = 300
plt.rcParams["savefig.dpi"] = 300
plt.rcParams["figure.figsize"] = (12, 8)

# Директорії
REPORTS_DIR = Path("../reports")
ML_DIR = REPORTS_DIR / "ml"
ML_DIR.mkdir(exist_ok=True)

print("=" * 80)
print("ML MODELING & PREDICTIVE ANALYSIS")
print("Фаза 3: Machine Learning для prediction outcome-based метрик")
print("=" * 80)
print()


# ============================================================================
# 1. DATA LOADING & PREPROCESSING
# ============================================================================
print("=" * 80)
print("1. DATA LOADING & PREPROCESSING")
print("=" * 80)

# Завантаження engineered features
df = pd.read_csv(REPORTS_DIR / "statistical" / "engineered_features.csv")
print(
    f"✓ Завантажено engineered features: {df.shape[0]} проектів × {df.shape[1]} features"
)

# Видалити колонку name (не feature)
if "name" in df.columns:
    project_names = df["name"].copy()
    df = df.drop("name", axis=1)
else:
    project_names = None

# Видалити non-numeric колонки (наприклад collectedAt)
non_numeric_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()
if non_numeric_cols:
    print(f"✓ Видалено {len(non_numeric_cols)} non-numeric колонок: {non_numeric_cols}")
    df = df.select_dtypes(include=[np.number])

print(f"✓ Features після видалення name та non-numeric: {df.shape[1]}")


# ============================================================================
# 2. FEATURE SELECTION
# ============================================================================
print()
print("=" * 80)
print("2. FEATURE SELECTION")
print("=" * 80)

# Target variables
TARGET_VARS = ["overallScore", "bi_timeToMarket", "bi_communityGrowth"]

# Видалити target variables з features
feature_cols = [col for col in df.columns if col not in TARGET_VARS]
print(f"✓ Початкова кількість features: {len(feature_cols)}")

# Safeguard: виявити leaked features (transformations of targets)
print("\n🔍 Перевірка на leaked features...")
TARGET_PATTERNS = ["timeToMarket", "communityGrowth", "overallScore"]
leaked_features = []

for col in feature_cols:
    for pattern in TARGET_PATTERNS:
        if pattern in col and col not in TARGET_VARS:
            leaked_features.append(col)
            break

if leaked_features:
    print(f"⚠️  WARNING: Виявлено {len(leaked_features)} potential leaked features:")
    for feat in leaked_features:
        print(f"   - {feat}")

    # Видалити leaked features
    feature_cols = [col for col in feature_cols if col not in leaked_features]
    print(f"✓ Видалено leaked features, залишилось: {len(feature_cols)} features")
else:
    print("✓ Leaked features НЕ виявлено")
print()

# Видалити highly correlated features (correlation > 0.95)
corr_matrix = df[feature_cols].corr().abs()
upper_triangle = corr_matrix.where(
    np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
)
to_drop = [
    column for column in upper_triangle.columns if any(upper_triangle[column] > 0.95)
]

print(f"✓ Видалено {len(to_drop)} highly correlated features (r > 0.95)")
feature_cols = [col for col in feature_cols if col not in to_drop]

# Видалити scaled duplicates - залишити тільки original версії
# (видалити _std та _norm суфікси)
original_features = []
scaled_features = {"std": [], "norm": []}

for col in feature_cols:
    if col.endswith("_std"):
        scaled_features["std"].append(col)
    elif col.endswith("_norm"):
        scaled_features["norm"].append(col)
    else:
        original_features.append(col)

# Перевірити чи є original версія для кожної scaled
features_to_keep = original_features.copy()
for std_col in scaled_features["std"]:
    base_name = std_col[:-4]  # видалити _std
    if base_name not in original_features:
        features_to_keep.append(std_col)  # залишити якщо немає original

for norm_col in scaled_features["norm"]:
    base_name = norm_col[:-5]  # видалити _norm
    if (
        base_name not in original_features
        and base_name + "_std" not in features_to_keep
    ):
        features_to_keep.append(norm_col)  # залишити якщо немає ні original ні std

feature_cols = features_to_keep
print(f"✓ Після видалення scaled duplicates: {len(feature_cols)} features")

# Створити final dataset
X = df[feature_cols].copy()
y_overall = df["overallScore"].copy()
y_time_to_market = df["bi_timeToMarket"].copy()
y_community = df["bi_communityGrowth"].copy()

# Збереження selected features
selected_features_df = pd.DataFrame({"Feature": feature_cols})
selected_features_df.to_csv(ML_DIR / "selected_features.csv", index=False)
print(f"✓ Збережено selected features: {len(feature_cols)} features")
print()


# ============================================================================
# 3. TRAIN/TEST SPLIT
# ============================================================================
print("=" * 80)
print("3. TRAIN/TEST SPLIT")
print("=" * 80)

# Використаємо 70/15/15 split
test_size = 0.15
val_size = 0.15 / (1 - test_size)  # 15% від решти після test split

random_state = 42

# Створення splits для кожного target
splits = {}

for target_name, y in [
    ("overallScore", y_overall),
    ("timeToMarket", y_time_to_market),
    ("communityGrowth", y_community),
]:
    # Test split
    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )

    # Validation split
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=val_size, random_state=random_state
    )

    splits[target_name] = {
        "X_train": X_train,
        "X_val": X_val,
        "X_test": X_test,
        "y_train": y_train,
        "y_val": y_val,
        "y_test": y_test,
    }

    print(
        f"✓ {target_name}: Train={len(X_train)}, Val={len(X_val)}, Test={len(X_test)}"
    )

# Збереження split info
split_info = pd.DataFrame(
    {
        "Target": ["overallScore", "timeToMarket", "communityGrowth"],
        "Train Size": [
            len(splits["overallScore"]["X_train"]),
            len(splits["timeToMarket"]["X_train"]),
            len(splits["communityGrowth"]["X_train"]),
        ],
        "Val Size": [
            len(splits["overallScore"]["X_val"]),
            len(splits["timeToMarket"]["X_val"]),
            len(splits["communityGrowth"]["X_val"]),
        ],
        "Test Size": [
            len(splits["overallScore"]["X_test"]),
            len(splits["timeToMarket"]["X_test"]),
            len(splits["communityGrowth"]["X_test"]),
        ],
    }
)
split_info.to_csv(ML_DIR / "train_test_split.csv", index=False)
print("✓ Збережено split info")
print()


# ============================================================================
# 4. MODEL TRAINING & EVALUATION
# ============================================================================
print("=" * 80)
print("4. MODEL TRAINING & EVALUATION")
print("=" * 80)

# Моделі для тестування
models = {
    "Linear Regression": LinearRegression(),
    "Ridge": Ridge(alpha=1.0, random_state=random_state),
    "Lasso": Lasso(alpha=0.1, random_state=random_state),
    "ElasticNet": ElasticNet(alpha=0.1, l1_ratio=0.5, random_state=random_state),
    "Random Forest": RandomForestRegressor(
        n_estimators=100, max_depth=10, random_state=random_state, n_jobs=-1
    ),
    "XGBoost": xgb.XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=random_state,
        n_jobs=-1,
    ),
    "LightGBM": lgb.LGBMRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=random_state,
        n_jobs=-1,
        verbose=-1,
    ),
}

# Результати для всіх моделей
all_results = []

# Для кожного target
for target_name in ["overallScore", "timeToMarket", "communityGrowth"]:
    print(f"\n{'=' * 60}")
    print(f"TARGET: {target_name}")
    print(f"{'=' * 60}")

    split = splits[target_name]

    # Scaling features для neural network based models
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(split["X_train"])
    X_val_scaled = scaler.transform(split["X_val"])
    X_test_scaled = scaler.transform(split["X_test"])

    # Тренування кожної моделі
    for model_name, model in models.items():
        print(f"\n  Training {model_name}...")

        # Використовуємо scaled features для моделей що потребують scaling
        if model_name in ["Ridge", "Lasso", "ElasticNet"]:
            X_tr = X_train_scaled
            X_v = X_val_scaled
            X_te = X_test_scaled
        else:
            X_tr = split["X_train"]
            X_v = split["X_val"]
            X_te = split["X_test"]

        # Тренування
        model.fit(X_tr, split["y_train"])

        # Predictions
        y_train_pred = model.predict(X_tr)
        y_val_pred = model.predict(X_v)
        y_test_pred = model.predict(X_te)

        # Metrics
        train_r2 = r2_score(split["y_train"], y_train_pred)
        val_r2 = r2_score(split["y_val"], y_val_pred)
        test_r2 = r2_score(split["y_test"], y_test_pred)

        train_rmse = np.sqrt(mean_squared_error(split["y_train"], y_train_pred))
        val_rmse = np.sqrt(mean_squared_error(split["y_val"], y_val_pred))
        test_rmse = np.sqrt(mean_squared_error(split["y_test"], y_test_pred))

        train_mae = mean_absolute_error(split["y_train"], y_train_pred)
        val_mae = mean_absolute_error(split["y_val"], y_val_pred)
        test_mae = mean_absolute_error(split["y_test"], y_test_pred)

        print(
            f"    Train R²: {train_r2:.4f}, Val R²: {val_r2:.4f}, Test R²: {test_r2:.4f}"
        )
        print(f"    Test RMSE: {test_rmse:.4f}, Test MAE: {test_mae:.4f}")

        # Збереження результатів
        all_results.append(
            {
                "Target": target_name,
                "Model": model_name,
                "Train R²": train_r2,
                "Val R²": val_r2,
                "Test R²": test_r2,
                "Train RMSE": train_rmse,
                "Val RMSE": val_rmse,
                "Test RMSE": test_rmse,
                "Train MAE": train_mae,
                "Val MAE": val_mae,
                "Test MAE": test_mae,
            }
        )

# Збереження results
results_df = pd.DataFrame(all_results)
results_df.to_csv(ML_DIR / "model_performance.csv", index=False)
print("\n✓ Збережено model performance results")
print()


# ============================================================================
# 5. CROSS-VALIDATION
# ============================================================================
print("=" * 80)
print("5. CROSS-VALIDATION (5-Fold)")
print("=" * 80)

cv_results = []

for target_name in ["overallScore", "timeToMarket", "communityGrowth"]:
    print(f"\nTarget: {target_name}")

    split = splits[target_name]
    X_full = pd.concat([split["X_train"], split["X_val"]])
    y_full = pd.concat([split["y_train"], split["y_val"]])

    kfold = KFold(n_splits=5, shuffle=True, random_state=random_state)

    for model_name, model in models.items():
        # Cross-validation
        cv_scores = cross_val_score(
            model, X_full, y_full, cv=kfold, scoring="r2", n_jobs=-1
        )

        print(f"  {model_name}: μ={cv_scores.mean():.4f}, σ={cv_scores.std():.4f}")

        cv_results.append(
            {
                "Target": target_name,
                "Model": model_name,
                "CV Mean R²": cv_scores.mean(),
                "CV Std R²": cv_scores.std(),
                "Fold 1": cv_scores[0],
                "Fold 2": cv_scores[1],
                "Fold 3": cv_scores[2],
                "Fold 4": cv_scores[3],
                "Fold 5": cv_scores[4],
            }
        )

cv_df = pd.DataFrame(cv_results)
cv_df.to_csv(ML_DIR / "cv_scores.csv", index=False)
print("\n✓ Збережено cross-validation results")
print()


# ============================================================================
# 6. FEATURE IMPORTANCE ANALYSIS
# ============================================================================
print("=" * 80)
print("6. FEATURE IMPORTANCE ANALYSIS")
print("=" * 80)

# Для кожного target - Random Forest та XGBoost importance
for target_name in ["overallScore", "timeToMarket", "communityGrowth"]:
    print(f"\nTarget: {target_name}")

    split = splits[target_name]

    # Random Forest
    rf_model = RandomForestRegressor(
        n_estimators=100, max_depth=10, random_state=random_state, n_jobs=-1
    )
    rf_model.fit(split["X_train"], split["y_train"])

    rf_importance = pd.DataFrame(
        {
            "Feature": feature_cols,
            "Importance": rf_model.feature_importances_,
        }
    )
    rf_importance = rf_importance.sort_values("Importance", ascending=False)
    rf_importance.to_csv(
        ML_DIR / f"feature_importance_rf_{target_name}.csv", index=False
    )

    print("  ✓ Random Forest top-5 features:")
    for idx, row in rf_importance.head(5).iterrows():
        print(f"    {row['Feature']}: {row['Importance']:.4f}")

    # XGBoost
    xgb_model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=random_state,
        n_jobs=-1,
    )
    xgb_model.fit(split["X_train"], split["y_train"])

    xgb_importance = pd.DataFrame(
        {
            "Feature": feature_cols,
            "Importance": xgb_model.feature_importances_,
        }
    )
    xgb_importance = xgb_importance.sort_values("Importance", ascending=False)
    xgb_importance.to_csv(
        ML_DIR / f"feature_importance_xgb_{target_name}.csv", index=False
    )

    print("  ✓ XGBoost top-5 features:")
    for idx, row in xgb_importance.head(5).iterrows():
        print(f"    {row['Feature']}: {row['Importance']:.4f}")

print("\n✓ Збережено feature importance results")
print()


# ============================================================================
# 7. SHAP ANALYSIS (для найкращої моделі - XGBoost)
# ============================================================================
print("=" * 80)
print("7. SHAP ANALYSIS (Model Explainability)")
print("=" * 80)

shap_results = {}

for target_name in ["overallScore", "timeToMarket", "communityGrowth"]:
    print(f"\nTarget: {target_name}")

    split = splits[target_name]

    # Тренуємо XGBoost модель
    xgb_model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=random_state,
        n_jobs=-1,
    )
    xgb_model.fit(split["X_train"], split["y_train"])

    # SHAP explainer
    print("  Computing SHAP values...")
    explainer = shap.TreeExplainer(xgb_model)
    shap_values = explainer.shap_values(split["X_test"])

    # Середні |SHAP values| для кожної feature
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    shap_importance = pd.DataFrame(
        {"Feature": feature_cols, "Mean |SHAP|": mean_abs_shap}
    )
    shap_importance = shap_importance.sort_values("Mean |SHAP|", ascending=False)
    shap_importance.to_csv(ML_DIR / f"shap_importance_{target_name}.csv", index=False)

    print("  ✓ Top-5 important features (by SHAP):")
    for idx, row in shap_importance.head(5).iterrows():
        print(f"    {row['Feature']}: {row['Mean |SHAP|']:.4f}")

    shap_results[target_name] = {
        "explainer": explainer,
        "shap_values": shap_values,
        "X_test": split["X_test"],
    }

print("\n✓ Збережено SHAP analysis results")
print()


# ============================================================================
# 8. PREDICTIONS COMPARISON
# ============================================================================
print("=" * 80)
print("8. PREDICTIONS COMPARISON (Best Model - XGBoost)")
print("=" * 80)

predictions_data = []

for target_name in ["overallScore", "timeToMarket", "communityGrowth"]:
    split = splits[target_name]

    # XGBoost predictions
    xgb_model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=random_state,
        n_jobs=-1,
    )
    xgb_model.fit(split["X_train"], split["y_train"])
    predictions = xgb_model.predict(split["X_test"])

    # Збереження для кожного test project
    for i, (actual, pred) in enumerate(zip(split["y_test"], predictions)):
        predictions_data.append(
            {
                "Target": target_name,
                "Project Index": split["X_test"].index[i],
                "Actual": actual,
                "Predicted": pred,
                "Error": pred - actual,
                "Abs Error": abs(pred - actual),
                "Squared Error": (pred - actual) ** 2,
            }
        )

predictions_df = pd.DataFrame(predictions_data)
predictions_df.to_csv(ML_DIR / "predictions_comparison.csv", index=False)
print("✓ Збережено predictions comparison")
print()


# ============================================================================
# 9. VISUALIZATIONS
# ============================================================================
print("=" * 80)
print("9. GENERATING VISUALIZATIONS")
print("=" * 80)

# 9.1. Feature Selection Correlation Heatmap
print("\n9.1. Feature selection correlation heatmap...")
fig, ax = plt.subplots(figsize=(14, 12))

# Візуалізуємо топ-30 features за correlation з overallScore
feature_importance_overall = pd.read_csv(
    ML_DIR / "feature_importance_xgb_overallScore.csv"
)
top_features = feature_importance_overall.head(30)["Feature"].tolist()

if len(top_features) > 0:
    corr_top = df[top_features].corr()
    sns.heatmap(
        corr_top,
        annot=False,
        cmap="coolwarm",
        center=0,
        square=True,
        linewidths=0.5,
        cbar_kws={"shrink": 0.8},
        ax=ax,
    )
    ax.set_title(
        "Correlation Matrix: Top-30 Most Important Features", fontsize=14, pad=15
    )
    plt.tight_layout()
    plt.savefig(ML_DIR / "13_feature_selection.png", dpi=300, bbox_inches="tight")
    plt.close()
    print("  ✓ Saved: 13_feature_selection.png")


# 9.2. Model Comparison Bar Chart
print("\n9.2. Model comparison bar chart...")
fig, axes = plt.subplots(1, 3, figsize=(18, 6))

for idx, target_name in enumerate(["overallScore", "timeToMarket", "communityGrowth"]):
    target_results = results_df[results_df["Target"] == target_name]

    axes[idx].barh(
        target_results["Model"], target_results["Test R²"], color="steelblue"
    )
    axes[idx].set_xlabel("Test R²")
    axes[idx].set_title(f"Model Performance: {target_name}")
    axes[idx].grid(True, alpha=0.3, axis="x")
    axes[idx].axvline(x=0.75, color="red", linestyle="--", label="Target (0.75)")
    axes[idx].legend()

plt.tight_layout()
plt.savefig(ML_DIR / "14_model_comparison.png", dpi=300, bbox_inches="tight")
plt.close()
print("  ✓ Saved: 14_model_comparison.png")


# 9.3. Learning Curves (Train vs Val R²)
print("\n9.3. Learning curves...")
fig, axes = plt.subplots(3, 3, figsize=(18, 15))
axes = axes.flatten()

plot_idx = 0
for target_name in ["overallScore", "timeToMarket", "communityGrowth"]:
    target_results = results_df[results_df["Target"] == target_name]

    for idx, model_name in enumerate(["Random Forest", "XGBoost", "LightGBM"]):
        model_data = target_results[target_results["Model"] == model_name]

        if len(model_data) > 0:
            train_r2 = model_data["Train R²"].values[0]
            val_r2 = model_data["Val R²"].values[0]
            test_r2 = model_data["Test R²"].values[0]

            axes[plot_idx].bar(
                ["Train", "Val", "Test"],
                [train_r2, val_r2, test_r2],
                color=["blue", "orange", "green"],
                alpha=0.7,
            )
            axes[plot_idx].set_ylabel("R²")
            axes[plot_idx].set_title(f"{model_name} - {target_name}")
            axes[plot_idx].set_ylim([0, 1])
            axes[plot_idx].grid(True, alpha=0.3, axis="y")

        plot_idx += 1

plt.tight_layout()
plt.savefig(ML_DIR / "15_learning_curves.png", dpi=300, bbox_inches="tight")
plt.close()
print("  ✓ Saved: 15_learning_curves.png")


# 9.4. Residual Plots (Best Model - XGBoost)
print("\n9.4. Residual plots...")
fig, axes = plt.subplots(1, 3, figsize=(18, 5))

for idx, target_name in enumerate(["overallScore", "timeToMarket", "communityGrowth"]):
    pred_data = predictions_df[predictions_df["Target"] == target_name]

    axes[idx].scatter(pred_data["Predicted"], pred_data["Error"], alpha=0.6)
    axes[idx].axhline(y=0, color="red", linestyle="--")
    axes[idx].set_xlabel("Predicted Value")
    axes[idx].set_ylabel("Residual (Error)")
    axes[idx].set_title(f"Residual Plot: {target_name}")
    axes[idx].grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig(ML_DIR / "16_residual_plots.png", dpi=300, bbox_inches="tight")
plt.close()
print("  ✓ Saved: 16_residual_plots.png")


# 9.5. Feature Importance Comparison
print("\n9.5. Feature importance comparison...")
fig, axes = plt.subplots(3, 1, figsize=(12, 15))

for idx, target_name in enumerate(["overallScore", "timeToMarket", "communityGrowth"]):
    rf_imp = pd.read_csv(ML_DIR / f"feature_importance_rf_{target_name}.csv")
    xgb_imp = pd.read_csv(ML_DIR / f"feature_importance_xgb_{target_name}.csv")

    # Топ-10 features
    top_features = xgb_imp.head(10)["Feature"].tolist()

    rf_values = [
        rf_imp[rf_imp["Feature"] == f]["Importance"].values[0]
        if f in rf_imp["Feature"].values
        else 0
        for f in top_features
    ]
    xgb_values = [
        xgb_imp[xgb_imp["Feature"] == f]["Importance"].values[0]
        if f in xgb_imp["Feature"].values
        else 0
        for f in top_features
    ]

    x = np.arange(len(top_features))
    width = 0.35

    axes[idx].barh(x - width / 2, rf_values, width, label="Random Forest", alpha=0.8)
    axes[idx].barh(x + width / 2, xgb_values, width, label="XGBoost", alpha=0.8)
    axes[idx].set_yticks(x)
    axes[idx].set_yticklabels(top_features, fontsize=9)
    axes[idx].set_xlabel("Importance")
    axes[idx].set_title(f"Feature Importance: {target_name}")
    axes[idx].legend()
    axes[idx].grid(True, alpha=0.3, axis="x")

plt.tight_layout()
plt.savefig(
    ML_DIR / "17_feature_importance_comparison.png", dpi=300, bbox_inches="tight"
)
plt.close()
print("  ✓ Saved: 17_feature_importance_comparison.png")


# 9.6. Predictions vs Actual Scatter Plots
print("\n9.6. Predictions vs actual scatter plots...")
fig, axes = plt.subplots(1, 3, figsize=(18, 5))

for idx, target_name in enumerate(["overallScore", "timeToMarket", "communityGrowth"]):
    pred_data = predictions_df[predictions_df["Target"] == target_name]

    axes[idx].scatter(
        pred_data["Actual"], pred_data["Predicted"], alpha=0.6, s=80, edgecolors="black"
    )

    # Perfect prediction line
    min_val = min(pred_data["Actual"].min(), pred_data["Predicted"].min())
    max_val = max(pred_data["Actual"].max(), pred_data["Predicted"].max())
    axes[idx].plot([min_val, max_val], [min_val, max_val], "r--", lw=2)

    axes[idx].set_xlabel("Actual Value")
    axes[idx].set_ylabel("Predicted Value")
    axes[idx].set_title(f"Predictions vs Actual: {target_name}")
    axes[idx].grid(True, alpha=0.3)

    # R² on plot
    target_r2 = results_df[
        (results_df["Target"] == target_name) & (results_df["Model"] == "XGBoost")
    ]["Test R²"].values[0]
    axes[idx].text(
        0.05,
        0.95,
        f"R² = {target_r2:.4f}",
        transform=axes[idx].transAxes,
        fontsize=12,
        verticalalignment="top",
        bbox=dict(boxstyle="round", facecolor="white", alpha=0.8),
    )

plt.tight_layout()
plt.savefig(ML_DIR / "18_predictions_vs_actual.png", dpi=300, bbox_inches="tight")
plt.close()
print("  ✓ Saved: 18_predictions_vs_actual.png")


# 9.7. SHAP Summary Plots
print("\n9.7. SHAP summary plots...")
fig, axes = plt.subplots(3, 1, figsize=(12, 18))

for idx, target_name in enumerate(["overallScore", "timeToMarket", "communityGrowth"]):
    shap_data = shap_results[target_name]

    plt.sca(axes[idx])
    shap.summary_plot(
        shap_data["shap_values"],
        shap_data["X_test"],
        plot_type="bar",
        max_display=15,
        show=False,
    )
    axes[idx].set_title(f"SHAP Feature Importance: {target_name}", fontsize=12)

plt.tight_layout()
plt.savefig(ML_DIR / "19_shap_summary.png", dpi=300, bbox_inches="tight")
plt.close()
print("  ✓ Saved: 19_shap_summary.png")


# 9.8. SHAP Dependence Plots (Top-3 features)
print("\n9.8. SHAP dependence plots...")

for target_name in ["overallScore", "timeToMarket", "communityGrowth"]:
    shap_imp = pd.read_csv(ML_DIR / f"shap_importance_{target_name}.csv")
    top_3_features = shap_imp.head(3)["Feature"].tolist()

    if len(top_3_features) >= 3:
        fig, axes = plt.subplots(1, 3, figsize=(18, 5))
        shap_data = shap_results[target_name]

        for i, feature in enumerate(top_3_features):
            if feature in shap_data["X_test"].columns:
                feature_idx = shap_data["X_test"].columns.tolist().index(feature)
                plt.sca(axes[i])
                shap.dependence_plot(
                    feature_idx,
                    shap_data["shap_values"],
                    shap_data["X_test"],
                    show=False,
                )
                axes[i].set_title(f"{feature}", fontsize=10)

        plt.tight_layout()
        plt.savefig(
            ML_DIR / f"20_shap_dependence_{target_name}.png",
            dpi=300,
            bbox_inches="tight",
        )
        plt.close()
        print(f"  ✓ Saved: 20_shap_dependence_{target_name}.png")


# 9.9. Cross-Validation Scores Distribution
print("\n9.9. Cross-validation scores distribution...")
fig, axes = plt.subplots(1, 3, figsize=(18, 6))

for idx, target_name in enumerate(["overallScore", "timeToMarket", "communityGrowth"]):
    cv_target = cv_df[cv_df["Target"] == target_name]

    # Box plot для кожної моделі
    cv_data = []
    labels = []
    for model_name in ["Random Forest", "XGBoost", "LightGBM"]:
        model_cv = cv_target[cv_target["Model"] == model_name]
        if len(model_cv) > 0:
            fold_scores = model_cv[
                ["Fold 1", "Fold 2", "Fold 3", "Fold 4", "Fold 5"]
            ].values[0]
            cv_data.append(fold_scores)
            labels.append(model_name)

    if cv_data:
        bp = axes[idx].boxplot(cv_data, labels=labels, patch_artist=True)
        for patch in bp["boxes"]:
            patch.set_facecolor("lightblue")

        axes[idx].set_ylabel("Cross-Validation R²")
        axes[idx].set_title(f"CV Scores: {target_name}")
        axes[idx].grid(True, alpha=0.3, axis="y")
        axes[idx].axhline(y=0.75, color="red", linestyle="--", label="Target (0.75)")
        axes[idx].legend()

plt.tight_layout()
plt.savefig(ML_DIR / "21_cv_scores_distribution.png", dpi=300, bbox_inches="tight")
plt.close()
print("  ✓ Saved: 21_cv_scores_distribution.png")

print("\n✓ Усі візуалізації згенеровано!")
print()


# ============================================================================
# 10. SUMMARY STATISTICS
# ============================================================================
print("=" * 80)
print("10. SUMMARY STATISTICS")
print("=" * 80)

print("\nBest Models per Target (by Test R²):")
for target_name in ["overallScore", "timeToMarket", "communityGrowth"]:
    target_results = results_df[results_df["Target"] == target_name]
    best_model = target_results.loc[target_results["Test R²"].idxmax()]

    print(f"\n  {target_name}:")
    print(f"    Best Model: {best_model['Model']}")
    print(f"    Test R²: {best_model['Test R²']:.4f}")
    print(f"    Test RMSE: {best_model['Test RMSE']:.4f}")
    print(f"    Test MAE: {best_model['Test MAE']:.4f}")

print("\n" + "=" * 80)
print("ML MODELING ЗАВЕРШЕНО!")
print("=" * 80)
print(f"\nЗгенеровані файли збережено в: {ML_DIR}")
print("\nCSV Files:")
for csv_file in sorted(ML_DIR.glob("*.csv")):
    print(f"  • {csv_file.name}")

print("\nVisualizations:")
for png_file in sorted(ML_DIR.glob("*.png")):
    print(f"  • {png_file.name}")

print("\n✅ Фаза 3: ML Modeling - SUCCESS!")
print()
