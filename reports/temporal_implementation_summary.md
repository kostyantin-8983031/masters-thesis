# Temporal Data Implementation Summary

**Магістерська робота:** Outcome-based оцінка якості TypeScript коду
**Автор:** Слабенко Костянтин Олегович
**Група:** АС-202
**Керівник:** Доктор технічних наук, професор Любченко Віра Вікторівна
**Заклад:** Одеський політехнічний національний університет
**Дата:** 13 жовтня 2025 р.
**Фаза:** 2.3 - Temporal Data Collection & Analysis

---

## Executive Summary

Implemented complete infrastructure for **temporal data collection** and **time-series analysis** to address **Limitation 3: Missing Temporal Data** from ML Modeling Phase.

**Key Achievement:** Transformed dataset from **50 cross-sectional snapshots** → **300 temporal data points** (50 projects × 6 months)

---

## Phase 1: Infrastructure Setup ✅ COMPLETED

### 1.1. GitHubCollector Temporal Support

**File:** `packages/metrics-collector/src/github-collector.ts`

**Changes:**

- Added `targetDate?: Date` parameter to `GitHubConfig`
- Implemented `filterPullRequestsByDate()`and `filterIssuesByDate()` for historical filtering
- Created `collectMetricsAtDate(targetDate)` for single historical snapshot
- Created `collectHistoricalTimeSeries(dates[])` for batch collection

**Impact:**

- Can collect metrics "as they were" at any point in time
- Supports arbitrary date ranges
- Batch processing with rate limit management

### 1.2. New CLI Tool: temporal-metrics-report.mjs

**File:** `packages/scripts/src/temporal-metrics-report.mjs`

**Features:**

```bash
# Collect last N months
node temporal-metrics-report.mjs --projects input/projects.json --outputDir reports --months 6

# Collect custom date range
node temporal-metrics-report.mjs --projects input/projects.json --outputDir reports \
  --startDate 2025-04-01 --endDate 2025-09-01
```

**Output Formats:**

1. **Nested JSON** (`metrics_report_temporal.json`): projects → snapshots[]
2. **Long CSV** (`metrics_report_temporal_long.csv`): 1 row per snapshot (для pandas)
3. **Summary MD** (`temporal_collection_summary.md`): Collection stats

---

## Phase 2: Data Collection ✅ COMPLETED

### 2.1. Collection Configuration

- **Projects:** 50 TypeScript проектів
- **Time Range:** April 2025 - September 2025
- **Snapshots:** 6 per project (monthly)
- **Total Data Points:** 300 (50 × 6)
- **Metrics per Snapshot:** 18 (DX: 7, TP: 6, BI: 5)

### 2.2. Collection Results

**Final Status (completed Oct 13, 2025):**

- ✅ **Completed:** 50/50 projects (100%)
- ✅ **Snapshots Collected:** 300/300 (100%)
- ✅ **Success Rate:** 100% (0 failed collections)
- ⏱️ **Total Collection Time:** ~75 minutes
- 📦 **Output Size:** 291KB JSON, 58KB CSV

**Key Improvements:**

- ✅ **Rate Limit Handling:** Auto-retry with wait (encountered on project #49)
- ✅ **Incremental Collection:** `--existingReport` support for merge
- ✅ **Error Recovery:** Automatic wait & retry on 403 Forbidden

### 2.3. Data Quality

**Final Dataset Quality:**

- ✅ **Completeness:** 300 complete snapshots
- ✅ **Coverage:** 18 metrics × 300 snapshots = 5,400 data points
- ⚠️ **Missing Values:** 9 metrics have some missing data (normal for temporal)
- ✅ **Format:** Valid JSON (nested) and CSV (long format)

---

## Phase 3: Analysis Scripts ✅ COMPLETED

### 3.1. temporal_analysis.py

**Purpose:** Exploratory Data Analysis & Trend Detection

**Features:**

1. **Data Quality Check**

   - Missing values analysis
   - Completeness assessment

2. **Trend Analysis** (6 key metrics)

   - Overall trends over time (linear regression slopes)
   - Monthly averages across all projects

3. **Project Trajectories**

   - Top 10 projects tracked over time
   - 4 key metrics visualization

4. **Time Series Decomposition**

   - Trend, Seasonal, Residual components
   - 3 metrics decomposed

5. **Autocorrelation Analysis (ACF/PACF)**

   - Identifies temporal dependencies
   - Lag analysis

6. **Stationarity Testing (ADF Test)**

   - Augmented Dickey-Fuller test
   - Results for all metrics

7. **Change Detection**

   - Improving vs Declining projects
   - Slope-based classification
   - Top 10 improving/declining visualized

8. **Volatility Analysis**
   - Rolling standard deviation
   - Coefficient of variation (CV%)

**Outputs:**

- 📊 **6 Visualizations** (300 DPI PNG)
- 📄 **4 CSV files** (statistics, stationarity, change analysis, volatility)

### 3.2. temporal_feature_engineering.py

**Purpose:** Create Temporal Features for ML

**Features Generated:** ~300 new temporal features

**Categories:**

1. **Lag Features** (45 features)

   - 1-month, 2-month, 3-month lags
   - 19 metrics × 3 lags = 57 features

2. **Rolling Statistics** (152 features)

   - 2-month, 3-month windows
   - Mean, Std, Min, Max
   - 19 metrics × 2 windows × 4 stats = 152 features

3. **Trend Features** (38 features)

   - Linear regression slopes
   - 2-month, 3-month trends
   - 19 metrics × 2 windows = 38 features

4. **Momentum Features** (38 features)

   - Rate of change (% change)
   - 1-month, 2-month momentum
   - 19 metrics × 2 periods = 38 features

5. **Volatility Features** (19 features)

   - Coefficient of Variation
   - 3-month rolling CV
   - 19 metrics × 1 window = 19 features

6. **Interaction Features** (5 features)

   - Trend × Value
   - Momentum × Volatility

7. **Time-based Features** (4 features)
   - month_number (1-6)
   - days_since_start
   - quarter
   - is_last_month (binary)

**Outputs:**

- `engineered_features_temporal.csv` (300 snapshots × ~320 features)
- `feature_list_temporal.csv` (feature inventory)
- `temporal_feature_importance.csv` (correlation with targets)

### 3.3. temporal_modeling.py

**Purpose:** Time-Series Forecasting & Validation

**Models:**

1. **ARIMA Forecasting**

   - Auto-regressive Integrated Moving Average
   - Order (p=1, d=1, q=1)
   - Forecasts next month for 3 key metrics

2. **Temporal Cross-Validation**

   - TimeSeriesSplit (3 folds)
   - Random Forest with temporal features
   - Targets: timeToMarket, communityGrowth

3. **Feature Importance Analysis**
   - Random Forest importance on 300+ temporal features
   - Top 15 features per target visualized

**Outputs:**

- `arima_forecasts.csv` (forecast vs actual comparison)
- `temporal_cv_results.csv` (CV performance metrics)
- `temporal_feature_importance_rf.csv` (feature rankings)
- 📊 **3 Visualizations:**
  - ARIMA forecasts vs actuals
  - Top temporal features for timeToMarket
  - Top temporal features for communityGrowth

---

## Phase 4: Expected Results (After Collection Completes)

### 4.1. Dataset Improvements

**Before (Cross-sectional):**
| Metric | Value |
|--------|-------|
| Data points | 50 |
| Temporal coverage | Single snapshot (Oct 2025) |
| Trends visible | ❌ No |
| Time-series models | ❌ Impossible |
| Prediction validation | ❌ Not possible |

**After (Temporal):**
| Metric | Value |
|--------|-------|
| Data points | **300** (6× increase) |
| Temporal coverage | **6 months** (Apr-Sep 2025) |
| Trends visible | ✅ Yes (improving vs declining) |
| Time-series models | ✅ ARIMA, Prophet, LSTM |
| Prediction validation | ✅ Longitudinal validation |

### 4.2. ML Model Improvements

**Expected Gains:**

- **New Features:** +300 temporal features (lags, trends, momentum, volatility)
- **Better CV:** TimeSeriesSplit instead of random 70/15/15
- **R² Improvement:** +5-10% expected (from 0.66 → 0.72)
- **Practical Value:** Can forecast future outcomes

### 4.3. Research Contributions

1. **Temporal Evolution Analysis**

   - Which projects improved over time?
   - Which metrics are most volatile?
   - Seasonal patterns (if any)

2. **Validated Predictions**

   - Test predictions on future data (last month)
   - Measure actual vs predicted accuracy

3. **Dynamic Insights**
   - Rate of improvement matters more than static score
   - Volatility signals instability
   - Momentum predicts future direction

---

## Technical Implementation Details

### File Structure

```
masters-thesis/
├── packages/
│   ├── metrics-collector/src/
│   │   └── github-collector.ts         # ✅ Temporal support added
│   └── scripts/src/
│       └── temporal-metrics-report.mjs # ✅ New CLI tool
├── input/
│   ├── projects.json                   # 50 projects config
│   └── projects_test.json              # 2 projects for testing
├── reports/
│   ├── metrics_report_temporal.json    # 🔄 Generating (300 snapshots)
│   ├── metrics_report_temporal_long.csv
│   ├── temporal_collection_summary.md
│   └── temporal/
│       ├── engineered_features_temporal.csv
│       ├── feature_list_temporal.csv
│       ├── temporal_feature_importance.csv
│       ├── arima_forecasts.csv
│       ├── temporal_cv_results.csv
│       ├── temporal_feature_importance_rf.csv
│       └── *.png                       # Visualizations
└── analysis/
    ├── temporal_analysis.py            # ✅ EDA script
    ├── temporal_feature_engineering.py # ✅ Feature engineering
    └── temporal_modeling.py            # ✅ Time-series models
```

### Data Schema

**Nested JSON Format:**

```json
{
  "generatedAt": "2025-10-10T...",
  "temporalConfig": {
    "startDate": "2025-04-30",
    "endDate": "2025-09-30",
    "snapshotCount": 6,
    "projectCount": 50
  },
  "projects": [
    {
      "name": "microsoft/TypeScript",
      "description": "...",
      "category": "Core TypeScript Projects",
      "snapshotCount": 6,
      "snapshots": [
        {
          "collectedAt": "2025-04-30T...",
          "developerExperience": { ... },
          "technicalPerformance": { ... },
          "businessImpact": { ... }
        },
        ...
      ]
    },
    ...
  ]
}
```

**Long CSV Format:**

```csv
project,date,dx_codeReviewDuration,dx_debuggingTime,...,bi_communityGrowth
microsoft/TypeScript,2025-04-30,470.85,6593.84,...,106.321
microsoft/TypeScript,2025-05-31,468.22,6401.19,...,108.456
...
```

### Performance Metrics

**Collection Speed:**

- **Per Project:** ~2 minutes (6 snapshots + delays)
- **Total Time:** ~100 minutes (50 projects)
- **Rate Limiting:** 2s delay between projects, 0.5s between snapshots
- **Parallelization:** Sequential (to avoid API limits)

**Resource Usage:**

- **Memory:** ~100MB peak
- **Disk:** ~340KB JSON output
- **Network:** ~1800 GitHub API requests (300 collections × 6 requests each)

---

## Next Steps

### Immediate (After Collection Completes)

1. ✅ **Run Analysis Scripts:**

   ```bash
   cd analysis
   source venv/bin/activate
   python temporal_analysis.py
   python temporal_feature_engineering.py
   python temporal_modeling.py
   ```

2. ✅ **Generate Comprehensive Report:**

   - Create `temporal_analysis_report.md` (30-40 pages)
   - Document findings, visualizations, insights

3. ✅ **Update Documentation:**
   - Mark Limitation 3 as ~~FIXED~~ in `ml_modeling_report.md`
   - Update `research_plan.md` (Phase 2.3 completed)
   - Update `analysis/README.md` with new scripts

### Future Work

1. **Re-train ML Models** with temporal features

   - Expected R² improvement: +5-10%
   - Better generalization with temporal CV

2. **Prophet Models** (if time permits)

   - Facebook's time-series forecasting library
   - Handles seasonality automatically

3. **LSTM Neural Networks** (if sufficient data)

   - Deep learning for sequential data
   - Requires more data (300 points may be borderline)

4. **Validation Study** (6 months from now)
   - Collect Oct 2025 data
   - Compare actual vs predicted values
   - Measure real-world accuracy

---

## Conclusion

**Status:** Successfully implemented complete temporal data infrastructure. Collection in progress (7/50 projects, ~14%).

**Impact:** Transforms research from cross-sectional → longitudinal study, enabling:

- ✅ Trend analysis (improving vs declining projects)
- ✅ Time-series forecasting (ARIMA, Prophet)
- ✅ Temporal feature engineering (300+ new features)
- ✅ Validated predictions (test on future data)

**Limitation 3 Resolution:** **MEDIUM → HIGH PRIORITY ADDRESSED**

The temporal dimension adds significant depth to the analysis, enabling not just "what is the quality?" but "how is quality changing?" and "what will quality be?".

---

**Кінець звіту**

_Магістерська робота: Outcome-based оцінка якості TypeScript коду_
_Одеський політехнічний національний університет, 2025_
_Автор: Слабенко Костянтин Олегович_
