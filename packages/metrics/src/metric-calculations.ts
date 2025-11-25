/* eslint-disable no-case-declarations */
/**
 * Metric Calculation Functions
 *
 * Математичні функції для роботи з метриками
 */

import { MetricValue, DataSource, MetricID } from './common-types';

/**
 * Перевіряє чи є значення валідним
 */
export function isValidValue(value: MetricValue): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Нормалізує значення до діапазону 0-100
 */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

/**
 * Розраховує процентиль
 */
export function percentile(values: number[], p: number): number {
  const sorted = values.slice().sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (upper >= sorted.length) return sorted[sorted.length - 1];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Генерує унікальний ID для метрики
 */
export function generateMetricId(source: DataSource, name: string): MetricID {
  return `${source}_${name}_${Date.now()}`;
}

/**
 * Розраховує середнє значення
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Розраховує медіану
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Розраховує стандартне відхилення
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = calculateAverage(values);
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const variance = calculateAverage(squaredDiffs);
  return Math.sqrt(variance);
}

/**
 * Знаходить викиди в даних (outliers)
 */
export function findOutliers(
  values: number[],
  threshold: number = 2
): {
  outliers: number[];
  cleanedValues: number[];
} {
  const mean = calculateAverage(values);
  const stdDev = calculateStandardDeviation(values);
  const outliers: number[] = [];
  const cleanedValues: number[] = [];

  values.forEach((value) => {
    const zScore = Math.abs((value - mean) / stdDev);
    if (zScore > threshold) {
      outliers.push(value);
    } else {
      cleanedValues.push(value);
    }
  });

  return { outliers, cleanedValues };
}

/**
 * Інтерполює відсутні значення в часовому ряду
 */
export function interpolateMissingValues(
  values: (number | undefined)[],
  method: 'linear' | 'forward' | 'backward' = 'linear'
): number[] {
  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    if (values[i] !== undefined) {
      result[i] = values[i]!;
    } else {
      switch (method) {
        case 'forward':
          result[i] = i > 0 ? result[i - 1] : 0;
          break;
        case 'backward':
          // Знаходимо наступне валідне значення
          let nextValid = 0;
          for (let j = i + 1; j < values.length; j++) {
            if (values[j] !== undefined) {
              nextValid = values[j]!;
              break;
            }
          }
          result[i] = nextValid;
          break;
        case 'linear':
        default:
          // Лінійна інтерполяція
          let prevIndex = i - 1;
          let nextIndex = i + 1;

          // Знаходимо попереднє валідне значення
          while (prevIndex >= 0 && values[prevIndex] === undefined) {
            prevIndex--;
          }

          // Знаходимо наступне валідне значення
          while (nextIndex < values.length && values[nextIndex] === undefined) {
            nextIndex++;
          }

          if (prevIndex >= 0 && nextIndex < values.length) {
            const prevValue = values[prevIndex]!;
            const nextValue = values[nextIndex]!;
            const ratio = (i - prevIndex) / (nextIndex - prevIndex);
            result[i] = prevValue + (nextValue - prevValue) * ratio;
          } else if (prevIndex >= 0) {
            result[i] = values[prevIndex]!;
          } else if (nextIndex < values.length) {
            result[i] = values[nextIndex]!;
          } else {
            result[i] = 0;
          }
          break;
      }
    }
  }

  return result;
}

/**
 * Згладжує дані використовуючи ковзне середнє
 */
export function smoothData(values: number[], windowSize: number = 3): number[] {
  if (windowSize <= 1) return values;

  const smoothed: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(values.length - 1, i + halfWindow);
    const window = values.slice(start, end + 1);
    smoothed[i] = calculateAverage(window);
  }

  return smoothed;
}

/**
 * Розраховує кореляцію між двома масивами значень
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const meanX = calculateAverage(x);
  const meanY = calculateAverage(y);

  let numerator = 0;
  let sumXSquared = 0;
  let sumYSquared = 0;

  for (let i = 0; i < x.length; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;

    numerator += diffX * diffY;
    sumXSquared += diffX * diffX;
    sumYSquared += diffY * diffY;
  }

  const denominator = Math.sqrt(sumXSquared * sumYSquared);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Розраховує тренд в даних (slope лінійної регресії)
 */
export function calculateTrend(values: number[]): {
  slope: number;
  intercept: number;
  rSquared: number;
} {
  if (values.length < 2) return { slope: 0, intercept: 0, rSquared: 0 };

  const n = values.length;
  const indices = Array.from({ length: n }, (_, i) => i);

  const meanX = calculateAverage(indices);
  const meanY = calculateAverage(values);

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const diffX = indices[i] - meanX;
    const diffY = values[i] - meanY;
    numerator += diffX * diffY;
    denominator += diffX * diffX;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;

  // Розраховуємо R-squared
  let totalSumSquares = 0;
  let residualSumSquares = 0;

  for (let i = 0; i < n; i++) {
    const predicted = slope * indices[i] + intercept;
    const actualDiff = values[i] - meanY;
    const residual = values[i] - predicted;

    totalSumSquares += actualDiff * actualDiff;
    residualSumSquares += residual * residual;
  }

  const rSquared =
    totalSumSquares === 0 ? 0 : 1 - residualSumSquares / totalSumSquares;

  return { slope, intercept, rSquared };
}

/**
 * Конвертує одиниці вимірювання
 */
export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string
): number {
  const conversionTable: Record<string, Record<string, number>> = {
    time: {
      ms: 1,
      seconds: 1000,
      minutes: 60000,
      hours: 3600000,
      days: 86400000,
    },
    size: {
      bytes: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
    },
    percentage: {
      ratio: 1,
      percent: 100,
    },
  };

  // Знаходимо категорію одиниць
  let category = '';
  for (const [cat, units] of Object.entries(conversionTable)) {
    if (fromUnit in units && toUnit in units) {
      category = cat;
      break;
    }
  }

  if (!category) return value; // Якщо конвертація неможлива

  const fromMultiplier = conversionTable[category][fromUnit];
  const toMultiplier = conversionTable[category][toUnit];

  return (value * fromMultiplier) / toMultiplier;
}

/**
 * Валідує діапазон значень
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
  inclusive: boolean = true
): boolean {
  if (inclusive) {
    return value >= min && value <= max;
  } else {
    return value > min && value < max;
  }
}

/**
 * Форматує значення для відображення
 */
export function formatValue(
  value: number,
  unit: string,
  decimals: number = 2
): string {
  const formatted = value.toFixed(decimals);
  return `${formatted} ${unit}`;
}
