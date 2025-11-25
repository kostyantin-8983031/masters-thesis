#!/usr/bin/env node

/**
 * Quality Dashboard CLI Tool
 *
 * Practical tool for analyzing TypeScript project quality using outcome-based metrics.
 *
 * Features:
 * - Shows Composite Quality Score with breakdown
 * - Compares with benchmarks (50 projects)
 * - Predicts trends based on historical patterns
 * - Provides actionable recommendations with ROI
 *
 * Usage:
 *   npx quality-dashboard --repo owner/repo
 *   npx quality-dashboard --repo owner/repo --format json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to Python prediction script
const PREDICT_SCRIPT = path.resolve(__dirname, '../../../analysis/predict.py');
const ANALYSIS_VENV = path.resolve(
  __dirname,
  '../../../analysis/venv/bin/python'
);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    repo: null,
    format: 'terminal', // terminal | json
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--repo' && args[i + 1]) {
      parsed.repo = args[i + 1];
      i++;
    } else if (args[i] === '--format' && args[i + 1]) {
      parsed.format = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      parsed.help = true;
    }
  }

  return parsed;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
${colors.bright}Quality Dashboard - Outcome-based TypeScript Project Analysis${colors.reset}

${colors.cyan}USAGE:${colors.reset}
  npx quality-dashboard --repo <owner/repo> [options]

${colors.cyan}OPTIONS:${colors.reset}
  --repo <owner/repo>   GitHub repository to analyze (required)
  --format <type>       Output format: terminal (default) | json
  --help, -h            Show this help message

${colors.cyan}EXAMPLES:${colors.reset}
  npx quality-dashboard --repo facebook/react
  npx quality-dashboard --repo vercel/next.js --format json
  npx quality-dashboard --repo microsoft/TypeScript

${colors.cyan}OUTPUT:${colors.reset}
  - Composite Quality Score (0-100)
  - Category breakdown (DX, TP, BI)
  - Benchmark comparison (percentile among 50 projects)
  - Trend prediction (IMPROVING | STABLE | DECLINING)
  - Actionable recommendations with ROI

${colors.cyan}DOCUMENTATION:${colors.reset}
  https://github.com/user/masters-thesis
`);
}

/**
 * Load benchmark data from existing reports
 */
async function loadBenchmarks() {
  const benchmarkPath = path.resolve(
    __dirname,
    '../../../reports/metrics_report.json'
  );

  try {
    const content = await fs.promises.readFile(benchmarkPath, 'utf8');
    const data = JSON.parse(content);
    return data.projects.filter((p) => !p.error && p.overallScore);
  } catch (error) {
    console.warn(
      `${colors.yellow}⚠️  Could not load benchmarks: ${error.message}${colors.reset}`
    );
    return [];
  }
}

/**
 * Call Python ML model for predictions
 */
function callMLPrediction(metrics) {
  try {
    // Check if models exist
    const modelsDir = path.resolve(
      __dirname,
      '../../../reports/ml/saved_models'
    );
    if (!fs.existsSync(path.join(modelsDir, 'metadata.json'))) {
      return { error: 'Models not found. Run train_and_save_models.py first.' };
    }

    // Prepare input JSON
    const inputJson = JSON.stringify(metrics);

    // Call Python script
    const pythonPath = fs.existsSync(ANALYSIS_VENV) ? ANALYSIS_VENV : 'python3';
    const result = execSync(
      `${pythonPath} "${PREDICT_SCRIPT}" '${inputJson}'`,
      {
        encoding: 'utf8',
        timeout: 30000,
        cwd: path.dirname(PREDICT_SCRIPT),
      }
    );

    return JSON.parse(result);
  } catch (error) {
    return { error: `ML prediction failed: ${error.message}` };
  }
}

/**
 * Call Python ML model for what-if analysis
 */
function callWhatIfAnalysis(metrics, changes) {
  try {
    // Check if models exist
    const modelsDir = path.resolve(
      __dirname,
      '../../../reports/ml/saved_models'
    );
    if (!fs.existsSync(path.join(modelsDir, 'metadata.json'))) {
      return { error: 'Models not found. Run train_and_save_models.py first.' };
    }

    // Prepare input JSON with whatif changes
    const input = {
      metrics: metrics,
      whatif: changes,
    };
    const inputJson = JSON.stringify(input);

    // Call Python script
    const pythonPath = fs.existsSync(ANALYSIS_VENV) ? ANALYSIS_VENV : 'python3';
    const result = execSync(
      `${pythonPath} "${PREDICT_SCRIPT}" '${inputJson}'`,
      {
        encoding: 'utf8',
        timeout: 30000,
        cwd: path.dirname(PREDICT_SCRIPT),
      }
    );

    return JSON.parse(result);
  } catch (error) {
    return { error: `What-if analysis failed: ${error.message}` };
  }
}

/**
 * Generate what-if scenarios based on recommendations
 */
function generateWhatIfScenarios(metrics) {
  const scenarios = [];

  // Scenario 1: Optimize code review to 48h
  const currentReview = metrics.developerExperience?.codeReviewDuration || 0;
  if (currentReview > 48) {
    scenarios.push({
      name: 'Optimize Code Reviews',
      changes: { dx_codeReviewDuration: 48 },
      description: `Reduce code review from ${Math.round(
        currentReview
      )}h to 48h`,
    });
  }

  // Scenario 2: Increase test coverage to 85%
  const currentCoverage = metrics.technicalPerformance?.testCoverage || 0;
  if (currentCoverage < 85) {
    scenarios.push({
      name: 'Increase Test Coverage',
      changes: { tp_testCoverage: 85 },
      description: `Increase coverage from ${Math.round(
        currentCoverage
      )}% to 85%`,
    });
  }

  // Scenario 3: Combined improvements
  if (currentReview > 48 && currentCoverage < 85) {
    scenarios.push({
      name: 'Combined Improvements',
      changes: {
        dx_codeReviewDuration: 48,
        tp_testCoverage: 85,
      },
      description: 'Apply both code review and test coverage improvements',
    });
  }

  return scenarios;
}

/**
 * Calculate percentile rank
 */
function calculatePercentile(score, benchmarks) {
  if (benchmarks.length === 0) return null;

  const scores = benchmarks.map((p) => p.overallScore).sort((a, b) => a - b);
  const belowCount = scores.filter((s) => s < score).length;
  const percentile = Math.round((belowCount / scores.length) * 100);

  return percentile;
}

/**
 * Calculate benchmark statistics
 */
function calculateBenchmarkStats(benchmarks) {
  if (benchmarks.length === 0) return null;

  const scores = benchmarks.map((p) => p.overallScore).sort((a, b) => a - b);

  return {
    min: Math.min(...scores),
    max: Math.max(...scores),
    mean: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    median: scores[Math.floor(scores.length / 2)],
    p25: scores[Math.floor(scores.length * 0.25)],
    p75: scores[Math.floor(scores.length * 0.75)],
    count: scores.length,
  };
}

/**
 * Predict trend based on metrics
 */
function predictTrend(metrics) {
  // Based on research findings:
  // - Fast code reviews (< 48h) → IMPROVING
  // - High test coverage (> 85%) → STABLE/IMPROVING
  // - High community growth → IMPROVING

  let improvingSignals = 0;
  let decliningSignals = 0;

  // Code review duration
  const reviewHours = metrics.developerExperience?.codeReviewDuration || 0;
  if (reviewHours < 48) {
    improvingSignals += 2; // Strong signal based on research (r=0.881)
  } else if (reviewHours > 168) {
    // > 7 days
    decliningSignals += 2;
  }

  // Test coverage
  const coverage = metrics.technicalPerformance?.testCoverage || 0;
  if (coverage > 85) {
    improvingSignals += 1;
  } else if (coverage < 60) {
    decliningSignals += 1;
  }

  // Community growth
  const growth = metrics.businessImpact?.communityGrowth || 0;
  if (growth > 50) {
    improvingSignals += 1;
  } else if (growth < 10) {
    decliningSignals += 1;
  }

  // Issue resolution rate
  const resolutionRate = metrics.businessImpact?.issueResolutionRate || 0;
  if (resolutionRate > 0.7) {
    improvingSignals += 1;
  } else if (resolutionRate < 0.3) {
    decliningSignals += 1;
  }

  // Determine trend
  if (improvingSignals >= 3 && improvingSignals > decliningSignals * 2) {
    return 'IMPROVING';
  } else if (decliningSignals >= 3 && decliningSignals > improvingSignals * 2) {
    return 'DECLINING';
  }
  return 'STABLE';
}

/**
 * Generate recommendations based on metrics and research findings
 */
function generateRecommendations(metrics, score) {
  const recommendations = [];

  // 1. Code Review Duration (highest ROI based on research)
  const reviewHours = metrics.developerExperience?.codeReviewDuration || 0;
  if (reviewHours > 48) {
    const currentDays = Math.round(reviewHours / 24);
    const savingsHours = (reviewHours - 48) * 0.027 * 24; // Based on regression β=0.027
    const annualSavings = Math.round(savingsHours * 52);

    recommendations.push({
      priority: 1,
      category: 'Developer Experience',
      metric: 'Code Review Duration',
      current: `${currentDays} days`,
      target: '< 2 days',
      action: 'Implement <48h SLA for code reviews',
      details: [
        'Set up automated reminders after 24h',
        'Require smaller PRs (< 400 lines)',
        'Use PR templates for structured descriptions',
        'Implement CODEOWNERS for automatic assignment',
      ],
      impact: `Save ${Math.round(savingsHours)}h per feature delivery`,
      roi: '929%',
      paybackPeriod: '6 weeks',
    });
  }

  // 2. Test Coverage (strong correlation with community growth)
  const coverage = metrics.technicalPerformance?.testCoverage || 0;
  if (coverage < 85) {
    const gap = 85 - coverage;
    const starsImpact = Math.round(gap * 1.43); // Based on +14.3 stars/month per 10%

    recommendations.push({
      priority: 2,
      category: 'Technical Performance',
      metric: 'Test Coverage',
      current: `${Math.round(coverage)}%`,
      target: '> 85%',
      action: 'Increase test coverage systematically',
      details: [
        'Set up coverage gates in CI/CD (fail < current - 2%)',
        'Use Jest/Vitest for fast unit tests',
        'Add Playwright/Cypress for E2E testing',
        'Display coverage badges on README',
      ],
      impact: `+${starsImpact} community growth (stars/month)`,
      roi: '74%',
      paybackPeriod: '16 months',
    });
  }

  // 3. Issue Resolution Rate
  const resolutionRate = metrics.businessImpact?.issueResolutionRate || 0;
  if (resolutionRate < 0.5) {
    recommendations.push({
      priority: 3,
      category: 'Business Impact',
      metric: 'Issue Resolution Rate',
      current: `${Math.round(resolutionRate * 100)}%`,
      target: '> 50%',
      action: 'Improve issue triage and resolution process',
      details: [
        'Implement issue templates for better descriptions',
        'Set up automated labeling (bug, feature, docs)',
        'Create issue triage rotation among team',
        'Close stale issues automatically (> 90 days)',
      ],
      impact: 'Faster feedback loop, better community engagement',
      roi: '120%',
      paybackPeriod: '3 months',
    });
  }

  // 4. Build Time
  const buildTime = metrics.technicalPerformance?.buildTime || 0;
  if (buildTime > 300) {
    // > 5 minutes
    recommendations.push({
      priority: 4,
      category: 'Developer Experience',
      metric: 'Build Time',
      current: `${Math.round(buildTime)}s`,
      target: '< 60s',
      action: 'Optimize build pipeline',
      details: [
        'Enable incremental TypeScript compilation',
        'Use Nx/Turborepo for smart caching',
        'Parallelize test execution',
        'Consider esbuild/swc for faster transpilation',
      ],
      impact: 'Faster feedback loops, higher developer satisfaction',
      roi: '85%',
      paybackPeriod: '2 months',
    });
  }

  // 5. DX × TP Interaction (based on 47.5% feature importance)
  const dxScore = calculateCategoryScore(metrics.developerExperience, 'dx');
  const tpScore = calculateCategoryScore(metrics.technicalPerformance, 'tp');

  if (Math.abs(dxScore - tpScore) > 20) {
    const lowerCategory =
      dxScore < tpScore ? 'Developer Experience' : 'Technical Performance';
    recommendations.push({
      priority: 5,
      category: 'Balance',
      metric: 'DX × TP Interaction',
      current: `DX: ${dxScore}, TP: ${tpScore}`,
      target: 'Balanced (±10 points)',
      action: `Invest more in ${lowerCategory}`,
      details: [
        'Research shows 47.5% importance of DX×TP interaction',
        'Balanced projects score 6+ points higher',
        'Allocate 50/50 budget between DX and TP improvements',
      ],
      impact: '+6 points overall score',
      roi: '150-200%',
      paybackPeriod: '6 months',
    });
  }

  // Sort by priority
  recommendations.sort((a, b) => a.priority - b.priority);

  return recommendations.slice(0, 5); // Top 5 recommendations
}

/**
 * Calculate category score (simplified version)
 */
function calculateCategoryScore(categoryMetrics, type) {
  if (!categoryMetrics) return 0;

  // Simplified scoring based on key metrics
  if (type === 'dx') {
    const reviewScore = Math.max(
      0,
      100 - (categoryMetrics.codeReviewDuration || 0) / 1.68
    );
    const deployScore = (categoryMetrics.successfulDeploymentsRatio || 0) * 100;
    return Math.round((reviewScore + deployScore) / 2);
  }

  if (type === 'tp') {
    const coverageScore = categoryMetrics.testCoverage || 0;
    const perfScore = categoryMetrics.performanceScore || 60;
    return Math.round((coverageScore + perfScore) / 2);
  }

  if (type === 'bi') {
    const resolutionScore = (categoryMetrics.issueResolutionRate || 0) * 100;
    const growthScore = Math.min(
      100,
      (categoryMetrics.communityGrowth || 0) * 2
    );
    return Math.round((resolutionScore + growthScore) / 2);
  }

  return 0;
}

/**
 * Collect metrics for a repository
 */
async function collectMetrics(owner, repo) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  console.log(
    `\n${colors.cyan}🔍 Collecting metrics for ${owner}/${repo}...${colors.reset}\n`
  );

  // Dynamic import of the collector
  const { quickGitHubAssessment } = await import('@thesis/metrics-collector');

  const result = await quickGitHubAssessment(owner, repo, token);

  return result;
}

/**
 * Format score with color based on value
 */
function formatScore(score, label = '') {
  let color = colors.red;
  let emoji = '🔴';

  if (score >= 80) {
    color = colors.green;
    emoji = '🟢';
  } else if (score >= 70) {
    color = colors.yellow;
    emoji = '🟡';
  } else if (score >= 60) {
    color = colors.yellow;
    emoji = '🟠';
  }

  return `${emoji} ${color}${score}${colors.reset}${label ? ` ${label}` : ''}`;
}

/**
 * Format trend with color
 */
function formatTrend(trend) {
  const icons = {
    IMPROVING: `${colors.green}📈 IMPROVING${colors.reset}`,
    STABLE: `${colors.yellow}📊 STABLE${colors.reset}`,
    DECLINING: `${colors.red}📉 DECLINING${colors.reset}`,
  };
  return icons[trend] || trend;
}

/**
 * Print terminal output
 */
function printTerminalOutput(result, benchmarks) {
  const { metrics, overallScore, confidence } = result;

  // Header
  console.log(`\n${'═'.repeat(60)}`);
  console.log(
    `${colors.bright}${colors.cyan}  QUALITY DASHBOARD - ${result.name}${colors.reset}`
  );
  console.log(`${'═'.repeat(60)}\n`);

  // Overall Score
  console.log(`${colors.bright}📊 COMPOSITE QUALITY SCORE${colors.reset}`);
  console.log(`${'─'.repeat(40)}`);
  console.log(`   Overall Score: ${formatScore(overallScore, '/100')}`);
  console.log(`   Confidence: ${confidence}%`);
  console.log();

  // Category Breakdown
  const dxScore = calculateCategoryScore(metrics.developerExperience, 'dx');
  const tpScore = calculateCategoryScore(metrics.technicalPerformance, 'tp');
  const biScore = calculateCategoryScore(metrics.businessImpact, 'bi');

  console.log(`${colors.bright}📈 CATEGORY BREAKDOWN${colors.reset}`);
  console.log(`${'─'.repeat(40)}`);
  console.log(`   Developer Experience: ${formatScore(dxScore, '/100')}`);
  console.log(`   Technical Performance: ${formatScore(tpScore, '/100')}`);
  console.log(`   Business Impact: ${formatScore(biScore, '/100')}`);
  console.log();

  // Key Metrics
  console.log(`${colors.bright}🔑 KEY METRICS${colors.reset}`);
  console.log(`${'─'.repeat(40)}`);
  const reviewDays =
    (metrics.developerExperience?.codeReviewDuration || 0) / 24;
  console.log(`   Code Review Duration: ${reviewDays.toFixed(1)} days`);
  console.log(
    `   Test Coverage: ${Math.round(
      metrics.technicalPerformance?.testCoverage || 0
    )}%`
  );
  console.log(
    `   Issue Resolution Rate: ${Math.round(
      (metrics.businessImpact?.issueResolutionRate || 0) * 100
    )}%`
  );
  console.log(
    `   Community Growth: ${Math.round(
      metrics.businessImpact?.communityGrowth || 0
    )} stars/month`
  );
  console.log();

  // Benchmark Comparison
  if (benchmarks.length > 0) {
    const percentile = calculatePercentile(overallScore, benchmarks);
    const stats = calculateBenchmarkStats(benchmarks);

    console.log(`${colors.bright}📊 BENCHMARK COMPARISON${colors.reset}`);
    console.log(`${'─'.repeat(40)}`);
    console.log(
      `   Percentile: ${colors.bright}${percentile}th${colors.reset} (better than ${percentile}% of projects)`
    );
    console.log(`   Benchmark Mean: ${stats.mean}/100`);
    console.log(`   Benchmark Range: ${stats.min}-${stats.max}/100`);
    console.log(`   Projects Analyzed: ${stats.count}`);
    console.log();
  }

  // Trend Prediction
  const trend = predictTrend(metrics);
  console.log(`${colors.bright}🔮 TREND PREDICTION${colors.reset}`);
  console.log(`${'─'.repeat(40)}`);
  console.log(`   Expected Trend: ${formatTrend(trend)}`);
  console.log();

  // ML Predictions
  console.log(`${colors.bright}🤖 ML MODEL PREDICTIONS${colors.reset}`);
  console.log(`${'─'.repeat(40)}`);
  const predictions = callMLPrediction(metrics);
  if (predictions.error) {
    console.log(`   ${colors.yellow}⚠️  ${predictions.error}${colors.reset}`);
  } else if (predictions.predictions) {
    console.log(
      `   Predicted Overall Score: ${formatScore(
        Math.round(predictions.predictions.overallScore),
        '/100'
      )}`
    );
    console.log(
      `   Predicted Time to Market: ${
        colors.cyan
      }${predictions.predictions.timeToMarket.toFixed(1)}${colors.reset} days`
    );
    console.log(
      `   Predicted Community Growth: ${
        colors.cyan
      }${predictions.predictions.communityGrowth.toFixed(0)}${
        colors.reset
      } stars/month`
    );
  }
  console.log();

  // What-If Analysis
  const scenarios = generateWhatIfScenarios(metrics);
  if (scenarios.length > 0) {
    console.log(`${colors.bright}🔬 WHAT-IF ANALYSIS${colors.reset}`);
    console.log(`${'─'.repeat(40)}`);

    for (const scenario of scenarios) {
      const analysis = callWhatIfAnalysis(metrics, scenario.changes);
      if (analysis.error) {
        console.log(`   ${colors.yellow}⚠️  ${analysis.error}${colors.reset}`);
        break;
      }

      console.log(`\n   ${colors.bright}${scenario.name}${colors.reset}`);
      console.log(`   ${colors.dim}${scenario.description}${colors.reset}`);

      if (analysis.analysis) {
        for (const [target, data] of Object.entries(analysis.analysis)) {
          const changeColor =
            data.change > 0
              ? colors.green
              : data.change < 0
              ? colors.red
              : colors.yellow;
          const changeSign = data.change > 0 ? '+' : '';
          const label =
            target === 'overallScore'
              ? 'Overall Score'
              : target === 'timeToMarket'
              ? 'Time to Market'
              : 'Community Growth';
          const unit =
            target === 'timeToMarket'
              ? ' days'
              : target === 'communityGrowth'
              ? ' stars/mo'
              : '';

          console.log(
            `      ${label}: ${data.baseline.toFixed(
              1
            )}${unit} → ${changeColor}${data.predicted.toFixed(1)}${unit}${
              colors.reset
            } (${changeSign}${data.change.toFixed(1)})`
          );
        }
      }
    }
    console.log();
  }

  // Recommendations
  const recommendations = generateRecommendations(metrics, overallScore);

  if (recommendations.length > 0) {
    console.log(`${colors.bright}💡 RECOMMENDATIONS${colors.reset}`);
    console.log(`${'─'.repeat(40)}`);

    recommendations.forEach((rec, index) => {
      console.log(
        `\n   ${colors.bright}${index + 1}. ${rec.action}${colors.reset}`
      );
      console.log(`      Category: ${rec.category}`);
      console.log(`      Current: ${rec.current} → Target: ${rec.target}`);
      console.log(`      Impact: ${colors.green}${rec.impact}${colors.reset}`);
      console.log(
        `      ROI: ${colors.cyan}${rec.roi}${colors.reset} (Payback: ${rec.paybackPeriod})`
      );

      if (rec.details && rec.details.length > 0) {
        console.log(`      Actions:`);
        rec.details.slice(0, 3).forEach((detail) => {
          console.log(`        • ${detail}`);
        });
      }
    });
  } else {
    console.log(`${colors.bright}💡 RECOMMENDATIONS${colors.reset}`);
    console.log(`${'─'.repeat(40)}`);
    console.log(
      `   ${colors.green}✅ Great job! No critical improvements needed.${colors.reset}`
    );
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(
    `${colors.dim}Generated by Quality Dashboard | Based on outcome-based metrics research${colors.reset}`
  );
  console.log(`${'═'.repeat(60)}\n`);
}

/**
 * Print JSON output
 */
function printJsonOutput(result, benchmarks) {
  const { metrics, overallScore, confidence } = result;

  const output = {
    project: result.name,
    timestamp: new Date().toISOString(),
    score: {
      overall: overallScore,
      confidence: confidence,
      breakdown: {
        developerExperience: calculateCategoryScore(
          metrics.developerExperience,
          'dx'
        ),
        technicalPerformance: calculateCategoryScore(
          metrics.technicalPerformance,
          'tp'
        ),
        businessImpact: calculateCategoryScore(metrics.businessImpact, 'bi'),
      },
    },
    metrics: {
      codeReviewDuration: metrics.developerExperience?.codeReviewDuration,
      testCoverage: metrics.technicalPerformance?.testCoverage,
      issueResolutionRate: metrics.businessImpact?.issueResolutionRate,
      communityGrowth: metrics.businessImpact?.communityGrowth,
    },
    benchmark:
      benchmarks.length > 0
        ? {
            percentile: calculatePercentile(overallScore, benchmarks),
            stats: calculateBenchmarkStats(benchmarks),
          }
        : null,
    trend: predictTrend(metrics),
    recommendations: generateRecommendations(metrics, overallScore),
  };

  // Add ML predictions
  const predictions = callMLPrediction(metrics);
  if (!predictions.error && predictions.predictions) {
    output.mlPredictions = predictions.predictions;
  }

  // Add what-if analysis
  const scenarios = generateWhatIfScenarios(metrics);
  if (scenarios.length > 0) {
    output.whatIfAnalysis = [];
    for (const scenario of scenarios) {
      const analysis = callWhatIfAnalysis(metrics, scenario.changes);
      if (!analysis.error && analysis.analysis) {
        output.whatIfAnalysis.push({
          scenario: scenario.name,
          description: scenario.description,
          changes: scenario.changes,
          results: analysis.analysis,
        });
      }
    }
  }

  console.log(JSON.stringify(output, null, 2));
}

/**
 * Main function
 */
async function main() {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  if (!args.repo) {
    console.error(
      `${colors.red}Error: --repo argument is required${colors.reset}`
    );
    console.log('Use --help for usage information');
    process.exit(1);
  }

  // Parse repo
  const [owner, repo] = args.repo.split('/');
  if (!owner || !repo) {
    console.error(
      `${colors.red}Error: Invalid repo format. Use owner/repo${colors.reset}`
    );
    process.exit(1);
  }

  try {
    // Load benchmarks
    const benchmarks = await loadBenchmarks();

    // Collect metrics
    const result = await collectMetrics(owner, repo);

    // Add name for display
    result.name = `${owner}/${repo}`;

    // Normalize metrics structure
    // quickGitHubAssessment returns { metrics: { developerExperience, technicalPerformance, businessImpact } }
    if (result.metrics && typeof result.metrics === 'object') {
      // Metrics are already nested correctly
      result.metrics = {
        developerExperience: result.metrics.developerExperience || {},
        technicalPerformance: result.metrics.technicalPerformance || {},
        businessImpact: result.metrics.businessImpact || {},
      };
    } else {
      // Fallback for different structure
      result.metrics = {
        developerExperience: result.developerExperience || {},
        technicalPerformance: result.technicalPerformance || {},
        businessImpact: result.businessImpact || {},
      };
    }

    // Output based on format
    if (args.format === 'json') {
      printJsonOutput(result, benchmarks);
    } else {
      printTerminalOutput(result, benchmarks);
    }
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run
main();
