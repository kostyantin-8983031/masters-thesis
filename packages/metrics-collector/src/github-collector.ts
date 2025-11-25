/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GitHub Metrics Collector
 *
 * Реальний збір метрик з GitHub API для open source проектів
 *
 * @author Слабенко Костянтин
 */

import {
  OpenSourceDeveloperExperience,
  OpenSourceTechnicalPerformance,
  OpenSourceBusinessImpact,
  MetricTimestamp,
} from '@thesis/metrics';

export interface GitHubConfig {
  owner: string;
  repo: string;
  token?: string;
  baseUrl?: string;
  targetDate?: Date; // For historical data collection - collect metrics as of this date
}

export interface GitHubApiResponse<T> {
  data: T;
  rateLimit: {
    remaining: number;
    resetAt: string;
  };
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  created_at: string;
  updated_at: string;
  closed_at?: string;
  merged_at?: string;
  comments: number;
  review_comments: number;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
  user: {
    login: string;
    type: string;
  };
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  created_at: string;
  closed_at?: string;
  comments: number;
  labels: Array<{
    name: string;
    color: string;
  }>;
  user: {
    login: string;
  };
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  size: number;
  default_branch: string;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  license?: {
    key: string;
    name: string;
  };
  topics: string[];
}

export interface GitHubMetrics {
  developerExperience: Partial<OpenSourceDeveloperExperience>;
  technicalPerformance: Partial<OpenSourceTechnicalPerformance>;
  businessImpact: Partial<OpenSourceBusinessImpact>;
  collectedAt: MetricTimestamp;
  repository: string;
}

export class GitHubCollector {
  private config: GitHubConfig;
  private baseUrl: string;
  private targetDate?: Date;

  constructor(config: GitHubConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.github.com';
    this.targetDate = config.targetDate;
  }

  /**
   * Filter pull requests by target date
   * For historical collection: only include PRs merged/closed before targetDate
   */
  private filterPullRequestsByDate(prs: PullRequest[]): PullRequest[] {
    if (!this.targetDate) {
      return prs;
    }

    const targetTime = this.targetDate.getTime();
    return prs.filter((pr) => {
      // Include PR if it was merged before targetDate
      if (pr.merged_at) {
        return new Date(pr.merged_at).getTime() <= targetTime;
      }
      // Include closed (not merged) PR if closed before targetDate
      if (pr.closed_at) {
        return new Date(pr.closed_at).getTime() <= targetTime;
      }
      // Include open PR if created before targetDate
      if (pr.state === 'open' && pr.created_at) {
        return new Date(pr.created_at).getTime() <= targetTime;
      }
      return false;
    });
  }

  /**
   * Filter issues by target date
   * For historical collection: only include issues created/closed before targetDate
   */
  private filterIssuesByDate(issues: Issue[]): Issue[] {
    if (!this.targetDate) {
      return issues;
    }

    const targetTime = this.targetDate.getTime();
    return issues.filter((issue) => {
      // Include issue if closed before targetDate
      if (issue.closed_at) {
        return new Date(issue.closed_at).getTime() <= targetTime;
      }
      // Include open issue if created before targetDate
      if (issue.state === 'open' && issue.created_at) {
        return new Date(issue.created_at).getTime() <= targetTime;
      }
      return false;
    });
  }

  private async makeRequest<T>(
    endpoint: string,
    retryOnRateLimit = true
  ): Promise<GitHubApiResponse<T>> {
    const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}${endpoint}`;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'MetricsCollector/1.0',
    };

    if (this.config.token) {
      headers['Authorization'] = `token ${this.config.token}`;
    }

    try {
      // Використовуємо Node.js fetch або fallback на node-fetch
      const fetchFn = fetch;

      const response = await fetchFn(url, { headers });

      // Extract rate limit info first (available even on error responses)
      const rateLimit = {
        remaining: parseInt(
          response.headers.get('X-RateLimit-Remaining') || '0'
        ),
        resetAt:
          response.headers.get('X-RateLimit-Reset') || new Date().toISOString(),
      };

      // Check for rate limit error (403)
      if (response.status === 403) {
        const rateLimitRemaining = parseInt(
          response.headers.get('X-RateLimit-Remaining') || '0'
        );

        if (rateLimitRemaining === 0) {
          const resetTimestamp = parseInt(
            response.headers.get('X-RateLimit-Reset') || '0'
          );
          const resetDate = new Date(resetTimestamp * 1000);
          const waitTimeMs = resetDate.getTime() - Date.now();
          const waitTimeMin = Math.ceil(waitTimeMs / 60000);

          console.warn(`⚠️  GitHub API Rate Limit exceeded!`);
          console.warn(`   Limit resets at: ${resetDate.toLocaleTimeString()}`);
          console.warn(`   Wait time: ~${waitTimeMin} minutes`);

          if (retryOnRateLimit && waitTimeMs > 0 && waitTimeMs < 3600000) {
            // Only auto-retry if wait time is reasonable (< 1 hour)
            console.warn(
              `   ⏳ Waiting ${waitTimeMin} minutes before retry...`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, waitTimeMs + 5000)
            ); // +5s buffer
            console.log(`   🔄 Retrying after rate limit reset...`);
            return this.makeRequest<T>(endpoint, false); // Don't retry again
          } else {
            throw new Error(
              `GitHub API Rate Limit exceeded. Resets at ${resetDate.toISOString()}. Wait ${waitTimeMin} minutes.`
            );
          }
        }
      }

      if (!response.ok) {
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return { data, rateLimit };
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  async getRepository(): Promise<Repository> {
    const response = await this.makeRequest<Repository>('');
    return response.data;
  }

  async getPullRequests(
    state: 'open' | 'closed' | 'all' = 'all',
    perPage = 100
  ): Promise<PullRequest[]> {
    const response = await this.makeRequest<PullRequest[]>(
      `/pulls?state=${state}&per_page=${perPage}&sort=updated&direction=desc`
    );
    return response.data;
  }

  async getPullRequestDetails(prNumber: number): Promise<PullRequest> {
    const response = await this.makeRequest<PullRequest>(`/pulls/${prNumber}`);
    return response.data;
  }

  async getPullRequestComments(prNumber: number): Promise<number> {
    try {
      const [comments, reviewComments] = await Promise.all([
        this.makeRequest<any[]>(`/issues/${prNumber}/comments`),
        this.makeRequest<any[]>(`/pulls/${prNumber}/comments`),
      ]);
      return comments.data.length + reviewComments.data.length;
    } catch (error) {
      console.warn(`Could not get comments for PR #${prNumber}:`, error);
      return 0;
    }
  }

  async getIssues(
    state: 'open' | 'closed' | 'all' = 'all',
    perPage = 100
  ): Promise<Issue[]> {
    const response = await this.makeRequest<Issue[]>(
      `/issues?state=${state}&per_page=${perPage}&sort=updated&direction=desc`
    );
    return response.data.filter((issue) => !('pull_request' in issue));
  }

  async collectDeveloperExperienceMetrics(): Promise<
    Partial<OpenSourceDeveloperExperience>
  > {
    try {
      const [pullRequestsRaw, issuesRaw] = await Promise.all([
        this.getPullRequests('closed', 50), // Зменшуємо кількість для детального аналізу
        this.getIssues('closed', 100),
      ]);

      // Apply date filtering for historical collection
      const pullRequests = this.filterPullRequestsByDate(pullRequestsRaw);
      const issues = this.filterIssuesByDate(issuesRaw);

      // Аналіз PR метрик
      const mergedPRs = pullRequests.filter((pr) => pr.merged_at);
      const totalReviewTime = mergedPRs.reduce((sum, pr) => {
        if (pr.created_at && pr.merged_at) {
          const reviewTime =
            new Date(pr.merged_at).getTime() -
            new Date(pr.created_at).getTime();
          return sum + reviewTime / (1000 * 60 * 60); // Convert to hours
        }
        return sum;
      }, 0);

      const codeReviewDuration =
        mergedPRs.length > 0 ? totalReviewTime / mergedPRs.length : 0;

      // Отримуємо детальні дані для перших 10 PR
      console.log(
        `   📝 Аналізуємо детальні дані для ${Math.min(
          10,
          mergedPRs.length
        )} PR...`
      );
      let totalComments = 0;
      let totalChanges = 0;
      let prWithDataCount = 0;

      for (let i = 0; i < Math.min(10, mergedPRs.length); i++) {
        const pr = mergedPRs[i];
        try {
          const [detailedPR, comments] = await Promise.all([
            this.getPullRequestDetails(pr.number),
            this.getPullRequestComments(pr.number),
          ]);

          if (
            detailedPR.additions !== undefined &&
            detailedPR.deletions !== undefined
          ) {
            totalChanges += detailedPR.additions + detailedPR.deletions;
            prWithDataCount++;
          }

          totalComments += comments;

          // Невелика затримка для rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.warn(
            `   ⚠️ Помилка при отриманні деталей PR #${pr.number}:`,
            error
          );
        }
      }

      const averageCommentsPerPR =
        mergedPRs.length > 0
          ? totalComments / Math.min(10, mergedPRs.length)
          : 0;

      // Аналіз багів та debugging time
      const bugLabels = ['bug', 'error', 'defect', 'issue'];
      const bugIssues = issues.filter((issue) =>
        issue.labels.some((label) =>
          bugLabels.some((bugLabel) =>
            label.name.toLowerCase().includes(bugLabel)
          )
        )
      );

      const closedBugs = bugIssues.filter((issue) => issue.closed_at);
      const totalBugTime = closedBugs.reduce((sum, issue) => {
        if (issue.created_at && issue.closed_at) {
          const bugTime =
            new Date(issue.closed_at).getTime() -
            new Date(issue.created_at).getTime();
          return sum + bugTime / (1000 * 60 * 60); // Convert to hours
        }
        return sum;
      }, 0);

      const debuggingTime =
        closedBugs.length > 0 ? totalBugTime / closedBugs.length : 0;

      // Розраховуємо PR iteration rate з детальними даними
      console.log(
        `   🔄 Аналізуємо PR iteration rate для ${Math.min(
          10,
          mergedPRs.length
        )} PR...`
      );
      let prsWithMultipleCommits = 0;
      let prIterationAnalyzed = 0;

      for (let i = 0; i < Math.min(10, mergedPRs.length); i++) {
        const pr = mergedPRs[i];
        try {
          const detailedPR = await this.getPullRequestDetails(pr.number);
          if (detailedPR.commits > 1) {
            prsWithMultipleCommits++;
          }
          prIterationAnalyzed++;

          // Невелика затримка для rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.warn(
            `   ⚠️ Помилка при аналізі PR iteration для #${pr.number}:`,
            error
          );
        }
      }

      const prIterationRate =
        prIterationAnalyzed > 0
          ? prsWithMultipleCommits / prIterationAnalyzed
          : 0;

      // Приблизні значення для метрик, що потребують додаткового API
      const successfulDeploymentsRatio = 0.95; // Would need GitHub Actions API
      const timeToFirstCommit = 2.5; // Would need contributor analysis
      const linesChangedPerHour =
        totalChanges > 0 && totalReviewTime > 0
          ? totalChanges / totalReviewTime
          : 0;

      return {
        codeReviewDuration,
        debuggingTime,
        successfulDeploymentsRatio,
        timeToFirstCommit,
        linesChangedPerHour,
        averageCommentsPerPR,
        prIterationRate,
      };
    } catch (error) {
      console.error('Error collecting developer experience metrics:', error);
      return {};
    }
  }

  async collectTechnicalPerformanceMetrics(): Promise<
    Partial<OpenSourceTechnicalPerformance>
  > {
    try {
      const [repository] = await Promise.all([this.getRepository()]);

      // Get package name for bundlephobia lookup
      const packageName = await this.getPackageName();

      // Try to get actual bundle size from bundlephobia API
      let bundleSize: number;
      let bundleLoadTime: number;

      if (packageName) {
        console.log(
          `   📦 Fetching bundle size from bundlephobia.com for "${packageName}"...`
        );
        const bundleData = await this.fetchBundlephobiaSize(packageName);

        if (bundleData) {
          bundleSize = bundleData.gzip; // Use gzipped size as it's more realistic
          bundleLoadTime = bundleData.gzip / 50000; // Rough estimate: 50KB/s on 3G
          console.log(
            `   ✅ Bundle size: ${(bundleData.size / 1024).toFixed(1)}KB (${(
              bundleData.gzip / 1024
            ).toFixed(1)}KB gzipped)`
          );
        } else {
          // Fallback to estimation
          bundleSize = repository.size * 1024; // KB, rough estimate
          bundleLoadTime = bundleSize / 100; // Rough estimate
          console.log(
            `   📈 Estimated bundle size (heuristic): ${(
              bundleSize / 1024
            ).toFixed(1)}KB`
          );
        }
      } else {
        // No package.json found, use estimation
        bundleSize = repository.size * 1024; // KB, rough estimate
        bundleLoadTime = bundleSize / 100; // Rough estimate
        console.log(`   ⚠️ No package.json found, using estimated bundle size`);
      }

      const estimatedBuildTime = Math.min(600, repository.size / 10); // Rough estimate in seconds
      const estimatedPerformanceScore = Math.max(
        60,
        100 - repository.size / 1000
      ); // Rough estimate

      // TypeScript error rate на основі аналізу issues та мови репозиторію
      const typeScriptErrorRate = await this.estimateTypeScriptErrorRate();

      // Test coverage на основі аналізу README та workflows
      const testCoverage = await this.estimateTestCoverage();

      return {
        buildTime: estimatedBuildTime,
        bundleSize,
        bundleLoadTime,
        performanceScore: estimatedPerformanceScore,
        typeScriptErrorRate,
        testCoverage,
      };
    } catch (error) {
      console.error('Error collecting technical performance metrics:', error);
      return {};
    }
  }

  async collectBusinessImpactMetrics(): Promise<
    Partial<OpenSourceBusinessImpact>
  > {
    try {
      const [repository, pullRequestsRaw, issuesRaw] = await Promise.all([
        this.getRepository(),
        this.getPullRequests('closed', 100),
        this.getIssues('all', 100),
      ]);

      // Apply date filtering for historical collection
      const pullRequests = this.filterPullRequestsByDate(pullRequestsRaw);
      const issues = this.filterIssuesByDate(issuesRaw);

      // Time to market - час від створення до останнього релізу
      const mergedPRs = pullRequests.filter((pr) => pr.merged_at);
      const totalFeatureTime = mergedPRs.reduce((sum, pr) => {
        if (pr.created_at && pr.merged_at) {
          const featureTime =
            new Date(pr.merged_at).getTime() -
            new Date(pr.created_at).getTime();
          return sum + featureTime / (1000 * 60 * 60 * 24); // Convert to days
        }
        return sum;
      }, 0);

      const timeToMarket =
        mergedPRs.length > 0 ? totalFeatureTime / mergedPRs.length : 0;

      // Feature success rate - відсоток успішних PR
      const featureSuccessRate =
        pullRequests.length > 0 ? mergedPRs.length / pullRequests.length : 0;

      // Active contributors - приблизна кількість на основі PR
      const uniqueContributors = new Set(mergedPRs.map((pr) => pr.user.login));
      const activeContributors = uniqueContributors.size;

      // Issue resolution rate
      const closedIssues = issues.filter((issue) => issue.closed_at);
      const issueResolutionRate =
        issues.length > 0 ? closedIssues.length / issues.length : 0;

      // Community growth - combine GitHub stars with npm downloads
      let communityGrowth = repository.stargazers_count / 1000; // Normalized value from stars

      // Try to get npm downloads for additional community metric
      const packageName = await this.getPackageName();
      if (packageName) {
        console.log(`   📈 Fetching npm downloads for "${packageName}"...`);
        const npmData = await this.fetchNpmDownloads(packageName);

        if (npmData) {
          // Add normalized downloads to community growth
          // 1M downloads/month = +10 to community growth score
          const downloadsBonus = npmData.downloads / 100000;
          communityGrowth += downloadsBonus;
          console.log(
            `   ✅ npm downloads: ${(npmData.downloads / 1000).toFixed(
              0
            )}K/month (period: ${npmData.period})`
          );
        }
      }

      return {
        timeToMarket,
        featureSuccessRate,
        activeContributors,
        issueResolutionRate,
        communityGrowth,
      };
    } catch (error) {
      console.error('Error collecting business impact metrics:', error);
      return {};
    }
  }

  private async estimateTypeScriptErrorRate(): Promise<number> {
    try {
      const [repository, issues] = await Promise.all([
        this.getRepository(),
        this.getIssues('all', 100),
      ]);

      // Базова оцінка на основі мови проекту
      let baseErrorRate = 0.3; // Default for JS projects
      if (repository.language === 'TypeScript') {
        baseErrorRate = 0.15; // TS projects generally have fewer runtime errors
      }

      // Аналіз issues на предмет TypeScript/type errors
      const typeErrorKeywords = [
        'type error',
        'typescript',
        'compile error',
        'tsc',
        'type check',
      ];
      const typeIssues = issues.filter((issue) =>
        typeErrorKeywords.some(
          (keyword) =>
            issue.title.toLowerCase().includes(keyword) ||
            (issue.body && issue.body.toLowerCase().includes(keyword))
        )
      );

      // Коригуємо на основі кількості type-related issues
      const typeIssueRate =
        issues.length > 0 ? typeIssues.length / issues.length : 0;
      const adjustedErrorRate = baseErrorRate + typeIssueRate * 0.3;

      return Math.min(1.0, Math.max(0.05, adjustedErrorRate));
    } catch (error) {
      console.warn('Error estimating TypeScript error rate:', error);
      return 0.3; // Fallback value
    }
  }

  private async estimateTestCoverage(): Promise<number> {
    try {
      // 1. First, try to get actual coverage from Codecov.io API
      console.log('   📊 Fetching coverage from Codecov.io API...');
      const codecovCoverage = await this.fetchCodecovCoverage();
      if (codecovCoverage !== null) {
        console.log(`   ✅ Codecov coverage: ${codecovCoverage.toFixed(1)}%`);
        return codecovCoverage;
      }

      // 2. Fallback: Try to find coverage badges in README
      const readmeResponse = await this.makeRequest<any>('/readme').catch(
        () => null
      );

      if (readmeResponse?.data?.content) {
        const readmeContent = Buffer.from(
          readmeResponse.data.content,
          'base64'
        ).toString('utf-8');

        // Шукаємо coverage badges у README
        const coverageBadgeRegex = /coverage[:\s]*(\d+(?:\.\d+)?)%/i;
        const codecovRegex = /codecov\.io.*?(\d+(?:\.\d+)?)%/i;
        const coverallsRegex = /coveralls\.io.*?(\d+(?:\.\d+)?)%/i;

        const coverageMatch =
          readmeContent.match(coverageBadgeRegex) ||
          readmeContent.match(codecovRegex) ||
          readmeContent.match(coverallsRegex);

        if (coverageMatch && coverageMatch[1]) {
          const coverage = parseFloat(coverageMatch[1]);
          if (coverage >= 0 && coverage <= 100) {
            console.log(`   📝 Coverage from README badge: ${coverage}%`);
            return coverage;
          }
        }
      }

      // 3. Final fallback: Heuristic estimation
      const repository = await this.getRepository();
      let baseCoverage = 60; // Default

      // Евристика на основі розміру та популярності проекту
      if (repository.stargazers_count > 10000) {
        baseCoverage = 75; // Popular projects tend to have better coverage
      }
      if (repository.stargazers_count > 50000) {
        baseCoverage = 85; // Very popular projects
      }

      // TypeScript projects зазвичай мають кращий coverage
      if (repository.language === 'TypeScript') {
        baseCoverage += 10;
      }

      console.log(`   📈 Estimated coverage (heuristic): ${baseCoverage}%`);
      return Math.min(95, Math.max(30, baseCoverage));
    } catch (error) {
      console.warn('Error estimating test coverage:', error);
      return 65; // Fallback value
    }
  }

  /**
   * Fetch test coverage from Codecov.io API
   * https://docs.codecov.com/reference/repos_retrieve
   */
  private async fetchCodecovCoverage(): Promise<number | null> {
    try {
      const response = await fetch(
        `https://codecov.io/api/v2/github/${this.config.owner}/repos/${this.config.repo}`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.totals?.coverage) {
        return parseFloat(data.totals.coverage);
      }
      return null;
    } catch (error) {
      console.warn('Codecov API error:', error);
      return null;
    }
  }

  /**
   * Fetch bundle size from bundlephobia.com API
   * https://bundlephobia.com/api/size?package=<package-name>
   */
  private async fetchBundlephobiaSize(packageName: string): Promise<{
    size: number;
    gzip: number;
  } | null> {
    try {
      const response = await fetch(
        `https://bundlephobia.com/api/size?package=${encodeURIComponent(
          packageName
        )}`,
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'thesis-metrics-collector/1.0',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        size: data.size || 0, // Minified size in bytes
        gzip: data.gzip || 0, // Gzipped size in bytes
      };
    } catch (error) {
      console.warn('Bundlephobia API error:', error);
      return null;
    }
  }

  /**
   * Fetch download statistics from npm Registry API
   * https://api.npmjs.org/downloads/point/last-month/<package-name>
   */
  private async fetchNpmDownloads(packageName: string): Promise<{
    downloads: number;
    period: string;
  } | null> {
    try {
      const response = await fetch(
        `https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(
          packageName
        )}`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        downloads: data.downloads || 0,
        period: `${data.start} to ${data.end}`,
      };
    } catch (error) {
      console.warn('npm Registry API error:', error);
      return null;
    }
  }

  /**
   * Get package name from repository (checks package.json)
   */
  private async getPackageName(): Promise<string | null> {
    try {
      const response = await this.makeRequest<any>('/contents/package.json');
      if (response.data?.content) {
        const packageJson = JSON.parse(
          Buffer.from(response.data.content, 'base64').toString('utf-8')
        );
        return packageJson.name || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  async collectAllMetrics(): Promise<GitHubMetrics> {
    const [developerExperience, technicalPerformance, businessImpact] =
      await Promise.all([
        this.collectDeveloperExperienceMetrics(),
        this.collectTechnicalPerformanceMetrics(),
        this.collectBusinessImpactMetrics(),
      ]);

    return {
      developerExperience,
      technicalPerformance,
      businessImpact,
      collectedAt: this.targetDate
        ? this.targetDate.toISOString()
        : new Date().toISOString(),
      repository: `${this.config.owner}/${this.config.repo}`,
    };
  }

  /**
   * Collect metrics as they were at a specific point in time
   * @param targetDate The date to collect historical metrics for
   */
  async collectMetricsAtDate(targetDate: Date): Promise<GitHubMetrics> {
    // Create new instance with target date
    const historicalCollector = new GitHubCollector({
      ...this.config,
      targetDate,
    });
    return historicalCollector.collectAllMetrics();
  }

  /**
   * Collect metrics for multiple dates (time series)
   * @param dates Array of dates to collect metrics for
   * @param delayMs Delay between requests to avoid rate limits (default: 1000ms)
   */
  async collectHistoricalTimeSeries(
    dates: Date[],
    delayMs = 1000
  ): Promise<GitHubMetrics[]> {
    const results: GitHubMetrics[] = [];

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      console.log(
        `\n📅 Collecting metrics for ${date.toISOString().split('T')[0]} (${
          i + 1
        }/${dates.length})...`
      );

      try {
        const metrics = await this.collectMetricsAtDate(date);
        results.push(metrics);

        // Delay to avoid rate limits (except for last iteration)
        if (i < dates.length - 1) {
          console.log(`   ⏳ Waiting ${delayMs}ms before next request...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        console.error(
          `   ❌ Error collecting metrics for ${date.toISOString()}:`,
          error
        );
        // Continue with next date even if one fails
      }
    }

    return results;
  }
}
