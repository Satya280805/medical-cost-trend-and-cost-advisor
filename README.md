# 🏥 Medical Cost Intelligence Platform

A full-stack predictive healthcare intelligence and cost containment application built with **Flask**, **Chart.js**, and an ensemble **Stacking Regressor (Random Forest + Gradient Boosting)** trained on clinical claims data.

---

## 🌟 Key Features

1. **Landing Page (`/`)**:
   - Executive intro, platform feature highlights, and direct entry CTA.
2. **Executive Dashboard (`/dashboard`)**:
   - High-level cost KPIs (Total Cost, YoY Growth, 2027 Projections, Cost Pressure Score).
   - Medical cost trend chart (2023–2027) & Cost driver contribution donut chart.
   - 4-pillar cost pressure breakdown & strategic recommendations.
3. **2027 Medical Cost Forecast (`/forecast`)**:
   - 12-month financial breakdown table (Jan–Dec) with lower and upper confidence bounds.
   - Forecast trend visualization with 95% Confidence Interval band.
4. **Cost Drivers Analysis (`/drivers`)**:
   - Contribution ranking (Specialty Drug Share, Utilization, Provider Mix, Unit Cost, ER).
   - Longitudinal driver trends and estimated financial impact (+/- ₹ Lakhs).
5. **Cost-Containment Advisor (`/advisor`)**:
   - AI-prioritized containment interventions (High, Medium, Low priority).
   - Interactive filtering by priority level and estimated percentage impact.
6. **What-If Scenario Simulation (`/what-if`)**:
   - Real-time simulation of policy changes (Specialty Drug reduction, ER reduction, Inpatient reduction, Generic substitution).
   - Dynamic cost comparison bar chart and projected savings calculation in ₹ Cr.

---

## 🚀 Getting Started

### 1. Install Dependencies & Run Application

In PowerShell / Terminal:

```bash
# Create virtual environment (optional if not present)
python -m venv myev

# Install dependencies
.\myev\Scripts\pip.exe install -r requirements.txt

# (Optional) Set MySQL Environment Variables if customized:
$env:MYSQL_HOST="localhost"
$env:MYSQL_PORT="3306"
$env:MYSQL_USER="root"
$env:MYSQL_PASSWORD="your_mysql_password"
$env:MYSQL_DB="medical_db"

# Run Flask app
.\myev\Scripts\python.exe app.py
```

Open your browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🔐 Authentication & MySQL Database

- **Sign In (`/signin` or `/login`)**: Log in with existing credentials or the default demo admin (`admin@medical.com` / `admin123`).
- **Sign Up (`/signup` or `/register`)**: Register new user accounts with Full Name, Email, Password, and Role.
- **MySQL Integration**:
  - Automatically creates database `medical_db` and table `users` with hashed passwords using `Werkzeug` secure hashing.
  - Automatically seeds default demo administrator account.
  - Includes resilient fallback store so that local testing runs smoothly even if the MySQL server is temporarily offline.

---

## 📁 Project Structure

```
Medical/
├── app.py                                # Flask Backend & Route Handlers
├── db.py                                 # MySQL Connection & Authentication Logic
├── requirements.txt                      # Project Dependencies (Flask, PyMySQL, scikit-learn, etc.)
├── medical_data_set_extended.csv         # Synthetic Clinical Claims Dataset (14,284 records)
├── medical_cost_deployment_bundle.joblib # Serialized ML Model Bundle (Stacking Regressor + Preprocessors)
├── medical_cost_model.joblib             # Core Model Weights
├── ens.ipynb                             # Jupyter Notebook for Model Training & Exploration
├── templates/
│   ├── base.html                         # Common Navigation & Sidebar Layout with User Profile
│   ├── index.html                        # Screen 1: Landing Page
│   ├── login.html                        # Sign In Page
│   ├── signup.html                       # New User Registration Page
│   ├── dashboard.html                    # Screen 2: Dashboard
│   ├── forecast.html                     # Screen 3: Forecast Page
│   ├── drivers.html                      # Screen 4: Drivers Analysis
│   ├── advisor.html                      # Screen 5: Advisor Recommendations
│   └── what_if.html                      # Screen 6: What-If Simulation
└── static/
    ├── css/
    │   └── style.css                     # Modern, Responsive UI Stylesheet
    └── js/
        └── main.js                       # Chart.js Visualizations & Reactive Logic
```

