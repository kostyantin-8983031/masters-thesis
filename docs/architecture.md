# Архітектура системи прогнозування продуктивності розробників

## Огляд системи

Система прогнозування продуктивності розробників на основі outcome-based аналізу TypeScript коду створена як частина магістерської роботи в Одеському національному політехнічному університеті (2025).

**Мета системи:** Автоматизований збір та аналіз метрик якості TypeScript проектів для прогнозування продуктивності розробників та якості продукту через outcome-based підхід.

**Ключові особливості:**

- Outcome-based підхід (результати замість активності)
- Автоматичний збір метрик з GitHub API
- ML-based прогнозування продуктивності
- Temporal analysis (часові ряди)
- Comprehensive статистичний аналіз

---

## Архітектурний підхід

Система побудована як **Nx monorepo** з TypeScript + Python stack:

```
masters-thesis/
├── packages/              # TypeScript пакети
│   ├── metrics/          # Система метрик
│   ├── metrics-collector/# GitHub API колектори
│   └── scripts/          # CLI інструменти
├── analysis/             # Python аналіз
├── reports/              # Згенеровані звіти
├── input/                # Конфігурація проектів
└── docs/                 # Документація
```

### Технологічний стек

**Frontend/Data Collection (TypeScript):**

- Runtime: Node.js 20+
- Build system: Nx 17
- Package manager: npm
- Testing: Vitest
- API client: Octokit (GitHub API v3/v4)

**Backend/Analysis (Python):**

- Python 3.11+
- Data analysis: pandas, numpy
- ML modeling: scikit-learn, xgboost, lightgbm
- Visualization: matplotlib, seaborn
- Statistics: scipy, statsmodels
- Dependency management: uv (ultra-fast package installer)

---

## Компоненти системи

### 1. `@thesis/metrics` - Система метрик

**Призначення:** Визначення та обчислення outcome-based метрик якості коду.

**Ключові файли:**

- `src/lib/categories/` - Категорії метрик (DX, TP, BI)
- `src/lib/scoring/` - Composite Quality Score calculation
- `src/lib/interfaces.ts` - TypeScript інтерфейси

**Outcome-based категорії:**

1. **Developer Experience (DX)** - досвід розробників

   - `codeReviewDuration` - Час code review (години)
   - `debuggingTime` - Час на debugging (години)
   - `timeToFirstCommit` - Onboarding час (дні)
   - `linesChangedPerHour` - Продуктивність (LoC/год)
   - `averageCommentsPerPR` - Складність review
   - `prIterationRate` - % PR з follow-up commits

2. **Technical Performance (TP)** - технічна якість

   - `buildTime` - Час збірки (хв)
   - `bundleSize` - Розмір bundle (bytes)
   - `bundleLoadTime` - Час завантаження (мс)
   - `performanceScore` - Загальна оцінка (0-100)
   - `typeScriptErrorRate` - TS помилки на 1000 LoC
   - `testCoverage` - Покриття тестами (%)

3. **Business Impact (BI)** - бізнес-результати
   - `timeToMarket` - Час виходу фічі (дні)
   - `featureSuccessRate` - % успішних фічі
   - `activeContributors` - Активні розробники (місяць)
   - `issueResolutionRate` - % issues закритих <7 днів
   - `communityGrowth` - Зростання спільноти (stars/місяць)

**Composite Quality Score:**

```typescript
// Нормалізація (0-100 scale)
normalizedDX = normalize(DX_metrics);
normalizedTP = normalize(TP_metrics);
normalizedBI = normalize(BI_metrics);

// Weighted average (рівні ваги)
overallScore = (normalizedDX + normalizedTP + normalizedBI) / 3;
```

### 2. `@thesis/metrics-collector` - Збір метрик

**Призначення:** Автоматизований збір метрик з GitHub API та локального аналізу.

**Ключові класи:**

#### `GitHubCollector`

Базовий колектор для взаємодії з GitHub API.

```typescript
class GitHubCollector {
  constructor(config: CollectorConfig);

  // Core methods
  async collectRepositoryMetrics(repo: string): Promise<RepositoryMetrics>;
  async collectPullRequestMetrics(repo: string): Promise<PRMetrics[]>;
  async collectIssueMetrics(repo: string): Promise<IssueMetrics[]>;

  // Temporal support (Phase 2.3)
  async collectHistoricalTimeSeries(
    repo: string,
    startDate: Date,
    endDate: Date,
    intervalMonths: number
  ): Promise<TemporalSnapshot[]>;
}
```

**Особливості:**

- Rate limit handling (auto-retry on 403 Forbidden)
- Incremental collection з `--existingReport` merge
- Кешування для повторного використання
- Error recovery (automatic wait & retry)

#### `RealMetricsCollector`

Високорівневий колектор для outcome-based метрик.

```typescript
class RealMetricsCollector {
  constructor(config: CollectorConfig);

  async collectMetrics(): Promise<CollectionResult>;
  // Returns: DX, TP, BI metrics + overallScore + confidence
}
```

### 3. `@thesis/scripts` - CLI інструменти

**Призначення:** Command-line інтерфейси для збору та аналізу метрик.

#### Головні скрипти:

**`detailed-metrics-report.mjs`** - Основний CLI для збору метрик

```bash
# Збір метрик для всіх проектів
node packages/scripts/src/detailed-metrics-report.mjs

# Вибіркові проекти
node packages/scripts/src/detailed-metrics-report.mjs \
  --projects angular,react,vue

# Інкрементальне оновлення
node packages/scripts/src/detailed-metrics-report.mjs \
  --existingReport reports/metrics_report.json

# Кастомна директорія
node packages/scripts/src/detailed-metrics-report.mjs \
  --outputDir custom-reports/
```

**Output формати:**

- `metrics_report.json` - Детальні дані (JSON)
- `metrics_report.csv` - Для Excel аналізу
- `metrics_report.md` - Читабельний звіт

**`temporal-metrics-report.mjs`** - Temporal data collection (Phase 2.3)

```bash
# Збір historical time series (6 місяців)
node packages/scripts/src/temporal-metrics-report.mjs

# З інкрементальним оновленням
node packages/scripts/src/temporal-metrics-report.mjs \
  --existingReport reports/metrics_report_temporal.json
```

**Output:**

- `metrics_report_temporal.json` - 300 snapshots (50 проектів × 6 місяців)
- `metrics_report_temporal_long.csv` - Time series у long format

**`verify-projects.mjs`** - Валідація конфігурації проектів

```bash
node packages/scripts/src/verify-projects.mjs
```

---

## Data Pipeline

### Phase 1: Data Collection

```
┌──────────────┐
│ input/       │
│ projects.json│──────┐
└──────────────┘      │
                      ▼
              ┌────────────────┐
              │ CLI Script     │
              │ (detailed-     │
              │  metrics-      │
              │  report.mjs)   │
              └───────┬────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ RealMetricsCollector   │
         │ (GitHub API + local    │
         │  code analysis)        │
         └──────────┬─────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ reports/            │
         │ metrics_report.*    │
         │ (JSON, CSV, MD)     │
         └─────────────────────┘
```

**Collected data:**

- 50 TypeScript проектів
- 20 outcome-based метрик на проект
- 1000 data points (50 × 20)
- 100% completeness, 0 missing values

### Phase 2.1-2.2: Statistical Analysis

```
┌─────────────────────┐
│ reports/            │
│ metrics_report.json │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────┐
│ Python Analysis      │
│ Scripts:             │
│ • data_validation.py │
│ • statistical_      │
│   analysis.py        │
│ • feature_          │
│   engineering.py     │
└──────────┬───────────┘
           │
           ▼
┌────────────────────────┐
│ reports/analysis/      │
│ • Visualizations (PNG) │
│ • Statistics (CSV)     │
│ • Reports (MD)         │
└────────────────────────┘
```

**Outputs:**

- `data_validation_report.md` (31 стор.)
- `statistical_analysis_report.md` (40 стор.)
- 7 візуалізацій (300 DPI PNG)
- 8 CSV файлів статистики

**Key findings:**

- Test Coverage ↔ Technical Performance (r = 0.72, p < 0.001)
- Code Review Duration ↔ Time to Market (r = 0.88, p < 10⁻¹⁶)
- 2 кластери проектів: "Складні" (n=11) vs "Ефективні" (n=39)

### Phase 2.3: Temporal Analysis

```
┌───────────────────────────┐
│ temporal-metrics-report   │
│ (6 snapshots per project) │
└────────────┬──────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Python Temporal Scripts:    │
│ • temporal_analysis.py      │
│ • temporal_feature_        │
│   engineering.py            │
│ • temporal_modeling.py      │
└────────────┬────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ reports/temporal/            │
│ • 297 temporal features      │
│ • ARIMA forecasts            │
│ • Random Forest CV results   │
│ • 6 visualizations           │
│ • 8 CSV files                │
└──────────────────────────────┘
```

**Outputs:**

- 297 temporal features (lags, rolling, trends, momentum, volatility)
- ARIMA forecasting: 8-14% error
- Random Forest CV: R² = 0.782-0.928
- `temporal_implementation_summary.md` (15 розділів)

### Phase 3: ML Modeling

```
┌──────────────────────────┐
│ reports/statistical/     │
│ engineered_features.csv  │
│ (126 features)           │
└───────────┬──────────────┘
            │
            ▼
┌────────────────────────────┐
│ Python ML Scripts:         │
│ • ml_data_preparation.py   │
│ • ml_modeling.py           │
│ • ml_evaluation.py         │
│ • ml_explainability.py     │
└───────────┬────────────────┘
            │
            ▼
┌─────────────────────────────┐
│ reports/ml/                 │
│ • 7 trained models          │
│ • Cross-validation results  │
│ • Feature importance (RF,   │
│   XGBoost)                  │
│ • SHAP values               │
│ • 11 visualizations         │
│ • 14 CSV files              │
└─────────────────────────────┘
```

**Best models (after data leakage fix):**

- **overallScore:** Linear Regression (R² = 0.625, RMSE = 5.12)
- **timeToMarket:** Lasso (R² = 0.663, RMSE = 7.84 hours)
- **communityGrowth:** Lasso (R² = 0.394, RMSE = 8.23 stars/month)

**Top predictors:**

- `dx_tp_interaction` → overallScore (47.5% importance)
- `dx_codeReviewDuration` → timeToMarket (40.5% importance)
- `tp_testCoverage` → communityGrowth (83.4% importance)

**Outputs:**

- `ml_modeling_report.md` (50 стор.)
- 11 PNG visualizations (300 DPI)
- 14 CSV statistical files

---

## Інтеграція компонентів

### Взаємодія між пакетами

```
┌─────────────────┐
│ @thesis/scripts │
│  (CLI layer)    │
└────────┬────────┘
         │ imports
         ▼
┌──────────────────────────┐
│ @thesis/metrics-collector│
│  (Data collection)       │
└────────┬─────────────────┘
         │ imports
         ▼
┌─────────────────┐
│ @thesis/metrics │
│  (Core domain)  │
└─────────────────┘
```

**Dependency flow:** scripts → metrics-collector → metrics

### TypeScript → Python Bridge

Дані передаються через JSON/CSV формати:

```typescript
// TypeScript: Generate JSON
const result = await collector.collectMetrics();
fs.writeFileSync('metrics_report.json', JSON.stringify(result));

// Python: Read and analyze
import pandas as pd
df = pd.read_json('metrics_report.json')
# Statistical analysis...
```

---

## Конфігурація проектів

### `input/projects.json`

Конфігурація 50 TypeScript проектів для аналізу:

```json
{
  "projects": [
    {
      "name": "Angular",
      "github": "angular/angular",
      "category": "Core Framework",
      "stars": 95000,
      "tier": 1
    }
    // ... 49 more projects
  ]
}
```

**Критерії вибору:**

- TypeScript > 70% codebase
- GitHub Stars > 5,000
- Open Issues > 50
- Active розробка (>10 commits/місяць)
- Публічні метрики (CI/CD налаштовано)

**Категорії:**

1. Core TypeScript Projects (10 проектів)
2. UI Component Libraries (10 проектів)
3. State Management (8 проектів)
4. Build Tools (6 проектів)
5. Developer Tools (8 проектів)
6. Data & Forms (8 проектів)

---

## Розгортання та запуск

### Вимоги до середовища

**Node.js:**

- Version: 20.x або новіше
- npm: 10.x або новіше

**Python:**

- Version: 3.11+ (рекомендовано 3.12)
- uv package manager: 0.5.0+

**GitHub:**

- Personal Access Token з правами:
  - `repo` (read)
  - `user` (read)

### Встановлення

```bash
# 1. Clone repository
git clone https://github.com/your-org/masters-thesis.git
cd masters-thesis

# 2. Install Node.js dependencies
npm install

# 3. Install Python dependencies (using uv)
uv pip install pandas numpy scikit-learn matplotlib seaborn scipy statsmodels xgboost lightgbm

# 4. Setup GitHub token
export GITHUB_TOKEN="your_github_personal_access_token"

# 5. Build TypeScript packages
npx nx run-many --target=build --all
```

### Запуск збору метрик

```bash
# Збір метрик для всіх 50 проектів
node packages/scripts/src/detailed-metrics-report.mjs

# Output: reports/metrics_report.{json,csv,md}
```

### Запуск аналізу

```bash
# Data validation & exploration
python analysis/data_validation.py

# Statistical analysis
python analysis/statistical_analysis.py

# Feature engineering
python analysis/feature_engineering.py

# ML modeling
python analysis/ml_data_preparation.py
python analysis/ml_modeling.py
python analysis/ml_evaluation.py
python analysis/ml_explainability.py

# Temporal analysis
python analysis/temporal_analysis.py
python analysis/temporal_feature_engineering.py
python analysis/temporal_modeling.py

# Output: reports/{analysis,statistical,ml,temporal}/
```

---

## Масштабованість та обмеження

### Поточні обмеження

1. **Small dataset (n=50)**

   - R² below target 0.75 (max 0.66)
   - High variance у CV scores
   - Потрібно 150+ проектів для R² > 0.75

2. **Selection bias**

   - Тільки популярні проекти (>5000 stars)
   - Може не репрезентувати smaller projects

3. **Temporal scope**

   - 6 місяців historical data (Apr-Sep 2025)
   - Single point-in-time для cross-sectional analysis

4. **GitHub API rate limits**
   - 5000 requests/hour (authenticated)
   - Automatic retry on 403 Forbidden
   - Incremental collection через `--existingReport`

### Шляхи масштабування

**Horizontal scaling (більше проектів):**

- Expand to 150+ projects для кращого R²
- Включити менш популярні проекти (1000-5000 stars)
- Додати non-TypeScript проекти для порівняння

**Temporal scaling (глибша історія):**

- Збільшити period до 12-24 місяців
- Щомісячні snapshots (замість кожні 2 місяці)
- Longitudinal tracking конкретних проектів

**Feature expansion:**

- Додати PR code quality metrics (CodeClimate, SonarQube)
- Sentiment analysis GitHub issues/PRs
- Developer survey data (відкладено на майбутнє)

**Infrastructure improvements:**

- Distributed collection (parallel GitHub API requests)
- Database storage (PostgreSQL) замість JSON
- Real-time streaming (GitHub webhooks)

---

## Безпека та приватність

### GitHub API Token

**Best practices:**

- Використовувати `.env` файл (не commit до git)
- Minimal permissions (read-only)
- Rotate tokens регулярно

```bash
# .env (not committed)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

### Data Privacy

**Public data only:**

- Всі метрики з public repositories
- Жодних private repositories
- Жодних особистих даних розробників

**GDPR compliance:**

- Aggregate metrics only (no individual developers)
- Anonymous contributor counts
- No emails, names, or personal identifiers

---

## Тестування

### Unit tests (TypeScript)

```bash
# Run all tests
npx nx test @thesis/metrics
npx nx test @thesis/metrics-collector
npx nx test @thesis/scripts

# Run specific test
npx nx test @thesis/metrics --testFile=composite-quality-score.spec.ts

# Coverage report
npx nx test @thesis/metrics --coverage
```

### Integration tests

**Ручна верифікація:**

```bash
# Test GitHub API connectivity
node packages/scripts/src/debug-github-api.mjs

# Verify projects configuration
node packages/scripts/src/verify-projects.mjs

# Test real metrics collection (small sample)
node packages/scripts/src/test-real-metrics.mjs
```

### Python tests

**Статистична валідація:**

- Shapiro-Wilk test (нормальність розподілів)
- Levene test (homogeneity of variance)
- VIF (multicollinearity)
- Cross-validation (overfitting detection)

**Data quality checks:**

- Completeness (100%)
- Range validation (outliers IQR)
- Consistency checks (correlation sanity)

---

## Моніторинг та логування

### Collection logs

CLI scripts виводять progress logs:

```
📊 Starting metrics collection...
✓ [1/50] Angular - Score: 82/100 (3.2s)
✓ [2/50] React - Score: 79/100 (2.8s)
⚠ [3/50] Vue - Rate limit hit, retrying in 60s...
✓ [3/50] Vue - Score: 76/100 (61.5s)
...
✅ Collection complete! 50/50 projects successful
📈 Average score: 70.3/100
💾 Reports saved to: reports/
```

### Error handling

**GitHub API errors:**

- 403 Forbidden → Auto-retry з exponential backoff
- 404 Not Found → Skip project, log warning
- Network timeout → Retry 3x, then fail
- Invalid token → Immediate failure з clear message

**Data validation errors:**

- Missing required fields → Use default values, log warning
- Out-of-range values → Clamp to valid range, log warning
- Type mismatch → Attempt coercion, fail if impossible

---

## Підтримка та розвиток

### Автор

**Konstantin Kai**
Магістр Програмної інженерії (спеціальність 121)
Одеський національний політехнічний університет
Email: konstantin.kai@example.com (update)
GitHub: @konstantinkai

### Науковий керівник

**[Ім'я керівника]**
[Посада]
Одеський національний політехнічний університет

### Ліцензія

MIT License - дозволяє вільне використання, модифікацію та розповсюдження.

### Contributing

Проект створено як частина магістерської роботи (2025). Подальші contributions можливі після публікації повного коду.

**Майбутні напрямки:**

- VS Code extension для real-time quality scoring
- Web dashboard для project analysis
- Expanded dataset (150+ projects)
- Deep learning models (after data expansion)
- Industry partnerships для валідації

---

## Посилання

### Документація проекту

- [Usage Guide](./usage_guide.md) - Детальні інструкції користування
- [Best Practices Guide](./best_practices.md) - Рекомендації outcome-based метрик
- [Replication Package](./replication_package.md) - Відтворення дослідження
- [Research Plan](./research_plan.md) - План та прогрес дослідження

### Звіти дослідження

- [Data Validation Report](../reports/data_validation_report.md) - EDA (31 стор.)
- [Statistical Analysis Report](../reports/statistical_analysis_report.md) - Статистика (40 стор.)
- [ML Modeling Report](../reports/ml_modeling_report.md) - Machine Learning (50 стор.)
- [Temporal Implementation Summary](../reports/temporal_implementation_summary.md) - Time series (15 розділів)

### Зовнішні ресурси

**Outcome-based frameworks:**

- [SPACE Framework](https://queue.acm.org/detail.cfm?id=3454124) - Productivity measurement
- [DORA Metrics](https://dora.dev/) - DevOps performance
- [DevEx Framework](https://queue.acm.org/detail.cfm?id=3595878) - Developer Experience

**Технології:**

- [Nx Workspace](https://nx.dev/) - Monorepo build system
- [GitHub REST API](https://docs.github.com/en/rest) - Data collection
- [scikit-learn](https://scikit-learn.org/) - ML modeling
- [pandas](https://pandas.pydata.org/) - Data analysis

---

**Версія документу:** 1.0.0
**Дата останнього оновлення:** 13 листопада 2025 р.
**Статус:** Phase 4 Implementation - Documentation
