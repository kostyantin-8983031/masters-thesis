/**
 * Metrics Types
 *
 * Utility типи для організації метрик
 */

import {
  OpenSourceDeveloperExperience,
  OpenSourceTechnicalPerformance,
  OpenSourceBusinessImpact,
} from './open-source-metrics';
import { SurveyBasedMetrics } from './survey-metrics';
import { EnterpriseOnlyMetrics } from './enterprise-metrics';

/**
 * Open Source типи
 */
export type OpenSourceMetricsType = {
  developerExperience: OpenSourceDeveloperExperience;
  technicalPerformance: OpenSourceTechnicalPerformance;
  businessImpact: OpenSourceBusinessImpact;
};

/**
 * Survey типи
 */
export type SurveyMetricsType = SurveyBasedMetrics;

/**
 * Enterprise типи
 */
export type EnterpriseMetricsType = EnterpriseOnlyMetrics;

/**
 * Всі доступні метрики
 */
export type AllMetricsType = OpenSourceMetricsType & {
  survey?: SurveyMetricsType;
  enterprise?: EnterpriseMetricsType;
};

/**
 * Мінімальний набір для дослідження
 */
export type EssentialMetricsType = {
  codeReviewDuration: number;
  debuggingTime: number;
  buildTime: number;
  timeToMarket: number;
  testCoverage: number;
  developerSatisfactionScore?: number;
  codebaseConfidence?: number;
};
