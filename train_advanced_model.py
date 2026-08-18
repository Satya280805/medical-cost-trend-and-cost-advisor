import os
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import (
    StackingRegressor,
    RandomForestRegressor,
    GradientBoostingRegressor,
    HistGradientBoostingRegressor
)
from sklearn.linear_model import Ridge
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

print("=" * 60)
print("TRAINING PRODUCTION HEALTHCARE STACKING ML PIPELINE")
print("=" * 60)

DATA_PATH = "medical_data_set_extended.csv"
if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(f"{DATA_PATH} not found.")

print(f"[*] Loading dataset: {DATA_PATH}...")
df = pd.read_csv(DATA_PATH)
print(f"[*] Loaded {len(df):,} records.")

# 1. Clean Category Inconsistencies
category_fixes = {
    "insurance_type": {"private": "Private"},
    "site_of_care": {"in patient": "Inpatient"},
    "provider_type": {"hospital": "Hospital"},
    "drug_category": {"generic": "Generic", "High Cost Specialty": "High-Cost Specialty"},
}
for col, mapping in category_fixes.items():
    if col in df.columns:
        df[col] = df[col].replace(mapping)

# 2. Financial Outlier Treatment (99.5th percentile cap)
cap = df["monthly_medical_cost"].quantile(0.995)
df["monthly_medical_cost"] = np.where(df["monthly_medical_cost"] > cap, cap, df["monthly_medical_cost"])

# 3. Temporal & Rolling Feature Engineering
df["month"] = pd.to_datetime(df["month"])
df = df.sort_values(["member_id", "month"]).reset_index(drop=True)
df["year"] = df["month"].dt.year
df["month_num"] = df["month"].dt.month
df["quarter"] = df["month"].dt.quarter
start = df["month"].min()
df["time_index"] = (df["year"] - start.year) * 12 + (df["month_num"] - start.month)

monthly_prior = df["previous_year_medical_cost"] / 12.0
df["prev_month_cost"] = df.groupby("member_id")["monthly_medical_cost"].shift(1).fillna(monthly_prior)
df["cost_3m_avg"] = (
    df.groupby("member_id")["monthly_medical_cost"]
    .shift(1).rolling(3, min_periods=1).mean()
    .reset_index(level=0, drop=True)
).fillna(monthly_prior)

# 4. Clinical & Actuarial Domain Features
df["comorbidity_score"] = (
    df["diabetes"].astype(float) + df["hypertension"].astype(float) +
    df["heart_disease"].astype(float) + df["asthma"].astype(float)
)
df["cardio_metabolic_risk"] = (
    df["diabetes"].astype(float) * df["hypertension"].astype(float) * (df["bmi"].astype(float) / 25.0)
)
df["utilization_score"] = (
    df["doctor_visits"].astype(float) * 1.0 +
    df["specialist_visits"].astype(float) * 2.0 +
    df["emergency_visits"].astype(float) * 4.0 +
    df["hospital_admissions"].astype(float) * 6.0
)
df["cost_per_med"] = df["pharmacy_spend"].astype(float) / (df["medication_count"].astype(float) + 1.0)
df["drug_spend_ratio"] = df["drug_cost"].astype(float) / (df["pharmacy_spend"].astype(float) + 1.0)
df["rx_burden_ratio"] = df["pharmacy_spend"].astype(float) / (df["previous_year_medical_cost"].astype(float) + 1.0)
df["oon_exposure"] = (df["out_of_network_rate"].astype(float) / 100.0) * df["previous_year_medical_cost"].astype(float)
df["oop_exposure"] = ((100.0 - df["insurance_coverage_percent"].astype(float)) / 100.0) * df["previous_year_medical_cost"].astype(float)
df["inpatient_intensity"] = df["average_length_of_stay_days"].astype(float) * df["unit_cost"].astype(float)
df["provider_risk_index"] = df["provider_mix_index"].astype(float) * (df["out_of_network_rate"].astype(float) / 10.0)
df["active_lifestyle_score"] = (df["daily_steps"].astype(float) / 5000.0) * (df["sleep_hours"].astype(float) / 7.0)

TARGET = "monthly_medical_cost"
categorical_cols = [
    "gender", "smoking_status", "physical_activity", "stress_level",
    "insurance_type", "city_type", "site_of_care", "provider_type", "drug_category"
]
drop_cols = ["record_id", "member_id", "month", TARGET]
if "Unnamed: 0" in df.columns:
    drop_cols.append("Unnamed: 0")

numeric_cols = [c for c in df.columns if c not in drop_cols + categorical_cols]

print(f"[*] Total numeric features: {len(numeric_cols)}, categorical: {len(categorical_cols)}.")

# Encode categoricals
encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False, drop="first")
encoded = encoder.fit_transform(df[categorical_cols])
cat_feature_names = encoder.get_feature_names_out(categorical_cols).tolist()
encoded_df = pd.DataFrame(encoded, columns=cat_feature_names, index=df.index)

X = pd.concat([df[numeric_cols], encoded_df], axis=1)
y = df[TARGET]

# Out-of-Time Train/Test Split (last 3 months as holdout)
cutoff = df["time_index"].max() - 3
X_train, X_test = X[df["time_index"] < cutoff], X[df["time_index"] >= cutoff]
y_train, y_test = y[df["time_index"] < cutoff], y[df["time_index"] >= cutoff]

print(f"[*] Train set: {len(X_train):,} rows, Holdout Test set: {len(X_test):,} rows.")

# Standard Scaling
scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s = scaler.transform(X_test)

# Base Estimators
rf = RandomForestRegressor(
    n_estimators=300,
    max_depth=13,
    min_samples_leaf=3,
    random_state=42,
    n_jobs=-1
)

gb = GradientBoostingRegressor(
    n_estimators=300,
    max_depth=4,
    learning_rate=0.05,
    min_samples_leaf=4,
    subsample=0.85,
    random_state=42
)

hist_gb = HistGradientBoostingRegressor(
    max_iter=300,
    learning_rate=0.05,
    max_leaf_nodes=31,
    min_samples_leaf=8,
    random_state=42
)

stacking_model = StackingRegressor(
    estimators=[
        ("rf", rf),
        ("gb", gb),
        ("hist_gb", hist_gb)
    ],
    final_estimator=Ridge(alpha=1.0),
    cv=3,
    n_jobs=-1
)

print("[*] Training Stacking Regressor (RF + GBM + HistGB with Ridge Meta-Learner)...")
stacking_model.fit(X_train_s, y_train)

print("[*] Training Quantile Confidence Estimators (10th and 90th percentiles)...")
q10_model = HistGradientBoostingRegressor(
    loss="quantile",
    quantile=0.10,
    max_iter=200,
    learning_rate=0.06,
    random_state=42
)
q10_model.fit(X_train_s, y_train)

q90_model = HistGradientBoostingRegressor(
    loss="quantile",
    quantile=0.90,
    max_iter=200,
    learning_rate=0.06,
    random_state=42
)
q90_model.fit(X_train_s, y_train)

# Evaluation
y_pred = stacking_model.predict(X_test_s)
q10_pred = q10_model.predict(X_test_s)
q90_pred = q90_model.predict(X_test_s)

r2 = r2_score(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
mae = mean_absolute_error(y_test, y_pred)
mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100.0
ci_coverage = np.mean((y_test >= q10_pred) & (y_test <= q90_pred)) * 100.0

print("\n" + "=" * 55)
print("            PRODUCTION MODEL METRICS (HOLDOUT)      ")
print("=" * 55)
print(f"  R-Squared (R2):                {r2:.4f} ({r2*100:.2f}%)")
print(f"  Root Mean Squared Error (RMSE): INR {rmse:,.2f}")
print(f"  Mean Absolute Error (MAE):      INR {mae:,.2f}")
print(f"  Mean Absolute % Error (MAPE):   {mape:.2f}%")
print(f"  80% CI Empirical Coverage:      {ci_coverage:.2f}%")
print("=" * 55)

# Compute Feature Importances
rf.fit(X_train_s, y_train)
importances = rf.feature_importances_
fi_df = pd.DataFrame({
    "feature": X.columns,
    "importance": importances
}).sort_values(by="importance", ascending=False)

top_features = fi_df.head(15).to_dict(orient="records")
print("\n[*] Top 10 Clinical & Actuarial Feature Importances:")
for idx, row in fi_df.head(10).iterrows():
    print(f"    - {row['feature']:<30}: {row['importance']:.4f}")

# Package Deployment Bundle
bundle = {
    "model": stacking_model,
    "q10_model": q10_model,
    "q90_model": q90_model,
    "model_name": "Production Healthcare Stacking Ensemble (RF + GBM + HistGB)",
    "scaler": scaler,
    "encoder": encoder,
    "numeric_cols": numeric_cols,
    "categorical_cols": categorical_cols,
    "feature_names": X.columns.tolist(),
    "is_log_transformed": False,
    "metrics": {
        "R2": round(float(r2), 4),
        "RMSE": round(float(rmse), 2),
        "MAE": round(float(mae), 2),
        "MAPE": round(float(mape), 2),
        "CI_Coverage": round(float(ci_coverage), 2)
    },
    "top_features": top_features
}

output_bundle_path = "medical_cost_deployment_bundle.joblib"
output_model_path = "medical_cost_model.joblib"

print(f"\n[*] Serializing upgraded deployment bundle to {output_bundle_path}...")
joblib.dump(bundle, output_bundle_path)
joblib.dump(stacking_model, output_model_path)
print("[OK] Production ML Bundle saved successfully!")
