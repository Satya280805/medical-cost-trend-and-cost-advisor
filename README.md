# 🏥 Trend2Action — Medical Cost Intelligence Platform

Trend2Action is a full-stack healthcare analytics and medical-cost intelligence platform designed to analyze medical cost trends, identify major cost drivers, forecast future expenditure, and recommend actionable cost-containment strategies.

The platform combines **MySQL**, **Python**, **Flask**, **scikit-learn**, **Jupyter Notebook**, and **Chart.js** into an end-to-end analytics and machine-learning workflow.

---

## 🎯 Project Objective

Medical costs can increase because of several factors, including:

- Utilization shifts
- Unit cost changes
- High-cost drugs
- Site-of-care patterns
- Provider mix

Trend2Action is designed to help healthcare and medical-economics teams answer:

> **What is driving medical cost growth, how is it changing, what could happen next, and where should cost-containment efforts be focused?**

The platform follows this workflow:

```text
Medical Cost Data
        ↓
MySQL Database
        ↓
Data Analysis & Feature Engineering
        ↓
Machine Learning
        ↓
Cost Driver Detection
        ↓
Forecasting
        ↓
Interactive Web Dashboard
        ↓
Cost-Containment Recommendations
```

---

# 🌟 Key Features

## 1. Landing Page — `/`

The landing page provides:

- Executive introduction to the platform
- Overview of major capabilities
- Healthcare cost-intelligence positioning
- Navigation into the analytics platform

---

## 2. Executive Dashboard — `/dashboard`

The Executive Dashboard provides a high-level view of medical cost performance.

### Features

- Total medical-cost indicators
- Year-over-year cost trends
- Historical medical-cost visualization
- Cost-share analysis by drug category
- Key cost-pressure indicators
- Executive-level recommendations

### Visualizations

The dashboard uses interactive **Chart.js** visualizations backed by Flask APIs and MySQL data.

Current database-backed analytics include:

```text
Historical Cost Trend
        +
Medical Cost Share by Drug Category
```

---

# 3. AI Medical Cost Prediction — `/forecast`

The Forecast page contains the individual medical-cost prediction system.

Users can provide:

### Basic Information
- Age
- BMI
- Gender
- Smoking status
- Physical activity
- Stress level

### Medical Conditions
- Diabetes
- Hypertension
- Heart disease
- Asthma
- Daily steps
- Sleep hours

### Healthcare Utilization
- Doctor visits
- Hospital admissions
- Emergency visits
- Specialist visits
- Lab tests
- Prescription count
- Average length of stay

### Insurance & Plan Information
- Insurance type
- Coverage percentage
- City type
- Previous-year medical cost
- Out-of-network rate
- Generic rate
- Pharmacy spend

### Provider & Treatment Information
- Site of care
- Provider type
- Provider mix index
- Unit cost
- Drug category
- Drug cost

### Output

The trained model produces:

- Predicted monthly medical cost
- Prediction period
- Confidence range where available
- Cost-risk classification
- Tailored cost-containment suggestions

---

# 4. Medical Cost Forecast

The Forecast section also provides macro-level medical-cost analysis.

### Features

- Historical annual medical-cost trend
- Actual vs forecast visualization
- Multi-year forecast horizon
- Monthly forecast table
- Forecast lower and upper ranges
- Expected growth
- Forecast risk status
- Budget implications
- Historical-to-forecast trend visualization

### Forecast Visualization

The chart distinguishes:

```text
Actual
Forecast
```

with the forecast connected to the latest observed historical value.

---

# 5. Cost Drivers Analysis — `/drivers`

The Cost Drivers page is designed to identify the major factors associated with medical-cost escalation.

### Major Driver Groups

- Specialty / high-cost drugs
- Healthcare utilization
- Site of care
- Provider mix
- Unit cost

### Features

#### Top Cost Drivers
Shows normalized model-derived importance across the major business driver groups.

#### Driver Trend
Shows normalized driver trends over time using a common index.

```text
Baseline Year = 100
```

This allows different driver types to be compared more meaningfully.

#### Current Driver Cost Signals
Provides current driver-level signals based on the available analytics.

#### Key Takeaway
Provides an executive interpretation of the observed drivers and highlights potential intervention areas.

---

# 6. Cost-Containment Advisor — `/advisor`

The Advisor provides recommended cost-containment strategies based on medical-cost risk and observed cost drivers.

### Recommendation Categories

- Pharmacy optimization
- Specialty-drug management
- Generic and biosimilar adoption
- ER utilization reduction
- Inpatient utilization management
- Site-of-care optimization
- Provider-network optimization
- Preventive care
- High-cost member management

### Priority Levels

Recommendations can be presented as:

```text
High Priority
Medium Priority
Low Priority
```

The objective is to connect analytical findings to practical containment actions.

---

# 🤖 Machine Learning

The platform uses a trained ensemble machine-learning model for medical-cost prediction.

## Model Architecture

The project uses a **Stacking Regressor** ensemble with tree-based base estimators and a meta-estimation layer.

The training workflow includes:

- Random Forest Regressor
- Gradient Boosting Regressor
- Ensemble / Stacking layer
- Numerical preprocessing
- Categorical encoding
- Feature engineering
- Model evaluation
- Deployment bundle generation

The deployment bundle contains the trained model and preprocessing components required by the Flask application.

---

# 📊 Data Analysis

The project includes a Jupyter Notebook:

```text
ens.ipynb
```

which is used for data analysis, feature engineering, model development, and training.

## Data Analysis Includes

- Dataset inspection
- Data-type inspection
- Missing-value analysis
- Duplicate analysis
- Target-variable analysis
- Cost distribution
- Historical medical-cost trends
- Cost by site of care
- Cost by provider type
- Cost by drug category
- Healthcare-utilization analysis
- Numeric correlation analysis
- Feature-importance analysis

---

# 📈 Visualization

The project uses two visualization approaches.

## Jupyter Notebook

Python-based analytical visualizations using:

```text
Matplotlib
```

These are primarily used for:

- Exploratory data analysis
- Model development
- Statistical interpretation
- Feature analysis

## Web Application

Interactive web-based visualizations using:

```text
Chart.js
```

These are used for:

- Executive dashboards
- Forecast charts
- Cost-driver visualizations
- Interactive browser analytics

The two approaches serve different purposes:

```text
Jupyter Notebook
       ↓
Analytical / Data Science Visualization

Flask Website
       ↓
Interactive Business Visualization
```

---

# 🗄️ MySQL Database Integration

The medical-cost dataset is loaded into MySQL and is used as the source for the website's analytics APIs.

## Database

```text
Database: trend2action
Host: localhost
Port: 3306
User: root
```

## Main Table

```text
medical_cost_data
```

The dataset contains approximately:

```text
14,284 records
36 columns
```

---

# 🔄 End-to-End Data Pipeline

The project follows an integrated data and ML pipeline.

```text
CSV Dataset
      ↓
Load into MySQL
      ↓
MySQL medical_cost_data
      ↓
ens.ipynb
      ↓
Data Inspection
      ↓
Data Cleaning
      ↓
Feature Engineering
      ↓
Encoding / Scaling
      ↓
Model Training
      ↓
Model Evaluation
      ↓
Deployment Model Bundle
      ↓
Flask Application
      ↓
Analytics APIs
      ↓
Chart.js Dashboard
```

---

# 🔌 Flask Analytics APIs

The Flask backend provides database-backed analytics endpoints.

### Cost Trend

```text
/api/analytics/cost-trend
```

Provides historical medical-cost trend information from MySQL.

### Drug Cost Share

```text
/api/analytics/drug-cost-share
```

Provides medical-cost share across drug categories.

### Driver Trend

```text
/api/analytics/driver-trend
```

Provides normalized cost-driver trends.

### Top Drivers

```text
/api/analytics/top-drivers
```

Provides model-derived importance grouped into major business drivers.

### Driver Impact

```text
/api/analytics/driver-impact
```

Provides current driver-level cost signals.

### Site of Care

```text
/api/analytics/site-of-care-cost
```

Provides medical-cost analysis by site of care.

### Macro Forecast

```text
/api/analytics/macro-forecast
```

Provides historical medical-cost data used by the forecasting interface.

### Forecast Summary

```text
/api/analytics/forecast-summary
```

Provides forecast information using the deployed machine-learning model.

---

# 🔐 Authentication

The Flask application includes session-based authentication.

### Authentication Features

- Sign In
- Sign Up
- Session management
- Protected application pages
- Password hashing using Werkzeug
- Local user persistence

Protected pages require an authenticated session.

---

# 🧠 Model Deployment

The trained model is stored in:

```text
medical_cost_deployment_bundle.joblib
```

A standalone model is also maintained in:

```text
medical_cost_model.joblib
```

The Flask application loads the deployment bundle during startup.

The bundle contains the components needed for prediction, including:

- Trained model
- Scaler
- Encoder
- Feature metadata
- Prediction-related model components

---

# 📁 Project Structure

```text
Medical/
│
├── app.py
├── requirements.txt
├── README.md
├── Procfile
├── render.yaml
├── .gitignore
│
├── ens.ipynb
│
├── load_data_mysql.py
├── train_advanced_model.py
│
├── medical_data_set_extended.csv
├── medical_cost_deployment_bundle.joblib
├── medical_cost_model.joblib
│
├── users_store.json
│
├── templates/
│   ├── base.html
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── dashboard.html
│   ├── forecast.html
│   ├── drivers.html
│   └── advisor.html
│
└── static/
    ├── css/
    │   └── style.css
    │
    └── js/
        └── main.js
```

### Removed

The previous What-If page has been removed from the current application.

```text
what_if.html
```

is no longer part of the active website.

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd Medical
```

---

## 2. Create a Virtual Environment

### Windows

```powershell
python -m venv venv
```

Activate it:

```powershell
.\venv\Scripts\Activate.ps1
```

---

## 3. Install Dependencies

```powershell
pip install -r requirements.txt
```

---

# 🗄️ 4. Configure MySQL

Make sure MySQL is running.

The current application is configured for:

```text
Host: localhost
Port: 3306
Database: trend2action
User: root
```

Update the database configuration in `app.py` if your local MySQL credentials are different.

---

# 📥 5. Load the Dataset into MySQL

Run:

```powershell
python load_data_mysql.py
```

The script loads the medical dataset into:

```text
medical_cost_data
```

You should see a successful loading message and the row count.

---

# 🧪 6. Train / Update the Model

Open:

```text
ens.ipynb
```

Run the notebook through:

```text
Data Loading
      ↓
Data Cleaning
      ↓
Feature Engineering
      ↓
Data Analysis
      ↓
Model Training
      ↓
Model Evaluation
      ↓
Model Saving
```

The resulting deployment files are:

```text
medical_cost_deployment_bundle.joblib
medical_cost_model.joblib
```

---

# ▶️ 7. Run Flask

From the project directory:

```powershell
python app.py
```

The current application runs on:

```text
http://127.0.0.1:5050
```

You may also access it through the machine's local network address when the Flask server is running on all interfaces.

---

# 🌐 Application Pages

| Page | Route | Purpose |
|------|------|---------|
| Landing | `/` | Platform introduction |
| Dashboard | `/dashboard` | Executive medical-cost analytics |
| Forecast | `/forecast` | Individual prediction and macro forecasting |
| Drivers | `/drivers` | Cost-driver analysis |
| Advisor | `/advisor` | Cost-containment recommendations |

---

# 🧮 Example Workflow

A typical project workflow is:

```text
1. Load medical claims data
        ↓
2. Store data in MySQL
        ↓
3. Analyze historical cost behavior
        ↓
4. Identify important cost drivers
        ↓
5. Train the ML model
        ↓
6. Save the deployment model
        ↓
7. Start Flask
        ↓
8. Generate patient-level predictions
        ↓
9. Display analytics on the dashboard
        ↓
10. Recommend containment strategies
```

---

# 💡 Business Use Case

Trend2Action is designed around the following business problem:

> Medical cost trends can rise because of utilization shifts, unit cost changes, high-cost drugs, site-of-care patterns, or provider mix.

The platform translates these drivers into a practical workflow:

```text
Detect
  ↓
Understand
  ↓
Forecast
  ↓
Prioritize
  ↓
Contain
```

### Example

If the platform identifies increasing specialty-drug pressure:

```text
High Specialty Drug Signal
        ↓
Higher Pharmacy Cost Pressure
        ↓
Forecast Risk Increase
        ↓
Advisor Recommendation
        ↓
Generic / Biosimilar Optimization
```

Similarly, increasing emergency or inpatient utilization can trigger recommendations focused on:

- Avoidable ER utilization
- Site-of-care redirection
- Provider-network optimization
- Care-management interventions

---

# 🛠️ Technology Stack

## Backend

- Python
- Flask
- SQLAlchemy
- MySQL Connector
- Werkzeug

## Data Science

- Pandas
- NumPy
- Jupyter Notebook
- Matplotlib

## Machine Learning

- scikit-learn
- Random Forest
- Gradient Boosting
- Stacking Regressor

## Frontend

- HTML
- CSS
- JavaScript
- Chart.js

## Database

- MySQL

---

# 📌 Current Project Status

```text
✅ MySQL integration
✅ Dataset loaded into MySQL
✅ Jupyter data-analysis pipeline
✅ Feature engineering
✅ Machine-learning training
✅ Model evaluation
✅ Deployment model bundle
✅ Flask application
✅ Individual medical-cost prediction
✅ Dashboard analytics
✅ Database-backed cost trend
✅ Database-backed drug cost share
✅ Cost-driver analysis
✅ Driver trend analysis
✅ Forecast page
✅ Historical vs forecast visualization
✅ Monthly forecast table
✅ Cost-containment advisor
✅ What-If page removed
✅ Updated navigation
```

---

# 🔒 Data Note

The included medical dataset is intended for project development, analytics, and demonstration purposes.

Predictions and recommendations generated by this application should be interpreted as analytical outputs rather than clinical or financial advice.

---

# 👨‍💻 Project

## Trend2Action — Medical Cost Intelligence Platform

An end-to-end healthcare analytics and machine-learning solution for:

```text
Medical Cost Analysis
+
Cost Driver Detection
+
Forecasting
+
Cost Containment
```

```text
MySQL → Data Analysis → Machine Learning → Flask → Interactive Analytics
```
