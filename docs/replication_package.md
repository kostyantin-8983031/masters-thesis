# Replication Package: Outcome-Based Code Quality Research

Цей документ містить повний replication package для відтворення дослідження "Система прогнозування продуктивності розробників на основі outcome-based аналізу TypeScript коду".

**Для кого:** Дослідники, peer reviewers, студенти, які хочуть відтворити або розширити це дослідження.

---

## Зміст

1. [Огляд дослідження](#огляд-дослідження)
2. [Системні вимоги](#системні-вимоги)
3. [Встановлення](#встановлення)
4. [Dataset](#dataset)
5. [Відтворення кроків дослідження](#відтворення-кроків-дослідження)
6. [Очікувані результати](#очікувані-результати)
7. [Валідація результатів](#валідація-результатів)
8. [Розширення дослідження](#розширення-дослідження)
9. [Troubleshooting](#troubleshooting)
10. [Citation](#citation)

---

## Огляд дослідження

### Мета

Дослідити кореляцію між статичними метриками TypeScript коду та реальними outcome результатами (продуктивність розробників, якість продукту, бізнес-метрики) на основі аналізу популярних open source проєктів веб-розробки.

### Research Questions

**RQ1:** Які outcome-based метрики найбільш strongly корелюють з якістю TypeScript проектів?

**RQ2:** Чи можна передбачити продуктивність розробників на основі статичних метрик коду?

**RQ3:** Які практичні рекомендації можна дати командам для покращення якості коду та продуктивності?

### Методологія

**Підхід:** Quantitative empirical study

**Dataset:** 50 популярних TypeScript open-source проектів (>5000 GitHub stars)

**Метрики:** 20 outcome-based метрик у 3 категоріях:

- Developer Experience (DX): 7 метрик
- Technical Performance (TP): 6 метрик
- Business Impact (BI): 7 метрик

**Аналіз:**

- Phase 1: Data Collection (GitHub API, code analysis)
- Phase 2.1: Data Validation & Exploration (EDA)
- Phase 2.2: Statistical Analysis & Feature Engineering
- Phase 2.3: Temporal Data Collection & Analysis
- Phase 3: ML Modeling & Predictive Analysis

**Інструменти:**

- Data collection: TypeScript, Node.js, Octokit (GitHub API)
- Analysis: Python, pandas, scikit-learn, matplotlib
- Statistical tests: Pearson correlation, OLS regression, ANOVA
- ML models: Linear Regression, Ridge, Lasso, ElasticNet, Random Forest, XGBoost, LightGBM

### Ключові результати

**Finding 1:** Code review duration має найсильнішу кореляцію з time to market (r = 0.881, p < 10⁻¹⁶)

**Finding 2:** Test coverage є головним predictor для community growth (83.4% feature importance)

**Finding 3:** Interaction effects між DX та TP є критичними (47.5% importance для overallScore)

**Finding 4:** Linear models outperform complex models на малому dataset (n=50)

---

## Системні вимоги

### Hardware

**Мінімальні вимоги:**

- CPU: 4 cores (Intel i5 or equivalent)
- RAM: 8 GB
- Disk: 10 GB free space
- Network: Stable internet (GitHub API calls)

**Рекомендовані вимоги:**

- CPU: 8+ cores (Intel i7/AMD Ryzen 7 or better)
- RAM: 16 GB
- Disk: 20 GB free space (SSD preferred)
- Network: High-speed internet (rate limits)

### Software

**Required:**

- **Node.js:** 20.x або новіше
- **npm:** 10.x або новіше
- **Python:** 3.11+ (рекомендовано 3.12)
- **Git:** 2.x або новіше
- **GitHub Personal Access Token** (free tier достатньо)

**Optional (recommended):**

- **uv:** Ultra-fast Python package installer
- **VS Code:** Для перегляду коду
- **Jupyter:** Для interactive analysis

### Operating Systems

**Tested on:**

- ✅ macOS 13+ (Ventura, Sonoma)
- ✅ Ubuntu 22.04+ LTS
- ✅ Windows 11 (через WSL2)

**Note:** Windows native не тестувався, рекомендовано WSL2.

---

## Встановлення

### Step 1: Clone Repository

```bash
# HTTPS
git clone https://github.com/konstantinkai/masters-thesis.git

# SSH (рекомендовано)
git clone git@github.com:konstantinkai/masters-thesis.git

cd masters-thesis
```

### Step 2: Install Node.js Dependencies

```bash
npm install
```

**Expected output:**

```
added 850 packages in 45s
```

**Verify:**

```bash
npm list --depth=0
# Should show @nx/*, @octokit/*, typescript, etc.
```

### Step 3: Install Python Dependencies

#### Option A: Using uv (recommended)

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install packages
uv pip install pandas numpy scikit-learn matplotlib seaborn \
  scipy statsmodels xgboost lightgbm
```

#### Option B: Using pip

```bash
# Optional: Create virtual environment
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate  # Windows

# Install packages
pip install pandas numpy scikit-learn matplotlib seaborn \
  scipy statsmodels xgboost lightgbm
```

**Verify:**

```bash
python3 -c "import pandas, sklearn, matplotlib; print('✅ All packages installed')"
```

### Step 4: Setup GitHub Token

```bash
# Create .env file (NOT committed to git)
echo "GITHUB_TOKEN=your_github_token_here" > .env

# OR set environment variable
export GITHUB_TOKEN="your_github_token_here"

# Test connection
node packages/scripts/src/debug-github-api.mjs
```

**Expected output:**

```
✅ GitHub API connection successful
Rate limit: 4999/5000 remaining
```

### Step 5: Build Project

```bash
# Build all TypeScript packages
npx nx run-many --target=build --all
```

**Expected output:**

```
✓ Successfully ran target build for 3 projects
  - @thesis/metrics
  - @thesis/metrics-collector
  - @thesis/scripts
```

---

## Dataset

### Project Selection Criteria

**Inclusion criteria:**

- TypeScript > 70% codebase
- GitHub Stars > 5,000
- Open Issues > 50
- Pull Requests > 100 (last 6 months)
- Active development (>10 commits/month)
- Public repository
- CI/CD configured

**Exclusion criteria:**

- Archived repositories
- Private repositories
- Non-web projects (e.g., CLI tools without web output)
- Forks (only original repositories)

### Dataset Summary

**Total projects:** 50

**Categories:**

- Core TypeScript Projects: 10 (20%)
- UI Component Libraries: 10 (20%)
- State Management: 8 (16%)
- Build Tools: 6 (12%)
- Developer Tools: 8 (16%)
- Data & Forms: 8 (16%)

**Full project list:** See `input/projects.json`

**Example entry:**

```json
{
  "name": "Angular",
  "github": "angular/angular",
  "category": "Core Framework",
  "stars": 95000,
  "tier": 1
}
```

### Temporal Dataset (Phase 2.3)

**Time range:** April 2025 - September 2025 (6 months)

**Snapshots:** 300 total (50 projects × 6 snapshots)

**Interval:** Monthly (last day of each month)

**Data points:** 300 snapshots × 20 metrics = 6,000 data points

---

## Відтворення кроків дослідження

### Phase 1: Data Collection

#### Step 1.1: Verify Projects Configuration

```bash
node packages/scripts/src/verify-projects.mjs
```

**Expected output:**

```
✅ All 50 projects validated
✓ angular/angular exists (95k stars)
✓ facebook/react exists (220k stars)
...
```

**Estimated time:** 2-3 minutes

#### Step 1.2: Collect Metrics (Cross-Sectional)

```bash
node packages/scripts/src/detailed-metrics-report.mjs
```

**Expected output:**

```
📊 Starting metrics collection for 50 projects...

✓ [1/50] Angular (angular/angular) - Score: 82/100 (3.2s)
✓ [2/50] React (facebook/react) - Score: 79/100 (2.8s)
...

✅ Collection complete!
   📈 Average score: 70.3/100
   ⏱️  Total time: 12m 34s
   💾 Reports saved to: reports/
```

**Estimated time:** 10-15 minutes

**Output files:**

- `reports/metrics_report.json` (56KB)
- `reports/metrics_report.csv` (14KB)
- `reports/metrics_report.md` (9KB)

#### Step 1.3: Collect Temporal Data (Optional)

```bash
node packages/scripts/src/temporal-metrics-report.mjs
```

**Expected output:**

```
📊 Collecting temporal data (6 months)...

✓ [1/50] Angular - 6 snapshots collected (45s)
⚠️ [49/50] Rate limit hit, waiting 60s...
✓ [49/50] TypeORM - 6 snapshots collected (105s)
✓ [50/50] Complete

✅ Temporal collection complete!
   📊 Total snapshots: 300 (50 × 6)
   ⏱️  Total time: 75m
   💾 Reports saved to: reports/
```

**Estimated time:** 60-90 minutes

**Output files:**

- `reports/metrics_report_temporal.json` (297KB)
- `reports/metrics_report_temporal_long.csv` (58KB)

### Phase 2.1: Data Validation & Exploration

#### Step 2.1.1: Data Validation

```bash
cd analysis
python3 data_validation.py
```

**Expected output:**

```
📊 Data Validation Report

Dataset summary:
  Projects: 50
  Metrics: 20
  Data points: 1000

Completeness:
  ✅ Missing values: 0 (0.00%)
  ✅ 100% completeness

Outliers (IQR method):
  13 metrics with outliers detected

Correlations:
  171 pairs tested
  Top correlation: bundleSize ↔ bundleLoadTime (r=1.000)

📈 Visualizations saved to: reports/analysis/
📋 Report saved to: reports/data_validation_report.md
```

**Estimated time:** 2-3 minutes

**Output files:**

- `reports/data_validation_report.md` (31 pages)
- `reports/analysis/01_overall_score_distribution.png`
- `reports/analysis/02_category_scores_boxplot.png`
- `reports/analysis/03_correlation_matrix.png`
- `reports/analysis/04_outliers_detection.png`
- `reports/analysis/05_metrics_distributions.png`
- `reports/analysis/06_top_bottom_projects.png`
- `reports/analysis/07_scatter_matrix.png`
- `reports/analysis/descriptive_statistics.csv`
- `reports/analysis/correlation_matrix.csv`
- `reports/analysis/top_correlations.csv`
- `reports/analysis/outliers_iqr.csv`

### Phase 2.2: Statistical Analysis

#### Step 2.2.1: Hypothesis Testing & Regression

```bash
python3 statistical_analysis.py
```

**Expected output:**

```
📊 Statistical Analysis Report

Hypothesis Testing:
  171 correlation pairs tested
  26 significant (p < 0.05): 15.2%
  14 significant after FDR: 8.2%

Regression Analysis:
  3 OLS models fitted
  Best R²: 0.784 (timeToMarket ~ DX)

Cluster Analysis:
  Optimal clusters: k=2 (Silhouette=0.212)
  Cluster 0: 11 projects (22%)
  Cluster 1: 39 projects (78%)

PCA:
  10 components for 90% variance

📈 Visualizations saved to: reports/statistical/
📋 Report saved to: reports/statistical_analysis_report.md
```

**Estimated time:** 3-5 minutes

**Output files:**

- `reports/statistical_analysis_report.md` (40 pages)
- `reports/statistical/08_regression_analysis.png`
- `reports/statistical/09_optimal_clusters.png`
- `reports/statistical/10_hierarchical_dendrogram.png`
- `reports/statistical/11_pca_explained_variance.png`
- `reports/statistical/12_pca_biplot_clusters.png`
- `reports/statistical/hypothesis_tests.csv`
- `reports/statistical/regression_summary.csv`
- `reports/statistical/regression_coefficients.csv`
- `reports/statistical/cluster_assignments.csv`
- `reports/statistical/pca_loadings.csv`

#### Step 2.2.2: Feature Engineering

```bash
python3 feature_engineering.py
```

**Expected output:**

```
📊 Feature Engineering

Original features: 19
Interaction features: +5
Polynomial features: +5
Log transformations: +4
Ratio features: +4
Categorical features: +2
Scaled features: +80

Total engineered features: 126

Top feature: dx_codeReviewDuration_log (r=-0.582)

💾 Saved to: reports/statistical/engineered_features.csv
```

**Estimated time:** 1-2 minutes

**Output files:**

- `reports/statistical/engineered_features.csv` (50 × 126)
- `reports/statistical/feature_importance.csv`

### Phase 2.3: Temporal Analysis (Optional)

#### Step 2.3.1: Time Series Analysis

```bash
python3 temporal_analysis.py
```

**Expected output:**

```
📊 Temporal Analysis Report

Dataset:
  Projects: 50
  Time range: 2025-04-01 to 2025-09-30
  Snapshots: 300 (6 per project)

Stationarity Tests (ADF):
  Stationary: 12/20 metrics (60%)
  Non-stationary: 8/20 metrics (40%)

Change Point Detection:
  Detected changes: 15 across 8 projects

Volatility:
  High volatility: dx_codeReviewDuration, bi_communityGrowth
  Low volatility: tp_testCoverage, tp_performanceScore

📈 Visualizations saved to: reports/temporal/
```

**Estimated time:** 5-7 minutes

**Output files:**

- `reports/temporal/01_metrics_trends_over_time.png`
- `reports/temporal/02_project_trajectories.png`
- `reports/temporal/03_seasonal_decomposition.png`
- `reports/temporal/04_acf_pacf_plots.png`
- `reports/temporal/05_change_point_detection.png`
- `reports/temporal/06_volatility_analysis.png`
- `reports/temporal/stationarity_tests.csv`
- `reports/temporal/change_points.csv`

#### Step 2.3.2: Temporal Feature Engineering

```bash
python3 temporal_feature_engineering.py
```

**Expected output:**

```
📊 Temporal Feature Engineering

Original features: 18
Lag features (1-3): +54
Rolling statistics: +135
Trend features: +18
Momentum features: +36
Volatility features: +36

Total temporal features: 297
Total features (with original): 315

💾 Saved to: reports/temporal/temporal_features.csv
```

**Estimated time:** 3-5 minutes

**Output files:**

- `reports/temporal/temporal_features.csv` (300 × 315)

#### Step 2.3.3: Temporal Modeling

```bash
python3 temporal_modeling.py
```

**Expected output:**

```
📊 Temporal Modeling Report

ARIMA Forecasting:
  dx_codeReviewDuration: MAE=8.12%, RMSE=14.28%
  bi_timeToMarket: MAE=9.87%, RMSE=13.45%
  bi_communityGrowth: MAE=11.23%, RMSE=15.67%

Random Forest (TimeSeriesSplit CV):
  bi_timeToMarket: R²=0.782, RMSE=9.96
  bi_communityGrowth: R²=0.928, RMSE=6.66

Top predictors:
  timeToMarket: rolling_2m_max (0.357)
  communityGrowth: rolling_3m_mean (0.176)

📋 Report saved to: reports/temporal_implementation_summary.md
```

**Estimated time:** 10-15 minutes

**Output files:**

- `reports/temporal_implementation_summary.md` (15 sections)
- `reports/temporal/arima_forecasts.csv`
- `reports/temporal/rf_cv_results.csv`
- `reports/temporal/feature_importance_temporal.csv`

### Phase 3: ML Modeling

#### Step 3.1: Data Preparation

```bash
cd ../analysis  # if still in analysis/
python3 ml_data_preparation.py
```

**Expected output:**

```
📊 ML Data Preparation

Input features: 126
After correlation filter (r>0.95): 45
After data leakage removal: 24

Train/Val/Test split:
  Train: 34 projects (70%)
  Val: 8 projects (15%)
  Test: 8 projects (15%)

💾 Saved to: reports/ml/selected_features.csv
```

**Estimated time:** 1-2 minutes

**Output files:**

- `reports/ml/selected_features.csv` (24 features)
- `reports/ml/train_test_split.csv`

#### Step 3.2: Model Training

```bash
python3 ml_modeling.py
```

**Expected output:**

```
📊 ML Modeling

Training 7 models × 3 targets = 21 model-target pairs

Models:
  ✓ Linear Regression
  ✓ Ridge Regression
  ✓ Lasso Regression
  ✓ ElasticNet
  ✓ Random Forest
  ✓ XGBoost
  ✓ LightGBM

Targets:
  - overallScore
  - timeToMarket
  - communityGrowth

Best Test R²:
  overallScore: 0.625 (Linear Regression)
  timeToMarket: 0.663 (Lasso)
  communityGrowth: 0.394 (Lasso)

💾 Saved to: reports/ml/model_performance.csv
```

**Estimated time:** 5-10 minutes

**Output files:**

- `reports/ml/model_performance.csv` (21 rows)
- `reports/ml/cv_scores.csv`
- `reports/ml/models/` (saved model files)

#### Step 3.3: Model Evaluation

```bash
python3 ml_evaluation.py
```

**Expected output:**

```
📊 ML Evaluation

Feature Importance (XGBoost):
  overallScore: dx_tp_interaction (47.5%)
  timeToMarket: dx_codeReviewDuration (40.5%)
  communityGrowth: tp_testCoverage (83.4%)

SHAP Values:
  overallScore: dx_tp_interaction (2.517)
  timeToMarket: dx_codeReviewDuration (5.451)
  communityGrowth: tp_testCoverage (14.280)

📈 Visualizations saved to: reports/ml/
```

**Estimated time:** 5-7 minutes

**Output files:**

- `reports/ml/13_feature_selection.png`
- `reports/ml/14_model_comparison.png`
- `reports/ml/15_learning_curves.png`
- `reports/ml/16_residual_plots.png`
- `reports/ml/17_feature_importance_comparison.png`
- `reports/ml/18_predictions_vs_actual.png`
- `reports/ml/19_shap_summary.png`
- `reports/ml/20_shap_dependence_*.png` (3 files)
- `reports/ml/21_cv_scores_distribution.png`
- `reports/ml/feature_importance_rf_*.csv` (3 files)
- `reports/ml/feature_importance_xgb_*.csv` (3 files)
- `reports/ml/shap_importance_*.csv` (3 files)

#### Step 3.4: Generate Report

```bash
python3 ml_explainability.py
```

**Expected output:**

```
📊 ML Explainability Report

Generated comprehensive report:
  - Executive summary
  - Model performance comparison
  - Feature importance analysis
  - SHAP value interpretation
  - Practical recommendations
  - Limitations discussion

📋 Report saved to: reports/ml_modeling_report.md (50 pages)
```

**Estimated time:** 2-3 minutes

**Output files:**

- `reports/ml_modeling_report.md` (50 pages)
- `reports/ml/predictions_comparison.csv`

---

## Очікувані результати

### Summary Statistics

**Dataset:**

- Projects: 50
- Data points: 1,000 (50 × 20)
- Completeness: 100% (0 missing)
- Confidence: 90% для всіх

**Overall Score:**

- Mean: 70.3/100
- Median: 70.5/100
- Std: 6.4
- Range: 57-85/100

**Top 3 Projects:**

1. pmndrs/valtio - 85/100
2. nestjs/nest - 84/100
3. reduxjs/redux - 84/100

### Key Findings

**Finding 1: Code Review Critical**

```
codeReviewDuration ↔ timeToMarket
r = 0.881, p < 10⁻¹⁶
1 hour review → 1.3 hours delivery delay
```

**Finding 2: Test Coverage Drives Community**

```
testCoverage ↔ communityGrowth
r = 0.772, p < 10⁻¹⁰
+10% coverage → +70 stars/month
```

**Finding 3: Interaction Effects**

```
dx_tp_interaction → overallScore
47.5% feature importance (XGBoost)
Balance DX and TP investments (50/50)
```

### ML Model Performance

**Best Models (Test Set):**

**overallScore:**

- Model: Linear Regression
- R²: 0.625
- RMSE: 5.116 points
- MAE: 3.836 points

**timeToMarket:**

- Model: Lasso
- R²: 0.663
- RMSE: 7.835 hours
- MAE: 6.016 hours

**communityGrowth:**

- Model: Lasso
- R²: 0.394
- RMSE: 8.231 stars/month
- MAE: 6.233 stars/month

### Temporal Analysis (if completed)

**ARIMA Forecasting:**

- dx_codeReviewDuration: MAE = 8.12%
- bi_timeToMarket: MAE = 9.87%
- bi_communityGrowth: MAE = 11.23%

**Random Forest CV:**

- bi_timeToMarket: R² = 0.782
- bi_communityGrowth: R² = 0.928

---

## Валідація результатів

### Automatic Validation

Run validation script:

```bash
python3 validate_results.py
```

**Expected checks:**

- ✅ All output files exist
- ✅ CSV files have correct number of rows/columns
- ✅ JSON files are well-formed
- ✅ R² values within expected range (0.0-1.0)
- ✅ Correlation values within [-1, 1]
- ✅ No NaN/Inf values in outputs

### Manual Validation

**Step 1: Check completeness**

```bash
ls -lh reports/metrics_report.json
# Should be ~56KB

ls -lh reports/ml_modeling_report.md
# Should be ~60KB (50 pages)
```

**Step 2: Verify key statistics**

```python
import pandas as pd

df = pd.read_csv('reports/metrics_report.csv')
print(f"Projects: {len(df)}")  # Should be 50
print(f"Mean score: {df['overallScore'].mean():.1f}")  # Should be ~70.3
print(f"Missing values: {df.isnull().sum().sum()}")  # Should be 0
```

**Step 3: Check correlations**

```python
corr_df = pd.read_csv('reports/analysis/correlation_matrix.csv', index_col=0)
print(corr_df.loc['dx_codeReviewDuration', 'bi_timeToMarket'])
# Should be ~0.88
```

**Step 4: Verify model performance**

```python
perf_df = pd.read_csv('reports/ml/model_performance.csv')
best = perf_df.loc[perf_df['target'] == 'overallScore', 'test_r2'].max()
print(f"Best R² for overallScore: {best:.3f}")
# Should be ~0.625
```

### Statistical Validation

**Shapiro-Wilk Test (normality):**

```python
from scipy import stats

df = pd.read_csv('reports/metrics_report.csv')
stat, p = stats.shapiro(df['overallScore'])
print(f"Shapiro-Wilk p-value: {p:.4f}")
# p > 0.05 → normally distributed
```

**Pearson Correlation (code review ↔ time to market):**

```python
r, p = stats.pearsonr(df['dx_codeReviewDuration'], df['bi_timeToMarket'])
print(f"r = {r:.3f}, p = {p:.2e}")
# Should be r ≈ 0.88, p < 0.001
```

---

## Розширення дослідження

### Extension 1: Expand Dataset

**Goal:** Increase to 150+ projects для R² > 0.75

**Steps:**

1. Add projects to `input/projects.json`
2. Include 1000-5000 stars range (reduce selection bias)
3. Add non-TypeScript projects (JavaScript, Python) для порівняння
4. Re-run data collection
5. Re-train models

**Expected improvement:**

- R² overallScore: 0.625 → 0.75+
- Better generalization
- Lower CV variance

### Extension 2: Temporal Validation

**Goal:** Longitudinal study (12-24 months)

**Steps:**

1. Modify `temporal-metrics-report.mjs` для extended range
2. Collect monthly snapshots (12-24 points per project)
3. ARIMA/Prophet forecasting
4. Validation: Train on past, predict future
5. Measure forecast accuracy

**Expected outcomes:**

- Causal inference (Granger causality)
- Seasonal patterns detection
- Better understanding of dynamics

### Extension 3: Qualitative Study

**Goal:** Developer survey для validation

**Steps:**

1. Create survey (SPACE framework based)
2. Distribute to active contributors (GitHub issues)
3. Collect responses (target: 100+)
4. Correlate survey scores з outcome metrics
5. Mixed-methods analysis

**Expected insights:**

- Validate quantitative findings
- Understand "why" (not just "what")
- Context-specific factors

### Extension 4: Real-World Tool

**Goal:** VS Code extension для real-time quality scoring

**Steps:**

1. Design VS Code extension API
2. Implement lightweight metrics collector
3. Real-time scoring (local + GitHub API)
4. Display in status bar, notifications
5. Beta testing з pilot teams

**Impact:**

- Actionable insights для developers
- Continuous improvement tracking
- Industry adoption potential

---

## Troubleshooting

### Common Issues

#### Issue 1: GitHub Rate Limit

**Symptom:**

```
⚠ [5/50] Rate limit hit, retrying in 60s...
```

**Solutions:**

1. Wait for automatic retry
2. Use `--existingReport` для incremental updates
3. Schedule collection during off-peak hours
4. Upgrade to GitHub Pro (higher rate limits)

#### Issue 2: Python Import Errors

**Symptom:**

```
ModuleNotFoundError: No module named 'pandas'
```

**Solutions:**

```bash
# Option 1: uv
uv pip install pandas

# Option 2: pip
pip install pandas

# Option 3: Verify virtual environment
which python3
# Should point to venv/bin/python3 if using venv
```

#### Issue 3: Nx Build Failures

**Symptom:**

```
❌ Failed to build @thesis/metrics
```

**Solutions:**

```bash
# Clear cache
npx nx reset

# Clean install
rm -rf node_modules package-lock.json
npm install

# Rebuild
npx nx build @thesis/metrics
```

#### Issue 4: Incorrect Results

**Symptom:** Results differ від expected values

**Debug steps:**

1. Check dataset completeness:

   ```python
   df = pd.read_csv('reports/metrics_report.csv')
   print(df.shape)  # Should be (50, 23)
   print(df.isnull().sum())  # Should be all 0
   ```

2. Verify data collection date:

   ```bash
   grep "collectionDate" reports/metrics_report.json
   # Ensure it's recent
   ```

3. Re-run data collection:

   ```bash
   rm reports/metrics_report.*
   node packages/scripts/src/detailed-metrics-report.mjs
   ```

4. Check Python dependencies versions:
   ```bash
   pip list | grep -E "(pandas|scikit-learn|numpy)"
   # pandas ≥ 2.0, scikit-learn ≥ 1.3, numpy ≥ 1.24
   ```

---

## Citation

Якщо ви використовуєте цей dataset, код або results у своєму дослідженні, будь ласка, cite:

### BibTeX

```bibtex
@mastersthesis{kai2025outcome,
  author = {Kai, Konstantin},
  title = {Система прогнозування продуктивності розробників на основі outcome-based аналізу TypeScript коду},
  school = {Одеський національний політехнічний університет},
  year = {2025},
  type = {Master's Thesis},
  address = {Odesa, Ukraine},
  note = {Speciality 121 - Software Engineering},
  url = {https://github.com/konstantinkai/masters-thesis}
}
```

### APA

```
Kai, K. (2025). Система прогнозування продуктивності розробників на основі
outcome-based аналізу TypeScript коду [Master's thesis, Odessa Polytechnic
National University]. GitHub. https://github.com/konstantinkai/masters-thesis
```

### IEEE

```
K. Kai, "Система прогнозування продуктивності розробників на основі outcome-based
аналізу TypeScript коду," Master's thesis, Odessa Polytechnic National University,
Odesa, Ukraine, 2025.
```

---

## Контакти

**Author:** Konstantin Kai

**Affiliation:** Odessa Polytechnic National University (Speciality 121 - Software Engineering)

**Email:** konstantin.kai@example.com (update)

**GitHub:** [@konstantinkai](https://github.com/konstantinkai)

**Supervisor:** [Ім'я наукового керівника] (update)

---

## Ліцензія

Цей replication package розповсюджується під **MIT License**, що дозволяє:

✅ Використання у комерційних та академічних цілях
✅ Модифікація та розповсюдження
✅ Приватне використання

⚠️ З умовою збереження copyright notice та attribution

**Full license text:** See `LICENSE` file в repository root.

---

## Додаткові ресурси

### Документація

- [Architecture Guide](./architecture.md) - System design
- [Usage Guide](./usage_guide.md) - Детальні інструкції
- [Best Practices Guide](./best_practices.md) - Практичні рекомендації

### Reports

- [Data Validation Report](../reports/data_validation_report.md) - EDA (31 pages)
- [Statistical Analysis Report](../reports/statistical_analysis_report.md) - Statistics (40 pages)
- [ML Modeling Report](../reports/ml_modeling_report.md) - Machine Learning (50 pages)
- [Temporal Implementation](../reports/temporal_implementation_summary.md) - Time series (15 sections)

### External Resources

- **SPACE Framework:** https://queue.acm.org/detail.cfm?id=3454124
- **DORA Metrics:** https://dora.dev/
- **DevEx Framework:** https://queue.acm.org/detail.cfm?id=3595878
- **GitHub API:** https://docs.github.com/en/rest

---

**Document Version:** 1.0.0
**Last Updated:** November 13, 2025
**Status:** Phase 4 Implementation - Complete Replication Package

---

**Acknowledgments:**

Special thanks to:

- Open source maintainers за публічні дані
- GitHub за API access
- Odessa Polytechnic National University за підтримку
- Scientific supervisor за guidance
- Community за feedback

**Funding:** This research received no specific grant from any funding agency.

**Data Availability:** All data, code, and analysis scripts доступні у цьому repository.

**Ethics:** Цe дослідження використовує only public data from open-source repositories. No personal identifying information було зібрано або обробл completeено. Всі практики відповідають GitHub Terms of Service та GDPR regulations.
