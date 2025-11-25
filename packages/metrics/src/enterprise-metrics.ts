/**
 * Enterprise-only Metrics Interfaces
 *
 * Метрики недоступні для open source проєктів (приватні корпоративні дані)
 */

/**
 * Enterprise-only метрики
 */
export interface EnterpriseOnlyMetrics {
  /**
   * Плинність кадрів (% за рік)
   * Джерело: HR системи - недоступно для open source
   * Розрахунок: employees_left / total_employees * 100
   */
  voluntaryTurnover: number;

  /**
   * Кількість помилок в production на 1000 користувачів
   * Джерело: Error tracking (Sentry, Bugsnag) - приватні дані
   * Розрахунок: production_errors / (active_users / 1000)
   */
  productionErrorRate: number;

  /**
   * Uptime системи (%)
   * Джерело: Production monitoring - приватні дані
   * Розрахунок: uptime_minutes / total_minutes * 100
   */
  uptime: number;

  /**
   * Задоволення користувачів (NPS)
   * Джерело: User analytics - приватні дані
   * Розрахунок: (promoters - detractors) / total_responses * 100
   */
  userSatisfactionScore: number;

  /**
   * Вартість підтримки коду ($/місяць)
   * Джерело: Financial systems - приватні дані
   * Розрахунок: maintenance_developer_hours * hourly_rate
   */
  maintenanceCost: number;
}

/**
 * Розширені enterprise метрики
 */
export interface ExtendedEnterpriseMetrics extends EnterpriseOnlyMetrics {
  /**
   * Середній час відновлення після інциденту (хвилин)
   * Джерело: Incident management systems (PagerDuty, Opsgenie)
   * Розрахунок: sum(incident_resolution_time) / incident_count
   */
  meanTimeToRecovery: number;

  /**
   * Кількість користувачів що можуть працювати одночасно
   * Джерело: Load testing data - приватні дані
   * Розрахунок: max_concurrent_users_stable_performance
   */
  concurrentUsersSupported: number;

  /**
   * Використання ресурсів під навантаженням (%)
   * Джерело: Production monitoring - приватні дані
   * Розрахунок: (cpu_usage + memory_usage) / 2 при peak load
   */
  resourceUtilization: number;

  /**
   * Ефективність горизонтального масштабування
   * Джерело: Cloud infrastructure metrics - приватні дані
   * Розрахунок: performance_improvement / instances_added
   */
  horizontalScalingEfficiency: number;

  /**
   * Кількість інцидентів безпеки на рік
   * Джерело: Security monitoring - приватні дані
   * Розрахунок: security_incidents_count
   */
  securityIncidents: number;

  /**
   * Порушення compliance стандартів
   * Джерело: Compliance monitoring - приватні дані
   * Розрахунок: compliance_violations_count
   */
  complianceViolations: number;

  /**
   * Кількість витоків даних
   * Джерело: Security incident tracking - приватні дані
   * Розрахунок: data_breaches_count
   */
  dataBreaches: number;

  /**
   * Середній час доставки feature до користувачів (дні)
   * Джерело: Product management + deployment tracking - приватні дані
   * Розрахунок: feature_delivery_time_average
   */
  averageFeatureDeliveryTime: number;

  /**
   * Рівень прийняття нових features користувачами (%)
   * Джерело: Product analytics - приватні дані
   * Розрахунок: users_adopted_feature / total_users * 100
   */
  featureAdoptionRate: number;

  /**
   * Retention користувачів через 30/90 днів (%)
   * Джерело: User analytics - приватні дані
   * Розрахунок: retained_users / initial_users * 100
   */
  userRetention: UserRetention;

  /**
   * Загальний technology debt score
   * Джерело: Code analysis + development time tracking - приватні дані
   * Розрахунок: weighted_technical_debt_score
   */
  technicalDebtScore: number;

  /**
   * ROI від інвестицій в якість коду
   * Джерело: Financial + productivity tracking - приватні дані
   * Розрахунок: (productivity_gains - quality_investments) / quality_investments * 100
   */
  codeQualityROI: number;
}

/**
 * User retention breakdown
 */
export interface UserRetention {
  /** Retention через 30 днів */
  thirtyDay: number;

  /** Retention через 90 днів */
  ninetyDay: number;

  /** Retention через 180 днів */
  oneHundredEightyDay: number;

  /** Retention через 365 днів */
  oneYear: number;
}

/**
 * Incident details
 */
export interface IncidentMetrics {
  /** Загальна кількість інцидентів */
  totalIncidents: number;

  /** Критичні інциденти */
  criticalIncidents: number;

  /** Середній час виявлення (хвилин) */
  meanTimeToDetection: number;

  /** Середній час відновлення (хвилин) */
  meanTimeToRecovery: number;

  /** Інциденти спричинені deployment */
  deploymentRelatedIncidents: number;

  /** Інциденти спричинені code changes */
  codeChangeRelatedIncidents: number;
}

/**
 * Security metrics
 */
export interface SecurityMetrics {
  /** Виявлені вразливості */
  vulnerabilitiesFound: number;

  /** Критичні вразливості */
  criticalVulnerabilities: number;

  /** Середній час виправлення вразливостей (дні) */
  averageFixTime: number;

  /** Успішні спроби атак */
  successfulAttacks: number;

  /** Заблоковані спроби атак */
  blockedAttacks: number;

  /** Security score (0-100) */
  securityScore: number;
}

/**
 * Financial metrics
 */
export interface FinancialMetrics {
  /** Загальна вартість розробки ($/місяць) */
  totalDevelopmentCost: number;

  /** Вартість підтримки ($/місяць) */
  maintenanceCost: number;

  /** Вартість інфраструктури ($/місяць) */
  infrastructureCost: number;

  /** Вартість downtime ($/година) */
  downtimeCost: number;

  /** Економія від автоматизації ($/місяць) */
  automationSavings: number;

  /** ROI від технічних покращень (%) */
  technicalImprovementROI: number;
}

/**
 * Комбінований enterprise metrics interface
 */
export interface CompleteEnterpriseMetrics {
  basic: EnterpriseOnlyMetrics;
  extended: ExtendedEnterpriseMetrics;
  incidents: IncidentMetrics;
  security: SecurityMetrics;
  financial: FinancialMetrics;
}
