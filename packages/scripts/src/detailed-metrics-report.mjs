/**
 * Detailed Metrics Report Generator
 *
 * Збір детальних метрик з GitHub API та генерація звіту
 *
 * Usage:
 *   node detailed-metrics-report.mjs --projects <path-to-json> --outputDir <output-directory> [--existingReport <path-to-json>]
 */

import { quickGitHubAssessment } from '@thesis/metrics-collector';
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
    existingReport: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--projects' && args[i + 1]) {
      parsed.projects = args[i + 1];
      i++;
    } else if (args[i] === '--outputDir' && args[i + 1]) {
      parsed.outputDir = args[i + 1];
      i++;
    } else if (args[i] === '--existingReport' && args[i + 1]) {
      parsed.existingReport = args[i + 1];
      i++;
    }
  }

  return parsed;
}

// Load existing report and create a map for quick lookup
async function loadExistingReport(existingReportPath, dirname) {
  if (!existingReportPath) {
    return new Map();
  }

  try {
    const reportPath = path.resolve(dirname, existingReportPath);
    console.log(`📂 Завантаження існуючого звіту з: ${reportPath}`);

    const reportContent = await fs.promises.readFile(reportPath, 'utf8');
    const reportData = JSON.parse(reportContent);

    const metricsMap = new Map();

    if (reportData.projects && Array.isArray(reportData.projects)) {
      for (const project of reportData.projects) {
        if (project.name && !project.error) {
          metricsMap.set(project.name, project);
        }
      }
      console.log(`   ✅ Завантажено ${metricsMap.size} проектів з кешу`);
    }

    return metricsMap;
  } catch (error) {
    console.warn(
      `   ⚠️  Не вдалося завантажити існуючий звіт: ${error.message}`
    );
    console.warn(`   ℹ️  Продовжуємо без кешу`);
    return new Map();
  }
}

async function generateDetailedReport() {
  console.log('📊 Генерація детального звіту по метрикам');
  console.log('==========================================');

  // Parse CLI arguments
  const cliArgs = parseArgs();

  if (!cliArgs.projects || !cliArgs.outputDir) {
    console.error("❌ Помилка: відсутні обов'язкові параметри");
    console.error(
      'Usage: node detailed-metrics-report.mjs --projects <path-to-json> --outputDir <output-directory> [--existingReport <path-to-json>]'
    );
    process.exit(1);
  }

  // Read projects from JSON file
  const projectsPath = path.resolve(__dirname, cliArgs.projects);
  const outputDir = path.resolve(__dirname, cliArgs.outputDir);

  console.log(`📁 Читаємо проекти з: ${projectsPath}`);
  console.log(`📂 Звіти будуть збережені в: ${outputDir}`);

  // Load existing report if provided
  const existingMetrics = await loadExistingReport(
    cliArgs.existingReport,
    __dirname
  );

  let projectsData;
  try {
    const projectsContent = await fs.promises.readFile(projectsPath, 'utf8');
    projectsData = JSON.parse(projectsContent);
  } catch (error) {
    console.error(`❌ Помилка читання файлу проектів: ${error.message}`);
    process.exit(1);
  }

  // Create output directory if it doesn't exist
  await fs.promises.mkdir(outputDir, { recursive: true });

  const reportData = {
    generatedAt: new Date().toISOString(),
    projects: [],
    summary: {},
    methodology: {
      dataSource: 'GitHub API',
      metricsFramework: 'Outcome-based TypeScript Code Quality Assessment',
      categories: [
        'Developer Experience',
        'Technical Performance',
        'Business Impact',
      ],
    },
  };

  // Use projects from JSON file
  const repos = projectsData.projects;

  console.log(`\n🔍 Аналізуємо ${repos.length} проектів...`);

  // Збираємо метрики для всіх проектів
  let cachedCount = 0;
  let fetchedCount = 0;

  for (let i = 0; i < repos.length; i++) {
    const repo = repos[i];
    const projectName = `${repo.owner}/${repo.repo}`;
    console.log(`\n${i + 1}/${repos.length} Аналізуємо ${projectName}...`);

    try {
      // Check if project exists in cache
      const cachedProject = existingMetrics.get(projectName);

      if (cachedProject) {
        console.log(`   💾 Використовуємо дані з кешу`);
        reportData.projects.push(cachedProject);
        cachedCount++;

        console.log(
          `   ✅ ${cachedProject.name}: ${cachedProject.overallScore}/100 (кеш)`
        );
        console.log(
          `   📊 Dev: ${calculateCategoryScore(
            cachedProject.developerExperience
          )}/100, Tech: ${calculateCategoryScore(
            cachedProject.technicalPerformance
          )}/100, Business: ${calculateCategoryScore(
            cachedProject.businessImpact
          )}/100`
        );
        continue;
      }

      // Fetch from API if not in cache
      console.log(`   🌐 Збираємо дані з GitHub API...`);
      const result = await quickGitHubAssessment(
        repo.owner,
        repo.repo,
        process.env.GITHUB_TOKEN
      );
      fetchedCount++;

      const projectData = {
        name: result.projectName,
        description: repo.description,
        overallScore: result.overallScore,
        confidence: result.confidence,
        dataSource: result.dataSource,
        processingTime: result.processingTime,
        collectedAt: result.collectedAt,

        // Детальні метрики
        developerExperience: {
          codeReviewDuration:
            result.metrics.developerExperience.codeReviewDuration,
          debuggingTime: result.metrics.developerExperience.debuggingTime,
          successfulDeploymentsRatio:
            result.metrics.developerExperience.successfulDeploymentsRatio,
          timeToFirstCommit:
            result.metrics.developerExperience.timeToFirstCommit,
          linesChangedPerHour:
            result.metrics.developerExperience.linesChangedPerHour,
          averageCommentsPerPR:
            result.metrics.developerExperience.averageCommentsPerPR,
          prIterationRate: result.metrics.developerExperience.prIterationRate,
        },

        technicalPerformance: {
          buildTime: result.metrics.technicalPerformance.buildTime,
          bundleSize: result.metrics.technicalPerformance.bundleSize,
          bundleLoadTime: result.metrics.technicalPerformance.bundleLoadTime,
          performanceScore:
            result.metrics.technicalPerformance.performanceScore,
          typeScriptErrorRate:
            result.metrics.technicalPerformance.typeScriptErrorRate,
          testCoverage: result.metrics.technicalPerformance.testCoverage,
        },

        businessImpact: {
          timeToMarket: result.metrics.businessImpact.timeToMarket,
          featureSuccessRate: result.metrics.businessImpact.featureSuccessRate,
          activeContributors: result.metrics.businessImpact.activeContributors,
          issueResolutionRate:
            result.metrics.businessImpact.issueResolutionRate,
          communityGrowth: result.metrics.businessImpact.communityGrowth,
        },

        errors: result.errors || [],
      };

      reportData.projects.push(projectData);

      console.log(
        `   ✅ ${result.projectName}: ${result.overallScore}/100 (${result.dataSource})`
      );
      console.log(
        `   📊 Dev: ${calculateCategoryScore(
          projectData.developerExperience
        )}/100, Tech: ${calculateCategoryScore(
          projectData.technicalPerformance
        )}/100, Business: ${calculateCategoryScore(
          projectData.businessImpact
        )}/100`
      );

      // Затримка для уникнення rate limiting
      if (i < repos.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`   ❌ Помилка для ${projectName}:`, error.message);
      reportData.projects.push({
        name: projectName,
        description: repo.description,
        error: error.message,
        overallScore: 0,
        confidence: 0,
      });
    }
  }

  console.log(`\n📊 Статистика збору:`);
  console.log(`   💾 З кешу: ${cachedCount} проектів`);
  console.log(`   🌐 З GitHub API: ${fetchedCount} проектів`);

  // Розраховуємо статистику
  const successfulProjects = reportData.projects.filter((p) => !p.error);
  const scores = successfulProjects.map((p) => p.overallScore);
  const devScores = successfulProjects.map((p) =>
    calculateCategoryScore(p.developerExperience)
  );
  const techScores = successfulProjects.map((p) =>
    calculateCategoryScore(p.technicalPerformance)
  );
  const businessScores = successfulProjects.map((p) =>
    calculateCategoryScore(p.businessImpact)
  );

  reportData.summary = {
    totalProjects: reportData.projects.length,
    successfulCollections: successfulProjects.length,
    failedCollections: reportData.projects.length - successfulProjects.length,

    overallScores: {
      average: average(scores),
      median: median(scores),
      min: Math.min(...scores),
      max: Math.max(...scores),
      standardDeviation: standardDeviation(scores),
    },

    developerExperience: {
      average: average(devScores),
      median: median(devScores),
      min: Math.min(...devScores),
      max: Math.max(...devScores),
    },

    technicalPerformance: {
      average: average(techScores),
      median: median(techScores),
      min: Math.min(...techScores),
      max: Math.max(...techScores),
    },

    businessImpact: {
      average: average(businessScores),
      median: median(businessScores),
      min: Math.min(...businessScores),
      max: Math.max(...businessScores),
    },

    dataSourceDistribution: {
      github: successfulProjects.filter((p) => p.dataSource === 'github')
        .length,
      mixed: successfulProjects.filter((p) => p.dataSource === 'mixed').length,
      mock: successfulProjects.filter((p) => p.dataSource === 'mock').length,
    },

    averageProcessingTime: average(
      successfulProjects.map((p) => p.processingTime)
    ),
    averageConfidence: average(successfulProjects.map((p) => p.confidence)),
  };

  // Топ проекти
  const topProjects = successfulProjects
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 5);

  reportData.insights = {
    topProjects: topProjects.map((p) => ({
      name: p.name,
      score: p.overallScore,
      strengths: identifyStrengths(p),
      confidence: p.confidence,
    })),

    averageMetrics: {
      codeReviewDuration: average(
        successfulProjects.map(
          (p) => p.developerExperience?.codeReviewDuration || 0
        )
      ),
      debuggingTime: average(
        successfulProjects.map((p) => p.developerExperience?.debuggingTime || 0)
      ),
      buildTime: average(
        successfulProjects.map((p) => p.technicalPerformance?.buildTime || 0)
      ),
      testCoverage: average(
        successfulProjects.map((p) => p.technicalPerformance?.testCoverage || 0)
      ),
      activeContributors: average(
        successfulProjects.map((p) => p.businessImpact?.activeContributors || 0)
      ),
      timeToMarket: average(
        successfulProjects.map((p) => p.businessImpact?.timeToMarket || 0)
      ),
    },
  };

  // Генеруємо звіти
  await generateJSONReport(reportData, outputDir);
  await generateMarkdownReport(reportData, outputDir);
  await generateCSVReport(reportData, outputDir);

  console.log('\n✅ Звіт згенеровано!');
  console.log('📄 Файли звіту:');
  console.log(
    `   - ${path.join(outputDir, 'metrics_report.json')} (детальні дані)`
  );
  console.log(
    `   - ${path.join(outputDir, 'metrics_report.md')} (читабельний звіт)`
  );
  console.log(
    `   - ${path.join(outputDir, 'metrics_report.csv')} (дані для Excel)`
  );
}

function calculateCategoryScore(metrics) {
  if (!metrics) return 0;

  const values = Object.values(metrics).filter(
    (v) => typeof v === 'number' && !isNaN(v)
  );
  if (values.length === 0) return 0;

  // Нормалізація різних типів метрик до 0-100 шкали
  const normalizedValues = values.map((v) => Math.min(100, Math.max(0, v)));
  return Math.round(average(normalizedValues));
}

function identifyStrengths(project) {
  const strengths = [];

  if (project.developerExperience?.codeReviewDuration < 24) {
    strengths.push('Fast code reviews');
  }
  if (project.technicalPerformance?.testCoverage > 80) {
    strengths.push('High test coverage');
  }
  if (project.businessImpact?.activeContributors > 50) {
    strengths.push('Active community');
  }
  if (project.technicalPerformance?.buildTime < 300) {
    strengths.push('Fast builds');
  }

  return strengths;
}

function average(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function standardDeviation(arr) {
  if (arr.length === 0) return 0;
  const mean = average(arr);
  const squaredDiffs = arr.map((val) => Math.pow(val - mean, 2));
  return Math.sqrt(average(squaredDiffs));
}

async function generateJSONReport(data, outputDir) {
  const content = JSON.stringify(data, null, 2);
  const filePath = path.join(outputDir, 'metrics_report.json');
  await fs.promises.writeFile(filePath, content, 'utf8');
}

async function generateMarkdownReport(data, outputDir) {
  const content = `# Звіт по метрикам TypeScript проектів

**Згенеровано:** ${new Date(data.generatedAt).toLocaleString('uk-UA')}

## Резюме

- **Загальна кількість проектів:** ${data.summary.totalProjects}
- **Успішно зібрано:** ${data.summary.successfulCollections}
- **Помилки збору:** ${data.summary.failedCollections}
- **Середній час обробки:** ${data.summary.averageProcessingTime?.toFixed(2)}s
- **Середня довіра:** ${data.summary.averageConfidence?.toFixed(1)}%

## Статистика оцінок

### Загальні оцінки
- **Середня оцінка:** ${data.summary.overallScores.average.toFixed(1)}/100
- **Медіана:** ${data.summary.overallScores.median.toFixed(1)}/100
- **Мінімум:** ${data.summary.overallScores.min}/100
- **Максимум:** ${data.summary.overallScores.max}/100
- **Стандартне відхилення:** ${data.summary.overallScores.standardDeviation.toFixed(
    1
  )}

### За категоріями

#### Developer Experience
- **Середня:** ${data.summary.developerExperience.average.toFixed(1)}/100
- **Діапазон:** ${data.summary.developerExperience.min}-${
    data.summary.developerExperience.max
  }/100

#### Technical Performance
- **Середня:** ${data.summary.technicalPerformance.average.toFixed(1)}/100
- **Діапазон:** ${data.summary.technicalPerformance.min}-${
    data.summary.technicalPerformance.max
  }/100

#### Business Impact
- **Середня:** ${data.summary.businessImpact.average.toFixed(1)}/100
- **Діапазон:** ${data.summary.businessImpact.min}-${
    data.summary.businessImpact.max
  }/100

## Топ-5 проектів

${data.insights.topProjects
  .map(
    (project, index) => `
${index + 1}. **${project.name}** - ${project.score}/100
   - Довіра: ${project.confidence}%
   - Переваги: ${project.strengths.join(', ') || 'Немає виявлених переваг'}
`
  )
  .join('')}

## Середні показники метрик

- **Час Code Review:** ${data.insights.averageMetrics.codeReviewDuration.toFixed(
    1
  )} годин
- **Час Debugging:** ${data.insights.averageMetrics.debuggingTime.toFixed(
    1
  )} годин
- **Час Build:** ${data.insights.averageMetrics.buildTime.toFixed(1)} секунд
- **Test Coverage:** ${data.insights.averageMetrics.testCoverage.toFixed(1)}%
- **Активні контрибютори:** ${data.insights.averageMetrics.activeContributors.toFixed(
    0
  )}
- **Time to Market:** ${data.insights.averageMetrics.timeToMarket.toFixed(
    1
  )} днів

## Детальні результати

| Проект | Оцінка | Developer Experience | Technical Performance | Business Impact | Довіра |
|--------|--------|---------------------|----------------------|----------------|--------|
${data.projects
  .filter((p) => !p.error)
  .map(
    (p) =>
      `| ${p.name} | ${p.overallScore}/100 | ${calculateCategoryScore(
        p.developerExperience
      )}/100 | ${calculateCategoryScore(
        p.technicalPerformance
      )}/100 | ${calculateCategoryScore(p.businessImpact)}/100 | ${
        p.confidence
      }% |`
  )
  .join('\n')}

## Розподіл джерел даних

- **GitHub API:** ${data.summary.dataSourceDistribution.github} проектів
- **Змішані дані:** ${data.summary.dataSourceDistribution.mixed} проектів
- **Mock дані:** ${data.summary.dataSourceDistribution.mock} проектів

## Методологія

**Фреймворк:** ${data.methodology.metricsFramework}
**Джерело даних:** ${data.methodology.dataSource}
**Категорії метрик:** ${data.methodology.categories.join(', ')}

---
*Згенеровано автоматично системою збору метрик @thesis/metrics-collector*
`;

  const filePath = path.join(outputDir, 'metrics_report.md');
  await fs.promises.writeFile(filePath, content, 'utf8');
}

async function generateCSVReport(data, outputDir) {
  const headers = [
    'Project',
    'Overall Score',
    'Developer Experience',
    'Technical Performance',
    'Business Impact',
    'Confidence',
    'Data Source',
    'Processing Time',
    'Code Review Duration',
    'Debugging Time',
    'Build Time',
    'Test Coverage',
    'Active Contributors',
    'Time to Market',
  ];

  const rows = data.projects
    .filter((p) => !p.error)
    .map((p) => [
      p.name,
      p.overallScore,
      calculateCategoryScore(p.developerExperience),
      calculateCategoryScore(p.technicalPerformance),
      calculateCategoryScore(p.businessImpact),
      p.confidence,
      p.dataSource,
      p.processingTime?.toFixed(2) || 0,
      p.developerExperience?.codeReviewDuration?.toFixed(1) || 0,
      p.developerExperience?.debuggingTime?.toFixed(1) || 0,
      p.technicalPerformance?.buildTime?.toFixed(1) || 0,
      p.technicalPerformance?.testCoverage?.toFixed(1) || 0,
      p.businessImpact?.activeContributors || 0,
      p.businessImpact?.timeToMarket?.toFixed(1) || 0,
    ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');
  const filePath = path.join(outputDir, 'metrics_report.csv');
  await fs.promises.writeFile(filePath, csvContent, 'utf8');
}

// Запуск генерації звіту
generateDetailedReport().catch(console.error);
