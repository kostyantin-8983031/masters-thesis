/**
 * Metric Configuration Functions
 *
 * Функції для створення та управління конфігурацією метрик
 */

import { ProjectType, ScoreConfiguration } from './composite-score';
import { AllMetricsType } from './metrics-types';
import { DEFAULT_WEIGHTS } from './metric-constants';
import { hasMinimumMetrics } from './metric-validation';

/**
 * Створює базову конфігурацію для збору метрик
 */
export function createDefaultConfig(
  projectType: ProjectType,
  isOpenSource: boolean
): Partial<ScoreConfiguration> {
  const weights = { ...DEFAULT_WEIGHTS };

  // Налаштування ваг залежно від типу проєкту
  if (projectType === ProjectType.Library) {
    weights.developerExperience = 0.5;
    weights.technicalPerformance = 0.3;
    weights.businessImpact = 0.2;
  } else if (projectType === ProjectType.Microservice) {
    weights.technicalPerformance = 0.45;
    weights.developerExperience = 0.35;
    weights.businessImpact = 0.2;
  }

  // Зменшуємо вагу enterprise метрик для open source
  if (isOpenSource) {
    weights.enterpriseMetrics = 0.05;
    weights.surveyMetrics = 0.25;
  }

  return {
    weights,
    minimumRequirements: {
      codeReviewDuration: 0,
      debuggingTime: 0,
      buildTime: 0,
      testCoverage: 0,
      timeToMarket: 0,
    },
  };
}

/**
 * Генерує звіт про покриття метрик
 */
export function generateMetricsCoverageReport(
  metrics: Partial<AllMetricsType>
): {
  totalMetrics: number;
  availableMetrics: number;
  coveragePercentage: number;
  categoryBreakdown: Record<string, { available: number; total: number }>;
  qualityAssessment: 'excellent' | 'good' | 'fair' | 'poor';
} {
  const totalMetrics = Object.keys(metrics).length;
  const availableMetrics = Object.values(metrics).filter(
    (v) => v !== undefined
  ).length;
  const coveragePercentage = (availableMetrics / totalMetrics) * 100;

  // Розрахунок по категоріях
  const categoryBreakdown = {
    developerExperience: { available: 0, total: 7 },
    technicalPerformance: { available: 0, total: 6 },
    businessImpact: { available: 0, total: 5 },
    survey: { available: 0, total: 5 },
    enterprise: { available: 0, total: 5 },
  };

  // Підрахунок доступних метрик по категоріях
  if (metrics.developerExperience) {
    categoryBreakdown.developerExperience.available = Object.values(
      metrics.developerExperience
    ).filter((v) => v !== undefined).length;
  }

  if (metrics.technicalPerformance) {
    categoryBreakdown.technicalPerformance.available = Object.values(
      metrics.technicalPerformance
    ).filter((v) => v !== undefined).length;
  }

  if (metrics.businessImpact) {
    categoryBreakdown.businessImpact.available = Object.values(
      metrics.businessImpact
    ).filter((v) => v !== undefined).length;
  }

  if (metrics.survey) {
    categoryBreakdown.survey.available = Object.values(metrics.survey).filter(
      (v) => v !== undefined
    ).length;
  }

  if (metrics.enterprise) {
    categoryBreakdown.enterprise.available = Object.values(
      metrics.enterprise
    ).filter((v) => v !== undefined).length;
  }

  // Оцінка якості покриття
  let qualityAssessment: 'excellent' | 'good' | 'fair' | 'poor';
  const hasMinimum = hasMinimumMetrics(metrics);

  if (coveragePercentage >= 80 && hasMinimum) {
    qualityAssessment = 'excellent';
  } else if (coveragePercentage >= 60 && hasMinimum) {
    qualityAssessment = 'good';
  } else if (coveragePercentage >= 40 || hasMinimum) {
    qualityAssessment = 'fair';
  } else {
    qualityAssessment = 'poor';
  }

  return {
    totalMetrics,
    availableMetrics,
    coveragePercentage,
    categoryBreakdown,
    qualityAssessment,
  };
}

/**
 * Створює оптимізовану конфігурацію для конкретного проєкту
 */
export function createOptimizedConfig(
  metrics: Partial<AllMetricsType>,
  projectType: ProjectType,
  isOpenSource: boolean,
  teamSize: number
): Partial<ScoreConfiguration> {
  const baseConfig = createDefaultConfig(projectType, isOpenSource);
  const weights = { ...baseConfig.weights! };

  // Адаптація ваг на основі доступних метрик
  const coverage = generateMetricsCoverageReport(metrics);

  // Якщо survey метрик мало, збільшуємо вагу технічних метрик
  if (coverage.categoryBreakdown.survey.available < 3) {
    weights.technicalPerformance += 0.1;
    weights.surveyMetrics -= 0.1;
  }

  // Для великих команд збільшуємо вагу collaboration метрик
  if (teamSize > 10) {
    weights.developerExperience += 0.05;
    weights.businessImpact -= 0.05;
  }

  // Для маленьких команд фокус на технічній якості
  if (teamSize < 5) {
    weights.technicalPerformance += 0.05;
    weights.developerExperience -= 0.05;
  }

  return {
    ...baseConfig,
    weights,
    // Додаткові налаштування на основі контексту
    minimumRequirements: {
      ...baseConfig.minimumRequirements,
      // Нижчі вимоги для маленьких команд
      ...(teamSize < 5 && {
        codeReviewDuration: 24, // 1 день для маленьких команд
        testCoverage: 60, // Нижча вимога до покриття
      }),
      // Вищі вимоги для великих команд
      ...(teamSize > 20 && {
        codeReviewDuration: 8, // 8 годин для великих команд
        testCoverage: 85, // Висока вимога до покриття
      }),
    },
  };
}
