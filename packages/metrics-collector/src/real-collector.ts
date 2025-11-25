/**
 * Real Metrics Collector
 *
 * Реальний збір метрик з GitHub API та інших джерел
 *
 * @author Слабенко Костянтин
 */

import {
  OpenSourceDeveloperExperience,
  OpenSourceTechnicalPerformance,
  OpenSourceBusinessImpact,
  OpenSourceMetrics,
  ProjectType,
  MetricTimestamp,
} from '@thesis/metrics';

import {
  GitHubCollector,
  GitHubConfig,
  GitHubMetrics,
} from './github-collector.js';

export interface RealCollectorConfig {
  projectName: string;
  projectType: ProjectType;
  isOpenSource: boolean;
  github?: GitHubConfig;
  includeRealData?: boolean;
}

export interface RealCollectionResult {
  projectName: string;
  collectedAt: MetricTimestamp;
  metrics: OpenSourceMetrics;
  overallScore: number;
  confidence: number;
  dataSource: 'github' | 'mock' | 'mixed';
  processingTime: number;
  errors?: string[];
}

export class RealMetricsCollector {
  private config: RealCollectorConfig;
  private githubCollector?: GitHubCollector;

  constructor(config: RealCollectorConfig) {
    this.config = config;

    if (config.github) {
      this.githubCollector = new GitHubCollector(config.github);
    }
  }

  async collectMetrics(): Promise<RealCollectionResult> {
    const startTime = Date.now();
    const collectedAt: MetricTimestamp = new Date().toISOString();
    const errors: string[] = [];

    let githubMetrics: GitHubMetrics | null = null;
    let dataSource: 'github' | 'mock' | 'mixed' = 'mock';

    // Спробуємо зібрати реальні дані з GitHub
    if (this.githubCollector && this.config.includeRealData) {
      try {
        console.log(
          `🔍 Збираємо метрики для ${this.config.github?.owner}/${this.config.github?.repo}...`
        );
        githubMetrics = await this.githubCollector.collectAllMetrics();
        dataSource = 'github';
        console.log('✅ GitHub метрики успішно зібрані');
      } catch (error) {
        console.warn('⚠️ Помилка при зборі GitHub метрик:', error);
        errors.push(
          `GitHub API error: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
        dataSource = 'mock';
      }
    }

    // Створюємо фінальні метрики
    const metrics = this.createFinalMetrics(githubMetrics);

    // Якщо є часткові дані з GitHub, позначимо як mixed
    if (githubMetrics && errors.length > 0) {
      dataSource = 'mixed';
    }

    const overallScore = this.calculateOverallScore(metrics);
    const confidence = this.calculateConfidence(dataSource, errors.length);
    const processingTime = (Date.now() - startTime) / 1000;

    return {
      projectName: this.config.projectName,
      collectedAt,
      metrics,
      overallScore,
      confidence,
      dataSource,
      processingTime,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private createFinalMetrics(
    githubMetrics: GitHubMetrics | null
  ): OpenSourceMetrics {
    // Базові mock значення
    const mockDeveloperExperience: OpenSourceDeveloperExperience = {
      codeReviewDuration: 12.5,
      debuggingTime: 8.2,
      successfulDeploymentsRatio: 0.94,
      timeToFirstCommit: 2.5,
      linesChangedPerHour: 25.8,
      averageCommentsPerPR: 4.2,
      prIterationRate: 0.35,
    };

    const mockTechnicalPerformance: OpenSourceTechnicalPerformance = {
      buildTime: 180,
      bundleSize: 512000,
      bundleLoadTime: 850,
      performanceScore: 85,
      typeScriptErrorRate: 0.5,
      testCoverage: 78.5,
    };

    const mockBusinessImpact: OpenSourceBusinessImpact = {
      timeToMarket: 3.2,
      featureSuccessRate: 0.87,
      activeContributors: 15,
      issueResolutionRate: 0.72,
      communityGrowth: 0.15,
    };

    // Якщо є GitHub дані, об'єднуємо з mock
    if (githubMetrics) {
      return {
        developerExperience: {
          ...mockDeveloperExperience,
          ...githubMetrics.developerExperience,
        },
        technicalPerformance: {
          ...mockTechnicalPerformance,
          ...githubMetrics.technicalPerformance,
        },
        businessImpact: {
          ...mockBusinessImpact,
          ...githubMetrics.businessImpact,
        },
      };
    }

    // Інакше використовуємо mock дані
    return {
      developerExperience: mockDeveloperExperience,
      technicalPerformance: mockTechnicalPerformance,
      businessImpact: mockBusinessImpact,
    };
  }

  private calculateOverallScore(metrics: OpenSourceMetrics): number {
    const devScore = this.calculateDeveloperScore(metrics.developerExperience);
    const techScore = this.calculateTechnicalScore(
      metrics.technicalPerformance
    );
    const businessScore = this.calculateBusinessScore(metrics.businessImpact);

    // Weighted average
    return Math.round(devScore * 0.4 + techScore * 0.35 + businessScore * 0.25);
  }

  private calculateDeveloperScore(
    metrics: OpenSourceDeveloperExperience
  ): number {
    let score = 50;

    // Code review duration (lower is better)
    if (metrics.codeReviewDuration <= 8) score += 20;
    else if (metrics.codeReviewDuration <= 24) score += 10;
    else score -= 10;

    // Debugging time (lower is better)
    if (metrics.debuggingTime <= 4) score += 15;
    else if (metrics.debuggingTime <= 12) score += 5;
    else score -= 5;

    // Successful deployments (higher is better)
    if (metrics.successfulDeploymentsRatio >= 0.9) score += 15;
    else if (metrics.successfulDeploymentsRatio >= 0.8) score += 10;
    else score -= 5;

    // Average comments per PR (sweet spot)
    if (metrics.averageCommentsPerPR >= 2 && metrics.averageCommentsPerPR <= 8)
      score += 10;
    else if (metrics.averageCommentsPerPR > 8) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  private calculateTechnicalScore(
    metrics: OpenSourceTechnicalPerformance
  ): number {
    let score = 50;

    // Test coverage (higher is better)
    if (metrics.testCoverage >= 80) score += 20;
    else if (metrics.testCoverage >= 60) score += 10;
    else score -= 10;

    // Build time (lower is better)
    if (metrics.buildTime <= 120) score += 15;
    else if (metrics.buildTime <= 300) score += 5;
    else score -= 5;

    // Performance score (higher is better)
    if (metrics.performanceScore >= 80) score += 15;
    else if (metrics.performanceScore >= 60) score += 5;
    else score -= 5;

    // TypeScript error rate (lower is better)
    if (metrics.typeScriptErrorRate <= 0.5) score += 10;
    else if (metrics.typeScriptErrorRate <= 2) score += 5;
    else score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  private calculateBusinessScore(metrics: OpenSourceBusinessImpact): number {
    let score = 50;

    // Time to market (lower is better)
    if (metrics.timeToMarket <= 2) score += 20;
    else if (metrics.timeToMarket <= 5) score += 10;
    else score -= 5;

    // Feature success rate (higher is better)
    if (metrics.featureSuccessRate >= 0.8) score += 15;
    else if (metrics.featureSuccessRate >= 0.6) score += 5;
    else score -= 5;

    // Issue resolution rate (higher is better)
    if (metrics.issueResolutionRate >= 0.7) score += 15;
    else if (metrics.issueResolutionRate >= 0.5) score += 5;
    else score -= 5;

    // Active contributors (more is better)
    if (metrics.activeContributors >= 10) score += 10;
    else if (metrics.activeContributors >= 5) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  private calculateConfidence(dataSource: string, errorCount: number): number {
    let confidence = 50;

    // Базована на джерелі даних
    switch (dataSource) {
      case 'github':
        confidence = 90;
        break;
      case 'mixed':
        confidence = 75;
        break;
      case 'mock':
        confidence = 60;
        break;
    }

    // Зменшуємо за кількість помилок
    confidence -= errorCount * 5;

    return Math.max(0, Math.min(100, confidence));
  }

  // Статичний метод для швидкого створення колектора
  static forGitHubRepo(
    owner: string,
    repo: string,
    token?: string
  ): RealMetricsCollector {
    return new RealMetricsCollector({
      projectName: `${owner}/${repo}`,
      projectType: 'Library' as ProjectType,
      isOpenSource: true,
      github: { owner, repo, token },
      includeRealData: true,
    });
  }

  // Batch збір для кількох репозиторіїв
  static async collectBatch(
    repos: Array<{ owner: string; repo: string; token?: string }>
  ): Promise<RealCollectionResult[]> {
    const results: RealCollectionResult[] = [];

    for (const repoConfig of repos) {
      try {
        const collector = RealMetricsCollector.forGitHubRepo(
          repoConfig.owner,
          repoConfig.repo,
          repoConfig.token
        );

        const result = await collector.collectMetrics();
        results.push(result);

        console.log(
          `✅ ${repoConfig.owner}/${repoConfig.repo}: ${result.overallScore}/100 (${result.dataSource})`
        );

        // Додаємо невелику затримку між запитами для уникнення rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(
          `❌ Помилка при зборі метрик для ${repoConfig.owner}/${repoConfig.repo}:`,
          error
        );
      }
    }

    return results;
  }
}
