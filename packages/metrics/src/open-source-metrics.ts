/**
 * Open Source Metrics Interfaces
 *
 * Метрики доступні через відкриті джерела (GitHub API, Lighthouse, etc.)
 *
 * @author Слабенко Костянтин
 */

/**
 * Developer Experience метрики з відкритих джерел
 */
export interface OpenSourceDeveloperExperience {
  /**
   * Середній час від створення PR до merge (годин)
   * Джерело: GitHub API - /repos/{owner}/{repo}/pulls
   * Розрахунок: merged_at - created_at для merged PRs
   */
  codeReviewDuration: number;

  /**
   * Середній час розв'язання bug issues (годин)
   * Джерело: GitHub API - /repos/{owner}/{repo}/issues
   * Розрахунок: closed_at - created_at для issues з label 'bug'
   */
  debuggingTime: number;

  /**
   * Відсоток успішних деплоїв до загальної кількості
   * Джерело: GitHub Actions API - /repos/{owner}/{repo}/actions/runs
   * Розрахунок: success_runs / total_runs * 100
   */
  successfulDeploymentsRatio: number;

  /**
   * Середній час від форку до першого коміту (дні)
   * Джерело: GitHub API - /repos/{owner}/{repo}/commits
   * Розрахунок: first_commit_date - fork_date для нових контриб'юторів
   */
  timeToFirstCommit: number;

  /**
   * Кількість змінених рядків коду на годину роботи
   * Джерело: GitHub API - /repos/{owner}/{repo}/stats/contributors
   * Розрахунок: (additions + deletions) / active_hours_estimated
   */
  linesChangedPerHour: number;

  /**
   * Середня кількість коментарів на PR
   * Джерело: GitHub API - /repos/{owner}/{repo}/pulls/{number}/comments
   * Розрахунок: total_comments / total_prs
   */
  averageCommentsPerPR: number;

  /**
   * Відсоток PR що потребували додаткових коммітів після review
   * Джерело: GitHub API - аналіз коммітів після першого review
   * Розрахунок: prs_with_follow_up_commits / total_prs * 100
   */
  prIterationRate: number;
}

/**
 * Technical Performance метрики з відкритих джерел
 */
export interface OpenSourceTechnicalPerformance {
  /**
   * Середній час виконання CI/CD pipeline (хвилин)
   * Джерело: GitHub Actions API - /repos/{owner}/{repo}/actions/runs
   * Розрахунок: run_duration для successful runs
   */
  buildTime: number;

  /**
   * Розмір bundle після збірки (KB)
   * Джерело: GitHub Actions artifacts або webpack-bundle-analyzer
   * Розрахунок: bundle_size_compressed з build artifacts
   */
  bundleSize: number;

  /**
   * Час завантаження сторінки (мс) для публічних сайтів
   * Джерело: Lighthouse API - PageSpeed Insights
   * Розрахунок: first_contentful_paint метрика
   */
  bundleLoadTime: number;

  /**
   * Загальний Performance Score (0-100)
   * Джерело: Lighthouse API - PageSpeed Insights
   * Розрахунок: performance_score з Lighthouse audit
   */
  performanceScore: number;

  /**
   * Кількість TypeScript помилок на 1000 рядків коду
   * Джерело: TypeScript Compiler API або tsc output
   * Розрахунок: typescript_errors / (total_lines / 1000)
   */
  typeScriptErrorRate: number;

  /**
   * Покриття коду тестами (%)
   * Джерело: Jest/Vitest coverage reports або codecov.io API
   * Розрахунок: covered_lines / total_lines * 100
   */
  testCoverage: number;
}

/**
 * Business Impact метрики з відкритих джерел
 */
export interface OpenSourceBusinessImpact {
  /**
   * Час від першого коміту до release (дні)
   * Джерело: GitHub API - /repos/{owner}/{repo}/releases
   * Розрахунок: release_date - first_commit_date_in_milestone
   */
  timeToMarket: number;

  /**
   * Відсоток features що були успішно релізнуті
   * Джерело: GitHub milestones API + releases API
   * Розрахунок: completed_milestones / total_milestones * 100
   */
  featureSuccessRate: number;

  /**
   * Кількість активних контриб'юторів за місяць
   * Джерело: GitHub API - /repos/{owner}/{repo}/stats/contributors
   * Розрахунок: unique_contributors_last_30_days
   */
  activeContributors: number;

  /**
   * Відсоток issues що були закриті протягом тижня
   * Джерело: GitHub API - /repos/{owner}/{repo}/issues
   * Розрахунок: issues_closed_within_week / total_issues * 100
   */
  issueResolutionRate: number;

  /**
   * Кількість GitHub stars за місяць (індикатор задоволення)
   * Джерело: GitHub API - /repos/{owner}/{repo}/stargazers
   * Розрахунок: new_stars_last_30_days
   */
  communityGrowth: number;
}

/**
 * Комбінований інтерфейс для всіх Open Source метрик
 */
export interface OpenSourceMetrics {
  developerExperience: OpenSourceDeveloperExperience;
  technicalPerformance: OpenSourceTechnicalPerformance;
  businessImpact: OpenSourceBusinessImpact;
}
