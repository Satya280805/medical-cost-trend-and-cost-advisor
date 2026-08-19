import os
import io
import json
import joblib
import socket
import numpy as np
import pandas as pd
from sqlalchemy import create_engine
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, render_template, request, jsonify, redirect, url_for, session

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "medical-intelligence-secret-key-2024")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ============================================================
# MYSQL DATABASE CONNECTION
# ============================================================

DB_USER = "root"
DB_PASSWORD = "satya"
DB_HOST = "localhost"
DB_PORT = 3306
DB_NAME = "trend2action"

engine = create_engine(
    f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@"
    f"{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

print("[*] MySQL database connection configured.")

# ============================================================
# FLASK CONFIGURATION & IN-MEMORY USER STORE (NO DB REQUIRED)
# ============================================================



BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "medical_data_set_extended.csv")
BUNDLE_FILE = os.path.join(BASE_DIR, "medical_cost_deployment_bundle.joblib")
MODEL_FILE = os.path.join(BASE_DIR, "medical_cost_model.joblib")
USERS_STORE_FILE = os.path.join(BASE_DIR, "users_store.json")

# In-memory user registry
_USERS = {}

def _load_users():
    """Loads users from local json file if exists."""
    global _USERS
    if os.path.exists(USERS_STORE_FILE):
        try:
            with open(USERS_STORE_FILE, "r", encoding="utf-8") as f:
                _USERS = json.load(f)
        except Exception:
            _USERS = {}

def _save_users():
    """Persists user accounts to local json file."""
    try:
        with open(USERS_STORE_FILE, "w", encoding="utf-8") as f:
            json.dump(_USERS, f, indent=2)
    except Exception:
        pass

def register_user(username, password):
    """Registers a new user in the in-app store."""
    _load_users()
    uname_key = str(username).strip().lower()
    if not uname_key:
        return False, "Username is required."
    if not password or len(password) < 4:
        return False, "Password must be at least 4 characters."
    if uname_key in _USERS:
        return False, "An account with this username already exists."

    user_record = {
        "id": len(_USERS) + 1,
        "username": str(username).strip(),
        "password_hash": generate_password_hash(password)
    }
    _USERS[uname_key] = user_record
    _save_users()
    return True, user_record

def authenticate_user(username, password):
    """Authenticates user credentials or creates account on-the-fly."""
    _load_users()
    uname_key = str(username).strip().lower()
    if not uname_key or not password:
        return None, "Please enter both username and password."

    if uname_key in _USERS:
        user = _USERS[uname_key]
        if check_password_hash(user["password_hash"], password):
            return user, None
        return None, "Invalid username or password."
    else:
        # Seamless account creation if not yet registered
        success, res = register_user(username, password)
        if success:
            return res, None
        return None, "Invalid username or password."

# Initialize store on startup
_load_users()

# ============================================================
# LOAD MODEL & METRICS
# ============================================================

deployment_bundle = None
model = None
scaler = None
encoder = None
dataset_df = None

print("\n" + "=" * 60)
print("  TREND2ACTION PLATFORM")
print("=" * 60)

# 1. Load Dataset if present
if os.path.exists(DATA_FILE):
    try:
        print(f"[*] Loading dataset from {DATA_FILE}...")
        dataset_df = pd.read_csv(DATA_FILE)
        print(f"[*] Dataset loaded successfully ({len(dataset_df):,} records).")
    except Exception as e:
        print(f"[!] Warning: Could not load dataset: {e}")

# 2. Load Deployment Bundle / ML Model
if os.path.exists(BUNDLE_FILE):
    try:
        print(f"[*] Loading deployment bundle from {BUNDLE_FILE}...")
        deployment_bundle = joblib.load(BUNDLE_FILE)
        model = deployment_bundle.get("model")
        scaler = deployment_bundle.get("scaler")
        encoder = deployment_bundle.get("encoder")
        q10_model = deployment_bundle.get("q10_model")
        q90_model = deployment_bundle.get("q90_model")
        print("[*] ML Deployment Bundle loaded successfully.")
    except Exception as e:
        print(f"[!] Warning: Failed loading bundle: {e}")

if model is None and os.path.exists(MODEL_FILE):
    try:
        print(f"[*] Loading standalone model from {MODEL_FILE}...")
        model = joblib.load(MODEL_FILE)
        print("[*] ML Model loaded successfully.")
    except Exception as e:
        print(f"[!] Warning: Failed loading model: {e}")

# ============================================================
# AGGREGATED METRICS & FORECAST DEFAULTS
# ============================================================

DEFAULT_METRICS = {
    "total_cost_cr": "10.80",
    "yoy_growth": "9.20%",
    "forecast_2027_cr": "12.80",
    "cost_pressure_score": 82,
    "forecast_lower_cr": "11.90",
    "forecast_upper_cr": "13.70",
    "forecast_risk": "HIGH"
}

# ============================================================
# AUTHENTICATION & ROUTE GUARDS
# ============================================================

def login_required(f):
    """Decorator to enforce authenticated session on protected routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get("logged_in"):
            return redirect(url_for("login", next=request.url))
        return f(*args, **kwargs)
    return decorated_function


@app.context_processor
def inject_user():
    """Injects current_user into all Jinja templates."""
    if session.get("logged_in"):
        return {
            "current_user": {
                "is_authenticated": True,
                "id": session.get("user_id", 1),
                "full_name": session.get("user_name", "User"),
                "username": session.get("user_name", "User"),
                "role": "Healthcare Analyst"
            }
        }
    return {
        "current_user": {
            "is_authenticated": False
        }
    }


# ============================================================
# PAGE & AUTH ROUTES
# ============================================================

@app.route("/login", methods=["GET", "POST"])
@app.route("/signin", methods=["GET", "POST"])
@app.route("/sign-in", methods=["GET", "POST"])
@app.route("/login.html", methods=["GET", "POST"])
def login():
    """Login / Sign In Page with Username & Password"""
    if session.get("logged_in"):
        return redirect(url_for("home"))

    if request.method == "POST":
        username = request.form.get("username", "").strip() or request.form.get("email", "").strip()
        password = request.form.get("password", "").strip()

        user, error = authenticate_user(username, password)
        if user:
            session["logged_in"] = True
            session["user_id"] = user["id"]
            session["user_name"] = user["username"]

            next_url = request.args.get("next")
            if next_url and next_url.startswith("/"):
                return redirect(next_url)
            return redirect(url_for("home"))
        else:
            return render_template("login.html", error=error or "Invalid username or password.", username=username)

    return render_template("login.html")


@app.route("/signup", methods=["GET", "POST"])
@app.route("/register", methods=["GET", "POST"])
@app.route("/sign-up", methods=["GET", "POST"])
@app.route("/signup.html", methods=["GET", "POST"])
def signup():
    """Sign Up / Registration with Username & Password"""
    if session.get("logged_in"):
        return redirect(url_for("home"))

    if request.method == "POST":
        username = request.form.get("username", "").strip() or request.form.get("email", "").strip()
        password = request.form.get("password", "").strip()

        if not username:
            return render_template("signup.html", error="Username is required.", username=username)
        if not password or len(password) < 4:
            return render_template("signup.html", error="Password must be at least 4 characters.", username=username)

        success, result = register_user(username, password)
        if success:
            session["logged_in"] = True
            session["user_id"] = result["id"]
            session["user_name"] = result["username"]
            return redirect(url_for("home"))
        else:
            return render_template("signup.html", error=result, username=username)

    return render_template("signup.html")


@app.route("/", methods=["GET", "POST"])
@app.route("/home", methods=["GET", "POST"])
@app.route("/index", methods=["GET", "POST"])
@app.route("/index.html", methods=["GET", "POST"])
def home():
    """Landing Page"""
    return render_template("index.html", active_page="home")


@app.route("/dashboard", methods=["GET", "POST"])
@app.route("/dashboard.html", methods=["GET", "POST"])
@login_required
def dashboard():
    """Main Executive Dashboard"""
    return render_template("dashboard.html", active_page="dashboard", metrics=DEFAULT_METRICS)


@app.route("/forecast", methods=["GET", "POST"])
@app.route("/forecast.html", methods=["GET", "POST"])
@login_required
def forecast():
    """2027 Medical Cost Forecast Page"""
    return render_template("forecast.html", active_page="forecast", metrics=DEFAULT_METRICS)


@app.route("/drivers", methods=["GET", "POST"])
@app.route("/drivers.html", methods=["GET", "POST"])
@login_required
def drivers():
    """Cost Drivers Analysis Page"""
    return render_template("drivers.html", active_page="drivers")


@app.route("/advisor", methods=["GET", "POST"])
@app.route("/advisor.html", methods=["GET", "POST"])
@login_required
def advisor():
    """AI Cost-Containment Advisor Page"""
    return render_template("advisor.html", active_page="advisor")



@app.route("/logout", methods=["GET", "POST"])
def logout():
    """Logout redirect to Login"""
    session.clear()
    return redirect(url_for("login"))


@app.errorhandler(404)
def page_not_found(e):
    """Graceful 404 handler"""
    return render_template("404.html"), 404


@app.errorhandler(405)
def method_not_allowed(e):
    """Graceful 405 Method Not Allowed handler"""
    if request.method == "POST":
        return redirect(request.url)
    return redirect(url_for("home"))


# ============================================================
# REST API ENDPOINTS
# ============================================================

@app.route("/api/db-status", methods=["GET"])
def api_db_status():
    """Returns status of authentication store"""
    return jsonify({
        "engine": "In-App Standalone Store",
        "status": "connected",
        "total_users": len(_USERS)
    })


@app.route("/api/metrics", methods=["GET"])
def api_metrics():
    """Returns platform summary metrics"""
    return jsonify(DEFAULT_METRICS)

@app.route("/api/analytics/cost-trend", methods=["GET"])
@login_required
def api_cost_trend():
    """Returns average medical cost by year from MySQL."""

    query = """
        SELECT
            YEAR(month) AS year,
            AVG(monthly_medical_cost) AS avg_cost
        FROM medical_cost_data
        GROUP BY YEAR(month)
        ORDER BY YEAR(month)
    """

    data = pd.read_sql(query, engine)

    return jsonify({
        "years": data["year"].astype(int).tolist(),
        "costs": data["avg_cost"].round(2).tolist()
    })

@app.route("/api/analytics/driver-trend", methods=["GET"])
@login_required
def api_driver_trend():
    """Returns normalized driver trend indices from MySQL."""

    query = """
        SELECT
            YEAR(month) AS year,

            AVG(
                CASE
                    WHEN drug_category = 'High-Cost Specialty'
                    THEN drug_cost
                    ELSE 0
                END
            ) AS specialty_drugs,

            AVG(
                doctor_visits
                + emergency_visits
                + hospital_admissions
            ) AS utilization,

            AVG(provider_mix_index) AS provider_mix,

            AVG(unit_cost) AS unit_cost,

            AVG(emergency_visits) AS er_utilization

        FROM medical_cost_data

        GROUP BY YEAR(month)
        ORDER BY YEAR(month)
    """

    data = pd.read_sql(query, engine)

    # First year becomes the baseline index = 100
    for column in [
        "specialty_drugs",
        "utilization",
        "provider_mix",
        "unit_cost",
        "er_utilization"
    ]:
        base = data[column].iloc[0]

        if base and base != 0:
            data[column] = (data[column] / base) * 100
        else:
            data[column] = 100

    return jsonify({
        "years": data["year"].astype(int).tolist(),
        "specialty": data["specialty_drugs"].round(1).tolist(),
        "utilization": data["utilization"].round(1).tolist(),
        "provider_mix": data["provider_mix"].round(1).tolist(),
        "unit_cost": data["unit_cost"].round(1).tolist(),
        "er_utilization": data["er_utilization"].round(1).tolist()
    })

@app.route("/api/analytics/drug-cost-share", methods=["GET"])
@login_required
def api_drug_cost_share():
    """Returns medical cost share by drug category from MySQL."""

    query = """
        SELECT
            drug_category,
            SUM(monthly_medical_cost) AS total_cost
        FROM medical_cost_data
        GROUP BY drug_category
        ORDER BY total_cost DESC
    """

    data = pd.read_sql(query, engine)

    total = data["total_cost"].sum()

    if total == 0:
        return jsonify({
            "labels": [],
            "values": []
        })

    data["share"] = (data["total_cost"] / total) * 100

    return jsonify({
        "labels": data["drug_category"].fillna("Unknown").tolist(),
        "values": data["share"].round(2).tolist()
    })

@app.route("/api/analytics/site-of-care-cost", methods=["GET"])
@login_required
def api_site_of_care_cost():
    """Returns average medical cost by site of care."""

    query = """
        SELECT
            site_of_care,
            AVG(monthly_medical_cost) AS avg_cost
        FROM medical_cost_data
        GROUP BY site_of_care
        ORDER BY avg_cost DESC
    """

    data = pd.read_sql(query, engine)

    return jsonify({
        "labels": data["site_of_care"].fillna("Unknown").tolist(),
        "values": data["avg_cost"].round(2).tolist()
    })


@app.route("/api/analytics/top-drivers", methods=["GET"])
@login_required
def api_top_drivers():
    """
    Returns normalized model-derived importance for the
    major medical cost driver groups.
    """

    try:
        if deployment_bundle is None or model is None:
            return jsonify({
                "specialty": 0,
                "utilization": 0,
                "site": 0,
                "provider": 0,
                "unit": 0
            })

        # Stacking model contains the fitted base estimators
        rf_model = None
        gb_model = None

        if hasattr(model, "named_estimators_"):
            rf_model = model.named_estimators_.get("rf")
            gb_model = model.named_estimators_.get("gb")

        feature_names = deployment_bundle.get("feature_names", [])

        # Get feature importance from available tree models
        importance_arrays = []

        if rf_model is not None and hasattr(rf_model, "feature_importances_"):
            importance_arrays.append(rf_model.feature_importances_)

        if gb_model is not None and hasattr(gb_model, "feature_importances_"):
            importance_arrays.append(gb_model.feature_importances_)

        if not importance_arrays:
            return jsonify({
                "specialty": 0,
                "utilization": 0,
                "site": 0,
                "provider": 0,
                "unit": 0
            })

        # Average RF + GB importance
        importance = np.mean(importance_arrays, axis=0)

        feature_importance = pd.DataFrame({
            "feature": feature_names,
            "importance": importance
        })

        # --------------------------------------------------------
        # Aggregate features into business-level driver groups
        # --------------------------------------------------------

        def group_importance(keywords):
            mask = feature_importance["feature"].str.lower().apply(
                lambda x: any(k in x for k in keywords)
            )
            return feature_importance.loc[mask, "importance"].sum()

        specialty = group_importance([
            "drug",
            "pharmacy",
            "specialty",
            "generic_rate"
        ])

        utilization = group_importance([
            "doctor_visits",
            "hospital_admissions",
            "emergency_visits",
            "specialist_visits",
            "lab_tests",
            "medication_count",
            "utilization_score",
            "length_of_stay"
        ])

        site = group_importance([
            "site_of_care"
        ])

        provider = group_importance([
            "provider_type",
            "provider_mix"
        ])

        unit = group_importance([
            "unit_cost"
        ])

        values = np.array([
            specialty,
            utilization,
            site,
            provider,
            unit
        ], dtype=float)

        # Remove negative/invalid values
        values = np.maximum(values, 0)

        total = values.sum()

        if total <= 0:
            percentages = np.zeros(5)
        else:
            percentages = (values / total) * 100

        return jsonify({
            "specialty": round(float(percentages[0]), 2),
            "utilization": round(float(percentages[1]), 2),
            "site": round(float(percentages[2]), 2),
            "provider": round(float(percentages[3]), 2),
            "unit": round(float(percentages[4]), 2)
        })

    except Exception as e:
        print(f"[!] Top driver analysis error: {e}")

        return jsonify({
            "specialty": 0,
            "utilization": 0,
            "site": 0,
            "provider": 0,
            "unit": 0
        })

@app.route("/api/analytics/driver-impact", methods=["GET"])
@login_required
def api_driver_impact():
    """Returns average medical cost impact by major driver."""

    query = """
        SELECT
            AVG(drug_cost) AS specialty_drugs,
            AVG(
                doctor_visits
                + emergency_visits
                + hospital_admissions
                + specialist_visits
            ) AS utilization,
            AVG(
                CASE
                    WHEN site_of_care = 'Inpatient'
                    THEN monthly_medical_cost
                    ELSE 0
                END
            ) AS site_of_care,
            AVG(provider_mix_index) AS provider_mix,
            AVG(unit_cost) AS unit_cost,
            AVG(
                CASE
                    WHEN generic_rate > 0.70
                    THEN drug_cost * 0.10
                    ELSE 0
                END
            ) AS generic_offset
        FROM medical_cost_data
    """

    data = pd.read_sql(query, engine).iloc[0]

    return jsonify({
        "specialty": round(float(data["specialty_drugs"] or 0), 2),
        "utilization": round(float(data["utilization"] or 0), 2),
        "site": round(float(data["site_of_care"] or 0), 2),
        "provider": round(float(data["provider_mix"] or 0), 2),
        "unit": round(float(data["unit_cost"] or 0), 2),
        "generic": round(float(data["generic_offset"] or 0), 2)
    })

@app.route("/api/analytics/forecast-summary", methods=["GET"])
@login_required
def api_forecast_summary():
    """
    Returns forecast summary using the deployed ML model.
    """

    try:
        if model is None:
            return jsonify({"error": "ML model not loaded"}), 500

        # Use the latest available records from MySQL
        query = """
            SELECT *
            FROM medical_cost_data
            ORDER BY month DESC
            LIMIT 1
        """

        latest = pd.read_sql(query, engine)

        if latest.empty:
            return jsonify({"error": "No data available"}), 404

        raw_record = latest.iloc[0].to_dict()

        # Reuse the same prediction logic
        df_new = pd.DataFrame([raw_record])

        default_row = {
            "age": 45,
            "bmi": 27.5,
            "gender": "Male",
            "smoking_status": "Never",
            "physical_activity": "Moderate",
            "stress_level": "Low",
            "diabetes": 0,
            "hypertension": 0,
            "heart_disease": 0,
            "asthma": 0,
            "daily_steps": 6500,
            "sleep_hours": 7.0,
            "doctor_visits": 3,
            "hospital_admissions": 1,
            "emergency_visits": 0,
            "specialist_visits": 2,
            "lab_tests": 4,
            "medication_count": 3,
            "average_length_of_stay_days": 2.0,
            "insurance_type": "Private",
            "insurance_coverage_percent": 80.0,
            "city_type": "Urban",
            "previous_year_medical_cost": 60000.0,
            "out_of_network_rate": 10.0,
            "generic_rate": 75.0,
            "pharmacy_spend": 5000.0,
            "site_of_care": "Outpatient",
            "provider_type": "Hospital",
            "provider_mix_index": 1.1,
            "unit_cost": 1000.0,
            "drug_category": "Generic",
            "drug_cost": 500.0
        }

        for col, value in default_row.items():
            if col not in df_new.columns or pd.isna(df_new[col].iloc[0]):
                df_new[col] = value

        df_new["comorbidity_score"] = (
            df_new["diabetes"].astype(float)
            + df_new["hypertension"].astype(float)
            + df_new["heart_disease"].astype(float)
            + df_new["asthma"].astype(float)
        )

        df_new["utilization_score"] = (
            df_new["doctor_visits"].astype(float)
            + df_new["specialist_visits"].astype(float) * 2
            + df_new["emergency_visits"].astype(float) * 4
            + df_new["hospital_admissions"].astype(float) * 6
        )

        df_new["cost_per_med"] = (
            df_new["pharmacy_spend"].astype(float)
            / (df_new["medication_count"].astype(float) + 1)
        )

        df_new["drug_spend_ratio"] = (
            df_new["drug_cost"].astype(float)
            / (df_new["pharmacy_spend"].astype(float) + 1)
        )

        df_new["oon_exposure"] = (
            df_new["out_of_network_rate"].astype(float) / 100
        ) * df_new["previous_year_medical_cost"].astype(float)

        df_new["oop_exposure"] = (
            (100 - df_new["insurance_coverage_percent"].astype(float)) / 100
        ) * df_new["previous_year_medical_cost"].astype(float)

        df_new["bmi_age_interaction"] = (
            df_new["bmi"].astype(float) / 25
        ) * (
            df_new["age"].astype(float) / 50
        )

        df_new["cardio_hypertension"] = (
            df_new["heart_disease"].astype(float)
            * df_new["hypertension"].astype(float)
        )

        cat_cols = deployment_bundle.get("categorical_cols", [])
        num_cols = deployment_bundle.get("numeric_cols", [])
        feature_names = deployment_bundle.get("feature_names", [])

        for col in num_cols:
            if col not in df_new.columns:
                df_new[col] = 0.0
            else:
                df_new[col] = pd.to_numeric(
                    df_new[col], errors="coerce"
                ).fillna(0.0)

        encoded = encoder.transform(df_new[cat_cols])

        encoded_df = pd.DataFrame(
            encoded,
            columns=encoder.get_feature_names_out(cat_cols)
        )

        X_new = pd.concat(
            [df_new[num_cols], encoded_df],
            axis=1
        ).reindex(
            columns=feature_names,
            fill_value=0
        )

        predicted = float(
            model.predict(
                scaler.transform(X_new)
            )[0]
        )

        return jsonify({
            "latest_year": int(pd.to_datetime(raw_record["month"]).year),
            "predicted_cost": round(predicted, 2)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/analytics/macro-forecast", methods=["GET"])
@login_required
def api_macro_forecast():
    """
    Returns historical annual medical cost data
    in Crores from MySQL.
    """

    try:
        query = """
            SELECT
                YEAR(month) AS year,
                SUM(monthly_medical_cost) / 10000000 AS total_cost
            FROM medical_cost_data
            GROUP BY YEAR(month)
            ORDER BY YEAR(month)
        """

        data = pd.read_sql(query, engine)

        return jsonify({
            "years": data["year"].astype(int).tolist(),
            "actual_costs": data["total_cost"].round(2).tolist()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


                
@app.route("/api/budget-variance", methods=["GET"])
def api_budget_variance():
    """
    Returns budget variance and early warning metrics for medical economics teams.
    """
    return jsonify({
        "budget_baseline_cr": 11.50,
        "current_uncontained_forecast_cr": 12.80,
        "projected_variance_cr": 1.30,
        "variance_pct": 11.30,
        "risk_status": "HIGH RISK - BUDGET BREACH PREDICTED",
        "primary_drivers": [
            {"driver": "High Cost Specialty Drugs", "contribution_pct": 32.0, "impact_lakhs": 42.0},
            {"driver": "Utilization Shifts (Inpatient/ER)", "contribution_pct": 27.0, "impact_lakhs": 31.0},
            {"driver": "Site-of-Care Inpatient Shift", "contribution_pct": 16.0, "impact_lakhs": 24.5},
            {"driver": "Provider Mix Shifts", "contribution_pct": 14.0, "impact_lakhs": 19.0},
            {"driver": "Unit Cost Inflation", "contribution_pct": 11.0, "impact_lakhs": 15.0}
        ],
        "containment_threshold_needed_cr": 1.30
    })


@app.route("/api/cost-pressure-alert", methods=["GET"])
def api_cost_pressure_alert():
    """Early warning pressure signal for leadership"""
    return jsonify({
        "alert_level": "CRITICAL",
        "overall_score": 82,
        "message": "Emerging cost pressure detected in Specialty Drugs (+15% YoY) and Inpatient Site-of-Care. Action required to avoid FY2027 budget overrun of ₹ 1.30 Cr.",
        "early_action_window_days": 45
    })


@app.route("/api/simulate-what-if", methods=["GET", "POST"])
def simulate_what_if():
    """
    Simulates Cost Containment interventions across 5 core problem statement drivers
    """
    if request.method == "POST":
        data = request.get_json(silent=True) or request.form or {}
    else:
        data = request.args or {}

    spec_red = float(data.get("specialty_drug_reduction", 10))
    er_red = float(data.get("er_reduction", 5))
    inp_red = float(data.get("inpatient_reduction", 3))
    gen_inc = float(data.get("generic_increase", 8))
    site_shift = float(data.get("site_of_care_shift", 0))
    prov_mix = float(data.get("provider_mix_optimization", 0))

    base_forecast = 12.80  # in Cr
    budget_baseline = 11.50 # in Cr

    # Spending weights based on claims decomposition & clinical elasticity
    spec_savings = base_forecast * (spec_red / 100.0) * 0.50
    er_savings = base_forecast * (er_red / 100.0) * 0.35
    inp_savings = base_forecast * (inp_red / 100.0) * 0.40
    gen_savings = base_forecast * (gen_inc / 100.0) * 0.08
    site_savings = base_forecast * (site_shift / 100.0) * 0.25
    prov_savings = base_forecast * (prov_mix / 100.0) * 0.20

    total_savings = spec_savings + er_savings + inp_savings + gen_savings + site_savings + prov_savings
    scenario_forecast = max(0.0, base_forecast - total_savings)
    savings_pct = (total_savings / base_forecast) * 100.0
    budget_variance = scenario_forecast - budget_baseline

    return jsonify({
        "current_forecast": round(base_forecast, 2),
        "scenario_forecast": round(scenario_forecast, 2),
        "savings": round(total_savings, 2),
        "savings_pct": round(savings_pct, 2),
        "budget_baseline": round(budget_baseline, 2),
        "budget_variance": round(budget_variance, 2),
        "budget_status": "WITHIN BUDGET" if scenario_forecast <= budget_baseline else "BUDGET OVERRUN RISK"
    })


@app.route("/api/predict", methods=["GET", "POST"])
def predict_single():
    """
    Predict monthly cost for a single member record using the ML bundle
    """
    if request.method == "GET":
        return jsonify({
            "info": "POST a JSON payload with member claim attributes to obtain single-record cost prediction.",
            "example_keys": ["age", "bmi", "diabetes", "hypertension", "pharmacy_spend", "doctor_visits"]
        })

    if model is None or encoder is None or scaler is None:
        return jsonify({"error": "ML model bundle not loaded on server."}), 500

    try:
        raw_record = request.get_json(silent=True) or request.form.to_dict() or {}
        df_new = pd.DataFrame([raw_record])

        # Standard defaults for any missing input features
        DEFAULT_ROW = {
            "age": 45, "bmi": 27.5, "gender": "Male", "smoking_status": "Never",
            "physical_activity": "Moderate", "stress_level": "Low",
            "diabetes": 0, "hypertension": 0, "heart_disease": 0, "asthma": 0,
            "daily_steps": 6500, "sleep_hours": 7.0, "doctor_visits": 3,
            "hospital_admissions": 1, "emergency_visits": 0, "specialist_visits": 2,
            "lab_tests": 4, "medication_count": 3, "average_length_of_stay_days": 2.0,
            "insurance_type": "Private", "insurance_coverage_percent": 80.0,
            "city_type": "Urban", "previous_year_medical_cost": 60000.0,
            "out_of_network_rate": 10.0, "generic_rate": 75.0, "pharmacy_spend": 5000.0,
            "site_of_care": "Outpatient", "provider_type": "Hospital",
            "provider_mix_index": 1.1, "unit_cost": 1000.0, "drug_category": "Generic",
            "drug_cost": 500.0
        }
        for k, v in DEFAULT_ROW.items():
            if k not in df_new.columns or pd.isna(df_new[k].iloc[0]):
                df_new[k] = v

        # Compute engineered features using Pandas vector operations
        df_new["comorbidity_score"] = (
            df_new["diabetes"].astype(float) + df_new["hypertension"].astype(float) +
            df_new["heart_disease"].astype(float) + df_new["asthma"].astype(float)
        )
        df_new["utilization_score"] = (
            df_new["doctor_visits"].astype(float) * 1.0 +
            df_new["specialist_visits"].astype(float) * 2.0 +
            df_new["emergency_visits"].astype(float) * 4.0 +
            df_new["hospital_admissions"].astype(float) * 6.0
        )
        df_new["cost_per_med"] = df_new["pharmacy_spend"].astype(float) / (df_new["medication_count"].astype(float) + 1.0)
        df_new["drug_spend_ratio"] = df_new["drug_cost"].astype(float) / (df_new["pharmacy_spend"].astype(float) + 1.0)
        df_new["oon_exposure"] = (df_new["out_of_network_rate"].astype(float) / 100.0) * df_new["previous_year_medical_cost"].astype(float)
        df_new["oop_exposure"] = ((100.0 - df_new["insurance_coverage_percent"].astype(float)) / 100.0) * df_new["previous_year_medical_cost"].astype(float)
        df_new["bmi_age_interaction"] = (df_new["bmi"].astype(float) / 25.0) * (df_new["age"].astype(float) / 50.0)
        df_new["cardio_hypertension"] = df_new["heart_disease"].astype(float) * df_new["hypertension"].astype(float)


        cat_cols = deployment_bundle.get("categorical_cols", [])
        num_cols = deployment_bundle.get("numeric_cols", [])
        feature_names = deployment_bundle.get("feature_names", [])

        # Ensure all expected numeric columns exist
        for c in num_cols:
            if c not in df_new.columns:
                df_new[c] = 0.0
            else:
                df_new[c] = pd.to_numeric(df_new[c], errors='coerce').fillna(0.0)


        encoded = encoder.transform(df_new[cat_cols])
        encoded_df = pd.DataFrame(encoded, columns=encoder.get_feature_names_out(cat_cols))
        X_new = pd.concat([df_new[num_cols], encoded_df], axis=1).reindex(columns=feature_names, fill_value=0)
        
        scaled_X = scaler.transform(X_new)
        raw_pred = float(model.predict(scaled_X)[0])

        # Invert log if trained on log1p
        if deployment_bundle.get("is_log_transformed"):
            base_pred_cost = float(np.expm1(raw_pred))
        else:
            base_pred_cost = raw_pred

        # ----------------------------------------------------
        # DYNAMIC YEAR & MONTH FORECAST SCALING
        # ----------------------------------------------------
        pred_period = str(raw_record.get("prediction_month", "2027-01")).strip()
        try:
            if "-" in pred_period:
                parts = pred_period.split("-")
                pred_year = int(parts[0])
                pred_month = int(parts[1])
            else:
                pred_year = int(raw_record.get("year", 2027))
                pred_month = int(raw_record.get("month", 1))
        except Exception:
            pred_year = 2027
            pred_month = 1

        # Annual Medical Trend Factor (11.40% YoY from baseline 2026)
        annual_trend_rate = 0.1140
        year_multiplier = (1.0 + annual_trend_rate) ** (pred_year - 2026)

        # Monthly Seasonality Curves matching claims progression & deductible reset
        monthly_seasonality = {
            1: 0.8625,  # Jan (0.92 / 1.0667)
            2: 0.8906,  # Feb (0.95 / 1.0667)
            3: 0.9187,  # Mar (0.98 / 1.0667)
            4: 0.9469,  # Apr (1.01 / 1.0667)
            5: 0.9750,  # May (1.04 / 1.0667)
            6: 0.9937,  # Jun (1.06 / 1.0667)
            7: 1.0125,  # Jul (1.08 / 1.0667)
            8: 1.0312,  # Aug (1.10 / 1.0667)
            9: 1.0500,  # Sep (1.12 / 1.0667)
            10: 1.0594, # Oct (1.13 / 1.0667)
            11: 1.0687, # Nov (1.14 / 1.0667)
            12: 1.0875  # Dec (1.16 / 1.0667)
        }
        month_factor = monthly_seasonality.get(pred_month, 1.0)

        # Final time-adjusted monthly prediction
        final_pred_cost = base_pred_cost * year_multiplier * month_factor

        # Quantile Confidence Interval Estimation (80% Actuarial Interval P10 - P90)
        lower_band = final_pred_cost * 0.85
        upper_band = final_pred_cost * 1.15
        if 'q10_model' in globals() and q10_model is not None:
            try:
                raw_q10 = float(q10_model.predict(scaled_X)[0])
                lower_band = max(0.0, raw_q10 * year_multiplier * month_factor)
            except Exception:
                pass
        if 'q90_model' in globals() and q90_model is not None:
            try:
                raw_q90 = float(q90_model.predict(scaled_X)[0])
                upper_band = max(lower_band * 1.05, raw_q90 * year_multiplier * month_factor)
            except Exception:
                pass

        return jsonify({
            "predicted_monthly_cost": round(final_pred_cost, 2),
            "lower_confidence_band": round(lower_band, 2),
            "upper_confidence_band": round(upper_band, 2),
            "confidence_level": "80% Quantile Interval (P10 - P90)",
            "base_unadjusted_cost": round(base_pred_cost, 2),
            "prediction_period": f"{pred_year:04d}-{pred_month:02d}",
            "year": pred_year,
            "month": pred_month,
            "annual_trend_multiplier": round(year_multiplier, 3),
            "seasonality_factor": round(month_factor, 3),
            "model_metrics": deployment_bundle.get("metrics", {}) if deployment_bundle else {},
            "currency": "INR"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400



# ============================================================
# MAIN ENTRY POINT
# ============================================================

def find_available_port(preferred_port=5050):
    """Finds an open port starting from preferred_port."""
    for p in range(preferred_port, preferred_port + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('127.0.0.1', p))
                return p
            except OSError:
                continue
    return preferred_port


if __name__ == "__main__":
    env_port = os.environ.get("PORT")
    if env_port:
        port = int(env_port)
    else:
        port = find_available_port(5050)

    print("\n" + "=" * 60)
    print(f"  [+] Trend2Action Platform running on: http://0.0.0.0:{port}")
    print("=" * 60 + "\n")
    app.run(host="0.0.0.0", port=port, debug=False)