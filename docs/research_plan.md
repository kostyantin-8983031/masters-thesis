# План проведення дослідження outcome-based якості TypeScript коду

## 🎯 Мета дослідження

Дослідити кореляцію між статичними метриками TypeScript коду та реальними outcome результатами (продуктивність розробників, якість продукту, бізнес-метрики) на основі аналізу популярних open source проєктів веб-розробки.

---

## 📈 Загальний прогрес: 100% (6 з 6 підфаз завершено)

- **✅ Фаза 1 (Місяць 1): Data Collection** - ЗАВЕРШЕНО 100%
- **✅ Фаза 2.1 (Тижні 1-2): Data Validation & Exploration** - ЗАВЕРШЕНО 100%
- **✅ Фаза 2.2 (Тижні 3-4): Statistical Analysis & Feature Engineering** - ЗАВЕРШЕНО 100%
- **✅ Фаза 2.3 (Додаткова): Temporal Data Collection & Analysis** - ЗАВЕРШЕНО 100%
- **✅ Фаза 3 (Місяць 3): ML Modeling** - ЗАВЕРШЕНО 100%
- **✅ Фаза 4 (Місяць 4): Implementation & Documentation** - ЗАВЕРШЕНО 100%

**Останнє оновлення:** 13 листопада 2025 р.

---

## 📊 Поточний прогрес

### ✅ Завершено

**Фаза 1, Тижні 1-2: Infrastructure Setup**

- ✅ GitHub API колектори (`@thesis/metrics-collector`) - `GitHubCollector`, `RealMetricsCollector`
- ✅ Система метрик (`@thesis/metrics`) - повний набір outcome-based метрик
- ✅ CLI інструменти (`@thesis/scripts`) - `detailed-metrics-report.mjs` з підтримкою параметрів
- ✅ Data pipeline з підтримкою кешування - `--existingReport` для інкрементальних оновлень
- ✅ Multi-format звітність (JSON, CSV, Markdown) - автоматична генерація трьох форматів
- ✅ Конфігурація 50 TypeScript проектів - `input/projects.json`

**Фаза 1, Тижні 3-4: Project Analysis**

- ✅ Збір метрик для всіх 50 проектів - ЗАВЕРШЕНО (42 проекти 02.10.2025, 8 проектів 09.10.2025)
- ✅ Automated metrics collection через GitHub API
- ✅ Базова валідація даних (0 помилок у звіті)

**Фаза 2.1: Data Validation & Exploration**

- ✅ Deep data validation та cleaning - ЗАВЕРШЕНО (10.10.2025)
- ✅ Exploratory data analysis (EDA) - ЗАВЕРШЕНО (10.10.2025)
- ✅ Перевірка якості зібраних метрик - 100% completeness, 0 missing values
- ✅ Виявлення outliers та аномалій - 13 метрик з outliers ідентифіковано
- ✅ Data visualization - 7 візуалізацій згенеровано (300 DPI PNG)
- ✅ Статистичний аналіз - descriptive statistics, correlation matrix, outliers (IQR)
- ✅ Звіт аналізу - data_validation_report.md (31 стор.)

**Фаза 2.2: Statistical Analysis & Feature Engineering**

- ✅ Hypothesis Testing - ЗАВЕРШЕНО (10.10.2025)
- ✅ Regression Analysis - ЗАВЕРШЕНО (10.10.2025)
- ✅ Cluster Analysis - ЗАВЕРШЕНО (10.10.2025)
- ✅ PCA Analysis - ЗАВЕРШЕНО (10.10.2025)
- ✅ Feature Engineering - ЗАВЕРШЕНО (10.10.2025)
- ✅ Advanced Statistical Analysis - ЗАВЕРШЕНО (10.10.2025)
- ✅ Comprehensive звіт - statistical_analysis_report.md (40 стор.)

**Фаза 2.3: Temporal Data Collection & Analysis** (ДОДАТКОВА ФАЗА) ✅ ЗАВЕРШЕНО (13.10.2025)

- ✅ Infrastructure Setup - ЗАВЕРШЕНО (10.10.2025)

  - GitHubCollector temporal support (filterByDate, collectHistoricalTimeSeries)
  - CLI tool: temporal-metrics-report.mjs з --existingReport support
  - Rate limit handling (auto-retry on 403 Forbidden)
  - Build & compilation успішні

- ✅ Temporal Data Collection - ЗАВЕРШЕНО (13.10.2025)

  - 50 проєктів × 6 місяців = **300 snapshots (100% success)**
  - Time range: April 2025 - September 2025
  - Total collection time: ~75 minutes
  - Key improvements:
    - ✅ Rate limit auto-handling (encountered on project #49)
    - ✅ Incremental collection з --existingReport merge
    - ✅ Error recovery (automatic wait & retry)
  - Output size: 291KB JSON, 58KB CSV

- ✅ Analysis Scripts - ЗАВЕРШЕНО (13.10.2025)

  - `temporal_analysis.py` - EDA, trends, decomposition, ACF/PACF, stationarity tests
  - `temporal_feature_engineering.py` - **297 temporal features** (lags, rolling, trends, momentum, volatility)
  - `temporal_modeling.py` - ARIMA forecasting + TimeSeriesSplit CV
  - 6 visualizations (300 DPI PNG)
  - 8 CSV statistical files

- ✅ Documentation - ЗАВЕРШЕНО (13.10.2025)
  - `temporal_implementation_summary.md` (comprehensive, 15 розділів)
  - Updated `research_plan.md` (Phase 2.3 → COMPLETED)

**Final Results:**

- ✅ Dataset: 300 complete snapshots (50 projects × 6 months)
- ✅ Features: 297 new temporal features + 18 original = **315 total features**
- ✅ ARIMA Forecasting: 8-14% error (dx_codeReviewDuration, bi_timeToMarket, bi_communityGrowth)
- ✅ Random Forest CV: **R² = 0.782-0.928** (TimeSeriesSplit, 3-fold)
  - bi_timeToMarket: R² = 0.782, RMSE = 9.96, MAE = 3.07
  - bi_communityGrowth: R² = 0.928, RMSE = 6.66, MAE = 4.16
- ✅ Top temporal predictors:
  - For timeToMarket: rolling 2-month max/mean/min (importance: 0.357-0.103)
  - For communityGrowth: rolling 3-month mean/max (importance: 0.176-0.169)
- ✅ Visualizations: 6 PNG files (trends, trajectories, decomposition, ACF/PACF, change detection, volatility)
- ✅ Statistical outputs: 8 CSV files (statistics, stationarity, change analysis, volatility, forecasts, CV results, feature importance)

**Фаза 3: ML Modeling & Predictive Analysis**

- ✅ Data Preparation & Feature Selection - ЗАВЕРШЕНО (10.10.2025)
- ✅ Model Training & Evaluation (7 моделей) - ЗАВЕРШЕНО (10.10.2025)
- ✅ Cross-Validation (5-fold CV) - ЗАВЕРШЕНО (10.10.2025)
- ✅ Feature Importance Analysis (RF + XGBoost) - ЗАВЕРШЕНО (10.10.2025)
- ✅ Model Explainability (SHAP) - ЗАВЕРШЕНО (10.10.2025)
- ✅ Predictions Analysis - ЗАВЕРШЕНО (10.10.2025)
- ✅ Comprehensive звіт - ml_modeling_report.md (50 стор.)

**Фаза 4: Implementation & Documentation** ✅ ЗАВЕРШЕНО (19.11.2025)

- ✅ Comprehensive Documentation - ЗАВЕРШЕНО (13.11.2025)

  - `docs/architecture.md` - System architecture guide (8000+ слів)
  - `docs/usage_guide.md` - Complete usage instructions (10000+ слів)
  - `docs/best_practices.md` - Practical recommendations (8000+ слів)
  - `docs/replication_package.md` - Full replication guide (7000+ слів)

- ✅ Practical CLI Tool - ЗАВЕРШЕНО (19.11.2025)
  - `quality-dashboard.mjs` - Практичний інструмент аналізу проєктів
  - Composite Quality Score з breakdown по категоріях (DX, TP, BI)
  - Benchmark comparison (percentile ranking серед 50 проєктів)
  - Trend prediction на основі SHAP values та regression coefficients
  - Actionable recommendations з ROI calculations (929% для code review, 74% для test coverage)
  - Terminal та JSON output formats для інтеграції

**Documentation deliverables:**

1. **System Architecture Documentation** (docs/architecture.md)

   - Overview системи та компонентів
   - Технологічний стек (TypeScript + Python)
   - Data pipeline (Phase 1-3)
   - Інтеграція компонентів
   - Розгортання та запуск
   - Масштабованість та обмеження
   - Безпека та приватність

2. **Usage Guide** (docs/usage_guide.md)

   - Швидкий старт (5 хвилин)
   - Встановлення та налаштування
   - Збір метрик (cross-sectional + temporal)
   - Статистичний аналіз (Phase 2.1-2.3)
   - ML моделювання (Phase 3)
   - Інтерпретація результатів
   - Troubleshooting
   - FAQ

3. **Best Practices Guide** (docs/best_practices.md)

   - Outcome-based філософія
   - Три стовпи якості (DX, TP, BI)
   - Ключові метрики та цільові значення
   - Практичні рекомендації (Priority 1-3)
   - Анті-патерни
   - Впровадження у команді (4 phases)
   - ROI калькуляція
   - Case Studies (Angular, Redux, Valtio)
   - Інструменти та автоматизація

4. **Replication Package** (docs/replication_package.md)
   - Огляд дослідження
   - Системні вимоги
   - Встановлення (step-by-step)
   - Dataset опис
   - Відтворення кроків (Phase 1-3)
   - Очікувані результати
   - Валідація результатів
   - Розширення дослідження
   - Citation (BibTeX, APA, IEEE)

**Key insights documented:**

- **Finding 1:** Code review duration критичний для delivery (r = 0.88)

  - Recommendation: <48h SLA, automated checks, smaller PRs
  - ROI: 929% (saves 1 day per feature)

- **Finding 2:** Test coverage drives community growth (r = 0.77)

  - Recommendation: >85% target, quality badges
  - Impact: +70 stars/month per 10% increase

- **Finding 3:** Interaction effects DX × TP critical (47% importance)
  - Recommendation: 50/50 budget allocation
  - Synergistic improvements

**Documentation statistics:**

- Total pages: ~120 (33,000+ words)
- Code examples: 100+
- Visualizations referenced: 35+
- Best practices: 30+
- ROI calculations: 3 detailed

### ❌ Відкладено на майбутнє (Stretch Goals)

**Additional tools** (Optional):

- ✅ CLI tool для real-time quality analysis - `quality-dashboard.mjs` ЗАВЕРШЕНО
- ❌ VS Code extension для real-time quality scoring
- ❌ Web dashboard для project analysis
- ❌ Real-world testing з pilot teams

**Note:** Практичний CLI tool `quality-dashboard.mjs` реалізований і демонструє застосування результатів ML-моделювання. VS Code extension та web dashboard відкладено на post-graduation.

### 🔮 Відкладено на майбутнє

- 🔮 **Survey distribution** до contributors (опціонально, може бути додано у майбутньому дослідженні)

---

## 📈 Статистика зібраних даних

**Станом на 09.10.2025:**

### Загальна інформація

- **Кількість проектів:** 50/50 (100%)
- **Успішно зібрано:** 50 (0 помилок)
- **Середня довіра даних:** 90.0%
- **Загальний розмір датасету:** ~56KB JSON

### Метрики якості

- **Середня оцінка проектів:** 70.7/100
- **Діапазон оцінок:** 57-85/100
- **Стандартне відхилення:** 6.5

### За категоріями

- **Developer Experience:** середня 23.9/100 (діапазон 3-34)
- **Technical Performance:** середня 75.5/100 (діапазон 72-81)
- **Business Impact:** середня 15.3/100 (діапазон 5-30)

### Топ-3 проекти

1. **pmndrs/valtio** - 85/100
2. **nestjs/nest** - 84/100
3. **reduxjs/redux** - 84/100

### Дати збору

- **02.10.2025:** 42 проекти (84%)
- **09.10.2025:** 8 проектів (16%)

### Наявні звіти

- `reports/metrics_report.json` - детальні дані (56KB)
- `reports/metrics_report.csv` - для Excel аналізу (14KB)
- `reports/metrics_report.md` - читабельний звіт
- `reports/processed_metrics.csv` - оброблений датасет (14KB, 22 колонки)
- `reports/data_validation_report.md` - повний аналіз даних (31 стор.)

### Результати Data Validation & Exploration (10.10.2025)

**Якість даних:**

- ✅ Completeness: 100% (0 missing values)
- ✅ 50 проектів × 20 числових метрик = 1000 data points
- ✅ Confidence: 90% для всіх проектів
- ✅ Жодних критичних аномалій

**Ключові insights:**

- **Найсильніша кореляція:** bundleSize ↔ bundleLoadTime (r = 1.000) - очікувано
- **Технічна якість:** Test Coverage ↔ Technical Performance Score (r = 0.72)
- **Developer Experience:** Code Review Duration < 48h → +15% Overall Score
- **Outliers:** 13 метрик мають outliers (виявлено через IQR метод)
- **Розподіл:** Overall Score нормально розподілений (μ = 70.3, σ = 6.4)

**Згенеровані візуалізації (reports/analysis/):**

1. Overall Score Distribution - histogram + boxplot
2. Category Scores Boxplot - порівняння DX, TP, BI
3. Correlation Matrix - heatmap 20×20 метрик
4. Outliers Detection - boxplots для метрик з outliers
5. Metrics Distributions - 8 ключових метрик
6. Top/Bottom Projects - топ-10 та найгірші-10
7. Scatter Matrix - кореляції між ключовими метриками

**Статистичні файли (reports/analysis/):**

- `descriptive_statistics.csv` - описова статистика для всіх метрик
- `correlation_matrix.csv` - повна кореляційна матриця 20×20
- `top_correlations.csv` - топ кореляцій (відсортовано)
- `outliers_iqr.csv` - метрики з outliers (IQR метод)

### Результати Statistical Analysis & Feature Engineering (10.10.2025)

**1. Hypothesis Testing:**

- ✅ Перевірено: 171 пару метрик
- ✅ Значущих кореляцій (p < 0.05): 26 (15.2%)
- ✅ Значущих після FDR correction: 14 (8.2%)
- 🔥 **Топ predictor:** codeReviewDuration ↔ timeToMarket (r = 0.881, p < 10⁻¹⁶)
- 🎯 **Key insight:** testCoverage ↔ communityGrowth (r = 0.772, p < 10⁻¹⁰)

**2. Regression Analysis:**

- ✅ 3 моделі побудовано (OLS regression)
- 🏆 **Best model:** Time to Market ~ DX metrics (R² = 0.784, adj R² = 0.760)
  - codeReviewDuration є домінуючим предиктором (β = 0.027, p < 10⁻¹³)
  - **Interpretation:** кожна година code review додає ~0.027 дня до time to market
- 📈 **Community Growth ~ TP metrics:** R² = 0.732 (testCoverage основний predictor)
- 📊 **Overall Score ~ Categories:** R² = 0.173 (TP найважливіша категорія)

**3. Cluster Analysis:**

- ✅ Оптимальна кількість кластерів: k = 2 (Silhouette Score = 0.212)
- **Cluster 0 "Складні проєкти"** (n=11, 22%):
  - Високий codeReviewDuration (851 год ≈ 35 днів)
  - Нижчий overallScore (65.3)
  - Приклади: TypeScript, Storybook
- **Cluster 1 "Ефективні проєкти"** (n=39, 78%):
  - Швидкі code reviews (175 год ≈ 7 днів)
  - Вищий overallScore (72.2)
  - Приклади: Angular, NestJS, Chakra UI

**4. PCA (Principal Component Analysis):**

- ✅ 10 компонент для 90% explained variance
- **PC1 (19.9%):** "Project Size & Complexity"
  - Loadings: bundleSize (+0.41), overallScore (-0.34)
- **PC2 (18.5%):** "Community Success & Delivery Speed"
  - Loadings: communityGrowth (+0.40), codeReviewDuration (-0.38)
- **Insight:** Дані багатовимірні, потрібні всі компоненти

**5. Feature Engineering:**

- ✅ Створено 100 нових features (19 original → 126 total)
- **Top engineered feature:** dx_codeReviewDuration_log (r = -0.582 з overallScore)
  - Log transformation покращила predictive power на 34% (vs r = -0.434 original)
- **Типи features:**
  - 5 interaction features (dx × tp, tp × bi, etc.)
  - 5 polynomial features (squared terms)
  - 4 log transformations (для skewed metrics)
  - 4 ratio features (efficiency metrics)
  - 2 categorical features (binning)
  - 80 scaled features (StandardScaler + MinMaxScaler)
- ✅ Dataset готовий для ML modeling (Фаза 3)

**6. Advanced Statistical Analysis:**

- **Mediation Analysis (DX → TP → BI):**
  - ❌ НЕ підтверджена (proportion mediated: -6.3%)
  - Висновок: DX та TP є незалежними категоріями
- **Partial Correlations:**
  - testCoverage ↔ communityGrowth: r = 0.768 (controlling codeReviewDuration)
  - Зв'язок справжній, не confounder effect
- **Variance Decomposition:**
  - Technical Performance: +10.6% R² (найбільший вклад)
  - Developer Experience: +6.3% R²
  - Business Impact: +0.4% R² (мінімальний)

**Згенеровані файли (reports/statistical/):**

**CSV (8 files):**

1. `hypothesis_tests.csv` - 171 пару, p-values, CIs, FDR correction
2. `regression_summary.csv` - 3 моделі, R², F-statistics
3. `regression_coefficients.csv` - coefficients, p-values, VIF
4. `cluster_assignments.csv` - 50 проектів з cluster IDs
5. `pca_loadings.csv` - feature loadings для всіх PCs
6. `engineered_features.csv` - 50 × 126 features
7. `feature_importance.csv` - correlation з overallScore
8. `advanced_analysis_results.json` - mediation, partial correlations

**Visualizations (5 PNG, 300 DPI):**

1. `08_regression_analysis.png` - 4 regression plots
2. `09_optimal_clusters.png` - Elbow + Silhouette
3. `10_hierarchical_dendrogram.png` - dendrogram
4. `11_pca_explained_variance.png` - scree plot + cumulative
5. `12_pca_biplot_clusters.png` - PC1 vs PC2 з кластерами

**Comprehensive звіт:**

- `statistical_analysis_report.md` - 40 стор., детальні insights, практичні рекомендації

**🎯 Ключові практичні рекомендації:**

1. **Оптимізувати code review process** (найбільший ROI):

   - SLA < 48 годин
   - Automated checks (CI/CD)
   - Smaller PRs (< 400 lines)
   - Savings: 12 днів faster delivery

2. **Інвестувати в test coverage** (target > 85%):

   - Сильна кореляція з community growth
   - Signal якості для contributors
   - Infrastructure: Jest, Vitest, Playwright

3. **Пріоритизувати Technical Performance**:
   - Найбільший вплив на overall score (10.6% variance)
   - Focus: test coverage, bundle size, performance score

### Результати ML Modeling & Predictive Analysis (10.10.2025)

**1. Dataset & Feature Selection:**

- ✅ Початковий dataset: 50 проектів × 116 engineered features (після data leakage fix)
- ✅ Feature selection:
  - Видалено 79 highly correlated features (r > 0.95)
  - Видалено scaled duplicates (залишено original versions)
  - **Final:** 24 selected features для modeling (було 28 з leakage)
- ✅ Train/Val/Test split: 70/15/15 (34/8/8 проектів)
- ✅ **Data Leakage FIXED:** Excluded all target transformations (Oct 10, 2025)

**2. Model Performance (Test Set):**

**Target 1: overallScore** (загальна якість проєкту)

- 🏆 **Best Model:** Linear Regression
- **Test R² = 0.625** (realistic, after data leakage fix)
- RMSE = 5.116 points, MAE = 3.836 points
- Predictive power обмежена small dataset (n=50)

**Target 2: timeToMarket** (час доставки features)

- 🏆 **Best Model:** Lasso
- **Test R² = 0.663** (realistic, after data leakage fix)
- RMSE = 7.835 hours, MAE = 6.016 hours
- ✅ Leaked features removed (`bi_timeToMarket_std`)

**Target 3: communityGrowth** (ріст спільноти)

- 🏆 **Best Model:** Lasso
- **Test R² = 0.394** (realistic, after data leakage fix)
- RMSE = 8.231 stars/month, MAE = 6.233 stars/month
- ✅ Leaked features removed (`bi_communityGrowth_log`, `bi_communityGrowth_std`)

**Інші моделі (after leakage fix):**

- Ridge: R²=0.01-0.63 (L2 regularization)
- ElasticNet: R²=-0.10 to 0.65 (L1+L2 regularization)
- XGBoost: R²=-0.64 to 0.62 (overfitting на малому dataset)
- Random Forest: R²=0.12-0.48 (moderate)
- LightGBM: R²=-2.32 to -0.03 (failed на small dataset)

**3. Cross-Validation Results (5-Fold CV, after fix):**

- **overallScore:** CV unstable (negative mean scores) - малий dataset
- **timeToMarket:** CV improved (Lasso mean=-0.40, σ=1.02)
- **communityGrowth:** CV stable (ElasticNet mean=0.86, σ=0.13)
- **Висновок:** Realistic CV scores після fix data leakage

**4. Feature Importance Analysis (after leakage fix):**

**XGBoost Top-3 per Target:**

**overallScore:**

1. `dx_tp_interaction` - 47.5% (DX × TP interaction, dominant!)
2. `bi_featureSuccessRate` - 26.8%
3. `tp_typeScriptErrorRate` - 7.3%

**timeToMarket:**

1. `dx_codeReviewDuration` - 40.5% (direct impact!)
2. `bi_issueResolutionRate` - 20.5%
3. `bi_activeContributors` - 8.5%

**communityGrowth:**

1. `tp_testCoverage` - 83.4% (dominant predictor!)
2. `avg_bi` - 10.8%
3. `dx_debuggingTime` - 2.1%

**5. Model Explainability (SHAP Values, after fix):**

**SHAP Top-3 Features:**

**overallScore:**

1. `dx_tp_interaction` - Mean |SHAP| = 2.517
2. `bi_featureSuccessRate` - Mean |SHAP| = 2.505
3. `dx_codeReviewDuration` - Mean |SHAP| = 1.054

**timeToMarket:**

1. `dx_codeReviewDuration` - Mean |SHAP| = 5.451
   - 1 година review → +5.5 години delivery delay!

**communityGrowth:**

1. `tp_testCoverage` - Mean |SHAP| = 14.280 (dominant!)
   - +10% test coverage → сильний impact на community growth

**6. Key Findings & Practical Insights:**

**Finding 1: Interaction Effects Critical**

- `dx_tp_interaction` є найважливішою feature (33-54% importance)
- Developer Experience AND Technical Performance work synergistically
- **Actionable:** Invest in both DX tools AND TP infrastructure

**Finding 2: Test Coverage Drives Community Growth**

- Test coverage має 93% importance (XGBoost) для community growth
- +10% coverage → +70 stars/month
- **Actionable:** Prioritize testing (Jest, Vitest, Playwright), display badges

**Finding 3: Code Review Speed Critical for Delivery**

- Code review duration directly impacts time to market
- 1 hour review → 1.3 hours delivery delay
- **Actionable:** SLA <48h, automated checks, smaller PRs (<400 lines)
- **ROI:** 8h→2h review saves 7.8h = ~1 work day per feature

**Finding 4: Linear Models Best for Small Datasets**

- Linear Regression outperforms complex models (RF, XGBoost)
- Small dataset (n=50) → simple models generalize better
- Complex models overfit (train R²=1.000, test R²=0.589)

**7. Згенеровані файли (reports/ml/, regenerated after fix):**

**CSV Files (14):**

1. `selected_features.csv` - **24 final features** (було 28)
2. `train_test_split.csv` - split info
3. `model_performance.csv` - all 7 models × 3 targets = 21 rows (updated)
4. `cv_scores.csv` - 5-fold CV results (realistic)
5. `feature_importance_rf_*.csv` - RF importance (3 targets, updated)
6. `feature_importance_xgb_*.csv` - XGBoost importance (3 targets, updated)
7. `shap_importance_*.csv` - SHAP values (3 targets, updated)
8. `predictions_comparison.csv` - actual vs predicted (realistic)

**Visualizations (11 PNG, 300 DPI):**

1. `13_feature_selection.png` - correlation heatmap top-30 features
2. `14_model_comparison.png` - R² comparison bar charts (3 targets)
3. `15_learning_curves.png` - train/val/test curves (9 subplots)
4. `16_residual_plots.png` - residual analysis (3 targets)
5. `17_feature_importance_comparison.png` - RF vs XGBoost (3 targets)
6. `18_predictions_vs_actual.png` - scatter plots (3 targets)
7. `19_shap_summary.png` - SHAP importance bar plots (3 targets)
   8-10. `20_shap_dependence_*.png` - SHAP dependence plots (3 targets)
8. `21_cv_scores_distribution.png` - CV boxplots (3 targets)

**Comprehensive Report:**

- `ml_modeling_report.md` - **50 стор.**, comprehensive analysis, limitations, future work

**8. Limitations Identified:**

✅ **FIXED (Oct 10, 2025):**

1. ~~**Data leakage**~~ - ✅ FIXED! Excluded all target transformations

⚠️ **Critical:**

2. **Small dataset** (n=50) - R² below target 0.75, high variance

⚠️ **Medium:**

3. **Selection bias** - only popular projects (>5000 stars)
4. **No temporal data** - single point-in-time measurement
5. **No causality** - correlation ≠ causation

**9. Success Criteria (Updated after fix):**

- ⚠️ **R² > 0.75:** NOT achieved (max R²=0.66) - need 150+ projects
- ✅ **Realistic predictions:** All R² < 0.80, no overfitting
- ✅ **Data Leakage FIXED:** Safeguard implemented
- ✅ **7 algorithms compared:** Linear, Ridge, Lasso, ElasticNet, RF, XGBoost, LightGBM
- ✅ **Feature importance validated:** Consistent across RF, XGBoost, SHAP
- ✅ **Practical recommendations:** Provided з ROI calculations

**10. Next Steps (Updated Priority):**

1. ~~**IMMEDIATE:** Fix data leakage~~ - ✅ COMPLETED (Oct 10, 2025)
2. **HIGH:** Expand dataset to 150+ projects for R² > 0.75
3. **MEDIUM:** Temporal validation - collect historical data
4. **LOW:** Deep learning models (after dataset expansion)

---

## 📋 Методологія дослідження

### Фаза 1: Збір даних (Місяць 1)

1. **Вибір open source проєктів**
2. **Збір статичних метрик коду**
3. **Збір outcome метрик з GitHub API**
4. ~~**Створення опитувань для контриб'юторів**~~ _(відкладено на майбутнє)_

### Фаза 2: Аналіз даних (Місяць 2)

1. **Статистичний аналіз кореляцій**
2. **Виявлення паттернів та залежностей**
3. **Validation результатів**
4. **Визначення key metrics та predictors**

### Фаза 3: Моделювання (Місяць 3)

1. **Побудова ML моделей**
2. **Тренування та валідація**
3. **Тестування predictive здатності**

### Фаза 4: Практична реалізація (Місяць 4)

1. **Розробка MVP системи**
2. **Тестування з реальними командами**
3. **Документація та публікація**

---

## 🎯 Критерії вибору проєктів

### Основні вимоги

- **TypeScript** основна мова (>70% codebase)
- **Веб-орієнтовані** проєкти (frameworks, libraries, tools, UI components, state management, etc.)
- **Різноманітність категорій** (Core frameworks, UI libraries, Build tools, Developer tools, Data & Forms)
- **Активна розробка** (>10 commits/month)
- **Великі команди** (>20 contributors)
- **Доступна історія** (>2 років розробки)

### Технічні критерії

- GitHub Stars > 5,000
- Open Issues > 50
- Pull Requests > 100 (за останні 6 місяців)
- TypeScript coverage > 70%
- Test coverage data доступна
- CI/CD налаштоване
- Open source з публічними метриками

---

## 📊 Обрані проєкти для дослідження (50 проєктів)

**Конфігурація проектів:** [`input/projects.json`](../input/projects.json)
**Повний список з описами:** Додаток В у [`thesis/internship-report/main.md`](../thesis/internship-report/main.md)

### Категорії проектів

1. **Core TypeScript Projects** (10 проєктів)

   - TypeScript (microsoft/TypeScript), Angular (angular/angular), Remix (remix-run/remix)
   - Vite (vitejs/vite), React Router (remix-run/react-router), Storybook (storybookjs/storybook)
   - NestJS (nestjs/nest), Astro (withastro/astro), Qwik (BuilderIO/qwik), tRPC (trpc/trpc)

2. **UI Component Libraries** (10 проєктів)

   - Material-UI (mui/material-ui), Ant Design (ant-design/ant-design), Chakra UI (chakra-ui/chakra-ui)
   - Mantine (mantinedev/mantine), Radix UI (radix-ui/primitives), shadcn/ui (shadcn-ui/ui)
   - Headless UI (tailwindlabs/headlessui), React Bootstrap (react-bootstrap/react-bootstrap)
   - Semantic UI React (Semantic-Org/Semantic-UI-React), Blueprint (palantir/blueprint)

3. **State Management** (8 проєктів)

   - Redux (reduxjs/redux), Redux Toolkit (reduxjs/redux-toolkit), MobX (mobxjs/mobx)
   - Zustand (pmndrs/zustand), Jotai (pmndrs/jotai), Valtio (pmndrs/valtio)
   - TanStack Query (TanStack/query), Apollo Client (apollographql/apollo-client)

4. **Build Tools** (6 проєктів)

   - TypeORM (typeorm/typeorm), esbuild (evanw/esbuild), SWC (swc-project/swc)
   - Prisma (prisma/prisma), Rspack (web-infra-dev/rspack), Turbo (vercel/turbo)

5. **Developer Tools** (8 проєктів)

   - React Testing Library (testing-library/react-testing-library), Playwright (microsoft/playwright)
   - Vitest (vitest-dev/vitest), Nx (nrwl/nx), Zod (colinhacks/zod)
   - TypeScript ESLint (typescript-eslint/typescript-eslint), Lerna (lerna/lerna), MSW (mswjs/msw)

6. **Data & Forms** (8 проєктів)
   - React Hook Form (react-hook-form/react-hook-form), TanStack Form (TanStack/form)
   - React Select (JedWatson/react-select), React Spring (pmndrs/react-spring)
   - Recharts (recharts/recharts), dnd-kit (clauderic/dnd-kit)
   - Floating UI (floating-ui/floating-ui), React JSON Schema Form (rjsf-team/react-jsonschema-form)

### Обґрунтування вибору

- **Різноманітність**: 6 категорій, різні розміри та призначення
- **TypeScript-first**: Усі проекти з >70% TypeScript codebase
- **Активність**: Регулярні коміти протягом останніх 6 місяців
- **Розмір спільноти**: Мінімум 5,000 GitHub stars
- **Публічність**: Open-source проекти з доступними метриками
- **Практична цінність**: Широко використовувані в індустрії

---

## 📈 Метрики для збору

### 🤖 Автоматичні метрики (GitHub API + Code Analysis)

#### Developer Experience Outcomes

```typescript
interface CollectedMetrics {
  // GitHub API метрики
  codeReviewDuration: number; // merged_at - created_at
  debuggingTime: number; // bug issues resolution time
  buildTime: number; // CI/CD pipeline duration
  successfulDeploymentsRatio: number; // successful builds %
  timeToFirstCommit: number; // onboarding time
  linesChangedPerHour: number; // productivity estimate
  averageCommentsPerPR: number; // review complexity
  prIterationRate: number; // % PRs with follow-up commits

  // Code Analysis метрики
  typeScriptErrorRate: number; // tsc errors per 1000 LOC
  testCoverage: number; // coverage %
  bundleSize: number; // build output size
  cyclomaticComplexity: number; // average complexity
  duplicatedCode: number; // % duplicated code

  // Business Impact метрики
  timeToMarket: number; // feature delivery time
  featureSuccessRate: number; // milestone completion %
  activeContributors: number; // monthly active devs
  issueResolutionRate: number; // % issues closed <7 days
  communityGrowth: number; // new stars/month
}
```

### 📝 Survey метрики (Contributor опитування) - _ВІДКЛАДЕНО НА МАЙБУТНЄ_

#### Weekly Developer Survey (2-3 хвилини) - _опціонально_

```typescript
interface WeeklySurvey {
  // Core satisfaction (1-10 scale)
  developerSatisfactionScore: number; // "How satisfied are you working with this codebase?"
  codebaseConfidence: number; // "How confident are you making changes?"
  onboardingDifficulty: number; // "How easy was it to start contributing?"

  // Time allocation (hours/week)
  codeComprehensionTime: number; // "Time spent understanding existing code"
  debuggingTime: number; // "Time spent on debugging issues"
  documentationTime: number; // "Time spent reading/writing docs"

  // Qualitative feedback
  mostFrustrating: string; // "What slows you down the most?"
  bestAspects: string; // "What works really well?"

  // Context
  contributorRole: DeveloperRole; // frontend/backend/fullstack
  experienceLevel: number; // years of experience
  contributionType: string; // feature/bugfix/docs/tests
}
```

### 🎯 Performance метрики (Lighthouse + Bundle Analysis)

Для проєктів з demo sites або documentation:

- First Contentful Paint
- Largest Contentful Paint
- Cumulative Layout Shift
- Bundle size trends
- Load time metrics

---

## 🔬 Інструменти для збору даних

### Automated Data Collection

```typescript
// GitHub API клієнт
class GitHubDataCollector {
  async collectRepositoryMetrics(repo: string): Promise<RepositoryMetrics>;
  async collectPullRequestMetrics(repo: string): Promise<PRMetrics[]>;
  async collectIssueMetrics(repo: string): Promise<IssueMetrics[]>;
  async collectContributorMetrics(repo: string): Promise<ContributorMetrics[]>;
  async collectCIMetrics(repo: string): Promise<CIMetrics[]>;
}

// Code Analysis
class CodeAnalysisCollector {
  async analyzeTypeScriptCode(repoPath: string): Promise<CodeMetrics>;
  async calculateComplexity(repoPath: string): Promise<ComplexityMetrics>;
  async analyzeDependencies(repoPath: string): Promise<DependencyMetrics>;
  async calculateTestCoverage(repoPath: string): Promise<CoverageMetrics>;
}

// Performance Analysis
class PerformanceCollector {
  async auditWithLighthouse(urls: string[]): Promise<PerformanceMetrics>;
  async analyzeBundleSize(repoPath: string): Promise<BundleMetrics>;
}
```

### Survey Distribution - _ВІДКЛАДЕНО НА МАЙБУТНЄ_

~~**Опціональна фаза для майбутнього дослідження:**~~

- ~~**GitHub Issues** з опитуванням для активних контриб'юторів~~
- ~~**Discord/Slack** спільноти проєктів~~
- ~~**Twitter** outreach до maintainers~~
- ~~**Conference** presentations для збору учасників~~

**Поточний фокус:** Аналіз об'єктивних метрик з GitHub API та code analysis без survey даних.

---

## 📊 Аналіз даних

### Статистичний аналіз

1. **Correlation Analysis** між статичними метриками та outcomes
2. **Regression Analysis** для виявлення предикторів
3. **Cluster Analysis** для групування проєктів
4. **Time Series Analysis** для тенденцій

### Machine Learning

```python
# Feature Engineering
features = [
    'typescript_coverage', 'test_coverage', 'cyclomatic_complexity',
    'pr_size_average', 'review_comments_average', 'build_time',
    'dependency_count', 'contributor_count', 'issue_resolution_time'
]

# Target variables (outcomes)
targets = [
    'developer_satisfaction', 'code_review_duration', 'bug_rate',
    'feature_delivery_time', 'contributor_retention', 'community_growth'
]

# Models to test
models = [
    RandomForestRegressor(),
    XGBRegressor(),
    LassoRegression(),
    ElasticNet()
]
```

### Validation Strategy

- **Cross-validation** по проєктах
- **Temporal validation** (train на старих даних, test на нових)
- **Holdout validation** (окремі проєкти для фінального тесту)

---

## 🎯 Очікувані результати

### Кількісні результати

- **Correlation coefficients** між метриками та outcomes
- **Predictive models** з R² > 0.7 для key outcomes
- **Feature importance** rankings для різних типів проєктів
- **Benchmarks** для TypeScript/React проєктів

### Якісні insights

- **Best practices** для покращення developer experience
- **Anti-patterns** що знижують продуктивність
- **Project archetypes** з різними оптимізаційними стратегіями
- **Actionable recommendations** для команд

---

## 📅 Детальний Timeline

### Місяць 1: Data Collection ✅ ЗАВЕРШЕНО

**Тиждень 1-2: Infrastructure Setup** ✅

- ✅ Налаштування GitHub API collectors
- ✅ Створення automated analysis pipeline (Nx monorepo, TypeScript)
- ✅ CLI tools з підтримкою параметрів (--projects, --outputDir, --existingReport)

**Тиждень 3-4: Project Analysis** ✅

- ✅ Збір метрик для всіх 50 проєктів (02.10.2025 + 09.10.2025)
- ✅ Automated metrics collection через GitHub API
- ✅ Initial data validation (0 помилок, 100% completeness)

### Місяць 2: Data Analysis

**Тиждень 1-2: Data Validation & Exploration** ✅ ЗАВЕРШЕНО (10.10.2025)

- ✅ Deep data validation та cleaning (100% completeness, 0 missing values)
- ✅ Exploratory data analysis (EDA) - Python/Pandas/Matplotlib/Seaborn
- ✅ Initial insights та hypothesis формування (13 метрик з outliers)
- ✅ 7 візуалізацій згенеровано (300 DPI PNG)
- ✅ 4 CSV файли статистики створено
- ✅ Детальний звіт аналізу (31 стор. Markdown)

**Тиждень 3-4: Statistical Analysis**

- Correlation analysis між статичними та outcome метриками
- Pattern recognition та clustering
- Data visualization та reporting

### Місяць 3: Modeling

**Тиждень 1-2: Feature Engineering**

- Feature selection та engineering
- Data preprocessing для ML models
- Train/validation/test splits

**Тиждень 3-4: Model Development**

- ML model training та tuning
- Cross-validation та performance evaluation
- Model interpretation та feature importance

### Місяць 4: Implementation & Documentation

**Тиждень 1-2: MVP Development**

- Practical tool implementation
- Real-time quality scoring system
- Integration з популярними tools

**Тиждень 3-4: Validation & Documentation**

- Testing з pilot teams
- Documentation та publication prep
- Conference submission preparation

---

## 🔬 Validation Strategy

### Statistical Validation

- **Multi-project cross-validation**
- **Temporal validation** (past predicts future)
- **Bootstrap confidence intervals**
- **Significance testing** for all correlations

### Practical Validation

- **A/B testing** з 3-5 реальними командами
- **Longitudinal study** протягом 3 місяців
- **Expert review** від senior developers
- **Industry validation** через conferences

---

## 🎯 Success Criteria

### Мінімальні вимоги (MVP)

- ✅ **50 проєктів** проаналізовано (02.10.2025 + 09.10.2025)
- ⏳ **R² > 0.6** для головних outcome метрик (потребує ML моделі - Фаза 3)
- ✅ **Statistically significant** кореляції знайдено (r = 0.72 для Test Coverage ↔ TP Score)
- ✅ **Comprehensive dataset** зібрано та валідовано (1000 data points, 100% completeness)
- ✅ **Data quality assessment** завершено (10.10.2025)

### Target вимоги

- 🎯 **R² > 0.75** для predictive models
- 🎯 **Feature importance rankings** для різних типів проектів
- 🎯 **Industry validation** від 5+ senior developers
- 🎯 **Conference acceptance** для publication

### Stretch goals

- 🚀 **Real-time tool** з VS Code integration
- 🚀 **Industry adoption** від 2+ companies
- 🚀 **Open source release** з community engagement
- 🚀 **Follow-up research** opportunities identified

---

## 📋 Risk Mitigation

### Потенційні ризики

1. **Data quality issues** → Automated validation і manual review
2. **Limited project diversity** → Backup project list готовий
3. **Weak correlations** → Multiple statistical approaches та visualization
4. **GitHub API rate limits** → Caching system та incremental updates
5. **Time constraints** → Phased delivery з MVP approach

### Backup plans

- **Alternative projects** підготовані для кожного tier
- **Reduced scope** option з 10 проєктами
- **Qualitative focus** якщо quantitative data weak
- **Industry partnerships** для додаткових даних

---

## 📖 Deliverables

### Академічні deliverables

1. **Магістерська робота** (80-100 сторінок)
2. **Conference paper** для ICSE/FSE/MSR
3. **Dataset** для майбутніх досліджень
4. **Replication package** з кодом та даними

### Практичні deliverables

1. **VS Code extension** для real-time quality scoring
2. **Web dashboard** для project analysis
3. **CLI tool** для automated analysis
4. **Documentation** та best practices guide

Цей план забезпечує comprehensive дослідження outcome-based якості коду з focus на практичну цінність для TypeScript/React екосистеми.
