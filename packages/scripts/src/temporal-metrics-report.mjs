/**
 * Temporal Metrics Report Generator
 *
 * Збір historical метрик з GitHub API для time-series аналізу
 *
 * Usage:
 *   node temporal-metrics-report.mjs --projects <path-to-json> --outputDir <output-directory> --months <number>
 *   node temporal-metrics-report.mjs --projects <path-to-json> --outputDir <output-directory> --startDate 2025-04-01 --endDate 2025-09-01
 *   node temporal-metrics-report.mjs --projects <path-to-json> --outputDir <output-directory> --months 6 --existingReport reports/metrics_report_temporal.json
 */

import { GitHubCollector } from '@thesis/metrics-collector';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    projects: null,
    outputDir: null,
    months: 6, // Default: last 6 months
    startDate: null,
    endDate: null,
    existingReport: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--projects' && args[i + 1]) {
      parsed.projects = args[i + 1];
      i++;
    } else if (args[i] === '--outputDir' && args[i + 1]) {
      parsed.outputDir = args[i + 1];
      i++;
    } else if (args[i] === '--months' && args[i + 1]) {
      parsed.months = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--startDate' && args[i + 1]) {
      parsed.startDate = args[i + 1];
      i++;
    } else if (args[i] === '--endDate' && args[i + 1]) {
      parsed.endDate = args[i + 1];
      i++;
    } else if (args[i] === '--existingReport' && args[i + 1]) {
      parsed.existingReport = args[i + 1];
      i++;
    }
  }

  return parsed;
}

// Generate date range for temporal collection
function generateDateRange(startDate, endDate, months) {
  const dates = [];

  if (startDate && endDate) {
    // Use explicit date range
    const start = new Date(startDate);
    const end = new Date(endDate);

    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      // Move to next month (first day)
      current.setMonth(current.getMonth() + 1);
      current.setDate(1);
    }
  } else {
    // Generate last N months
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      date.setDate(1); // First day of month
      date.setHours(0, 0, 0, 0);
      dates.push(date);
    }
  }

  return dates;
}

// Load existing report for merge
async function loadExistingReport(existingReportPath) {
  if (!existingReportPath) {
    return null;
  }

  try {
    const reportPath = path.resolve(__dirname, existingReportPath);
    const content = await fs.promises.readFile(reportPath, 'utf8');
    const data = JSON.parse(content);

    console.log(`\n📦 Завантажено existing report:`);
    console.log(`   Projects: ${data.projects?.length || 0}`);

    // Create Map for quick lookup by project name
    const projectsMap = new Map();
    if (data.projects) {
      for (const project of data.projects) {
        projectsMap.set(project.name, project);
      }
    }

    return { data, projectsMap };
  } catch (error) {
    console.warn(`⚠️  Could not load existing report: ${error.message}`);
    return null;
  }
}

// Check if project has complete data in existing report
function hasCompleteData(existingProject, expectedSnapshotCount) {
  if (!existingProject || !existingProject.snapshots) {
    return false;
  }

  if (existingProject.snapshots.length < expectedSnapshotCount) {
    return false;
  }

  // Check if at least one snapshot has actual data
  for (const snapshot of existingProject.snapshots) {
    const dx = snapshot.developerExperience || {};
    const tp = snapshot.technicalPerformance || {};
    const bi = snapshot.businessImpact || {};
    if (
      Object.keys(dx).length > 0 ||
      Object.keys(tp).length > 0 ||
      Object.keys(bi).length > 0
    ) {
      return true; // Has at least some data
    }
  }

  return false; // All snapshots empty
}

// Calculate overall score
function calculateOverallScore(metrics) {
  const dxScore = calculateCategoryScore(metrics.developerExperience);
  const tpScore = calculateCategoryScore(metrics.technicalPerformance);
  const biScore = calculateCategoryScore(metrics.businessImpact);
  return Math.round((dxScore + tpScore + biScore) / 3);
}

function calculateCategoryScore(metrics) {
  // Simplified scoring - у реальності це складніша формула
  return 70; // Placeholder
}

async function generateTemporalReport() {
  console.log('📊 Генерація temporal звіту по метрикам');
  console.log('==========================================');

  const cliArgs = parseArgs();

  if (!cliArgs.projects || !cliArgs.outputDir) {
    console.error("❌ Помилка: відсутні обов'язкові параметри");
    console.error(
      'Usage: node temporal-metrics-report.mjs --projects <path-to-json> --outputDir <output-directory> [--months <number>] [--startDate YYYY-MM-DD --endDate YYYY-MM-DD] [--existingReport <path-to-json>]'
    );
    process.exit(1);
  }

  const projectsPath = path.resolve(__dirname, cliArgs.projects);
  const outputDir = path.resolve(__dirname, cliArgs.outputDir);

  console.log(`📁 Читаємо проекти з: ${projectsPath}`);
  console.log(`📂 Звіти будуть збережені в: ${outputDir}`);

  // Read projects
  let projectsData;
  try {
    const projectsContent = await fs.promises.readFile(projectsPath, 'utf8');
    projectsData = JSON.parse(projectsContent);
  } catch (error) {
    console.error(`❌ Помилка читання файлу проектів: ${error.message}`);
    process.exit(1);
  }

  // Generate date range
  const dates = generateDateRange(
    cliArgs.startDate,
    cliArgs.endDate,
    cliArgs.months
  );

  console.log(`\n📅 Temporal Collection:`);
  console.log(`   Dates: ${dates.length} snapshots`);
  console.log(
    `   Range: ${dates[0].toISOString().split('T')[0]} → ${
      dates[dates.length - 1].toISOString().split('T')[0]
    }`
  );
  console.log(`   Projects: ${projectsData.projects.length}`);
  console.log(
    `   Total collections: ${dates.length * projectsData.projects.length}`
  );

  // Load existing report for merge (if provided)
  const existingReport = await loadExistingReport(cliArgs.existingReport);
  const existingProjectsMap = existingReport?.projectsMap || new Map();

  // Create output directory
  await fs.promises.mkdir(outputDir, { recursive: true });

  const reportData = {
    generatedAt: new Date().toISOString(),
    temporalConfig: {
      startDate: dates[0].toISOString(),
      endDate: dates[dates.length - 1].toISOString(),
      snapshotCount: dates.length,
      projectCount: projectsData.projects.length,
    },
    projects: [],
  };

  // Collect temporal data for each project
  const repos = projectsData.projects;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < repos.length; i++) {
    const repo = repos[i];
    const projectName = `${repo.owner}/${repo.repo}`;

    console.log(
      `\n${i + 1}/${
        repos.length
      } 📊 Collecting temporal data for ${projectName}...`
    );

    // Check if project already has complete data in existing report
    const existingProject = existingProjectsMap.get(projectName);
    if (hasCompleteData(existingProject, dates.length)) {
      console.log(
        `   ✅ Already has complete data (${existingProject.snapshots.length} snapshots) - skipping`
      );
      reportData.projects.push(existingProject);
      successCount++;
      continue;
    }

    try {
      // Create GitHub collector
      const collector = new GitHubCollector({
        owner: repo.owner,
        repo: repo.repo,
        token: process.env.GITHUB_TOKEN,
      });

      // Collect time series data
      console.log(`   Collecting ${dates.length} snapshots...`);
      const snapshots = [];

      for (let j = 0; j < dates.length; j++) {
        const date = dates[j];
        const dateStr = date.toISOString().split('T')[0];

        try {
          console.log(`   📅 ${j + 1}/${dates.length}: ${dateStr}...`);

          const metrics = await collector.collectMetricsAtDate(date);

          const snapshot = {
            collectedAt: metrics.collectedAt,
            developerExperience: metrics.developerExperience,
            technicalPerformance: metrics.technicalPerformance,
            businessImpact: metrics.businessImpact,
          };

          snapshots.push(snapshot);

          // Small delay to avoid rate limits
          if (j < dates.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.warn(`   ⚠️  Error for ${dateStr}: ${error.message}`);
          // Continue with next date
        }
      }

      const projectData = {
        name: projectName,
        description: repo.description,
        category: repo.category,
        snapshotCount: snapshots.length,
        snapshots: snapshots,
      };

      reportData.projects.push(projectData);
      successCount++;

      console.log(
        `   ✅ Successfully collected ${snapshots.length}/${dates.length} snapshots`
      );

      // Delay between projects to avoid rate limits
      if (i < repos.length - 1) {
        console.log(`   ⏳ Waiting 2s before next project...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`   ❌ Error for ${projectName}: ${error.message}`);
      errorCount++;

      reportData.projects.push({
        name: projectName,
        description: repo.description,
        error: error.message,
        snapshots: [],
      });
    }
  }

  // Generate output files
  console.log('\n📄 Генерація output файлів...');

  // 1. Save nested JSON format
  const jsonPath = path.join(outputDir, 'metrics_report_temporal.json');
  await fs.promises.writeFile(
    jsonPath,
    JSON.stringify(reportData, null, 2),
    'utf8'
  );
  console.log(`   ✅ ${jsonPath}`);

  // 2. Save long-format CSV
  const csvPath = path.join(outputDir, 'metrics_report_temporal_long.csv');
  const csvRows = [];

  // CSV Header
  csvRows.push(
    [
      'project',
      'date',
      'dx_codeReviewDuration',
      'dx_debuggingTime',
      'dx_successfulDeploymentsRatio',
      'dx_timeToFirstCommit',
      'dx_linesChangedPerHour',
      'dx_averageCommentsPerPR',
      'dx_prIterationRate',
      'tp_buildTime',
      'tp_bundleSize',
      'tp_bundleLoadTime',
      'tp_performanceScore',
      'tp_typeScriptErrorRate',
      'tp_testCoverage',
      'bi_timeToMarket',
      'bi_featureSuccessRate',
      'bi_activeContributors',
      'bi_issueResolutionRate',
      'bi_communityGrowth',
    ].join(',')
  );

  // CSV Data
  for (const project of reportData.projects) {
    if (project.snapshots) {
      for (const snapshot of project.snapshots) {
        const row = [
          project.name,
          snapshot.collectedAt,
          snapshot.developerExperience.codeReviewDuration || '',
          snapshot.developerExperience.debuggingTime || '',
          snapshot.developerExperience.successfulDeploymentsRatio || '',
          snapshot.developerExperience.timeToFirstCommit || '',
          snapshot.developerExperience.linesChangedPerHour || '',
          snapshot.developerExperience.averageCommentsPerPR || '',
          snapshot.developerExperience.prIterationRate || '',
          snapshot.technicalPerformance.buildTime || '',
          snapshot.technicalPerformance.bundleSize || '',
          snapshot.technicalPerformance.bundleLoadTime || '',
          snapshot.technicalPerformance.performanceScore || '',
          snapshot.technicalPerformance.typeScriptErrorRate || '',
          snapshot.technicalPerformance.testCoverage || '',
          snapshot.businessImpact.timeToMarket || '',
          snapshot.businessImpact.featureSuccessRate || '',
          snapshot.businessImpact.activeContributors || '',
          snapshot.businessImpact.issueResolutionRate || '',
          snapshot.businessImpact.communityGrowth || '',
        ];
        csvRows.push(row.join(','));
      }
    }
  }

  await fs.promises.writeFile(csvPath, csvRows.join('\n'), 'utf8');
  console.log(`   ✅ ${csvPath}`);

  // 3. Summary markdown
  const mdPath = path.join(outputDir, 'temporal_collection_summary.md');
  const mdContent = `# Temporal Metrics Collection Summary

**Generated:** ${new Date().toISOString()}

## Collection Configuration

- **Start Date:** ${dates[0].toISOString().split('T')[0]}
- **End Date:** ${dates[dates.length - 1].toISOString().split('T')[0]}
- **Snapshot Count:** ${dates.length}
- **Project Count:** ${projectsData.projects.length}
- **Total Collections:** ${dates.length * projectsData.projects.length}

## Results

- **Successful Projects:** ${successCount}/${repos.length}
- **Failed Projects:** ${errorCount}/${repos.length}
- **Total Snapshots Collected:** ${reportData.projects.reduce(
    (sum, p) => sum + (p.snapshots?.length || 0),
    0
  )}

## Date Range

${dates.map((d, i) => `${i + 1}. ${d.toISOString().split('T')[0]}`).join('\n')}

## Projects

${repos
  .map((r, i) => `${i + 1}. ${r.owner}/${r.repo} - ${r.description}`)
  .join('\n')}

## Output Files

- \`metrics_report_temporal.json\` - Nested format (projects → snapshots)
- \`metrics_report_temporal_long.csv\` - Long format for pandas (1 row per snapshot)
- \`temporal_collection_summary.md\` - This file

## Next Steps

1. Run temporal analysis: \`python analysis/temporal_analysis.py\`
2. Generate visualizations
3. Update ML models with temporal features
`;

  await fs.promises.writeFile(mdPath, mdContent, 'utf8');
  console.log(`   ✅ ${mdPath}`);

  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('TEMPORAL COLLECTION ЗАВЕРШЕНО!');
  console.log('='.repeat(80));
  console.log(`\n✅ Успішно: ${successCount}/${repos.length} projects`);
  console.log(`❌ Помилки: ${errorCount}/${repos.length} projects`);
  console.log(
    `📊 Зібрано: ${reportData.projects.reduce(
      (sum, p) => sum + (p.snapshots?.length || 0),
      0
    )} snapshots`
  );
  console.log(`\n📁 Output files збережено в: ${outputDir}`);
}

// Run the script
generateTemporalReport().catch((error) => {
  console.error('\n❌ FATAL ERROR:', error);
  process.exit(1);
});
