/**
 * Composite Quality Score Interfaces
 *
 * Інтерфейси для загального outcome-based score якості коду
 */

import { OpenSourceMetrics } from './open-source-metrics';
import { SurveyBasedMetrics } from './survey-metrics';
import { EnterpriseOnlyMetrics } from './enterprise-metrics';

/**
 * Composite Quality Score - основний інтерфейс для оцінки якості коду
 */
export interface CompositeQualityScore {
  /**
   * Загальний outcome-based score (0-100)
   * Розрахунок: зважена сума всіх доступних метрик
   */
  overallScore: number;

  /**
   * Розбивка по категоріях
   */
  breakdown: QualityBreakdown;

  /**
   * Рівень довіри до оцінки (0-100)
   * Залежить від кількості доступних метрик
   */
  confidenceLevel: number;

  /**
   * Список доступних метрик для цього проєкту
   */
  availableMetrics: string[];

  /**
   * Дата розрахунку
   */
  calculationDate: Date;

  /**
   * Версія алгоритму розрахунку
   */
  algorithmVersion: string;

  /**
   * Контекст проєкту
   */
  projectContext: ProjectContext;

  /**
   * Історичні дані для трендового аналізу
   */
  historicalData?: HistoricalQualityData[];

  /**
   * Рекомендації для покращення
   */
  recommendations: QualityRecommendation[];

  /**
   * Прогнозовані результати
   */
  predictions: QualityPredictions;
}

/**
 * Розбивка якості по категоріях
 */
export interface QualityBreakdown {
  /** Developer experience score (0-100) */
  developerExperience: CategoryScore;

  /** Technical performance score (0-100) */
  technicalPerformance: CategoryScore;

  /** Business impact score (0-100) */
  businessImpact: CategoryScore;

  /** Survey-based metrics score (0-100) */
  surveyMetrics?: CategoryScore;

  /** Enterprise metrics score (0-100) */
  enterpriseMetrics?: CategoryScore;
}

/**
 * Оцінка категорії з деталями
 */
export interface CategoryScore {
  /** Оцінка (0-100) */
  score: number;

  /** Вага в загальному розрахунку */
  weight: number;

  /** Метрики що використовувались */
  metricsUsed: string[];

  /** Кількість доступних метрик */
  availableMetrics: number;

  /** Тренд порівняно з попереднім періодом */
  trend: TrendDirection;

  /** Зміна в балах */
  change: number;

  /** Найсильніші точки */
  strengths: string[];

  /** Найслабкіші точки */
  weaknesses: string[];
}

/**
 * Контекст проєкту
 */
export interface ProjectContext {
  /** Назва проєкту */
  projectName: string;

  /** Розмір проєкту */
  projectSize: ProjectSize;

  /** Тип проєкту */
  projectType: ProjectType;

  /** Розмір команди */
  teamSize: number;

  /** Вік проєкту (місяці) */
  projectAge: number;

  /** Основна технологія */
  primaryTechnology: string;

  /** Домен застосування */
  domain: string;

  /** Чи є проєкт open source */
  isOpenSource: boolean;

  /** Активність розробки */
  developmentActivity: DevelopmentActivity;
}

/**
 * Історичні дані якості
 */
export interface HistoricalQualityData {
  /** Дата вимірювання */
  date: Date;

  /** Загальний score */
  overallScore: number;

  /** Розбивка по категоріях */
  breakdown: QualityBreakdown;

  /** Значущі події */
  significantEvents?: string[];
}

/**
 * Рекомендації для покращення
 */
export interface QualityRecommendation {
  /** Приоритет рекомендації */
  priority: RecommendationPriority;

  /** Категорія для покращення */
  category: string;

  /** Опис проблеми */
  description: string;

  /** Рекомендовані дії */
  actions: string[];

  /** Очікуваний вплив на score */
  expectedImpact: number;

  /** Орієнтовний час реалізації */
  estimatedEffort: EffortLevel;

  /** Зв'язані метрики */
  relatedMetrics: string[];
}

/**
 * Прогнозовані результати
 */
export interface QualityPredictions {
  /** Прогноз на наступний місяць */
  nextMonth: QualityForecast;

  /** Прогноз на наступний квартал */
  nextQuarter: QualityForecast;

  /** Прогноз при впровадженні рекомендацій */
  withRecommendations: QualityForecast;

  /** Ризики зниження якості */
  risks: QualityRisk[];
}

/**
 * Прогноз якості
 */
export interface QualityForecast {
  /** Прогнозований score */
  predictedScore: number;

  /** Довірчий інтервал */
  confidenceInterval: {
    lower: number;
    upper: number;
  };

  /** Ймовірність покращення */
  improvementProbability: number;

  /** Очікувані зміни в метриках */
  expectedChanges: Record<string, number>;
}

/**
 * Ризики якості
 */
export interface QualityRisk {
  /** Тип ризику */
  type: RiskType;

  /** Ймовірність (0-1) */
  probability: number;

  /** Потенційний вплив */
  impact: ImpactLevel;

  /** Опис ризику */
  description: string;

  /** Заходи для мітігації */
  mitigationActions: string[];
}

/**
 * Конфігурація розрахунку score
 */
export interface ScoreConfiguration {
  /** Ваги для категорій */
  weights: CategoryWeights;

  /** Мінімальні вимоги для метрик */
  minimumRequirements: Record<string, number>;

  /** Налаштування нормалізації */
  normalizationSettings: NormalizationSettings;

  /** Налаштування confidence level */
  confidenceSettings: ConfidenceSettings;
}

/**
 * Ваги категорій
 */
export interface CategoryWeights {
  /** Вага developer experience */
  developerExperience: number;

  /** Вага technical performance */
  technicalPerformance: number;

  /** Вага business impact */
  businessImpact: number;

  /** Вага survey metrics */
  surveyMetrics: number;

  /** Вага enterprise metrics */
  enterpriseMetrics: number;
}

/**
 * Налаштування нормалізації
 */
export interface NormalizationSettings {
  /** Метод нормалізації */
  method: NormalizationMethod;

  /** Референсні значення */
  referenceValues: Record<string, number>;

  /** Граничні значення */
  bounds: Record<string, { min: number; max: number }>;
}

/**
 * Налаштування довіри
 */
export interface ConfidenceSettings {
  /** Мінімальна кількість метрик */
  minimumMetrics: number;

  /** Ваги метрик для довіри */
  metricWeights: Record<string, number>;

  /** Штраф за відсутність метрик */
  missingMetricPenalty: number;
}

/**
 * Енуми для типів
 */
export enum TrendDirection {
  Improving = 'improving',
  Stable = 'stable',
  Declining = 'declining',
}

export enum ProjectSize {
  Small = 'small', // < 10k LOC
  Medium = 'medium', // 10k - 100k LOC
  Large = 'large', // 100k - 1M LOC
  Enterprise = 'enterprise', // > 1M LOC
}

export enum ProjectType {
  Library = 'library',
  Application = 'application',
  Framework = 'framework',
  Microservice = 'microservice',
  Monolith = 'monolith',
  Platform = 'platform',
}

export enum DevelopmentActivity {
  VeryLow = 'very_low', // < 1 commit/week
  Low = 'low', // 1-5 commits/week
  Medium = 'medium', // 5-20 commits/week
  High = 'high', // 20-50 commits/week
  VeryHigh = 'very_high', // > 50 commits/week
}

export enum RecommendationPriority {
  Critical = 'critical',
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export enum EffortLevel {
  Minimal = 'minimal', // < 1 день
  Low = 'low', // 1-3 дні
  Medium = 'medium', // 1-2 тижні
  High = 'high', // 2-4 тижні
  Significant = 'significant', // > 1 місяць
}

export enum RiskType {
  TechnicalDebt = 'technical_debt',
  Performance = 'performance',
  Security = 'security',
  Maintainability = 'maintainability',
  TeamProductivity = 'team_productivity',
  BusinessImpact = 'business_impact',
}

export enum ImpactLevel {
  Negligible = 'negligible',
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export enum NormalizationMethod {
  MinMax = 'min_max',
  ZScore = 'z_score',
  Percentile = 'percentile',
  Sigmoid = 'sigmoid',
}

/**
 * Utility типи для роботи з метриками
 */
export type AllMetrics = OpenSourceMetrics & {
  survey?: SurveyBasedMetrics;
  enterprise?: EnterpriseOnlyMetrics;
};

export type MetricValue = number | undefined;

export type MetricCategory =
  | 'developerExperience'
  | 'technicalPerformance'
  | 'businessImpact'
  | 'surveyMetrics'
  | 'enterpriseMetrics';
