/**
 * Metric Constants
 *
 * Константи для конфігурації метрик
 */

import { CategoryWeights } from './composite-score';

/**
 * Константи для конфігурації
 */
export const DEFAULT_WEIGHTS: CategoryWeights = {
  developerExperience: 0.4,
  technicalPerformance: 0.35,
  businessImpact: 0.25,
  surveyMetrics: 0.2,
  enterpriseMetrics: 0.15,
};

export const MINIMUM_METRICS_FOR_RESEARCH: string[] = [
  'codeReviewDuration',
  'debuggingTime',
  'buildTime',
  'timeToMarket',
  'testCoverage',
];

export const RECOMMENDED_SURVEY_METRICS: string[] = [
  'developerSatisfactionScore',
  'codebaseConfidence',
  'onboardingDifficulty',
];

export const OPTIONAL_PERFORMANCE_METRICS: string[] = [
  'performanceScore',
  'bundleLoadTime',
];
