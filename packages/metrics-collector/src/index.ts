/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @fileoverview Metrics Collector Package - Real metrics collection for TypeScript projects
 *
 * Цей пакет призначений для практичного збору метрик з open source проектів
 * для дослідження outcome-based оцінки якості TypeScript коду.
 *
 * @author Слабенко Костянтин
 */

// Real collector with GitHub API integration
export { RealMetricsCollector } from './real-collector.js';
export type {
  RealCollectorConfig,
  RealCollectionResult,
} from './real-collector.js';

// GitHub API collector
export { GitHubCollector } from './github-collector.js';
export type {
  GitHubConfig,
  GitHubApiResponse,
  GitHubMetrics,
  PullRequest,
  Issue,
  Repository,
} from './github-collector.js';

// Simple collector for testing
export { SimpleMetricsCollector } from './simple-collector.js';
export type {
  SimpleCollectorConfig,
  SimpleCollectionResult,
} from './simple-collector.js';

// Re-export core types for convenience
export type {
  OpenSourceMetrics,
  OpenSourceDeveloperExperience,
  OpenSourceTechnicalPerformance,
  OpenSourceBusinessImpact,
  ProjectType,
  MetricTimestamp,
} from '@thesis/metrics';

// Package metadata
export const COLLECTOR_VERSION = '1.0.0';
export const COLLECTOR_INFO = {
  name: '@thesis/metrics-collector',
  version: COLLECTOR_VERSION,
  description:
    'Real metrics collection for TypeScript projects with GitHub API',
  author: 'Слабенко Костянтин',
  license: 'MIT',
} as const;

// Helper functions for common tasks
export function createMockConfig(projectName: string): SimpleCollectorConfig {
  return {
    projectName,
    projectType: 'Library' as any,
    isOpenSource: true,
    mockData: true,
  };
}

export function createGitHubConfig(
  owner: string,
  repo: string,
  token?: string
): RealCollectorConfig {
  return {
    projectName: `${owner}/${repo}`,
    projectType: 'Library' as any,
    isOpenSource: true,
    github: { owner, repo, token },
    includeRealData: true,
  };
}

// Quick assessment with real GitHub data
export async function quickGitHubAssessment(
  owner: string,
  repo: string,
  token?: string
): Promise<RealCollectionResult> {
  const { RealMetricsCollector } = await import('./real-collector.js');
  const collector = RealMetricsCollector.forGitHubRepo(owner, repo, token);
  return await collector.collectMetrics();
}

// Legacy simple assessment
export async function quickAssessment(
  projectName: string
): Promise<SimpleCollectionResult> {
  const { SimpleMetricsCollector } = await import('./simple-collector.js');
  const config = createMockConfig(projectName);
  const collector = new SimpleMetricsCollector(config);
  return await collector.collectMetrics();
}

// Batch assessment for GitHub repositories
export async function batchGitHubAssessment(
  repos: Array<{ owner: string; repo: string; token?: string }>
): Promise<RealCollectionResult[]> {
  const { RealMetricsCollector } = await import('./real-collector.js');
  return await RealMetricsCollector.collectBatch(repos);
}

// Legacy batch assessment
export async function batchAssessment(
  projectNames: string[]
): Promise<SimpleCollectionResult[]> {
  const results: SimpleCollectionResult[] = [];

  for (const name of projectNames) {
    try {
      const result = await quickAssessment(name);
      results.push(result);
    } catch (error) {
      console.error(`Error assessing ${name}:`, error);
    }
  }

  return results;
}

// Import types to satisfy TypeScript
import type {
  SimpleCollectorConfig,
  SimpleCollectionResult,
} from './simple-collector.js';
import type {
  RealCollectorConfig,
  RealCollectionResult,
} from './real-collector.js';
