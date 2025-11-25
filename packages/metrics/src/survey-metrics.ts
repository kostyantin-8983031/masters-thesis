/**
 * Survey-based Metrics Interfaces
 *
 * Метрики що потребують опитувань розробників
 */

/**
 * Survey-based Developer Experience метрики
 */
export interface SurveyBasedMetrics {
  /**
   * Оцінка задоволення роботою з кодовою базою (1-10)
   * Джерело: Weekly developer surveys
   * Питання: "Наскільки ви задоволені роботою з цією кодовою базою?"
   */
  developerSatisfactionScore: number;

  /**
   * Рівень впевненості при внесенні змін (1-10)
   * Джерело: Weekly developer surveys
   * Питання: "Наскільки впевнено ви вносите зміни в цей код?"
   */
  codebaseConfidence: number;

  /**
   * Оцінка складності онбордингу (1-10)
   * Джерело: New contributor surveys
   * Питання: "Наскільки складно було почати працювати з проєктом?"
   */
  onboardingDifficulty: number;

  /**
   * Час витрачений на розуміння коду (години/тиждень)
   * Джерело: Weekly developer surveys
   * Питання: "Скільки часу ви витрачаєте на розуміння чужого коду?"
   */
  codeComprehensionTime: number;

  /**
   * Оцінка якості документації (1-10)
   * Джерело: Developer surveys
   * Питання: "Наскільки якісна документація в проєкті?"
   */
  documentationQuality: number;
}

/**
 * Структура окремого survey response
 */
export interface SurveyResponse {
  /** ID респондента (анонімізований) */
  respondentId: string;

  /** Дата заповнення опитування */
  responseDate: Date;

  /** ID проєкту */
  projectId: string;

  /** Досвід роботи з проєктом (місяці) */
  projectExperience: number;

  /** Загальний досвід програмування (роки) */
  programmingExperience: number;

  /** Роль в проєкті */
  role: DeveloperRole;

  /** Відповіді на питання */
  responses: SurveyBasedMetrics;

  /** Додаткові коментарі */
  additionalComments?: string;
}

/**
 * Агреговані результати опитування
 */
export interface SurveyResults {
  /** Загальна кількість респондентів */
  totalResponses: number;

  /** Дата збору даних */
  collectionDate: Date;

  /** Період збору (дні) */
  collectionPeriod: number;

  /** Середні значення метрик */
  averageMetrics: SurveyBasedMetrics;

  /** Медіанні значення */
  medianMetrics: SurveyBasedMetrics;

  /** Стандартне відхилення */
  standardDeviation: SurveyBasedMetrics;

  /** Розподіл по ролях */
  roleDistribution: Record<DeveloperRole, number>;

  /** Розподіл по досвіду */
  experienceDistribution: {
    novice: number; // 0-1 рік
    intermediate: number; // 1-3 роки
    experienced: number; // 3-7 років
    expert: number; // 7+ років
  };

  /** Confidence interval (95%) */
  confidenceInterval: {
    lower: SurveyBasedMetrics;
    upper: SurveyBasedMetrics;
  };
}

/**
 * Конфігурація опитування
 */
export interface SurveyConfig {
  /** Тип опитування */
  surveyType: SurveyType;

  /** Частота проведення */
  frequency: SurveyFrequency;

  /** Тривалість опитування (дні) */
  duration: number;

  /** Мінімальна кількість відповідей */
  minResponses: number;

  /** Цільова аудиторія */
  targetAudience: DeveloperRole[];

  /** Додаткові питання */
  customQuestions?: SurveyQuestion[];
}

/**
 * Додаткове питання в опитуванні
 */
export interface SurveyQuestion {
  /** ID питання */
  id: string;

  /** Текст питання */
  question: string;

  /** Тип питання */
  type: QuestionType;

  /** Варіанти відповідей (для multiple choice) */
  options?: string[];

  /** Чи обов'язкове питання */
  required: boolean;

  /** Мінімальне значення (для numeric) */
  minValue?: number;

  /** Максимальне значення (для numeric) */
  maxValue?: number;
}

/**
 * Роль розробника
 */
export enum DeveloperRole {
  Frontend = 'frontend',
  Backend = 'backend',
  Fullstack = 'fullstack',
  DevOps = 'devops',
  QA = 'qa',
  TechLead = 'tech_lead',
  Architect = 'architect',
  ProductManager = 'product_manager',
  Other = 'other',
}

/**
 * Тип опитування
 */
export enum SurveyType {
  Weekly = 'weekly',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  Onboarding = 'onboarding',
  ProjectCompletion = 'project_completion',
  Custom = 'custom',
}

/**
 * Частота опитування
 */
export enum SurveyFrequency {
  Weekly = 'weekly',
  Biweekly = 'biweekly',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  OneTime = 'one_time',
}

/**
 * Тип питання
 */
export enum QuestionType {
  Numeric = 'numeric',
  Scale = 'scale',
  MultipleChoice = 'multiple_choice',
  Text = 'text',
  Boolean = 'boolean',
}
