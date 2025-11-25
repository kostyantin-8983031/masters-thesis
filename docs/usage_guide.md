# Посібник користувача системи outcome-based аналізу TypeScript коду

Цей посібник містить детальні інструкції з використання системи прогнозування продуктивності розробників на основі outcome-based аналізу TypeScript коду.

**Цільова аудиторія:** Дослідники, software engineering студенти, team leads, розробники інструментів якості коду.

---

## Зміст

1. [Швидкий старт](#швидкий-старт)
2. [Встановлення та налаштування](#встановлення-та-налаштування)
3. [Збір метрик](#збір-метрик)
4. [Статистичний аналіз](#статистичний-аналіз)
5. [ML моделювання](#ml-моделювання)
6. [Temporal аналіз](#temporal-аналіз)
7. [Інтерпретація результатів](#інтерпретація-результатів)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

---

## Швидкий старт

### Мінімальний приклад (5 хвилин)

```bash
# 1. Clone repository
git clone https://github.com/your-org/masters-thesis.git
cd masters-thesis

# 2. Встановити залежності
npm install

# 3. Build проект
npx nx run-many --target=build --all

# 4. Встановити GitHub token
export GITHUB_TOKEN="ghp_your_token_here"

# 5. Зібрати метрики для всіх проектів
node packages/scripts/src/detailed-metrics-report.mjs

# ✅ Готово! Звіти в reports/metrics_report.*
```

### Що отримаєте

Після виконання команди збору метрик ви отримаєте:

- **`reports/metrics_report.json`** - Детальні дані у JSON форматі (56KB)
- **`reports/metrics_report.csv`** - Табличні дані для Excel (14KB)
- **`reports/metrics_report.md`** - Читабельний звіт з оцінками проектів

**Приклад JSON output:**

```json
{
  "summary": {
    "totalProjects": 50,
    "successfulCollections": 50,
    "averageScore": 70.3,
    "collectionDate": "2025-10-09T15:30:00Z"
  },
  "projects": [
    {
      "name": "Angular",
      "github": "angular/angular",
      "overallScore": 82,
      "confidence": 90,
      "categories": {
        "developerExperience": 28,
        "technicalPerformance": 78,
        "businessImpact": 24
      },
      "metrics": {
        "dx": {
          "codeReviewDuration": 120,
          "debuggingTime": 48,
          ...
        },
        "tp": {
          "testCoverage": 85,
          "bundleSize": 2500000,
          ...
        },
        "bi": {
          "communityGrowth": 450,
          "timeToMarket": 14,
          ...
        }
      }
    },
    ...
  ]
}
```

---

## Встановлення та налаштування

### Системні вимоги

**Обов'язкові:**

- **Node.js** 20.x або новіше
- **npm** 10.x або новіше
- **Python** 3.11+ (для аналізу)
- **Git** (для клонування репозиторію)
- **GitHub Personal Access Token** (для збору метрик)

**Рекомендовані:**

- **uv** - Ultra-fast Python package installer
- **16GB RAM** - Для ML моделювання
- **Unix-like OS** - macOS, Linux (Windows через WSL2)

### Крок 1: Клонування репозиторію

```bash
# HTTPS
git clone https://github.com/your-org/masters-thesis.git

# SSH (рекомендовано)
git clone git@github.com:your-org/masters-thesis.git

cd masters-thesis
```

### Крок 2: Встановлення Node.js залежностей

```bash
# Використовуючи npm
npm install

# Перевірка встановлення
npm list --depth=0
```

**Основні пакети:**

- `nx` - Build system та task runner
- `@octokit/rest` - GitHub API client
- `vitest` - Testing framework
- `typescript` - Type checking
- `eslint` - Code quality

### Крок 3: Встановлення Python залежностей

#### Опція A: Використання uv (рекомендовано)

```bash
# Встановити uv (якщо ще не встановлено)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Встановити Python пакети
uv pip install pandas numpy scikit-learn matplotlib seaborn \
  scipy statsmodels xgboost lightgbm
```

#### Опція B: Використання pip

```bash
# Створити virtual environment (опціонально)
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# або
venv\Scripts\activate  # Windows

# Встановити пакети
pip install pandas numpy scikit-learn matplotlib seaborn \
  scipy statsmodels xgboost lightgbm
```

**Перевірка:**

```bash
python3 -c "import pandas, sklearn, matplotlib; print('✅ All packages installed')"
```

### Крок 4: GitHub Personal Access Token

#### Створення токену

1. Перейдіть до https://github.com/settings/tokens
2. Натисніть **"Generate new token (classic)"**
3. Назвіть токен: `thesis-metrics-collection`
4. Виберіть scopes:
   - ✅ `repo` (read access to public repositories)
   - ✅ `user:read` (read user profile data)
5. Натисніть **"Generate token"**
6. **Збережіть токен** (показується тільки раз!)

#### Налаштування токену

**Опція A: Environment variable (рекомендовано)**

```bash
# macOS/Linux
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"

# Додати до .bashrc/.zshrc для постійного використання
echo 'export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"' >> ~/.zshrc
source ~/.zshrc
```

**Опція B: .env файл**

```bash
# Створити .env файл (НЕ commit до git!)
echo 'GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx' > .env

# Додати до .gitignore
echo '.env' >> .gitignore
```

**Перевірка:**

```bash
# Тест GitHub API connectivity
node packages/scripts/src/debug-github-api.mjs

# Output:
# ✅ GitHub API connection successful
# Rate limit: 4999/5000 remaining
```

### Крок 5: Build проекту

```bash
# Build всіх TypeScript пакетів
npx nx run-many --target=build --all

# Або окремо:
npx nx build @thesis/metrics
npx nx build @thesis/metrics-collector
npx nx build @thesis/scripts
```

**Очікуваний output:**

```
✓ Successfully ran target build for 3 projects
  - @thesis/metrics
  - @thesis/metrics-collector
  - @thesis/scripts
```

---

## Збір метрик

### Базове використання

#### Збір метрик для всіх проектів

```bash
node packages/scripts/src/detailed-metrics-report.mjs
```

**Очікуваний час виконання:** ~10-15 хвилин для 50 проектів

**Output:**

```
📊 Starting metrics collection for 50 projects...

✓ [1/50] Angular (angular/angular) - Score: 82/100 (3.2s)
✓ [2/50] React (facebook/react) - Score: 79/100 (2.8s)
✓ [3/50] Vue (vuejs/core) - Score: 76/100 (2.5s)
...

✅ Collection complete!
   📈 Average score: 70.3/100
   ⏱️  Total time: 12m 34s
   💾 Reports saved to: reports/
```

#### Збір метрик для конкретних проектів

```bash
# Single project
node packages/scripts/src/detailed-metrics-report.mjs --projects angular

# Multiple projects (comma-separated)
node packages/scripts/src/detailed-metrics-report.mjs \
  --projects angular,react,vue

# Projects by category (all UI libraries)
node packages/scripts/src/detailed-metrics-report.mjs \
  --projects mui,ant-design,chakra-ui,mantine
```

#### Інкрементальне оновлення

```bash
# Update existing report (adds new projects, updates changed ones)
node packages/scripts/src/detailed-metrics-report.mjs \
  --existingReport reports/metrics_report.json
```

**Use case:** Додали нові проекти до `input/projects.json` і хочете оновити тільки їх.

#### Кастомна output директорія

```bash
# Save to custom directory
node packages/scripts/src/detailed-metrics-report.mjs \
  --outputDir custom-reports/

# Output: custom-reports/metrics_report.*
```

### Розширені параметри

#### Комбінація параметрів

```bash
# Update specific projects in custom directory
node packages/scripts/src/detailed-metrics-report.mjs \
  --projects angular,react,vue \
  --existingReport custom-reports/metrics_report.json \
  --outputDir custom-reports/
```

#### Verbose logging

```bash
# Enable debug logging (якщо потрібно)
DEBUG=* node packages/scripts/src/detailed-metrics-report.mjs
```

### Output формати

Після збору метрик генеруються три файли:

#### 1. JSON - `metrics_report.json`

**Призначення:** Програмний доступ, ML modeling, подальший аналіз

**Структура:**

```json
{
  "summary": {
    "totalProjects": 50,
    "successfulCollections": 50,
    "failedCollections": 0,
    "averageScore": 70.3,
    "averageConfidence": 90,
    "collectionDate": "2025-10-09T15:30:00Z"
  },
  "projects": [
    {
      "name": "Angular",
      "github": "angular/angular",
      "category": "Core Framework",
      "tier": 1,
      "overallScore": 82,
      "confidence": 90,
      "categories": {
        "developerExperience": 28,
        "technicalPerformance": 78,
        "businessImpact": 24
      },
      "metrics": {
        "dx": {
          "codeReviewDuration": 120,
          "debuggingTime": 48,
          "successfulDeploymentsRatio": 0.95,
          "timeToFirstCommit": 2,
          "linesChangedPerHour": 150,
          "averageCommentsPerPR": 8,
          "prIterationRate": 0.35
        },
        "tp": {
          "buildTime": 15,
          "bundleSize": 2500000,
          "bundleLoadTime": 1200,
          "performanceScore": 85,
          "typeScriptErrorRate": 0.5,
          "testCoverage": 85
        },
        "bi": {
          "timeToMarket": 14,
          "featureSuccessRate": 0.88,
          "activeContributors": 150,
          "issueResolutionRate": 0.75,
          "communityGrowth": 450
        }
      }
    },
    ...
  ]
}
```

#### 2. CSV - `metrics_report.csv`

**Призначення:** Excel аналіз, статистичні пакети, візуалізація

**Колонки:**

```
name,github,category,tier,overallScore,confidence,
dx_codeReviewDuration,dx_debuggingTime,dx_successfulDeploymentsRatio,
dx_timeToFirstCommit,dx_linesChangedPerHour,dx_averageCommentsPerPR,
dx_prIterationRate,tp_buildTime,tp_bundleSize,tp_bundleLoadTime,
tp_performanceScore,tp_typeScriptErrorRate,tp_testCoverage,
bi_timeToMarket,bi_featureSuccessRate,bi_activeContributors,
bi_issueResolutionRate,bi_communityGrowth
```

**Приклад:**

```csv
Angular,angular/angular,Core Framework,1,82,90,120,48,0.95,2,150,8,0.35,15,2500000,1200,85,0.5,85,14,0.88,150,0.75,450
React,facebook/react,Core Framework,1,79,90,95,36,0.92,1,180,6,0.28,12,1800000,950,88,0.3,80,10,0.90,200,0.80,520
```

#### 3. Markdown - `metrics_report.md`

**Призначення:** Читабельний звіт для документації, презентацій

**Зміст:**

- Summary statistics
- Top 10 проектів
- Bottom 10 проектів
- Category breakdowns
- Insights та рекомендації

**Приклад:**

```markdown
# Metrics Collection Report

**Collection Date:** 2025-10-09 15:30:00
**Total Projects:** 50
**Average Score:** 70.3/100

## Top 10 Projects

1. **pmndrs/valtio** - 85/100 (State Management)
2. **nestjs/nest** - 84/100 (Core Framework)
3. **reduxjs/redux** - 84/100 (State Management)
   ...

## Category Averages

- **Developer Experience:** 23.9/100
- **Technical Performance:** 75.5/100
- **Business Impact:** 15.3/100
  ...
```

### Temporal Metrics Collection

Для збору historical time series (фаза 2.3):

```bash
# Collect 6 snapshots per project (April-September 2025)
node packages/scripts/src/temporal-metrics-report.mjs

# Output:
# - metrics_report_temporal.json (297KB, 300 snapshots)
# - metrics_report_temporal_long.csv (58KB, long format)
```

**Структура temporal JSON:**

```json
{
  "summary": {
    "totalProjects": 50,
    "snapshotsPerProject": 6,
    "totalSnapshots": 300,
    "startDate": "2025-04-01",
    "endDate": "2025-09-30",
    "intervalMonths": 1
  },
  "projects": [
    {
      "name": "Angular",
      "github": "angular/angular",
      "snapshots": [
        {
          "date": "2025-04-30",
          "metrics": { ... },
          "overallScore": 80
        },
        {
          "date": "2025-05-31",
          "metrics": { ... },
          "overallScore": 81
        },
        ...
      ]
    },
    ...
  ]
}
```

### Валідація конфігурації проектів

Перед збором метрик можна перевірити конфігурацію:

```bash
# Verify projects.json configuration
node packages/scripts/src/verify-projects.mjs

# Output:
# ✅ All 50 projects validated
# ✓ angular/angular exists (95k stars)
# ✓ facebook/react exists (220k stars)
# ...
```

---

## Статистичний аналіз

Після збору метрик виконується статистичний аналіз в Python.

### Фаза 2.1: Data Validation & Exploration

#### Запуск EDA

```bash
cd analysis
python3 data_validation.py
```

**Output:** `reports/data_validation_report.md` (31 стор.)

**Що аналізується:**

- Data completeness (missing values)
- Descriptive statistics
- Outliers detection (IQR method)
- Correlation analysis
- Distribution plots

**Згенеровані візуалізації** (reports/analysis/):

1. `01_overall_score_distribution.png` - Histogram + boxplot
2. `02_category_scores_boxplot.png` - DX vs TP vs BI
3. `03_correlation_matrix.png` - Heatmap 20×20 metrics
4. `04_outliers_detection.png` - Boxplots з outliers
5. `05_metrics_distributions.png` - 8 key metrics
6. `06_top_bottom_projects.png` - Best/worst 10
7. `07_scatter_matrix.png` - Pairwise correlations

**Згенеровані CSV:**

- `descriptive_statistics.csv` - Mean, std, min, max, quartiles
- `correlation_matrix.csv` - Повна матриця кореляцій
- `top_correlations.csv` - Відсортовані кореляції
- `outliers_iqr.csv` - Проекти з outliers

#### Інтерпретація результатів

**Completeness:**

```
✅ 100% completeness (0 missing values)
✅ 50 projects × 20 metrics = 1000 data points
✅ All confidence scores = 90%
```

**Key correlations:**

```
bundleSize ↔ bundleLoadTime: r = 1.000 (p < 0.001)
testCoverage ↔ technicalPerformance: r = 0.72 (p < 0.001)
codeReviewDuration ↔ timeToMarket: r = 0.88 (p < 10⁻¹⁶)
```

### Фаза 2.2: Statistical Analysis & Feature Engineering

#### Hypothesis Testing

```bash
python3 statistical_analysis.py
```

**Output:** `reports/statistical_analysis_report.md` (40 стор.)

**Що тестується:**

- Pearson correlations (171 pairs)
- False Discovery Rate (FDR) correction
- Confidence intervals
- p-values та significance levels

**Key findings:**

```
✅ 26 significant correlations (p < 0.05): 15.2%
✅ 14 significant after FDR correction: 8.2%

🔥 Top predictor:
   codeReviewDuration ↔ timeToMarket
   r = 0.881, p < 10⁻¹⁶

🎯 Key insight:
   testCoverage ↔ communityGrowth
   r = 0.772, p < 10⁻¹⁰
```

#### Regression Analysis

**3 OLS моделі побудовано:**

1. **Time to Market ~ DX metrics**

   ```
   R² = 0.784, adj R² = 0.760
   Dominant predictor: codeReviewDuration (β = 0.027, p < 10⁻¹³)
   Interpretation: +1 година review → +0.027 дня delivery delay
   ```

2. **Community Growth ~ TP metrics**

   ```
   R² = 0.732
   Main predictor: testCoverage (p < 0.001)
   ```

3. **Overall Score ~ Categories**
   ```
   R² = 0.173
   Most important: Technical Performance category
   ```

#### Cluster Analysis

**Оптимальна кількість кластерів:** k = 2 (Silhouette Score = 0.212)

**Cluster 0 "Складні проєкти"** (n=11, 22%):

- High codeReviewDuration (851 год ≈ 35 днів)
- Lower overallScore (65.3)
- Examples: TypeScript, Storybook

**Cluster 1 "Ефективні проєкти"** (n=39, 78%):

- Fast code reviews (175 год ≈ 7 днів)
- Higher overallScore (72.2)
- Examples: Angular, NestJS, Chakra UI

**Згенеровані візуалізації:**

- `08_regression_analysis.png` - Scatter plots з regression lines
- `09_optimal_clusters.png` - Elbow + Silhouette methods
- `10_hierarchical_dendrogram.png` - Hierarchical clustering
- `11_pca_explained_variance.png` - Scree plot
- `12_pca_biplot_clusters.png` - PC1 vs PC2 з кластерами

#### Feature Engineering

```bash
# Generates 126 total features (19 original → 126)
python3 feature_engineering.py
```

**Output:** `reports/statistical/engineered_features.csv`

**Типи features:**

- 5 interaction features (dx × tp, tp × bi, etc.)
- 5 polynomial features (squared terms)
- 4 log transformations (для skewed metrics)
- 4 ratio features (efficiency metrics)
- 2 categorical features (binning)
- 80 scaled features (StandardScaler + MinMaxScaler)

**Top engineered feature:**

```
dx_codeReviewDuration_log
r = -0.582 з overallScore
(34% improvement vs original r = -0.434)
```

---

## ML моделювання

### Фаза 3: ML Modeling & Predictive Analysis

#### Підготовка даних

```bash
cd analysis
python3 ml_data_preparation.py
```

**Що робить:**

- Feature selection (видалення highly correlated r > 0.95)
- Видалення scaled duplicates
- Train/Val/Test split: 70/15/15 (34/8/8 projects)
- **Data leakage fix:** Excluded all target transformations

**Output:** `reports/ml/selected_features.csv` (24 final features)

#### Тренування моделей

```bash
python3 ml_modeling.py
```

**7 моделей тренується:**

1. Linear Regression
2. Ridge Regression
3. Lasso Regression
4. ElasticNet
5. Random Forest
6. XGBoost (Gradient Boosting)
7. LightGBM

**3 target variables:**

- `overallScore` - загальна якість проєкту
- `timeToMarket` - час доставки features
- `communityGrowth` - ріст спільноти

**Output:** `reports/ml/model_performance.csv`

#### Оцінка моделей

```bash
python3 ml_evaluation.py
```

**Best models (Test Set):**

**overallScore:**

```
🏆 Linear Regression
   R² = 0.625 (realistic after data leakage fix)
   RMSE = 5.116 points
   MAE = 3.836 points
```

**timeToMarket:**

```
🏆 Lasso
   R² = 0.663
   RMSE = 7.835 hours
   MAE = 6.016 hours
```

**communityGrowth:**

```
🏆 Lasso
   R² = 0.394
   RMSE = 8.231 stars/month
   MAE = 6.233 stars/month
```

**Cross-Validation (5-Fold CV):**

- CV scores realistic після fix data leakage
- Some models show negative CV scores (small dataset issue)
- Linear models generalize краще, ніж complex (RF, XGBoost)

#### Feature Importance

**XGBoost Top-3 per Target:**

**overallScore:**

```
1. dx_tp_interaction - 47.5%
2. bi_featureSuccessRate - 26.8%
3. tp_typeScriptErrorRate - 7.3%
```

**timeToMarket:**

```
1. dx_codeReviewDuration - 40.5%
2. bi_issueResolutionRate - 20.5%
3. bi_activeContributors - 8.5%
```

**communityGrowth:**

```
1. tp_testCoverage - 83.4% (dominant!)
2. avg_bi - 10.8%
3. dx_debuggingTime - 2.1%
```

#### Model Explainability (SHAP)

```bash
python3 ml_explainability.py
```

**SHAP Mean |Values|:**

**overallScore:**

```
1. dx_tp_interaction - 2.517
2. bi_featureSuccessRate - 2.505
3. dx_codeReviewDuration - 1.054
```

**timeToMarket:**

```
1. dx_codeReviewDuration - 5.451
   → 1 година review = +5.5 години delivery delay!
```

**communityGrowth:**

```
1. tp_testCoverage - 14.280 (dominant!)
   → +10% coverage = +70 stars/month
```

**Згенеровані візуалізації (reports/ml/):**

1. `13_feature_selection.png` - Correlation heatmap
2. `14_model_comparison.png` - R² bar charts
3. `15_learning_curves.png` - Train/val/test curves
4. `16_residual_plots.png` - Residual analysis
5. `17_feature_importance_comparison.png` - RF vs XGBoost
6. `18_predictions_vs_actual.png` - Scatter plots
7. `19_shap_summary.png` - SHAP importance
   8-10. `20_shap_dependence_*.png` - SHAP dependence plots
8. `21_cv_scores_distribution.png` - CV boxplots

**Comprehensive Report:** `reports/ml_modeling_report.md` (50 стор.)

---

## Temporal аналіз

### Фаза 2.3: Temporal Data Collection & Analysis

#### Збір temporal даних

```bash
# Collect 6 months of data (April-September 2025)
node packages/scripts/src/temporal-metrics-report.mjs
```

**Output:**

- `metrics_report_temporal.json` (297KB, 300 snapshots)
- `metrics_report_temporal_long.csv` (58KB, long format)

**Time series:**

- 50 проектів × 6 місяців = 300 snapshots
- Time range: 2025-04-01 to 2025-09-30
- Collection time: ~75 minutes

#### Time series analysis

```bash
cd analysis
python3 temporal_analysis.py
```

**Що аналізується:**

- EDA та trends
- Seasonal decomposition (trend, seasonal, residual)
- ACF/PACF (autocorrelation functions)
- Stationarity tests (ADF, KPSS)
- Change point detection
- Volatility analysis

**Згенеровані візуалізації (reports/temporal/):**

1. `01_metrics_trends_over_time.png` - Time series plots
2. `02_project_trajectories.png` - Individual project paths
3. `03_seasonal_decomposition.png` - Trend + seasonal + residual
4. `04_acf_pacf_plots.png` - Autocorrelation functions
5. `05_change_point_detection.png` - Structural breaks
6. `06_volatility_analysis.png` - Rolling std deviation

#### Temporal feature engineering

```bash
python3 temporal_feature_engineering.py
```

**Створює 297 нових features:**

- Lags (1-3 periods)
- Rolling statistics (2-3 months windows):
  - Mean, median, std, min, max
- Trends (linear slopes)
- Momentum (differences)
- Volatility (rolling std)

**Output:** `reports/temporal/temporal_features.csv` (315 total features)

#### Temporal modeling

```bash
python3 temporal_modeling.py
```

**ARIMA Forecasting:**

```
dx_codeReviewDuration:
  MAE = 8.12%, RMSE = 14.28%

bi_timeToMarket:
  MAE = 9.87%, RMSE = 13.45%

bi_communityGrowth:
  MAE = 11.23%, RMSE = 15.67%
```

**Random Forest с TimeSeriesSplit CV (3-fold):**

```
bi_timeToMarket:
  R² = 0.782, RMSE = 9.96, MAE = 3.07

bi_communityGrowth:
  R² = 0.928, RMSE = 6.66, MAE = 4.16
```

**Top temporal predictors:**

- For timeToMarket: rolling 2-month max/mean/min (0.357-0.103)
- For communityGrowth: rolling 3-month mean/max (0.176-0.169)

**Output:** `reports/temporal_implementation_summary.md` (15 розділів)

---

## Інтерпретація результатів

### Ключові практичні insights

#### 1. Code Review Speed Critical

**Finding:** `dx_codeReviewDuration` має найбільший impact на delivery.

**Recommendation:**

- Target SLA: <48 годин
- Automated checks (CI/CD)
- Smaller PRs (<400 lines)

**ROI calculation:**

```
Current: 8 годин review/PR
Target: 2 години review/PR
Savings: 6 годин × 1.3 = 7.8 годин delivery delay
≈ 1 робочий день per feature
```

#### 2. Test Coverage Drives Community

**Finding:** `tp_testCoverage` має 83% importance для community growth.

**Recommendation:**

- Target: >85% coverage
- Infrastructure: Jest, Vitest, Playwright
- Display badges (quality signal)

**Impact:**

```
+10% test coverage → +70 stars/month
80% → 90% coverage = +700 stars over 10 months
```

#### 3. Interaction Effects Matter

**Finding:** `dx_tp_interaction` є найважливішою feature (47% importance).

**Recommendation:**

- Invest in BOTH DX tools AND TP infrastructure
- Developer Experience та Technical Performance work synergistically
- Don't prioritize one over the other

#### 4. Linear Models Beat Complex

**Finding:** Linear Regression outperforms RF, XGBoost на малому dataset.

**Explanation:**

- Small dataset (n=50) → simple models generalize better
- Complex models overfit (train R²=1.000, test R²=0.589)

**Action:** Expand dataset to 150+ projects для складніших моделей.

### Обмеження дослідження

#### Critical Limitations

1. **Small dataset (n=50)**

   - R² below target 0.75 (max 0.66)
   - High variance у CV scores
   - Solution: Collect 150+ projects

2. **Selection bias**

   - Only popular projects (>5000 stars)
   - May not represent smaller projects
   - Solution: Include 1000-5000 stars projects

3. **Temporal scope**

   - 6 місяців historical data
   - Single point-in-time for cross-sectional
   - Solution: Extend to 12-24 months

4. **Correlation ≠ Causation**
   - Observational study, not RCT
   - Cannot prove causal relationships
   - Solution: A/B testing з pilot teams

---

## Troubleshooting

### GitHub API Issues

#### Rate Limit Hit

**Symptom:**

```
⚠ [5/50] Rate limit hit, retrying in 60s...
```

**Solution:**

- Automatic retry implemented
- Wait time: 60s default
- Check: `curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/rate_limit`

**Prevention:**

- Use `--existingReport` для incremental updates
- Reduce `--projects` list
- Schedule collection during off-peak hours

#### Invalid Token

**Symptom:**

```
❌ GitHub API authentication failed
Error: Bad credentials
```

**Solution:**

1. Verify token: `echo $GITHUB_TOKEN`
2. Check token permissions (repo, user:read)
3. Regenerate token if expired

#### 404 Not Found

**Symptom:**

```
⚠ [12/50] Project "old-repo" not found, skipping...
```

**Solution:**

- Verify repository exists: https://github.com/owner/repo
- Check repository visibility (public required)
- Update `input/projects.json` if renamed/archived

### Python Analysis Issues

#### Missing Packages

**Symptom:**

```
ModuleNotFoundError: No module named 'pandas'
```

**Solution:**

```bash
# Install missing package
uv pip install pandas

# Or install all
uv pip install pandas numpy scikit-learn matplotlib seaborn scipy statsmodels xgboost lightgbm
```

#### Memory Error

**Symptom:**

```
MemoryError: Unable to allocate array
```

**Solution:**

- Close other applications
- Reduce dataset size (use --projects subset)
- Increase swap space
- Use `gc.collect()` в Python scripts

#### Plot Display Issues

**Symptom:**

```
UserWarning: Matplotlib is currently using agg, which is a non-GUI backend
```

**Solution:**

```python
# In Python script
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
```

### Build Issues

#### Nx Build Fails

**Symptom:**

```
❌ Failed to build @thesis/metrics
```

**Solution:**

```bash
# Clear Nx cache
npx nx reset

# Rebuild
npx nx build @thesis/metrics

# Check dependencies
npm list --depth=0
```

#### TypeScript Errors

**Symptom:**

```
error TS2322: Type 'string' is not assignable to type 'number'
```

**Solution:**

```bash
# Check TypeScript version
npx tsc --version

# Rebuild with clean slate
rm -rf node_modules package-lock.json
npm install
npx nx build --all
```

---

## FAQ

### Загальні питання

**Q: Скільки часу займає збір метрик для 50 проектів?**

A: Близько 10-15 хвилин. Кожен проект займає ~10-30 секунд залежно від:

- Кількості PR/issues
- GitHub API rate limits
- Мережевої швидкості

**Q: Чи можна збирати метрики для приватних репозиторіїв?**

A: Ні, поточна система підтримує тільки public repositories. Для приватних потрібно:

- Додати `repo` (full) permissions до GitHub token
- Модифікувати `GitHubCollector` для приватного доступу

**Q: Як додати новий проект до аналізу?**

A: Відредагуйте `input/projects.json`:

```json
{
  "name": "MyProject",
  "github": "owner/repo",
  "category": "Core Framework",
  "tier": 1
}
```

Потім запустіть:

```bash
node packages/scripts/src/detailed-metrics-report.mjs \
  --existingReport reports/metrics_report.json
```

**Q: Що означає "confidence" у результатах?**

A: Confidence (90%) показує надійність зібраних метрик. Залежить від:

- Completeness даних (наявність всіх метрик)
- Data freshness (актуальність даних)
- API reliability (успішність запитів)

### Технічні питання

**Q: Чому R² такий низький (0.625)?**

A: Small dataset (n=50) обмежує predictive power. Рішення:

- Expand dataset до 150+ projects для R² > 0.75
- Використовувати linear models (generalize краще)
- Додати temporal features (297 нових)

**Q: Як інтерпретувати SHAP values?**

A: SHAP value показує contribution кожної feature до prediction:

- Positive SHAP → збільшує predicted value
- Negative SHAP → зменшує predicted value
- |SHAP| → magnitude of impact

Приклад:

```
dx_codeReviewDuration SHAP = -2.5
→ Higher review duration → Lower overall score (-2.5 points)
```

**Q: Чому деякі моделі показують negative R² на CV?**

A: Це нормально для малих datasets:

- Model overfits на train set
- Poor generalization на validation folds
- Рішення: Використовувати simpler models (Linear, Ridge)

**Q: Як обрати оптимальну кількість features?**

A: Feature selection базується на:

- Correlation threshold (r > 0.95 видаляємо)
- VIF (multicollinearity <10)
- Domain knowledge (логічна важливість)
- Model performance (cross-validation)

Поточний вибір: 24 features (з 126 engineered)

### Практичні питання

**Q: Як використовувати результати для покращення команди?**

A: Top 3 actionable recommendations:

1. **Optimize code review process:**

   - Target: <48h review time
   - ROI: 1 day faster delivery per feature

2. **Invest in test coverage:**

   - Target: >85% coverage
   - Impact: +70 stars/month community growth

3. **Balance DX and TP:**
   - Don't prioritize one over other
   - Interaction effects critical (47% importance)

**Q: Чи можна використовувати систему для non-TypeScript проектів?**

A: Так, але потрібні модифікації:

- Замінити `typeScriptErrorRate` на generic static analysis
- Адаптувати `bundleSize` метрики для non-web projects
- Налаштувати outcome metrics під специфіку мови

**Q: Як часто треба оновлювати метрики?**

A: Залежить від use case:

- **Research:** 1 раз (single snapshot)
- **Tracking:** Щомісяця (temporal trends)
- **Real-time monitoring:** Щотижня (continuous improvement)

Поточне дослідження: 6 snapshots over 6 months (Phase 2.3)

---

## Додаткові ресурси

### Документація

- [Architecture Guide](./architecture.md) - Система архітектури
- [Best Practices Guide](./best_practices.md) - Рекомендації
- [Replication Package](./replication_package.md) - Відтворення дослідження

### Звіти

- [Data Validation Report](../reports/data_validation_report.md) - EDA
- [Statistical Analysis Report](../reports/statistical_analysis_report.md) - Statistics
- [ML Modeling Report](../reports/ml_modeling_report.md) - Machine Learning
- [Temporal Implementation](../reports/temporal_implementation_summary.md) - Time series

### External Links

- [SPACE Framework](https://queue.acm.org/detail.cfm?id=3454124) - Productivity measurement
- [DORA Metrics](https://dora.dev/) - DevOps performance
- [DevEx](https://queue.acm.org/detail.cfm?id=3595878) - Developer Experience
- [GitHub API Docs](https://docs.github.com/en/rest) - API reference

---

**Версія:** 1.0.0
**Дата оновлення:** 13 листопада 2025 р.
**Автор:** Konstantin Kai, Одеський політехнічний університет
