#!/usr/bin/env python3
"""
ML Prediction Script
Скрипт для передбачення якості проекту на основі ML моделей

Приймає сирі метрики у форматі JSON, виконує feature engineering
та повертає передбачення з натренованих моделей.

Використання:
    python predict.py '{"dx_codeReviewDuration": 50, "tp_testCoverage": 80, ...}'

    # What-if аналіз:
    python predict.py '{"metrics": {...}, "whatif": {"dx_codeReviewDuration": 24}}'

Магістерська робота: Outcome-based оцінка якості TypeScript коду
Автор: Слабенко Костянтин Олегович
Група: АС-202
Одеський політехнічний національний університет
"""

import sys
import json
import warnings
from pathlib import Path
import numpy as np
import joblib

warnings.filterwarnings("ignore")

# Paths
SCRIPT_DIR = Path(__file__).parent
MODELS_DIR = SCRIPT_DIR / ".." / "reports" / "ml" / "saved_models"


def load_models():
    """Load all saved models and metadata."""
    try:
        # Load metadata
        with open(MODELS_DIR / "metadata.json", "r") as f:
            metadata = json.load(f)

        # Load feature list
        with open(MODELS_DIR / "feature_list.json", "r") as f:
            feature_list = json.load(f)

        # Load models and scalers
        models = {}
        scalers = {}

        for target in metadata["targets"]:
            model_path = MODELS_DIR / f"{target}_model.joblib"
            models[target] = joblib.load(model_path)

            if metadata["models"][target]["needs_scaling"]:
                scaler_path = MODELS_DIR / f"{target}_scaler.joblib"
                scalers[target] = joblib.load(scaler_path)
            else:
                scalers[target] = None

        return models, scalers, feature_list, metadata

    except Exception as e:
        return None, None, None, {"error": f"Failed to load models: {str(e)}"}


def engineer_features(raw_metrics):
    """
    Engineer features from raw metrics to match training data format.

    Raw metrics format:
    {
        "developerExperience": {
            "codeReviewDuration": 50,
            "debuggingTime": 24,
            ...
        },
        "technicalPerformance": {
            "testCoverage": 80,
            ...
        },
        "businessImpact": {
            "timeToMarket": 14,
            ...
        }
    }
    """
    features = {}

    # Extract base metrics with prefixes
    dx = raw_metrics.get("developerExperience", {})
    tp = raw_metrics.get("technicalPerformance", {})
    bi = raw_metrics.get("businessImpact", {})

    # Developer Experience metrics
    features["dx_codeReviewDuration"] = dx.get("codeReviewDuration", 0)
    features["dx_debuggingTime"] = dx.get("debuggingTime", 0)
    features["dx_buildTime"] = dx.get("buildTime", 0)
    features["dx_successfulDeploymentsRatio"] = dx.get("successfulDeploymentsRatio", 0)
    features["dx_timeToFirstCommit"] = dx.get("timeToFirstCommit", 0)
    features["dx_averageCommentsPerPR"] = dx.get("averageCommentsPerPR", 0)
    features["dx_prIterationRate"] = dx.get("prIterationRate", 0)

    # Technical Performance metrics
    features["tp_buildTime"] = tp.get("buildTime", 0)
    features["tp_testCoverage"] = tp.get("testCoverage", 0)
    features["tp_typeScriptErrorRate"] = tp.get("typeScriptErrorRate", 0)
    features["tp_bundleSize"] = tp.get("bundleSize", 0)
    features["tp_bundleLoadTime"] = tp.get("bundleLoadTime", 0)
    features["tp_performanceScore"] = tp.get("performanceScore", 0)

    # Business Impact metrics
    features["bi_featureSuccessRate"] = bi.get("featureSuccessRate", 0)
    features["bi_activeContributors"] = bi.get("activeContributors", 0)
    features["bi_issueResolutionRate"] = bi.get("issueResolutionRate", 0)
    features["bi_deploymentFrequency"] = bi.get("deploymentFrequency", 0)
    features["bi_changeFailureRate"] = bi.get("changeFailureRate", 0)

    # Category averages
    dx_values = [
        v
        for k, v in features.items()
        if k.startswith("dx_") and isinstance(v, (int, float))
    ]
    tp_values = [
        v
        for k, v in features.items()
        if k.startswith("tp_") and isinstance(v, (int, float))
    ]
    bi_values = [
        v
        for k, v in features.items()
        if k.startswith("bi_") and isinstance(v, (int, float))
    ]

    features["avg_dx"] = np.mean(dx_values) if dx_values else 0
    features["avg_tp"] = np.mean(tp_values) if tp_values else 0
    features["avg_bi"] = np.mean(bi_values) if bi_values else 0

    # Interaction features (based on research findings)
    features["dx_tp_interaction"] = features["avg_dx"] * features["avg_tp"]
    features["tp_bi_interaction"] = features["avg_tp"] * features["avg_bi"]
    features["dx_bi_interaction"] = features["avg_dx"] * features["avg_bi"]

    # Polynomial features
    features["dx_codeReviewDuration_squared"] = features["dx_codeReviewDuration"] ** 2
    features["tp_testCoverage_squared"] = features["tp_testCoverage"] ** 2

    # Log transformations (for skewed metrics)
    features["dx_codeReviewDuration_log"] = np.log1p(features["dx_codeReviewDuration"])
    features["tp_bundleSize_log"] = np.log1p(features["tp_bundleSize"])

    # Ratio features
    if features["tp_bundleSize"] > 0:
        features["tp_efficiency_ratio"] = (
            features["tp_testCoverage"] / features["tp_bundleSize"]
        )
    else:
        features["tp_efficiency_ratio"] = 0

    if features["dx_codeReviewDuration"] > 0:
        features["dx_review_efficiency"] = (
            features["dx_averageCommentsPerPR"] / features["dx_codeReviewDuration"]
        )
    else:
        features["dx_review_efficiency"] = 0

    return features


def predict(metrics, models, scalers, feature_list):
    """Make predictions using loaded models."""
    # Engineer features
    all_features = engineer_features(metrics)

    # Create feature vector in correct order
    feature_vector = []
    missing_features = []

    for feat in feature_list:
        if feat in all_features:
            feature_vector.append(all_features[feat])
        else:
            # Try without prefix
            base_name = feat.split("_", 1)[-1] if "_" in feat else feat
            if base_name in all_features:
                feature_vector.append(all_features[base_name])
            else:
                feature_vector.append(0)
                missing_features.append(feat)

    X = np.array([feature_vector])

    # Make predictions
    predictions = {}

    for target in ["overallScore", "timeToMarket", "communityGrowth"]:
        model = models[target]
        scaler = scalers[target]

        if scaler is not None:
            X_scaled = scaler.transform(X)
            pred = model.predict(X_scaled)[0]
        else:
            pred = model.predict(X)[0]

        predictions[target] = round(float(pred), 2)

    return predictions, missing_features


def what_if_analysis(metrics, whatif_changes, models, scalers, feature_list):
    """
    Perform what-if analysis by comparing predictions with and without changes.

    whatif_changes: dict of feature changes, e.g.:
        {"dx_codeReviewDuration": 24, "tp_testCoverage": 90}
    """
    # Get baseline predictions
    baseline_preds, _ = predict(metrics, models, scalers, feature_list)

    # Apply what-if changes to metrics
    modified_metrics = json.loads(json.dumps(metrics))  # Deep copy

    for key, value in whatif_changes.items():
        # Parse key like "dx_codeReviewDuration" -> developerExperience.codeReviewDuration
        if key.startswith("dx_"):
            metric_name = key[3:]  # Remove "dx_"
            if "developerExperience" not in modified_metrics:
                modified_metrics["developerExperience"] = {}
            modified_metrics["developerExperience"][metric_name] = value
        elif key.startswith("tp_"):
            metric_name = key[3:]
            if "technicalPerformance" not in modified_metrics:
                modified_metrics["technicalPerformance"] = {}
            modified_metrics["technicalPerformance"][metric_name] = value
        elif key.startswith("bi_"):
            metric_name = key[3:]
            if "businessImpact" not in modified_metrics:
                modified_metrics["businessImpact"] = {}
            modified_metrics["businessImpact"][metric_name] = value

    # Get modified predictions
    modified_preds, _ = predict(modified_metrics, models, scalers, feature_list)

    # Calculate differences
    analysis = {}
    for target in baseline_preds:
        baseline = baseline_preds[target]
        modified = modified_preds[target]
        diff = modified - baseline

        analysis[target] = {
            "baseline": baseline,
            "predicted": modified,
            "change": round(diff, 2),
            "changePercent": round((diff / baseline * 100) if baseline != 0 else 0, 2),
        }

    return analysis


def main():
    if len(sys.argv) < 2:
        print(
            json.dumps(
                {
                    "error": "No input provided",
                    "usage": "python predict.py '{\"developerExperience\": {...}, ...}'",
                }
            )
        )
        sys.exit(1)

    # Parse input
    try:
        input_data = json.loads(sys.argv[1])
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON: {str(e)}"}))
        sys.exit(1)

    # Load models
    models, scalers, feature_list, metadata = load_models()

    if models is None:
        print(json.dumps(metadata))  # Contains error message
        sys.exit(1)

    # Check if this is a what-if analysis request
    if "whatif" in input_data:
        metrics = input_data.get("metrics", {})
        whatif_changes = input_data.get("whatif", {})

        analysis = what_if_analysis(
            metrics, whatif_changes, models, scalers, feature_list
        )

        result = {
            "type": "whatif",
            "changes": whatif_changes,
            "analysis": analysis,
        }
    else:
        # Regular prediction
        predictions, missing = predict(input_data, models, scalers, feature_list)

        result = {
            "type": "prediction",
            "predictions": predictions,
        }

        if missing:
            result["warnings"] = {
                "missingFeatures": missing[:5],  # Show first 5
                "totalMissing": len(missing),
            }

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
