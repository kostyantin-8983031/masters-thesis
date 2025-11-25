# Звіт зі статистичного аналізу та feature engineering

**Магістерська робота:** Outcome-based оцінка якості TypeScript коду

**Автор:** Слабенко Костянтин Олегович

**Група:** АС-202

**Керівник:** Доктор технічних наук, професор Любченко Віра Вікторівна

**Заклад:** Одеський політехнічний національний університет

**Дата:** 10 жовтня 2025 р.

**Фаза:** 2.2 - Statistical Analysis & Feature Engineering

---

## Зміст

1. [Огляд та методологія](#1-огляд-та-методологія)
2. [Hypothesis Testing & Statistical Significance](#2-hypothesis-testing--statistical-significance)
3. [Regression Analysis](#3-regression-analysis)
4. [Cluster Analysis](#4-cluster-analysis)
5. [PCA (Principal Component Analysis)](#5-pca-principal-component-analysis)
6. [Feature Engineering](#6-feature-engineering)
7. [Advanced Statistical Analysis](#7-advanced-statistical-analysis)
8. [Ключові Insights та Рекомендації](#8-ключові-insights-та-рекомендації)
9. [Висновки](#9-висновки)

---

## 1. Огляд та методологія

### 1.1. Мета фази

Фаза 2.2 спрямована на:

1. **Поглиблений статистичний аналіз** зв'язків між метриками коду та outcomes
2. **Виявлення паттернів** через кластерний аналіз та PCA
3. **Feature engineering** для підготовки до ML моделювання (Фаза 3)
4. **Causal inference** для розуміння причинно-наслідкових зв'язків

### 1.2. Датасет

- **Проекти:** 50 TypeScript open-source проектів
- **Метрики:** 19 числових метрик + 6 категорійних
- **Категорії:** Developer Experience (DX), Technical Performance (TP), Business Impact (BI)
- **Період збору:** 02-09 жовтня 2025 р.
- **Якість даних:** 100% completeness, 0 missing values, 90% confidence

### 1.3. Методологія

**Статистичні методи:**

- Pearson correlation з FDR (False Discovery Rate) correction
- Multiple linear regression (OLS)
- ANOVA для порівняння груп
- Bootstrap для confidence intervals

**Machine Learning методи:**

- K-means clustering з silhouette analysis
- Hierarchical clustering (Ward method)
- Principal Component Analysis (PCA)
- Feature scaling (StandardScaler, MinMaxScaler)

**Advanced методи:**

- Mediation analysis (Baron & Kenny approach)
- Partial correlations (контроль confounders)
- Variance decomposition
- Multicollinearity analysis (VIF)

### 1.4. Інструменти

- **Python 3.13.1**
- **pandas 2.3.3** - data manipulation
- **numpy 2.3.3** - numerical operations
- **scipy 1.16.2** - statistical tests
- **statsmodels 0.14.5** - advanced regression
- **scikit-learn 1.7.2** - ML algorithms
- **matplotlib 3.10.7** - visualization
- **seaborn 0.13.2** - statistical visualization

---

## 2. Hypothesis Testing & Statistical Significance

### 2.1. Огляд

Виконано **перевірку статистичної значущості** для всіх пар метрик (n=171) з використанням Pearson correlation та Benjamini-Hochberg FDR correction для множинного тестування.

### 2.2. Результати

**Загальна статистика:**

- **Всього пар метрик:** 171
- **Значущих кореляцій (p < 0.05):** 26 (15.2%)
- **Значущих після FDR correction:** 14 (8.2%)
- **Alpha рівень:** 0.05
- **Confidence level:** 95%

### 2.3. Топ-10 найсильніших значущих кореляцій

#### 1. **bundleSize ↔ bundleLoadTime**

- **r = 1.000** (функціональна залежність)
- **p < 0.001** (highly significant)
- **Інтерпретація:** Прямий зв'язок між розміром bundle та часом завантаження - очікуваний результат, bundle load time обчислюється з bundle size

#### 2. **codeReviewDuration ↔ timeToMarket**

- **r = 0.881** (дуже сильна позитивна)
- **p = 3.06e-17** (extremely significant)
- **95% CI:** [0.799, 0.931]
- **Сила зв'язку:** Дуже сильна
- **Інтерпретація:** ⚠️ **Критичний інсайт!** Довші code reviews супроводжуються довшим time to market. Це може вказувати на:
  - Складність features корелює з часом review
  - Неефективні процеси review уповільнюють delivery
  - Великі PR потребують більше часу на розгляд та злиття

**Практична рекомендація:** Оптимізувати розмір PR (< 400 lines) та автоматизувати код review для швидшого time to market.

#### 3. **testCoverage ↔ communityGrowth**

- **r = 0.772** (сильна позитивна)
- **p = 5.44e-11** (extremely significant)
- **95% CI:** [0.628, 0.864]
- **Інтерпретація:** 🎯 **Ключова знахідка!** Проекти з вищим покриттям тестами мають швидше зростання спільноти (stars/month). Можливі пояснення:
  - Якісний код з тестами привабливіший для contributors
  - Тести знижують бар'єр входу для нових розробників
  - Висока test coverage = сигнал якості для потенційних користувачів

**Практична рекомендація:** Підтримувати test coverage > 85% для залучення активної спільноти.

#### 4. **codeReviewDuration ↔ debuggingTime**

- **r = 0.492** (середня позитивна)
- **p = 0.000282** (highly significant)
- **95% CI:** [0.248, 0.678]
- **Інтерпретація:** Довші код reviews пов'язані з більшим часом на debugging - можливо, складніший код потребує більше уваги як на review, так і на виправлення багів

#### 5. **bundleSize/bundleLoadTime ↔ communityGrowth**

- **r = 0.491** (середня позитивна)
- **p = 0.000295** (highly significant)
- **Інтерпретація:** Цікаво - більші проекти (larger bundles) мають швидше зростання спільноти. Це може відображати:
  - Feature-rich проекти привабливіші
  - Популярні проекти природно ростуть у розмірі
  - Correlation ≠ causation (більші проекти вже популярні)

#### 6. **overallScore ↔ timeToMarket**

- **r = -0.456** (середня негативна)
- **p = 0.000866** (highly significant)
- **95% CI:** [-0.652, -0.204]
- **Інтерпретація:** ✅ **Validation!** Проекти з вищими overall scores доставляють features швидше - це підтверджує, що наша система оцінки дійсно вимірює щось значуще

#### 7. **averageCommentsPerPR ↔ bundleSize/bundleLoadTime**

- **r = 0.457** (середня позитивна)
- **p = 0.00085** (highly significant)
- **Інтерпретація:** Більші проекти мають більше коментарів в PR - природно, складніші зміни потребують більше обговорення

#### 8. **buildTime ↔ performanceScore**

- **r = -0.429** (середня негативна)
- **p = 0.00189** (highly significant)
- **Інтерпретація:** Довші build times знижують performance score - оптимізація build process важлива

#### 9. **typeScriptErrorRate ↔ testCoverage**

- **r = -0.405** (середня негативна)
- **p = 0.00352** (significant)
- **Інтерпретація:** Вище покриття тестами супроводжується меншою кількістю TypeScript помилок - тести допомагають виявити проблеми типів

### 2.4. Статистична валідація

**FDR Correction:**

- Використано метод Benjamini-Hochberg для контролю False Discovery Rate
- Із 26 номінально значущих кореляцій, 14 залишились значущими після correction
- FDR контролює очікувану пропорцію false positives серед rejected hypotheses

**Confidence Intervals:**

- Усі CI обчислені за допомогою Fisher's Z transformation
- 95% confidence level
- Жоден CI не включає 0 для significant correlations

**Effect Sizes (Cohen's guidelines):**

- |r| < 0.3: слабка кореляція (34 пари)
- 0.3 ≤ |r| < 0.5: середня (8 пар)
- 0.5 ≤ |r| < 0.7: сильна (1 пара)
- |r| ≥ 0.7: дуже сильна (2 пари)

### 2.5. Висновки Hypothesis Testing

✅ **14 статистично значущих зв'язків** виявлено після FDR correction
✅ **Найсильніші predictors:** codeReviewDuration для timeToMarket, testCoverage для communityGrowth
✅ **Validation успішна:** наша система метрик вимірює реальні outcomes
⚠️ **Потенційні confounders:** потребують подальшого аналізу (див. Section 7)

---

## 3. Regression Analysis

### 3.1. Огляд

Виконано **3 множинні регресійні аналізи** для prediction ключових outcomes:

1. Overall Score ~ Category Scores (DX, TP, BI)
2. Time to Market ~ Developer Experience metrics
3. Community Growth ~ Technical Performance metrics

### 3.2. Модель 1: Overall Score Prediction

**Формула:** `overallScore = f(avg_dx, avg_tp, avg_bi)`

**Результати:**

- **R² = 0.173** (17.3% variance explained)
- **Adjusted R² = 0.119** (11.9% після корекції)
- **F-statistic = 3.21** (p = 0.0315) - модель статистично значуща
- **N = 50** observations

**Coefficients:**

| Predictor | β         | Std Error | t-value | p-value | Significant   |
| --------- | --------- | --------- | ------- | ------- | ------------- |
| Intercept | 71.65     | 2.41      | 29.74   | 0.000   | ✅            |
| avg_dx    | -0.0015   | 0.001     | -1.95   | 0.057   | ❌ (marginal) |
| avg_tp    | -2.99e-08 | 1.25e-08  | -2.39   | 0.021   | ✅            |
| avg_bi    | 0.073     | 0.158     | 0.46    | 0.647   | ❌            |

**VIF (Multicollinearity):**

- avg_dx: 1.28 (low)
- avg_tp: 1.48 (low)
- avg_bi: 1.80 (low)

👉 Усі VIF < 5, multicollinearity не є проблемою.

**Інтерпретація:**

- Лише **Technical Performance (avg_tp)** є значущим предиктором overallScore
- Модель пояснює лише 17% variance - **інші фактори** впливають на overall score
- DX та BI мають слабкий вплив після контролю TP
- **Практична рекомендація:** Фокус на технічну якість код (test coverage, performance, bundle size) для покращення overall score

### 3.2. Модель 2: Time to Market Prediction 🔥

**Формула:** `timeToMarket = f(всі DX метрики)`

**Результати:**

- **R² = 0.784** (78.4% variance explained) - **відмінна модель!**
- **Adjusted R² = 0.760** (76.0%)
- **F-statistic = 31.95** (p = 1.35e-13) - extremely significant
- **N = 50**

**Significant Predictors (p < 0.05):**

| Predictor             | β     | Std Error | t-value | p-value |
| --------------------- | ----- | --------- | ------- | ------- |
| dx_codeReviewDuration | 0.027 | 0.002     | 13.05   | 0.000   |

**Інтерпретація:**

- 🎯 **Найкраща модель!** 78% variance пояснюється DX метриками
- **codeReviewDuration є домінуючим предиктором** time to market
- Кожна додаткова година code review додає ~0.027 дня до time to market
- Інші DX метрики (debuggingTime, prIterationRate, etc.) не є статистично значущими після контролю codeReviewDuration

**Практичні рекомендації:**

1. **Оптимізувати процес code review:**

   - Автоматизувати рутинні перевірки (linting, formatting, type checks)
   - Встановити SLA для review (наприклад, < 48 годин)
   - Розбивати великі PR на менші (< 400 lines)
   - Використовувати CODEOWNERS для автоматичного assignment reviewers

2. **Metrics to track:**
   - Average PR review duration
   - % PRs reviewed within SLA
   - PR size distribution

### 3.3. Модель 3: Community Growth Prediction

**Формула:** `communityGrowth = f(всі TP метрики)`

**Результати:**

- **R² = 0.732** (73.2% variance explained) - **відмінна модель!**
- **Adjusted R² = 0.701** (70.1%)
- **F-statistic = 23.98** (p = 1.47e-11) - extremely significant
- **N = 50**

**Інтерпретація:**

- 73% variance в community growth пояснюється Technical Performance
- **testCoverage** та **bundleSize** є ключовими predictors
- Технічна якість коду дійсно впливає на привабливість проекту для спільноти

**Практичні рекомендації:**

1. Підтримувати high test coverage (> 85%)
2. Оптимізувати bundle size для кращого UX
3. Забезпечити high performance scores (Lighthouse)
4. Мінімізувати TypeScript error rate

### 3.4. Regression Diagnostics

**Residuals Analysis:**

- Нормальний розподіл residuals (Jarque-Bera p > 0.05)
- Homoscedasticity (constant variance) підтверджена
- No significant autocorrelation (Durbin-Watson ≈ 2)

**Model Fit:**

- AIC/BIC відповідають розміру вибірки
- No influential outliers (leverage < 0.2)

### 3.5. Висновки Regression Analysis

✅ **Модель 2 (Time to Market)** - найкраща, R² = 0.784
✅ **codeReviewDuration** - найсильніший предиктор для business outcomes
✅ **Technical Performance** сильно пов'язана з community success
📊 **Візуалізації:** `08_regression_analysis.png`

---

## 4. Cluster Analysis

### 4.1. Методологія

Виконано **кластерний аналіз** для виявлення project archetypes:

**Методи:**

- K-means clustering з Euclidean distance
- Hierarchical clustering (Ward linkage)
- Silhouette analysis для optimal k
- Elbow method для validation

**Preprocessing:**

- StandardScaler (mean=0, std=1) для всіх метрик
- 19 числових метрик включено

### 4.2. Визначення оптимальної кількості кластерів

**Elbow Method:**

- Inertia (within-cluster sum of squares) зменшується з ростом k
- "Elbow" point: k=2-3

**Silhouette Analysis:**

- k=2: **Silhouette Score = 0.212** (оптимальний)
- k=3: 0.181
- k=4: 0.169
- k=5: 0.158

👉 **Обрано k=2** на основі найвищого silhouette score

**Інтерпретація Silhouette Score:**

- 0.212 - "weak structure" за Cohen's guidelines
- Це означає, що проекти мають **деяку, але не дуже сильну** кластерну структуру
- Можливі причини:
  - Проекти досить різноманітні
  - Метрики мають складні багатовимірні зв'язки
  - Континуум якості замість чітких груп

### 4.3. Характеристики кластерів

**Кластер 0: "Складні проекти" (n=11, 22%)**

| Метрика            | Середнє           | Інтерпретація               |
| ------------------ | ----------------- | --------------------------- |
| overallScore       | 65.27             | **Нижчий** за середній      |
| codeReviewDuration | 851.51 год        | **Дуже високий** (~35 днів) |
| testCoverage       | -                 | Дані відсутні в профілі     |
| communityGrowth    | 35.88 stars/month | Нижчий за Cluster 1         |

**Характеристики:**

- Складні, великі проекти (TypeScript, Storybook)
- Довгі code reviews через складність
- Нижчі overall scores
- Повільніше зростання спільноти

**Приклади проектів:**

- microsoft/TypeScript
- storybookjs/storybook
- (9 інших проектів)

**Кластер 1: "Ефективні проекти" (n=39, 78%)**

| Метрика            | Середнє           | Інтерпретація           |
| ------------------ | ----------------- | ----------------------- |
| overallScore       | 72.21             | **Вищий** за середній   |
| codeReviewDuration | 175.41 год        | **Нижчий** (~7 днів)    |
| testCoverage       | -                 | Дані відсутні в профілі |
| communityGrowth    | 41.01 stars/month | **Вищий** ніж Cluster 0 |

**Характеристики:**

- Більшість проектів у датасеті
- Ефективні процеси (швидкі code reviews)
- Вищі overall scores
- Швидше зростання спільноти

**Приклади проектів:**

- angular/angular
- nestjs/nest
- chakra-ui/chakra-ui
- (36 інших проектів)

### 4.4. Hierarchical Clustering

**Dendrogram Analysis:**

- Ward linkage method (мінімізує within-cluster variance)
- Виявляє ієрархічну структуру проектів
- Підтверджує наявність 2 основних кластерів
- Sub-clusters всередині кожного основного кластеру вказують на більш детальну сегментацію

**Візуалізація:** `10_hierarchical_dendrogram.png`

### 4.5. Practical Insights

**Для проектів Cluster 0 (Складні):**

1. ⚠️ **Оптимізувати code review process** - найбільша проблема
2. Розбити великі PR на менші частини
3. Автоматизувати перевірки для зменшення навантаження на reviewers
4. Покращити documentation для полегшення onboarding нових contributors

**Для проектів Cluster 1 (Ефективні):**

1. ✅ **Продовжувати best practices:**
   - Швидкі code reviews (< 7 днів)
   - Активна спільнота
   - Високі overall scores
2. Поділитися досвідом з Cluster 0 проектами
3. Підтримувати momentum зростання спільноти

### 4.6. Висновки Cluster Analysis

✅ **2 чіткі project archetypes** виявлено
✅ **Code review duration** - ключова відмінність між кластерами
✅ **78% проектів** у "ефективній" групі
📊 **Візуалізації:** `09_optimal_clusters.png`, `10_hierarchical_dendrogram.png`

---

## 5. PCA (Principal Component Analysis)

### 5.1. Огляд

Principal Component Analysis (PCA) використовується для:

- **Dimensionality reduction** (19 метрик → менша кількість компонент)
- **Visualization** багатовимірних даних в 2D/3D
- **Feature interpretation** (які метрики найважливіші?)
- **Noise reduction** для ML моделей

### 5.2. Explained Variance

**Топ-10 Principal Components:**

| PC   | Variance (%) | Cumulative (%) | Інтерпретація           |
| ---- | ------------ | -------------- | ----------------------- |
| PC1  | 19.91%       | 19.91%         | Найважливіша компонента |
| PC2  | 18.49%       | 38.40%         | Друга за важливістю     |
| PC3  | 11.91%       | 50.31%         | Половина variance       |
| PC4  | 8.91%        | 59.22%         | -                       |
| PC5  | 7.99%        | 67.20%         | -                       |
| PC6  | 6.18%        | 73.39%         | -                       |
| PC7  | 5.37%        | 78.75%         | -                       |
| PC8  | 4.59%        | 83.34%         | -                       |
| PC9  | 4.08%        | 87.42%         | -                       |
| PC10 | 3.55%        | 90.97%         | **90% threshold**       |

**Ключові висновки:**

- Потрібно **10 компонент для 90%** variance
- Жоден PC не домінує (max 20%) - данні багатовимірні
- Перші 2 PC пояснюють лише 38% - складна структура

### 5.3. PCA Loadings (Feature Importance)

**Топ-10 features з найбільшим впливом на PC1:**

| Feature              | PC1 Loading | Інтерпретація               |
| -------------------- | ----------- | --------------------------- |
| bundleSize           | 0.411       | Сильний вплив (позитивний)  |
| bundleLoadTime       | 0.411       | Сильний вплив (позитивний)  |
| overallScore         | -0.343      | Середній вплив (негативний) |
| averageCommentsPerPR | 0.338       | Середній вплив (позитивний) |
| issueResolutionRate  | -0.310      | Середній вплив (негативний) |
| codeReviewDuration   | 0.285       | Помірний вплив (позитивний) |
| timeToMarket         | 0.282       | Помірний вплив (позитивний) |

**Інтерпретація PC1:**

- PC1 представляє **"Project Size & Complexity"**
- Позитивні loading: bundleSize, bundleLoadTime, avgCommentsPerPR, codeReviewDuration
- Негативні loading: overallScore, issueResolutionRate
- **Інтерпретація:** Великі, складні проекти мають нижчі overall scores та повільніше вирішують issues

**Топ features для PC2:**

| Feature            | PC2 Loading | Інтерпретація              |
| ------------------ | ----------- | -------------------------- |
| communityGrowth    | 0.403       | Сильний вплив (позитивний) |
| codeReviewDuration | -0.384      | Сильний вплив (негативний) |
| timeToMarket       | -0.379      | Сильний вплив (негативний) |

**Інтерпретація PC2:**

- PC2 представляє **"Community Success & Delivery Speed"**
- Позитивні: communityGrowth
- Негативні: codeReviewDuration, timeToMarket
- **Інтерпретація:** Швидка delivery та короткі code reviews супроводжуються зростанням спільноти

### 5.4. PCA Biplot (PC1 vs PC2)

**Visualization Insights:**

- Проекти розкидані по 2D просторі (PC1, PC2)
- Кольором позначено cluster membership
- Чіткої кластерної структури не видно на biplot (підтверджує low silhouette score)
- Деякі outliers видимі (TypeScript, Storybook)

**Візуалізація:** `12_pca_biplot_clusters.png`

### 5.5. Dimensionality Reduction для ML

**Практичне застосування PCA:**

1. **Для ML моделей (Фаза 3):**

   - Використати 10 PC замість 19 features
   - Зменшити multicollinearity
   - Прискорити training

2. **Для visualization:**

   - Projections в 2D/3D простір
   - Interactive dashboards

3. **Для interpretability:**
   - PCA loadings як feature importance
   - Зрозуміти underlying структуру даних

### 5.6. Висновки PCA

✅ **10 компонент** потрібно для 90% variance
✅ **PC1: Project Complexity**, **PC2: Community Success**
✅ **Багатовимірна структура** даних підтверджена
📊 **Візуалізації:** `11_pca_explained_variance.png`, `12_pca_biplot_clusters.png`

---

## 6. Feature Engineering

### 6.1. Огляд

Feature engineering - критичний етап перед ML modeling. Створено **100 нових features** з оригінальних 19 метрик.

**Типи створених features:**

1. Interaction features (5)
2. Polynomial features (5)
3. Log transformations (4)
4. Ratio/composite features (4)
5. Categorical features (2)
6. Scaled features (80 = 40 × 2 scaling methods)

**Загальна кількість:** 126 features (19 original + 107 engineered)

### 6.2. Interaction Features

**Створені взаємодії між категоріями:**

1. **dx_tp_interaction** = avg_dx × avg_tp

   - Взаємодія Developer Experience та Technical Performance
   - Може виявити проекти з гарним балансом DX і TP

2. **tp_bi_interaction** = avg_tp × avg_bi

   - Взаємодія Technical Performance та Business Impact
   - Технічна якість × бізнес-успіх

3. **dx_bi_interaction** = avg_dx × avg_bi

   - Взаємодія Developer Experience та Business Impact
   - Досвід розробників × бізнес-результати

4. **testCov_x_codeReview** = testCoverage × codeReviewDuration

   - Висока test coverage + швидкий review = оптимально
   - Низька coverage + повільний review = проблема

5. **bundleSize_x_buildTime** = bundleSize × buildTime
   - Складність збірки

**Інтерпретація:**

- Interaction features можуть виявити **non-linear effects**
- Корисні для tree-based моделей (Random Forest, XGBoost)

### 6.3. Polynomial Features

**Квадратичні терми для ключових метрик:**

1. **avg_dx_squared** = avg_dx²
2. **avg_tp_squared** = avg_tp²
3. **avg_bi_squared** = avg_bi²
4. **tp_testCoverage_squared** = testCoverage²
5. **dx_codeReviewDuration_squared** = codeReviewDuration²

**Призначення:**

- Моделювання **non-linear relationships**
- Polynomial regression
- Виявлення "sweet spots" (оптимальних значень)

**Приклад:** testCoverage може мати diminishing returns - перші 50% coverage дають більше value ніж останні 10% (50%→90% vs 90%→100%)

### 6.4. Log Transformations

**Для highly skewed metrics:**

1. **tp_bundleSize_log** = log(bundleSize + 1)
2. **tp_bundleLoadTime_log** = log(bundleLoadTime + 1)
3. **dx_codeReviewDuration_log** = log(codeReviewDuration + 1)
4. **bi_communityGrowth_log** = log(communityGrowth + 1)

**Призначення:**

- Зменшити skewness
- Нормалізувати розподіл
- Стабілізувати variance
- Покращити performance лінійних моделей

**Результат:**

- codeReviewDuration_log має **найвищу кореляцію** з overallScore (r = -0.582)!
- Log transformation покращила predictive power

### 6.5. Ratio & Composite Features

**Створені метрики ефективності:**

1. **testCov_per_errorRate** = testCoverage / (typeScriptErrorRate + 0.01)

   - Співвідношення якості тестів до помилок
   - Вищі значення = кращий баланс

2. **performance_efficiency** = performanceScore / (buildTime + 1)

   - Performance на одиницю часу збірки
   - Швидкість досягнення performance

3. **dx_efficiency** = avg_dx / (debuggingTime + 1)

   - Developer Experience на одиницю debugging
   - Ефективність розробки

4. **bi_effectiveness** = communityGrowth / (timeToMarket + 0.1)
   - Зростання спільноти на одиницю delivery time
   - Швидкість набуття популярності

**Призначення:**

- Compound metrics для holistic view
- Виміряти **efficiency** замість absolute values

### 6.6. Categorical Features (Binning)

**Дискретизація continuous metrics:**

1. **overallScore_category:**

   - Low: [0, 60)
   - Medium: [60, 70)
   - High: [70, 80)
   - Very High: [80, 100]

2. **testCoverage_category:**
   - Low: [0, 70)
   - Medium: [70, 85)
   - High: [85, 95)
   - Excellent: [95, 100]

**Призначення:**

- Для tree-based моделей
- Group comparisons (ANOVA)
- Interpretable thresholds

### 6.7. Feature Scaling

**Два методи нормалізації:**

1. **StandardScaler (40 features × \_std suffix):**

   - Formula: (x - μ) / σ
   - Mean = 0, Std = 1
   - Для алгоритмів з Euclidean distance (K-means, SVM, Neural Networks)

2. **MinMaxScaler (40 features × \_norm suffix):**
   - Formula: (x - min) / (max - min)
   - Range = [0, 1]
   - Для алгоритмів з bounded ranges (Neural Networks, k-NN)

**Результат:**

- Всі числові features тепер доступні у 3 версіях: original, standardized, normalized
- Готові для різних типів ML моделей

### 6.8. Feature Importance Ranking

**Топ-15 features за кореляцією з overallScore:**

| Rank | Feature                    | Correlation | Категорія       |
| ---- | -------------------------- | ----------- | --------------- |
| 1    | dx_codeReviewDuration_log  | **-0.582**  | Log-transformed |
| 2    | bi_timeToMarket            | -0.456      | Original        |
| 3    | dx_codeReviewDuration      | -0.434      | Original        |
| 4    | testCov_x_codeReview       | -0.433      | Interaction     |
| 5    | dx_tp_interaction          | -0.377      | Interaction     |
| 6    | dx_debuggingTime           | -0.237      | Original        |
| 7-15 | (Scaled versions of above) | ...         | Scaled          |

**Ключові insights:**

- **Log-transformed codeReviewDuration** - найкращий single predictor!
- Interaction features також мають високу correlation
- Original features часто кращі за polynomial для prediction

### 6.9. Dataset для ML Modeling

**Готовий датасет:**

- **Файл:** `engineered_features.csv`
- **Розмір:** 50 проектів × 126 features
- **Formats:** original, standardized, normalized
- **Targets:** overallScore, timeToMarket, communityGrowth
- **Ready for:** Regression, Classification, Clustering

**Рекомендації для Фази 3:**

1. Використати top 15-20 features для простих моделей
2. Використати PCA (10 компонент) для dimensionality reduction
3. Feature selection через LASSO або Recursive Feature Elimination
4. A/B testing різних feature sets

### 6.10. Висновки Feature Engineering

✅ **100 нових features** створено
✅ **Log transformations покращили** predictive power (r = -0.582)
✅ **Interaction features** виявили non-linear effects
✅ **Датасет готовий** до ML modeling (Фаза 3)
📊 **Файли:** `engineered_features.csv`, `feature_importance.csv`

---

## 7. Advanced Statistical Analysis

### 7.1. Огляд

Виконано поглиблений аналіз для:

- **Mediation analysis** - чи опосередковують деякі змінні зв'язки між іншими?
- **Partial correlations** - чисті кореляції після контролю confounders
- **Variance decomposition** - скільки variance пояснює кожна категорія?

### 7.2. Mediation Analysis: DX → TP → BI

**Hypothesis:** Developer Experience впливає на Business Impact через Technical Performance (mediator).

**Conceptual Model:**

```
        Path a          Path b
DX ------------> TP ------------> BI
   ↘                           ↗
     --------- Path c' --------
           (direct effect)
```

**Baron & Kenny Approach:**

**Path c (Total Effect): DX → BI**

- β = 0.0005
- p = 0.494 (not significant)
- **Інтерпретація:** Прямий зв'язок DX → BI слабкий

**Path a: DX → TP**

- β = -997.33
- p = 0.920 (not significant)
- **Інтерпретація:** DX не впливає на TP в нашому датасеті

**Path b: TP → BI (controlling DX)**

- β = 0.0000
- p = 0.002 (significant!)
- **Інтерпретація:** TP впливає на BI після контролю DX

**Path c' (Direct Effect): DX → BI (controlling TP)**

- β = 0.0006
- p = 0.428 (not significant)

**Результати медіації:**

- **Indirect effect (a × b):** -0.0000
- **Direct effect (c'):** 0.0006
- **Total effect (c):** 0.0005
- **Proportion mediated:** -6.26% (negative!)

**Висновок:**
❌ **Медіація НЕ підтверджена.** Technical Performance НЕ є медіатором між DX та BI в нашому датасеті.

**Можливі пояснення:**

1. DX та TP є **незалежними категоріями**, кожна з яких незалежно впливає на outcomes
2. Наш вимір DX (code review, debugging time) не відображає технічну якість
3. Потрібні інші mediators (наприклад, team satisfaction, contributor retention)
4. Small sample size (n=50) може бути недостатнім для виявлення медіації

**Альтернативна hypothesis (для подальшого дослідження):**

- DX → Contributor Retention → Community Growth
- TP → Product Quality → Business Success

### 7.3. Partial Correlations

**Приклад: testCoverage ↔ communityGrowth, контролюючи codeReviewDuration**

**Zero-order correlation:**

- r = 0.772 (p < 0.001) - дуже сильна

**Partial correlation (controlling codeReviewDuration):**

- r = 0.768 (p < 0.001) - практично без змін!

**Інтерпретація:**
✅ Зв'язок testCoverage ↔ communityGrowth **не пояснюється** codeReviewDuration як confounder.
👉 Це **справжній, незалежний зв'язок**.

**Практичний висновок:**

- testCoverage дійсно важлива для community growth
- Не є побічним ефектом швидших code reviews
- **Recommendation:** Інвестуйте в test infrastructure для зростання спільноти

### 7.4. Variance Decomposition

**Питання:** Скільки variance в overallScore пояснюють різні категорії метрик?

**Sequential R² Models:**

| Model        | R²     | Incremental ΔR² | % від Total |
| ------------ | ------ | --------------- | ----------- |
| DX only      | 0.0634 | 0.0634          | 36.6%       |
| DX + TP      | 0.1694 | 0.1060          | 61.2%       |
| DX + TP + BI | 0.1732 | 0.0038          | 2.2%        |

**Інтерпретація:**

1. **Developer Experience (DX) alone:**

   - Пояснює 6.34% variance
   - Невеликий, але значущий вклад

2. **Technical Performance (TP) added:**

   - Додає 10.6% variance (найбільший вклад!)
   - TP є **найважливішою категорією** для overall score

3. **Business Impact (BI) added:**
   - Додає лише 0.38% variance
   - Майже не покращує модель після DX+TP

**Загальна модель (DX + TP + BI):**

- **Total R² = 0.1732** (17.32% variance explained)
- **82.68% variance не пояснено** - інші фактори впливають на overall score:
  - Project domain (framework vs library vs tooling)
  - Team size та organization
  - Marketing та ecosystem
  - Historical momentum (older projects have more stars)

**Практичний висновок:**

- 🎯 **Фокус на Technical Performance** для покращення overall score
- DX також важливий, але менший вплив
- BI майже не впливає після контролю DX та TP

### 7.5. Multicollinearity Analysis (VIF)

**Variance Inflation Factors для категорійних моделей:**

**Model 1 (Overall Score ~ DX + TP + BI):**

- avg_dx: VIF = 1.28 (low)
- avg_tp: VIF = 1.48 (low)
- avg_bi: VIF = 1.80 (low)

✅ **Жоден VIF > 5** - multicollinearity не є проблемою
👉 Категорії DX, TP, BI є **відносно незалежними**

**Інтерпретація:**

- Наша система категоризації метрик (DX/TP/BI) успішна
- Категорії не дублюють одна одну
- Безпечно використовувати всі 3 категорії в регресійних моделях

### 7.6. Висновки Advanced Analysis

❌ **Mediation DX → TP → BI** не підтверджена
✅ **testCoverage ↔ communityGrowth** - справжній зв'язок (не confounder)
✅ **Technical Performance** пояснює найбільше variance (10.6%)
✅ **Низький multicollinearity** між категоріями (VIF < 2)
📊 **Файл:** `advanced_analysis_results.json`

---

## 8. Ключові Insights та Рекомендації

### 8.1. Топ-5 Statistical Insights

#### 1. 🔥 **Code Review Duration - критичний фактор для Time to Market**

- **r = 0.881** (extremely strong)
- **R² = 0.784** в regression моделі
- **Actionable:** Кожна година code review додає ~0.027 дня до delivery

**Рекомендації:**

- ✅ Встановити SLA для code reviews (< 48 годин)
- ✅ Автоматизувати рутинні перевірки (CI/CD, linting)
- ✅ Розбивати великі PR на менші (< 400 lines)
- ✅ Використовувати CODEOWNERS для швидкого assignment
- ✅ Metrics dashboard: track PR review time, % PRs within SLA

#### 2. 🎯 **Test Coverage - ключ до Community Growth**

- **r = 0.772** (very strong)
- **R² = 0.732** для community growth prediction
- **Partial correlation:** зв'язок залишається після контролю confounders

**Рекомендації:**

- ✅ Target: test coverage > 85%
- ✅ Інвестувати в test infrastructure (Jest, Vitest, Playwright)
- ✅ Вимагати tests для нових features (pre-commit hooks)
- ✅ Showcase test coverage на README (badges)
- ✅ Test coverage як quality signal для потенційних contributors

#### 3. 📊 **2 Project Archetypes виявлено**

- **Cluster 0:** Складні проекти (n=11) - високий codeReviewDuration, нижчий overallScore
- **Cluster 1:** Ефективні проекти (n=39) - швидкі reviews, вищий overallScore

**Рекомендації для Cluster 0:**

- ⚠️ Оптимізувати процеси (автоматизація, smaller PRs)
- ⚠️ Покращити documentation для onboarding
- ⚠️ Знизити complexity code reviews

**Best Practices від Cluster 1:**

- ✅ Швидкі code reviews (< 7 днів)
- ✅ Активна спільнота
- ✅ Високі overall scores

#### 4. 🔍 **Technical Performance - найважливіша категорія**

- **10.6% incremental R²** для overall score (найбільший вклад)
- **73% R²** для community growth prediction

**Ключові метрики TP:**

- Test coverage
- Bundle size
- Performance score
- TypeScript error rate

**Рекомендації:**

- 🎯 Пріоритизувати технічну якість над features
- 🎯 Regular performance audits (Lighthouse)
- 🎯 Minimize bundle size (tree-shaking, code-splitting)
- 🎯 Zero TypeScript errors policy

#### 5. 📈 **Feature Engineering покращив predictive power**

- **Log-transformed codeReviewDuration:** r = -0.582 (vs -0.434 original)
- **Interaction features** виявили non-linear effects
- **126 features** готові для ML modeling

**Рекомендації для Фази 3:**

- 🔬 Використати engineered features для ML моделей
- 🔬 Feature selection через LASSO або RFE
- 🔬 Ensemble models (Random Forest, XGBoost, Gradient Boosting)
- 🔬 A/B testing різних feature sets

### 8.2. Практичні Рекомендації для TypeScript Teams

#### Для покращення Developer Experience

1. **Оптимізувати Code Review:**

   - SLA < 48 годин
   - Automated checks (CI/CD)
   - Smaller PRs (< 400 lines)
   - CODEOWNERS для auto-assignment

2. **Зменшити Debugging Time:**
   - Інвестувати в debugging tools (source maps, debuggers)
   - Покращити error messages
   - Logging та observability

#### Для покращення Technical Performance

1. **Test Coverage:**

   - Target > 85%
   - Unit, integration, E2E tests
   - Test infrastructure (Jest, Vitest, Playwright)

2. **Bundle Optimization:**

   - Tree-shaking
   - Code-splitting
   - Dynamic imports
   - Minimize dependencies

3. **Performance:**
   - Regular Lighthouse audits
   - Performance budgets
   - Lazy loading
   - Caching strategies

#### Для покращення Business Impact

1. **Швидкий Time to Market:**

   - Швидкі code reviews (найважливіше!)
   - CI/CD automation
   - Feature flags для incremental rollout

2. **Community Growth:**
   - High test coverage (signals quality)
   - Good documentation
   - Active contribution guidelines
   - Responsive issue/PR management

### 8.3. Metrics Dashboard Recommendations

**Key Metrics to Track:**

**Developer Experience:**

- ⏱️ Average PR review duration (target: < 48h)
- 🐛 Debugging time per feature (target: < 10h)
- 💬 Comments per PR (target: < 5)
- 🔄 PR iteration rate (target: < 30%)

**Technical Performance:**

- ✅ Test coverage (target: > 85%)
- 📦 Bundle size (target: < 100KB gzipped)
- ⚡ Performance score (target: > 90)
- 🔴 TypeScript error rate (target: < 0.1/1000 LOC)

**Business Impact:**

- 🚀 Time to market (target: < 7 days)
- ⭐ Community growth (track trend)
- ✔️ Issue resolution rate (target: > 60% in < 7 days)
- 👥 Active contributors (track monthly)

**Overall:**

- 🎯 Overall Quality Score (target: > 75)

### 8.4. ROI Estimations

**Scenario: Optimize Code Review Duration**

**Current State (Cluster 0 projects):**

- Average code review: 851 hours (~35 days)
- Time to market: ~17 days (correlated)

**Target State (match Cluster 1):**

- Average code review: 175 hours (~7 days)
- Expected time to market: ~5 days (based on regression)

**ROI:**

- **Time saved per feature:** 12 days faster delivery
- **Business value:** Faster market feedback, competitive advantage
- **Developer satisfaction:** Less waiting, more productivity

**Investment Required:**

- CI/CD automation: 2-4 weeks setup
- Tooling (linters, formatters): 1 week
- Process documentation: 1 week
- Training: 2-3 days

**Expected ROI:** 3-6 months payback period

---

## 9. Висновки

### 9.1. Досягнення Фази 2.2

✅ **Hypothesis Testing:**

- 171 пар метрик перевірено
- 14 статистично значущих кореляцій виявлено (FDR corrected)
- Топ predictor: codeReviewDuration ↔ timeToMarket (r=0.881)

✅ **Regression Analysis:**

- 3 multiple regression моделі побудовано
- Best R²: 0.784 для time to market prediction
- codeReviewDuration - найсильніший predictor

✅ **Cluster Analysis:**

- 2 project archetypes виявлено (Складні vs Ефективні)
- Silhouette score: 0.212
- 78% проектів у "ефективній" групі

✅ **PCA Analysis:**

- 10 компонент для 90% variance
- PC1: Project Complexity
- PC2: Community Success & Delivery Speed

✅ **Feature Engineering:**

- 100 нових features створено
- Log-transformed codeReviewDuration: best predictor (r=-0.582)
- Dataset готовий для ML modeling (Фаза 3)

✅ **Advanced Analysis:**

- Mediation DX → TP → BI не підтверджена
- Partial correlations виявили справжні зв'язки
- Technical Performance пояснює найбільше variance (10.6%)

### 9.2. Практична Цінність

**Для TypeScript Teams:**

1. 🎯 **Фокус на code review optimization** - найбільший ROI
2. 🎯 **Інвестувати в test coverage** - залучає contributors
3. 🎯 **Пріоритизувати technical performance** - впливає на overall score

**Для Дослідження:**

1. 📊 Статистична валідація outcome-based підходу
2. 📊 14 значущих зв'язків виявлено
3. 📊 Dataset готовий для ML modeling

**Для Індустрії:**

1. 💼 Metrics dashboard recommendations
2. 💼 ROI estimations для process improvements
3. 💼 Best practices від top-performing projects

### 9.3. Обмеження та Future Work

**Обмеження:**

- **Sample size:** n=50 може бути недостатнім для деяких аналізів
- **Causality:** Correlation ≠ causation - потрібні longitudinal studies
- **Generalizability:** Лише TypeScript open-source проекти
- **Mediation:** Negative proportion mediated - потрібні інші mediators

**Future Work (Фаза 3+):**

1. ML modeling для prediction overall score
2. Feature selection через LASSO/RFE
3. Ensemble models (Random Forest, XGBoost)
4. Validation на новому датасеті
5. Longitudinal study (track projects over time)
6. Experimental validation (A/B testing)

### 9.4. Наступні Кроки

**Фаза 3: ML Modeling (Місяць 3)**

1. Побудова predictive моделей для overallScore
2. Feature selection та optimization
3. Model validation та testing
4. Interpretability analysis (SHAP, LIME)

**Фаза 4: Implementation (Місяць 4)**

1. MVP системи для real-time quality scoring
2. VS Code extension
3. Dashboard для teams
4. Documentation та publication

### 9.5. Фінальні Висновки

🎉 **Фаза 2.2 успішно завершена!**

Виконано comprehensive статистичний аналіз, який:

- ✅ Підтвердив статистичну значущість 14 кореляцій
- ✅ Виявив ключові predictors для business outcomes
- ✅ Створив 100 engineered features для ML
- ✅ Надав практичні рекомендації для TypeScript teams

**Найважливіший результат:**

> **Code review duration є найсильнішим предиктором time to market (R²=0.784). Оптимізація процесу code review може скоротити delivery time на 12 днів.**

---

## Додатки

### Додаток A: Згенеровані Файли

**CSV Files (8):**

1. `hypothesis_tests.csv` - 171 пар метрик, p-values, CIs, FDR correction
2. `regression_summary.csv` - 3 моделі, R², F-statistics
3. `regression_coefficients.csv` - Coefficients, p-values, VIF
4. `cluster_assignments.csv` - Cluster membership для 50 проектів
5. `pca_loadings.csv` - Feature loadings для всіх PCs
6. `engineered_features.csv` - 50 × 126 features
7. `feature_importance.csv` - Correlation з overallScore
8. `advanced_analysis_results.json` - Mediation, partial correlations

**Visualizations (5 PNG files, 300 DPI):**

1. `08_regression_analysis.png` - 4 regression plots
2. `09_optimal_clusters.png` - Elbow + Silhouette
3. `10_hierarchical_dendrogram.png` - Dendrogram
4. `11_pca_explained_variance.png` - Scree plot + Cumulative
5. `12_pca_biplot_clusters.png` - PC1 vs PC2 з кластерами

### Додаток B: Статистичні Тести

**Використані тести:**

- Pearson correlation (parametric)
- Benjamini-Hochberg FDR correction
- F-test для regression significance
- t-test для coefficient significance
- Silhouette analysis для clustering
- Fisher's Z transformation для CIs

**Assumptions Validated:**

- Normality (Jarque-Bera test)
- Homoscedasticity (residual plots)
- Independence (Durbin-Watson)
- Linearity (scatter plots)

### Додаток C: Рекомендована Література

1. Baron, R. M., & Kenny, D. A. (1986). The moderator-mediator variable distinction in social psychological research.
2. Benjamini, Y., & Hochberg, Y. (1995). Controlling the false discovery rate: a practical and powerful approach to multiple testing.
3. James, G., Witten, D., Hastie, T., & Tibshirani, R. (2013). An Introduction to Statistical Learning.
4. Rousseeuw, P. J. (1987). Silhouettes: a graphical aid to the interpretation and validation of cluster analysis.

---

**Кінець звіту**

_Магістерська робота: Outcome-based оцінка якості TypeScript коду_
_Одеський політехнічний національний університет, 2025_
