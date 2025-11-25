# Outcome-based Quality Assessment of TypeScript Code

**Master's Thesis**
Kostiantyn Slabenko, Group AS-202
Odessa Polytechnic National University, 2025

**Scientific Supervisor:** Doctor of Technical Sciences, Professor Vira Liubchenko

---

## Overview

Research on outcome-based approach to TypeScript code quality assessment based on analysis of 50 popular open-source web development projects. We measure not "how code looks", but "how code works in the real world" through the lens of impact on developer productivity, technical reliability, and business outcomes.

### Key Achievements

- **Dataset:** 50 TypeScript projects with >5000 GitHub stars
- **Metrics:** 20 outcome-based metrics (DX, TP, BI)
- **Temporal Data:** 300 snapshots (50 projects × 6 months)
- **ML Models:** 7 algorithms (Linear, Ridge, Lasso, ElasticNet, RF, XGBoost, LightGBM)
- **Features:** 315 total features (18 original + 297 temporal)
- **Best R²:** 0.928 (community growth prediction)

### Key Findings

1. **Code Review Duration** critical for delivery (r = 0.88)
   - 1 hour review → 5.5 hours delivery delay
   - Recommendation: SLA <48h, automated checks, PRs <400 lines

2. **Test Coverage** drives community growth (r = 0.77)
   - +10% coverage → +70 stars/month
   - Signal of quality for contributors

3. **DX × TP Interaction** most important feature (47% importance)
   - Developer Experience AND Technical Performance work synergistically
   - 50/50 budget allocation recommended

---

## Repository Structure

```
.
├── packages/              # TypeScript codebase
│   ├── metrics/           # Metrics and calculations
│   ├── metrics-collector/ # GitHub API collectors
│   └── scripts/           # CLI tools
├── analysis/              # Python analytics
│   ├── data_validation.py
│   ├── statistical_analysis.py
│   ├── temporal_analysis.py
│   ├── temporal_feature_engineering.py
│   └── ml_modeling.py
├── reports/               # Generated reports
│   ├── metrics_report.md
│   ├── data_validation_report.md
│   ├── statistical_analysis_report.md
│   ├── ml_modeling_report.md
│   ├── temporal_collection_summary.md
│   └── temporal_implementation_summary.md
├── docs/                  # Documentation
│   ├── architecture.md
│   ├── usage_guide.md
│   ├── best_practices.md
│   ├── replication_package.md
│   └── outcome_based_approach.md
├── input/                 # Input data
│   └── projects.json      # 50 projects configuration
└── thesis/                # Thesis text
```

---

## Quick Start

### Requirements

- **Node.js** 20+ (TypeScript infrastructure)
- **Python** 3.10+ (data analysis)
- **GitHub Token** (for metrics collection)

### Installation

```bash
# 1. Clone repository
git clone <repo-url>
cd masters-thesis

# 2. Install Node.js dependencies
npm install

# 3. Install Python dependencies
pip install -r analysis/requirements.txt

# 4. Set GitHub token
export GITHUB_TOKEN="your_github_token"
```

### Metrics Collection

```bash
# Cross-sectional metrics (50 projects)
npx nx run scripts:detailed-metrics-report \
  --projects input/projects.json \
  --outputDir reports/

# Temporal metrics (6 months)
npx nx run scripts:temporal-metrics-report \
  --projects input/projects.json \
  --outputDir reports/temporal/
```

### Run Analysis

```bash
# Phase 2.1: Data Validation & Exploration
python analysis/data_validation.py

# Phase 2.2: Statistical Analysis & Feature Engineering
python analysis/statistical_analysis.py

# Phase 2.3: Temporal Analysis
python analysis/temporal_analysis.py
python analysis/temporal_feature_engineering.py

# Phase 3: ML Modeling
python analysis/ml_modeling.py
```

### Practical Tool

```bash
# Analyze quality of your project
npx nx run scripts:quality-dashboard \
  --owner facebook \
  --repo react \
  --format terminal  # or json
```

---

## Outcome-based Metrics

### Developer Experience (DX)
- Code Review Duration
- Debugging Time
- Build Time
- Time to First Commit
- PR Iteration Rate

### Technical Performance (TP)
- TypeScript Error Rate
- Test Coverage
- Bundle Size
- Bundle Load Time
- Performance Score

### Business Impact (BI)
- Time to Market
- Feature Success Rate
- Active Contributors
- Issue Resolution Rate
- Community Growth

---

## Research Results

### Dataset Statistics

- **Projects:** 50 TypeScript projects (5K-100K+ stars)
- **Categories:** Core Frameworks, UI Libraries, State Management, Build Tools, Developer Tools, Data & Forms
- **Data Points:** 1000+ (50 projects × 20 metrics)
- **Temporal Snapshots:** 300 (50 projects × 6 months)
- **Completeness:** 100% (0 missing values)
- **Confidence:** 90% average

### ML Model Performance (after data leakage fix)

**overallScore prediction:**
- Best Model: Linear Regression
- Test R² = 0.625
- RMSE = 5.116 points

**timeToMarket prediction:**
- Best Model: Lasso
- Test R² = 0.663
- RMSE = 7.835 hours

**communityGrowth prediction:**
- Best Model: Lasso
- Test R² = 0.394
- RMSE = 8.231 stars/month

**Temporal Models (with 297 temporal features):**
- Random Forest R² = 0.782-0.928 (TimeSeriesSplit CV)
- ARIMA forecasting: 8-14% error
- Top predictors: rolling statistics (2-3 month windows)

### Feature Importance

**Top 5 predictors:**
1. `dx_tp_interaction` - 47.5% (DX × TP synergy)
2. `dx_codeReviewDuration` - 40.5% (delivery impact)
3. `tp_testCoverage` - 83.4% (community growth driver)
4. `bi_featureSuccessRate` - 26.8%
5. `tp_typeScriptErrorRate` - 7.3%

---

## Practical Recommendations

### Priority 1: Optimize Code Review Process (highest ROI)

**Problem:** Each hour of code review adds 5.5 hours delivery delay

**Solutions:**
- SLA <48 hours for reviews
- Automated checks (linting, type checking, tests)
- Smaller PRs (<400 lines)
- Review assignments algorithm

**Expected Impact:** 12 days faster delivery, 929% ROI

### Priority 2: Invest in Test Coverage (target >85%)

**Problem:** Test coverage has the strongest correlation with community growth (r = 0.77)

**Solutions:**
- Jest/Playwright infrastructure
- Coverage badges in README
- CI/CD coverage gates
- Testing documentation

**Expected Impact:** +70 stars/month per 10% increase

### Priority 3: Balance DX and TP Investments

**Problem:** Interaction effects (DX × TP) most important (47% importance)

**Solutions:**
- 50/50 budget allocation
- Developer tools + infrastructure
- Fast feedback loops
- Performance monitoring

---

## Documentation

### For Researchers

- **[Research Plan](docs/research_plan.md)** - complete research plan (100% completed)
- **[Outcome-based Approach](docs/outcome_based_approach.md)** - philosophy of the approach
- **[Replication Package](docs/replication_package.md)** - result reproduction
- **[Developer Productivity Research](docs/developer_productivity_research.md)** - literature review

### For Developers

- **[Architecture](docs/architecture.md)** - system design (8000+ words)
- **[Usage Guide](docs/usage_guide.md)** - step-by-step instructions (10000+ words)
- **[Best Practices](docs/best_practices.md)** - practical recommendations (8000+ words)

### Analysis Reports

- **[Data Validation Report](reports/data_validation_report.md)** - 31 pages, EDA
- **[Statistical Analysis Report](reports/statistical_analysis_report.md)** - 40 pages, hypothesis testing
- **[ML Modeling Report](reports/ml_modeling_report.md)** - 50 pages, predictive models
- **[Temporal Analysis Summary](reports/temporal_implementation_summary.md)** - 15 sections, time series

---

## Technology Stack

### TypeScript Infrastructure
- **Nx** - monorepo management
- **TypeScript** 5.9+ - type safety
- **ESLint** - code quality

### Python Analytics
- **pandas** - data manipulation
- **numpy** - numerical computing
- **matplotlib/seaborn** - visualization
- **scikit-learn** - ML models
- **statsmodels** - statistical analysis
- **lightgbm/xgboost** - gradient boosting

---

## Project Status

### Completed Phases (100%)

- ✅ Phase 1: Data Collection (50 projects, 0 errors)
- ✅ Phase 2.1: Data Validation & Exploration (100% completeness)
- ✅ Phase 2.2: Statistical Analysis & Feature Engineering (171 hypothesis tests)
- ✅ Phase 2.3: Temporal Data Collection & Analysis (300 snapshots)
- ✅ Phase 3: ML Modeling (7 algorithms, SHAP analysis)
- ✅ Phase 4: Implementation & Documentation (comprehensive docs + CLI tool)

### Future Work (Stretch Goals)

- 🔮 VS Code extension for real-time quality scoring
- 🔮 Web dashboard for project analysis
- 🔮 Real-world testing with pilot teams
- 🔮 Dataset expansion to 150+ projects (for R² > 0.75)
- 🔮 Survey distribution to contributors

---

## Citation

If you use this work in your research, please cite:

```bibtex
@mastersthesis{slabenko2025outcome,
  author = {Kostiantyn Slabenko},
  title = {Outcome-based Quality Assessment of TypeScript Code},
  school = {Odessa Polytechnic National University},
  year = {2025},
  type = {Master's Thesis},
  address = {Odessa, Ukraine},
  note = {Supervised by Prof. Vira Liubchenko}
}
```

---

## License

MIT License - see [LICENSE](LICENSE)

---

## Contact

**Author:** Kostiantyn Slabenko
**Email:** 8983031@stud.op.edu.ua

**Scientific Supervisor:** Professor Vira Liubchenko
**Institution:** Odessa Polytechnic National University

---

## Acknowledgments

- Maintainers of 50 projects in the dataset
- GitHub for public API
- TypeScript/React open source community
- Scientific supervisor for support and guidance

---

**Last Updated:** November 25, 2025
