# @thesis/metrics-collector

Пакет для збору метрик з TypeScript проектів у рамках магістерської роботи "Система прогнозування продуктивності розробників на основі outcome-аналізу TypeScript коду".

## Опис

Цей пакет реалізує простий і надійний спосіб збору метрик для оцінки якості TypeScript проектів. Підтримує outcome-based підхід до оцінки продуктивності розробників.

## Встановлення

```bash
npm install @thesis/metrics-collector
```

## Використання

### Швидка оцінка проекту

```typescript
import { quickAssessment } from '@thesis/metrics-collector';

const result = await quickAssessment('React');
console.log(`Оцінка проекту: ${result.overallScore}/100`);
```

### Детальна оцінка

```typescript
import {
  SimpleMetricsCollector,
  createMockConfig,
} from '@thesis/metrics-collector';

const config = createMockConfig('TypeScript');
const collector = new SimpleMetricsCollector(config);
const result = await collector.collectMetrics();

console.log(
  'Метрики Developer Experience:',
  result.metrics.developerExperience
);
console.log(
  'Метрики Technical Performance:',
  result.metrics.technicalPerformance
);
console.log('Метрики Business Impact:', result.metrics.businessImpact);
```

### Batch оцінка

```typescript
import { batchAssessment } from '@thesis/metrics-collector';

const projects = ['React', 'Vue', 'Angular'];
const results = await batchAssessment(projects);

results.forEach((result) => {
  console.log(`${result.projectName}: ${result.overallScore}/100`);
});
```

## Структура результату

```typescript
interface SimpleCollectionResult {
  projectName: string;
  collectedAt: string;
  metrics: {
    developerExperience: OpenSourceDeveloperExperience;
    technicalPerformance: OpenSourceTechnicalPerformance;
    businessImpact: OpenSourceBusinessImpact;
  };
  overallScore: number;
  confidence: number;
}
```

## Метрики

### Developer Experience

- `codeReviewDuration` - Час проведення code review (год)
- `debuggingTime` - Час на виправлення помилок (год)
- `successfulDeploymentsRatio` - Відсоток успішних деплоїв
- `timeToFirstCommit` - Час до першого коміту (дні)
- `linesChangedPerHour` - Рядків коду на годину
- `averageCommentsPerPR` - Середня кількість коментарів на PR
- `prIterationRate` - Відсоток PR з додатковими ітераціями

### Technical Performance

- `buildTime` - Час збірки (хв)
- `bundleSize` - Розмір bundle (bytes)
- `bundleLoadTime` - Час завантаження (мс)
- `performanceScore` - Оцінка продуктивності (0-100)
- `typeScriptErrorRate` - Кількість TS помилок на 1000 рядків
- `testCoverage` - Покриття тестами (%)

### Business Impact

- `timeToMarket` - Час виходу на ринок (дні)
- `featureSuccessRate` - Відсоток успішних фічі
- `activeContributors` - Кількість активних контриб'юторів
- `issueResolutionRate` - Швидкість вирішення issues
- `communityGrowth` - Зростання спільноти

## Розробка

### Збірка

```bash
nx build @thesis/metrics-collector
```

### Тестування

```bash
nx test @thesis/metrics-collector
```

### Linting

```bash
nx lint @thesis/metrics-collector
```

## Ліцензія

MIT

## Автор

Слабенко Костянтин, Одеський національний політехнічний університет, 2025
