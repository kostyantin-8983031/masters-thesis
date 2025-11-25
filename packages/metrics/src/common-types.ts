/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Common Types and Utilities
 *
 * Допоміжні типи та енуми для роботи з метриками
 */

/**
 * Загальні типи для метрик
 */
export type MetricValue = number | undefined;
export type MetricTimestamp = Date | string;
export type MetricID = string;

/**
 * Періоди для агрегації метрик
 */
export enum TimePeriod {
  Hour = 'hour',
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Quarter = 'quarter',
  Year = 'year',
}

/**
 * Статус метрики
 */
export enum MetricStatus {
  Available = 'available',
  Unavailable = 'unavailable',
  Pending = 'pending',
  Error = 'error',
  Outdated = 'outdated',
}

/**
 * Джерела даних для метрик
 */
export enum DataSource {
  GitHubApi = 'github_api',
  GitHubActions = 'github_actions',
  Lighthouse = 'lighthouse',
  Survey = 'survey',
  TypeScriptCompiler = 'typescript_compiler',
  JestCoverage = 'jest_coverage',
  WebpackAnalyzer = 'webpack_analyzer',
  Sentry = 'sentry',
  Bugsnag = 'bugsnag',
  PagerDuty = 'pagerduty',
  DataDog = 'datadog',
  NewRelic = 'newrelic',
  Custom = 'custom',
}

/**
 * Типи аггрегації
 */
export enum AggregationType {
  Sum = 'sum',
  Average = 'average',
  Median = 'median',
  Min = 'min',
  Max = 'max',
  Count = 'count',
  Percentile90 = 'percentile_90',
  Percentile95 = 'percentile_95',
  Percentile99 = 'percentile_99',
}

/**
 * Базовий інтерфейс для метрики
 */
export interface BaseMetric {
  /** Унікальний ідентифікатор метрики */
  id: MetricID;

  /** Назва метрики */
  name: string;

  /** Опис метрики */
  description: string;

  /** Значення метрики */
  value: MetricValue;

  /** Одиниця вимірювання */
  unit: string;

  /** Час збору даних */
  timestamp: MetricTimestamp;

  /** Джерело даних */
  source: DataSource;

  /** Статус метрики */
  status: MetricStatus;

  /** Метадані */
  metadata?: Record<string, any>;

  /** Теги для категоризації */
  tags?: string[];
}

/**
 * Часовий ряд метрики
 */
export interface MetricTimeSeries {
  /** Метрика */
  metric: BaseMetric;

  /** Історичні значення */
  values: TimeSeriesPoint[];

  /** Період агрегації */
  period: TimePeriod;

  /** Тип агрегації */
  aggregation: AggregationType;
}

/**
 * Точка в часовому ряду
 */
export interface TimeSeriesPoint {
  /** Час */
  timestamp: MetricTimestamp;

  /** Значення */
  value: number;

  /** Додаткові дані */
  metadata?: Record<string, any>;
}

/**
 * Конфігурація збору метрики
 */
export interface MetricConfig {
  /** ID метрики */
  id: MetricID;

  /** Чи активна метрика */
  enabled: boolean;

  /** Інтервал збору */
  collectionInterval: number;

  /** Джерело даних */
  source: DataSource;

  /** Параметри збору */
  parameters: Record<string, any>;

  /** Таймаут для збору */
  timeout: number;

  /** Кількість спроб */
  retries: number;

  /** Валідатори */
  validators?: MetricValidator[];

  /** Трансформери */
  transformers?: MetricTransformer[];
}

/**
 * Валідатор метрики
 */
export interface MetricValidator {
  /** Тип валідації */
  type: ValidationType;

  /** Параметри валідації */
  parameters: Record<string, any>;

  /** Повідомлення про помилку */
  errorMessage?: string;
}

/**
 * Трансформер метрики
 */
export interface MetricTransformer {
  /** Тип трансформації */
  type: TransformationType;

  /** Параметри трансформації */
  parameters: Record<string, any>;
}

/**
 * Типи валідації
 */
export enum ValidationType {
  MinValue = 'min_value',
  MaxValue = 'max_value',
  Range = 'range',
  Required = 'required',
  Type = 'type',
  Pattern = 'pattern',
  Custom = 'custom',
}

/**
 * Типи трансформації
 */
export enum TransformationType {
  Normalize = 'normalize',
  Scale = 'scale',
  Round = 'round',
  Clamp = 'clamp',
  ConvertUnit = 'convert_unit',
  Custom = 'custom',
}

/**
 * Результат збору метрики
 */
export interface MetricCollectionResult {
  /** Метрика */
  metric: BaseMetric;

  /** Чи успішно зібрано */
  success: boolean;

  /** Помилка (якщо є) */
  error?: string;

  /** Час збору */
  collectionTime: number;

  /** Попередження */
  warnings?: string[];
}

/**
 * Пакет метрик
 */
export interface MetricBatch {
  /** ID пакету */
  batchId: string;

  /** Час створення пакету */
  timestamp: MetricTimestamp;

  /** Метрики в пакеті */
  metrics: BaseMetric[];

  /** Контекст збору */
  context: Record<string, any>;

  /** Статус пакету */
  status: BatchStatus;
}

/**
 * Статус пакету
 */
export enum BatchStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
  Partial = 'partial',
}

/**
 * Алерт для метрики
 */
export interface MetricAlert {
  /** ID алерту */
  id: string;

  /** Метрика */
  metricId: MetricID;

  /** Тип алерту */
  type: AlertType;

  /** Умова спрацьовування */
  condition: AlertCondition;

  /** Чи активний алерт */
  enabled: boolean;

  /** Канали повідомлень */
  channels: NotificationChannel[];

  /** Останнє спрацьовування */
  lastTriggered?: MetricTimestamp;

  /** Кількість спрацьовувань */
  triggerCount: number;
}

/**
 * Типи алертів
 */
export enum AlertType {
  Threshold = 'threshold',
  Trend = 'trend',
  Anomaly = 'anomaly',
  MissingData = 'missing_data',
  Custom = 'custom',
}

/**
 * Умова алерту
 */
export interface AlertCondition {
  /** Оператор порівняння */
  operator: ComparisonOperator;

  /** Значення для порівняння */
  value: number;

  /** Період для перевірки */
  period: TimePeriod;

  /** Кількість послідовних порушень */
  consecutiveViolations: number;
}

/**
 * Оператори порівняння
 */
export enum ComparisonOperator {
  GreaterThan = 'greater_than',
  LessThan = 'less_than',
  GreaterThanOrEqual = 'greater_than_or_equal',
  LessThanOrEqual = 'less_than_or_equal',
  Equal = 'equal',
  NotEqual = 'not_equal',
}

/**
 * Канал повідомлень
 */
export enum NotificationChannel {
  Email = 'email',
  Slack = 'slack',
  Discord = 'discord',
  Webhook = 'webhook',
  SMS = 'sms',
  Push = 'push',
}
