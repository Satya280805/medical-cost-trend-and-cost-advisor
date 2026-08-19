# 🏥 Medical Cost Intelligence Platform

A full-stack healthcare analytics, medical cost forecasting, cost-driver analysis, and cost-containment decision-support platform built with **Python, Flask, MySQL, Pandas, Scikit-learn, Chart.js, and an ensemble Stacking Regressor**.

The platform transforms clinical claims data into actionable business intelligence by combining:

- Historical medical cost analysis
- Medical cost forecasting
- Machine-learning-based cost prediction
- Cost-driver analysis
- Driver trend analysis
- Cost-containment recommendations
- What-if scenario analysis
- Interactive executive dashboards
- MySQL-based application data management

---

# 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Problem Statement](#-problem-statement)
- [Project Objectives](#-project-objectives)
- [Key Features](#-key-features)
- [Application Modules](#-application-modules)
- [System Architecture](#-system-architecture)
- [Machine Learning Architecture](#-machine-learning-architecture)
- [Cost Driver Analysis](#-cost-driver-analysis)
- [Forecasting Workflow](#-forecasting-workflow)
- [What-If Analysis](#-what-if-analysis)
- [Technology Stack](#-technology-stack)
- [Dataset](#-dataset)
- [Project Structure](#-project-structure)
- [File and Folder Description](#-file-and-folder-description)
- [Backend Architecture](#-backend-architecture)
- [Frontend Architecture](#-frontend-architecture)
- [Database](#-database)
- [Authentication](#-authentication)
- [API Endpoints](#-api-endpoints)
- [Machine Learning Model](#-machine-learning-model)
- [Model Deployment Bundle](#-model-deployment-bundle)
- [Local Installation](#-local-installation)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Render Deployment](#-render-deployment)
- [Aiven MySQL Configuration](#-aiven-mysql-configuration)
- [GitHub Deployment](#-github-deployment)
- [Application Workflow](#-application-workflow)
- [Dashboard](#-dashboard)
- [Forecast](#-forecast)
- [Drivers](#-drivers)
- [Advisor](#-advisor)
- [Prediction](#-prediction)
- [Cost Containment Strategy](#-cost-containment-strategy)
- [Security](#-security)
- [Testing Checklist](#-testing-checklist)
- [Future Enhancements](#-future-enhancements)
- [Limitations](#-limitations)
- [License](#-license)
- [Author](#-author)

---

# 🏥 Project Overview

The **Medical Cost Intelligence Platform** is designed to help organizations understand, predict, and control rising healthcare costs.

Instead of focusing only on prediction, the platform follows a complete analytical workflow:

```text
Healthcare Claims Data
        │
        ▼
Data Preparation
        │
        ▼
Exploratory Analytics
        │
        ▼
Machine Learning
        │
        ├───────────────┐
        ▼               ▼
Cost Prediction    Driver Analysis
        │               │
        └───────┬───────┘
                ▼
          Cost Forecast
                │
                ▼
       Cost Containment
                │
                ▼
      Decision Support
