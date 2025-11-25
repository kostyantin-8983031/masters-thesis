/**
 * Simple Metrics Collector
 *
 * Спрощений колектор метрик для демонстрації функціональності
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

export interface SimpleCollectorConfig {
  projectName: string;
  projectType: ProjectType;
  isOpenSource: boolean;
  githubUrl?: string;
  mockData?: boolean;
}

export interface SimpleCollectionResult {
  projectName: string;
  collectedAt: MetricTimestamp;
  metrics: OpenSourceMetrics;
  overallScore: number;
  confidence: number;
}

export class SimpleMetricsCollector {
  private config: SimpleCollectorConfig;

  constructor(config: SimpleCollectorConfig) {
    this.config = config;
  }

  async collectMetrics(): Promise<SimpleCollectionResult> {
    const collectedAt: MetricTimestamp = new Date().toISOString();

    // Create mock metrics that match the exact interface
    const developerExperience: OpenSourceDeveloperExperience = {
      codeReviewDuration: 12.5,
      debuggingTime: 8.2,
      successfulDeploymentsRatio: 0.94,
      timeToFirstCommit: 2.5,
      linesChangedPerHour: 25.8,
      averageCommentsPerPR: 4.2,
      prIterationRate: 0.35,
    };

    const technicalPerformance: OpenSourceTechnicalPerformance = {
      buildTime: 180,
      bundleSize: 512000,
      bundleLoadTime: 850,
      performanceScore: 85,
      typeScriptErrorRate: 0.5,
      testCoverage: 78.5,
    };

    const businessImpact: OpenSourceBusinessImpact = {
      timeToMarket: 3.2,
      featureSuccessRate: 0.87,
      activeContributors: 15,
      issueResolutionRate: 0.72,
      communityGrowth: 0.15,
    };

    const metrics: OpenSourceMetrics = {
      developerExperience,
      technicalPerformance,
      businessImpact,
    };

    // Calculate simple overall score
    const overallScore = this.calculateOverallScore(metrics);
    const confidence = this.config.mockData ? 60 : 85;

    return {
      projectName: this.config.projectName,
      collectedAt,
      metrics,
      overallScore,
      confidence,
    };
  }

  private calculateOverallScore(metrics: OpenSourceMetrics): number {
    // Simple scoring algorithm
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

    return Math.max(0, Math.min(100, score));
  }

  async collectBatch(
    projects: Array<{ name: string; type: ProjectType }>
  ): Promise<SimpleCollectionResult[]> {
    const results: SimpleCollectionResult[] = [];

    for (const project of projects) {
      const config: SimpleCollectorConfig = {
        projectName: project.name,
        projectType: project.type,
        isOpenSource: true,
        mockData: true,
      };

      const collector = new SimpleMetricsCollector(config);
      const result = await collector.collectMetrics();
      results.push(result);
    }

    return results;
  }
}
