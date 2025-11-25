/**
 * @fileoverview Metrics Package - Outcome-based TypeScript Code Quality Assessment
 *
 * Цей пакет містить інтерфейси та типи для outcome-based оцінки якості TypeScript коду.
 * Розроблено для магістерської роботи "Система прогнозування продуктивності розробників
 * на основі outcome-аналізу TypeScript коду".
 *
 * @author Слабенко Костянтин
 */

// Open Source метрики (доступні через GitHub API, Lighthouse, etc.)
export type {
  OpenSourceDeveloperExperience,
  OpenSourceTechnicalPerformance,
  OpenSourceBusinessImpact,
  OpenSourceMetrics,
} from './open-source-metrics';

// Survey-based метрики (опитування розробників)
export {
  type SurveyBasedMetrics,
  type SurveyResponse,
  type SurveyResults,
  type SurveyConfig,
  type SurveyQuestion,
  DeveloperRole,
  SurveyType,
  SurveyFrequency,
  QuestionType,
} from './survey-metrics';

// Enterprise метрики (приватні корпоративні дані)
export type {
  EnterpriseOnlyMetrics,
  ExtendedEnterpriseMetrics,
  UserRetention,
  IncidentMetrics,
  SecurityMetrics,
  FinancialMetrics,
  CompleteEnterpriseMetrics,
} from './enterprise-metrics';

// Composite Quality Score (загальна оцінка якості)
export {
  type CompositeQualityScore,
  type QualityBreakdown,
  type CategoryScore,
  type ProjectContext,
  type HistoricalQualityData,
  type QualityRecommendation,
  type QualityPredictions,
  type QualityForecast,
  type QualityRisk,
  type ScoreConfiguration,
  type CategoryWeights,
  type NormalizationSettings,
  type ConfidenceSettings,
  type AllMetrics,
  type MetricValue,
  type MetricCategory,

  // Енуми для Composite Score
  TrendDirection,
  ProjectSize,
  ProjectType,
  DevelopmentActivity,
  RecommendationPriority,
  EffortLevel,
  RiskType,
  ImpactLevel,
  NormalizationMethod,
} from './composite-score';

// Загальні типи та утиліти
export {
  type MetricTimestamp,
  type MetricID,
  TimePeriod,
  MetricStatus,
  DataSource,
  AggregationType,
  type BaseMetric,
  type MetricTimeSeries,
  type TimeSeriesPoint,
  type MetricConfig,
  type MetricValidator,
  type MetricTransformer,
  ValidationType,
  TransformationType,
  type MetricCollectionResult,
  type MetricBatch,
  BatchStatus,
  type MetricAlert,
  AlertType,
  type AlertCondition,
  ComparisonOperator,
  NotificationChannel,
} from './common-types';

// Metrics Types - типи для організації метрик
export type {
  OpenSourceMetricsType,
  SurveyMetricsType,
  EnterpriseMetricsType,
  AllMetricsType,
  EssentialMetricsType,
} from './metrics-types';

// Metric Constants - константи для конфігурації
export {
  DEFAULT_WEIGHTS,
  MINIMUM_METRICS_FOR_RESEARCH,
  RECOMMENDED_SURVEY_METRICS,
  OPTIONAL_PERFORMANCE_METRICS,
} from './metric-constants';

// Metric Validation - функції валідації метрик
export {
  hasMinimumMetrics,
  calculateConfidence,
  getAvailableDataSources,
  validateMetricsForProject,
  calculateMetricImportance,
} from './metric-validation';

// Metric Configuration - функції конфігурації
export {
  createDefaultConfig,
  generateMetricsCoverageReport,
  createOptimizedConfig,
} from './metric-configuration';

// Metric Calculations - математичні функції
export {
  isValidValue,
  normalize,
  percentile,
  generateMetricId,
  calculateAverage,
  calculateMedian,
  calculateStandardDeviation,
  findOutliers,
  interpolateMissingValues,
  smoothData,
  calculateCorrelation,
  calculateTrend,
  convertUnit,
  validateRange,
  formatValue,
} from './metric-calculations';

// Версія пакету
export const PACKAGE_VERSION = '1.0.0';

// Інформація про дослідження
export const RESEARCH_INFO = {
  title:
    'Outcome-based TypeScript Code Quality Assessment System for Developer Productivity Prediction',
  author: 'Konstantin Kai',
  institution: 'Odessa Polytechnic National University',
  year: 2025,
  version: PACKAGE_VERSION,
} as const;
