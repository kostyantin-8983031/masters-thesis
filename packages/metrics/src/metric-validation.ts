/**
 * Metric Validation Functions
 *
 * Функції для валідації та перевірки метрик
 */

import { AllMetricsType } from './metrics-types';
import { ProjectType } from './composite-score';
import { DataSource } from './common-types';
import {
  MINIMUM_METRICS_FOR_RESEARCH,
  RECOMMENDED_SURVEY_METRICS,
} from './metric-constants';

/**
 * Перевіряє чи достатньо метрик для розрахунку якісного score
 */
export function hasMinimumMetrics(metrics: Partial<AllMetricsType>): boolean {
  const availableMetrics = Object.keys(metrics).filter(
    (key) => metrics[key as keyof AllMetricsType] !== undefined
  );

  return MINIMUM_METRICS_FOR_RESEARCH.every((required) =>
    availableMetrics.includes(required)
  );
}

/**
 * Розраховує рівень довіри до оцінки на основі доступних метрик
 */
export function calculateConfidence(
  availableMetrics: string[],
  totalPossibleMetrics: number
): number {
  const coverage = availableMetrics.length / totalPossibleMetrics;
  const hasEssential = MINIMUM_METRICS_FOR_RESEARCH.every((metric) =>
    availableMetrics.includes(metric)
  );

  let confidence = coverage * 80; // Базовий рівень від покриття

  if (hasEssential) {
    confidence += 20; // Бонус за наявність всіх ключових метрик
  }

  return Math.min(100, Math.max(0, confidence));
}

/**
 * Отримує список доступних джерел даних для проєкту
 */
export function getAvailableDataSources(isOpenSource: boolean): DataSource[] {
  const sources = [
    DataSource.GitHubApi,
    DataSource.GitHubActions,
    DataSource.TypeScriptCompiler,
    DataSource.JestCoverage,
    DataSource.WebpackAnalyzer,
    DataSource.Survey,
  ];

  if (isOpenSource) {
    sources.push(DataSource.Lighthouse);
  } else {
    sources.push(
      DataSource.Sentry,
      DataSource.Bugsnag,
      DataSource.PagerDuty,
      DataSource.DataDog,
      DataSource.NewRelic
    );
  }

  return sources;
}

/**
 * Валідує набір метрик для конкретного типу проєкту
 */
export function validateMetricsForProject(
  metrics: Partial<AllMetricsType>,
  projectType: ProjectType,
  isOpenSource: boolean
): {
  isValid: boolean;
  missingCritical: string[];
  recommendations: string[];
} {
  const missingCritical: string[] = [];
  const recommendations: string[] = [];

  // Перевіряємо обов'язкові метрики
  MINIMUM_METRICS_FOR_RESEARCH.forEach((metric) => {
    if (
      !(metric in metrics) ||
      metrics[metric as keyof AllMetricsType] === undefined
    ) {
      missingCritical.push(metric);
    }
  });

  // Рекомендації для різних типів проєктів
  if (projectType === ProjectType.Library) {
    if (!metrics.developerExperience?.averageCommentsPerPR) {
      recommendations.push(
        'Додайте метрику averageCommentsPerPR для кращої оцінки developer experience'
      );
    }
  }

  if (projectType === ProjectType.Microservice) {
    if (!metrics.technicalPerformance?.performanceScore) {
      recommendations.push('Додайте performance метрики для microservice');
    }
  }

  // Рекомендації для open source проєктів
  if (isOpenSource) {
    if (!metrics.survey?.developerSatisfactionScore) {
      recommendations.push(
        'Проведіть опитування розробників для отримання survey метрик'
      );
    }
  }

  return {
    isValid: missingCritical.length === 0,
    missingCritical,
    recommendations,
  };
}

/**
 * Розраховує важливість метрики для конкретного контексту
 */
export function calculateMetricImportance(
  metricName: string,
  projectType: ProjectType,
  isOpenSource: boolean
): number {
  // Базова важливість
  let importance = 0.5;

  // Збільшуємо важливість для обов'язкових метрик
  if (MINIMUM_METRICS_FOR_RESEARCH.includes(metricName)) {
    importance += 0.3;
  }

  // Збільшуємо важливість для рекомендованих метрик
  if (RECOMMENDED_SURVEY_METRICS.includes(metricName)) {
    importance += 0.2;
  }

  // Контекстуальні коригування
  if (projectType === ProjectType.Library) {
    if (metricName.includes('developer') || metricName.includes('onboarding')) {
      importance += 0.1;
    }
  }

  if (projectType === ProjectType.Microservice) {
    if (metricName.includes('performance') || metricName.includes('build')) {
      importance += 0.1;
    }
  }

  if (isOpenSource) {
    if (
      metricName.includes('community') ||
      metricName.includes('contributors')
    ) {
      importance += 0.1;
    }
  }

  return Math.min(1.0, importance);
}
