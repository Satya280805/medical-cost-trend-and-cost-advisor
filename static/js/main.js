// Trend2Action Platform - Charts & Interactivity

// Global Chart references
let costComparisonChartInstance = null;

// Dashboard Charts
async function initDashboardCharts() {

  // ============================================================
  // COST TREND CHART - DATA FROM MYSQL
  // ============================================================

  const trendCtx = document.getElementById('costTrendChart');

  if (trendCtx) {

    try {

      const response = await fetch('/api/analytics/cost-trend');

      if (!response.ok) {
        throw new Error('Failed to load cost trend data');
      }

      const data = await response.json();

      new Chart(trendCtx, {
        type: 'line',

        data: {
          labels: data.years,

          datasets: [{
            label: 'Average Medical Cost',
            data: data.costs,

            borderColor: '#2563eb',
            backgroundColor: '#2563eb',

            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.2
          }]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,

          plugins: {
            legend: {
              display: false
            },

            tooltip: {
              callbacks: {
                label: (ctx) =>
                  `Average Cost: ₹ ${Number(ctx.raw).toFixed(2)}`
              }
            }
          },

          scales: {
            y: {
              beginAtZero: true,

              title: {
                display: true,
                text: 'Average Medical Cost',
                font: {
                  size: 11,
                  weight: '500'
                }
              },

              ticks: {
                callback: (val) => `₹ ${val}`
              },

              grid: {
                color: '#f1f5f9'
              }
            },

            x: {
              grid: {
                display: false
              },

              title: {
                display: true,
                text: 'Year'
              }
            }
          }
        }
      });

    } catch (error) {

      console.error('Cost trend chart error:', error);

    }
  }

  // ============================================================
  // DRUG COST SHARE DONUT - DATA FROM MYSQL
  // ============================================================

  const donutCtx = document.getElementById('driversDonutChart');

  if (donutCtx) {

    try {

      const response = await fetch('/api/analytics/drug-cost-share');

      if (!response.ok) {
        throw new Error('Failed to load drug cost share data');
      }

      const data = await response.json();

      new Chart(donutCtx, {
        type: 'doughnut',

        data: {
          labels: data.labels,

          datasets: [{
            data: data.values,

            backgroundColor: [
              '#0284c7',
              '#10b981',
              '#8b5cf6',
              '#f59e0b',
              '#64748b',
              '#ef4444'
            ],

            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 4
          }]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',

          plugins: {
            legend: {
              position: 'right',

              labels: {
                boxWidth: 12,
                usePointStyle: true,
                pointStyle: 'circle',

                font: {
                  size: 11,
                  family: "'Inter', sans-serif"
                },

                generateLabels: (chart) => {

                  const chartData = chart.data;

                  return chartData.labels.map((label, i) => {

                    const value = chartData.datasets[0].data[i];

                    return {
                      text: `${label}   ${value.toFixed(1)}%`,
                      fillStyle:
                        chartData.datasets[0].backgroundColor[i],
                      strokeStyle:
                        chartData.datasets[0].backgroundColor[i],
                      index: i
                    };

                  });

                }
              }
            },

            tooltip: {
              callbacks: {
                label: (ctx) =>
                  `${ctx.label}: ${ctx.raw.toFixed(2)}%`
              }
            }
          }
        }
      });

    } catch (error) {

      console.error('Drug cost share chart error:', error);

    }
  }

}

// Global Forecast Horizon Chart Reference & Multi-Year Data Store
let forecastHorizonChartInstance = null;
let currentMacroYear = 2027;
let currentMacroMonth = 'all';

const MACRO_YEAR_PROJECTIONS = {
  2026: {
    total: 10.80,
    growth: '9.20%',
    range: '₹ 10.10 Cr - ₹ 11.50 Cr',
    risk: 'MODERATE',
    riskColor: '#16a34a',
    riskBadgeClass: 'up-green',
    riskAction: 'Within Guardrails',
    vsText: 'vs 2025 baseline'
  },
  2027: {
    total: 12.80,
    growth: '11.40%',
    range: '₹ 11.90 Cr - ₹ 13.70 Cr',
    risk: 'HIGH',
    riskColor: '#dc2626',
    riskBadgeClass: 'danger',
    riskAction: 'Action Required',
    vsText: '11.4% vs 2026'
  },
  2028: {
    total: 14.50,
    growth: '13.28%',
    range: '₹ 13.48 Cr - ₹ 15.52 Cr',
    risk: 'HIGH',
    riskColor: '#dc2626',
    riskBadgeClass: 'danger',
    riskAction: 'Early Levers Required',
    vsText: '13.3% vs 2027'
  },
  2029: {
    total: 16.40,
    growth: '13.10%',
    range: '₹ 15.25 Cr - ₹ 17.55 Cr',
    risk: 'CRITICAL',
    riskColor: '#991b1b',
    riskBadgeClass: 'danger',
    riskAction: 'Severe Overrun Risk',
    vsText: '13.1% vs 2028'
  },
  2030: {
    total: 18.60,
    growth: '13.41%',
    range: '₹ 17.30 Cr - ₹ 19.90 Cr',
    risk: 'CRITICAL',
    riskColor: '#991b1b',
    riskBadgeClass: 'danger',
    riskAction: 'Critical Budget Alert',
    vsText: '13.4% vs 2029'
  }
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORTS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_SHARES = [0.0719, 0.0742, 0.0766, 0.0789, 0.0813, 0.0828, 0.0844, 0.0859, 0.0875, 0.0883, 0.0891, 0.0906];

function getMacroYearData(year) {
  const y = parseInt(year) || 2027;
  if (MACRO_YEAR_PROJECTIONS[y]) {
    return MACRO_YEAR_PROJECTIONS[y];
  }

  // Calculate dynamic multi-year forecast for any year (e.g. 2031, 2032, 2035, 2040)
  // Baseline: 2026 enterprise spend = 10.80 Cr with compound 11.40% YoY trend rate
  const baseYear = 2026;
  const baseCost = 10.80;
  const annualTrendRate = 0.1140;
  const yearsAhead = y - baseYear;

  let projectedTotal;
  if (yearsAhead >= 0) {
    projectedTotal = parseFloat((baseCost * Math.pow(1.0 + annualTrendRate, yearsAhead)).toFixed(2));
  } else {
    projectedTotal = parseFloat((baseCost / Math.pow(1.0 + annualTrendRate, Math.abs(yearsAhead))).toFixed(2));
  }

  const prevYearTotal = baseCost * Math.pow(1.0 + annualTrendRate, yearsAhead - 1);
  const growthPct = yearsAhead > 0 ? (((projectedTotal - prevYearTotal) / prevYearTotal) * 100).toFixed(2) + '%' : '9.20%';
  const lowerRange = (projectedTotal * 0.93).toFixed(2);
  const upperRange = (projectedTotal * 1.07).toFixed(2);

  return {
    total: projectedTotal,
    growth: growthPct,
    range: `₹ ${lowerRange} Cr - ₹ ${upperRange} Cr`,
    risk: y >= 2029 ? 'CRITICAL' : 'HIGH',
    riskColor: '#991b1b',
    riskBadgeClass: 'danger',
    riskAction: y > 2030 ? 'Long-Range Overrun Alert' : 'Action Required',
    vsText: `${growthPct} vs ${y - 1}`
  };
}

async function loadForecastSummary() {
  try {
    const response = await fetch('/api/analytics/forecast-summary');

    if (!response.ok) {
      throw new Error('Failed to load forecast summary');
    }

    const data = await response.json();

    console.log('Model forecast:', data);

    const forecastValue =
      document.getElementById('kpiTotalForecastValue');

    if (forecastValue) {
      forecastValue.innerText =
        `₹ ${Number(data.predicted_cost).toFixed(2)} Cr`;
    }

  } catch (error) {
    console.error('Forecast summary error:', error);
  }
}

async function loadMacroForecastData() {

  try {

    const response = await fetch('/api/analytics/macro-forecast');

    if (!response.ok) {
      throw new Error('Failed to load macro forecast data');
    }

    const data = await response.json();

    console.log('Historical macro data:', data);

    // Store for later use by the forecast page
    window.macroHistoricalData = data;

  } catch (error) {

    console.error('Macro forecast data error:', error);

  }
}

function getMonthlyMacroData(year) {
  const yData = getMacroYearData(year);
  const total = yData.total;
  
  return MONTH_SHARES.map((share, i) => {
    const forecast = parseFloat((total * share).toFixed(2));
    const lower = parseFloat((forecast * 0.935).toFixed(2));
    const upper = parseFloat((forecast * 1.076).toFixed(2));
    return {
      monthIdx: i + 1,
      monthName: MONTH_NAMES[i],
      monthShort: MONTH_SHORTS[i],
      forecast: forecast,
      lower: lower,
      upper: upper
    };
  });
}

// Forecast Horizon Chart
async function initForecastCharts() {

  const fcCtx = document.getElementById('forecastHorizonChart');

  if (!fcCtx) return;

  // Get actual historical data from MySQL
  let historicalYears = [];
  let historicalCosts = [];

  if (window.macroHistoricalData) {
    historicalYears = window.macroHistoricalData.years || [];
    historicalCosts = window.macroHistoricalData.actual_costs || [];
  }

  // Existing forward forecast values
  const forecastYears = [2026, 2027, 2028, 2029, 2030];
  const forecastCosts = forecastYears.map(
    year => getMacroYearData(year).total
  );

  // Combine actual + forecast years
  const labels = [
    ...historicalYears,
    ...forecastYears.filter(
      year => !historicalYears.includes(year)
    )
  ];

  const actualData = labels.map(year => {
  const index = historicalYears.indexOf(year);
  return index !== -1 ? historicalCosts[index] : null;
});

const lastActualYear = historicalYears[historicalYears.length - 1];
const lastActualCost = historicalCosts[historicalCosts.length - 1];

const forecastData = labels.map(year => {

  // Connect forecast to the last actual point
  if (year === lastActualYear) {
    return lastActualCost;
  }

  const index = forecastYears.indexOf(year);

  return index !== -1 ? forecastCosts[index] : null;
});

  forecastHorizonChartInstance = new Chart(fcCtx, {
    type: 'line',

    data: {
      labels: labels,

      datasets: [
        {
          label: 'Actual',
          data: actualData,
          borderColor: '#2563eb',
          backgroundColor: '#2563eb',
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.2
        },

        {
          label: 'Forecast',
          data: forecastData,
          borderColor: '#60a5fa',
          backgroundColor: '#60a5fa',
          borderDash: [5, 5],
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.2
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          position: 'top'
        },

        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${ctx.dataset.label}: ₹ ${Number(ctx.raw).toFixed(2)} Cr`
          }
        }
      },

      scales: {
        y: {
          beginAtZero: true,

          title: {
            display: true,
            text: 'Medical Cost (₹ Cr)'
          },

          grid: {
            color: '#f1f5f9'
          }
        },

        x: {
          grid: {
            display: false
          }
        }
      }
    }
   });

  // Populate the monthly table, KPIs and summary
  updateMacroForecastHorizon(
    currentMacroYear,
    currentMacroMonth
  );
}

// Controller to dynamically update year, month, table, KPIs and Chart
function updateMacroForecastHorizon(year, monthFilter = 'all') {
  currentMacroYear = parseInt(year) || 2027;
  currentMacroMonth = monthFilter;

  const yData = MACRO_YEAR_PROJECTIONS[currentMacroYear] || MACRO_YEAR_PROJECTIONS[2027];
  const monthlyList = getMonthlyMacroData(currentMacroYear);

  // 1. Update Section Title
  const titleYearEl = document.getElementById('macroForecastYearTitle');
  if (titleYearEl) titleYearEl.innerText = currentMacroYear;

  // 2. Update KPI Cards
  const kpiTotalTitle = document.getElementById('kpiTotalForecastTitle');
  const kpiTotalVal = document.getElementById('kpiTotalForecastValue');
  const kpiVsText = document.getElementById('kpiTotalForecastVsText');
  if (kpiTotalTitle) kpiTotalTitle.innerText = `Total Forecast (${currentMacroYear})`;
  if (kpiTotalVal) kpiTotalVal.innerText = `₹ ${yData.total.toFixed(2)} Cr`;
  if (kpiVsText) kpiVsText.innerText = yData.vsText;

  const kpiGrowthVal = document.getElementById('kpiGrowthValue');
  if (kpiGrowthVal) kpiGrowthVal.innerText = yData.growth;

  const kpiRangeVal = document.getElementById('kpiRangeValue');
  if (kpiRangeVal) kpiRangeVal.innerText = yData.range;

  const kpiRiskVal = document.getElementById('kpiRiskValue');
  const kpiRiskSubText = document.getElementById('kpiRiskSubText');
  if (kpiRiskVal) {
    kpiRiskVal.innerText = yData.risk;
    kpiRiskVal.style.color = yData.riskColor;
  }
  if (kpiRiskSubText) kpiRiskSubText.innerText = yData.riskAction;

  // 3. Update Table Header & Body
  const tblTitle = document.getElementById('monthlyTableCardTitle');
  if (tblTitle) tblTitle.innerText = `Monthly Forecast for ${currentMacroYear}`;

  const tblBody = document.getElementById('macroForecastTableBody');
  if (tblBody) {
    let rowsHTML = '';
    let sumForecast = 0;
    let sumLower = 0;
    let sumUpper = 0;

    monthlyList.forEach((m, idx) => {
      const isSelected = (monthFilter !== 'all' && parseInt(monthFilter) === (idx + 1));
      const rowStyle = isSelected 
        ? 'background: #eff6ff; font-weight: 700; border-left: 4px solid var(--accent-blue);' 
        : '';

      sumForecast += m.forecast;
      sumLower += m.lower;
      sumUpper += m.upper;

      rowsHTML += `
        <tr style="${rowStyle}" onclick="selectMacroMonthFromTable(${idx + 1})">
          <td>
            ${m.monthName}
            ${isSelected ? ' <span style="font-size: 10.5px; background: #2563eb; color: white; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">Active</span>' : ''}
          </td>
          <td>${m.forecast.toFixed(2)}</td>
          <td>${m.lower.toFixed(2)}</td>
          <td>${m.upper.toFixed(2)}</td>
        </tr>
      `;
    });

    // Total Row
    rowsHTML += `
      <tr class="total-row">
        <td>Total (${currentMacroYear})</td>
        <td>${yData.total.toFixed(2)}</td>
        <td>${sumLower.toFixed(2)}</td>
        <td>${sumUpper.toFixed(2)}</td>
      </tr>
    `;

    tblBody.innerHTML = rowsHTML;
  }

  // 4. Update Summary List
  const summaryList = document.getElementById('macroSummaryList');
  if (summaryList) {
    const diff = (yData.total - 11.50).toFixed(2);
    summaryList.innerHTML = `
      <li>The total medical cost for ${currentMacroYear} is projected to reach <strong>₹ ${yData.total.toFixed(2)} Cr</strong> without policy intervention.</li>
      <li>Expected compound escalation of <strong>${yData.growth}</strong>, exceeding the approved budget baseline (₹ 11.50 Cr) by <strong>₹ ${diff} Cr</strong>.</li>
      <li>95% statistical confidence interval lies between <strong>${yData.range.split('-')[0].trim()}</strong> and <strong>${yData.range.split('-')[1].trim()}</strong>.</li>
    `;
  }

  // 5. Update Chart Title & Data
    // 5. Keep the chart as Historical Actual vs Forecast
  const chartTitleEl = document.getElementById('chartCardTitle');

  if (chartTitleEl) {
    chartTitleEl.innerText = 'Historical Medical Cost vs Forecast';
  }
}

// User Actions
function setMacroHorizonYear(year, btnEl) {
  const container = document.getElementById('macroYearChips');
  if (container) {
    container.querySelectorAll('.btn-tier-filter').forEach(b => b.classList.remove('active'));
  }
  if (btnEl) btnEl.classList.add('active');

  const customInput = document.getElementById('customMacroYearInput');
  if (customInput) {
    customInput.value = year;
  }

  updateMacroForecastHorizon(year, currentMacroMonth);
}

function submitCustomMacroForecast() {
  const input = document.getElementById('customMacroYearInput');
  const y = parseInt(input?.value);
  if (!y || isNaN(y) || y < 2020 || y > 2060) {
    alert('Please enter a valid year between 2020 and 2060.');
    return;
  }

  // Update Year chips active state
  const container = document.getElementById('macroYearChips');
  if (container) {
    container.querySelectorAll('.btn-tier-filter').forEach(b => {
      b.classList.toggle('active', parseInt(b.getAttribute('data-year')) === y);
    });
  }

  updateMacroForecastHorizon(y, currentMacroMonth);
}

function onMacroMonthDropdownChange(monthVal) {
  currentMacroMonth = monthVal;
  updateMacroForecastHorizon(currentMacroYear, monthVal);
}

function selectMacroMonthFromTable(monthIdx) {
  const select = document.getElementById('macroMonthFilter');
  if (select) select.value = monthIdx.toString();
  onMacroMonthDropdownChange(monthIdx.toString());
}

// ============================================================
// COST DRIVERS HORIZON YEAR DYNAMIC CONTROLS
// ============================================================


async function loadDriverImpactData() {

  try {

    const response = await fetch('/api/analytics/driver-impact');

    if (!response.ok) {
      throw new Error('Failed to load driver impact data');
    }

    const data = await response.json();

    const mappings = [
      ['impactSpecVal', data.specialty, true],
      ['impactUtilVal', data.utilization, true],
      ['impactSiteVal', data.site, true],
      ['impactProvVal', data.provider, true],
      ['impactUnitVal', data.unit, true],
      ['impactGenVal', data.generic, false]
    ];

    mappings.forEach(([id, value, positive]) => {

      const el = document.getElementById(id);

      if (!el) return;

      const sign = positive ? '+' : '-';

      el.innerText = `${sign}₹ ${Number(value).toFixed(2)} L`;

    });

  } catch (error) {

    console.error('Driver impact data error:', error);

  }
}


async function loadTopDriverData() {

  try {

    const response = await fetch('/api/analytics/top-drivers');

    if (!response.ok) {
      throw new Error('Failed to load top driver data');
    }

    const data = await response.json();

    const drivers = [
      ['pctSpecVal', 'barSpecVal', data.specialty],
      ['pctUtilVal', 'barUtilVal', data.utilization],
      ['pctSiteVal', 'barSiteVal', data.site],
      ['pctProvVal', 'barProvVal', data.provider],
      ['pctUnitVal', 'barUnitVal', data.unit]
    ];

    drivers.forEach(([pctId, barId, value]) => {

      const pctEl = document.getElementById(pctId);
      const barEl = document.getElementById(barId);

      if (pctEl) {
        pctEl.innerText = `${value}%`;
      }

      if (barEl) {
        barEl.style.width = `${Math.min(value, 100)}%`;
      }
    });

  } catch (error) {

    console.error('Top driver data error:', error);

  }
}

// ============================================================
// ADVISOR HORIZON YEAR DYNAMIC CONTROLS
// ============================================================

const advisorYearData = {
  2026: { maxSavings: '₹ 1.55 Cr', sub: '14.4% of total 2026 spend', topDriver: '₹ 54.00 Lakhs potential', siteCare: '₹ 32.50 L' },
  2027: { maxSavings: '₹ 1.85 Cr', sub: '14.4% of total 2027 spend', topDriver: '₹ 64.00 Lakhs potential', siteCare: '₹ 38.50 L' },
  2028: { maxSavings: '₹ 2.09 Cr', sub: '14.4% of total 2028 spend', topDriver: '₹ 72.50 Lakhs potential', siteCare: '₹ 43.50 L' },
  2029: { maxSavings: '₹ 2.36 Cr', sub: '14.4% of total 2029 spend', topDriver: '₹ 82.00 Lakhs potential', siteCare: '₹ 49.20 L' },
  2030: { maxSavings: '₹ 2.68 Cr', sub: '14.4% of total 2030 spend', topDriver: '₹ 93.00 Lakhs potential', siteCare: '₹ 55.80 L' }
};

function setAdvisorHorizonYear(year, btnEl) {
  const container = document.getElementById('advisorYearGroup');
  if (container) {
    container.querySelectorAll('.btn-tier-filter').forEach(b => b.classList.remove('active'));
  }
  if (btnEl) btnEl.classList.add('active');

  const d = advisorYearData[year] || advisorYearData[2027];

  const maxEl = document.getElementById('advisorMaxSavings');
  if (maxEl) maxEl.innerText = d.maxSavings;

  const subEl = document.getElementById('advisorMaxSavingsSub');
  if (subEl) subEl.innerText = d.sub;

  const topEl = document.getElementById('advisorTopDriverSavings');
  if (topEl) topEl.innerText = d.topDriver;

  const siteEl = document.getElementById('advisorSiteCareSavings');
  if (siteEl) siteEl.innerText = d.siteCare;
}

// Drivers Charts
async function initDriversCharts() {

  const drvCtx = document.getElementById('driverTrendChart');

  if (!drvCtx) return;

  try {

    const response = await fetch('/api/analytics/driver-trend');

    if (!response.ok) {
      throw new Error('Failed to load driver trend data');
    }

    const data = await response.json();

    console.log('Driver trend data:', data);

    // Destroy an existing chart if one already exists
    const existingChart = Chart.getChart(drvCtx);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(drvCtx, {
      type: 'line',

      data: {
        labels: data.years,

        datasets: [
          {
            label: 'Specialty Drugs',
            data: data.specialty,
            borderColor: '#2563eb',
            backgroundColor: '#2563eb',
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: false
          },

          {
            label: 'Utilization',
            data: data.utilization,
            borderColor: '#10b981',
            backgroundColor: '#10b981',
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: false
          },

          {
            label: 'Provider Mix',
            data: data.provider_mix,
            borderColor: '#8b5cf6',
            backgroundColor: '#8b5cf6',
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: false
          },

          {
            label: 'Unit Cost',
            data: data.unit_cost,
            borderColor: '#f59e0b',
            backgroundColor: '#f59e0b',
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: false
          },

          {
            label: 'ER Utilization',
            data: data.er_utilization,
            borderColor: '#06b6d4',
            backgroundColor: '#06b6d4',
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: false
          }
        ]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        interaction: {
          mode: 'index',
          intersect: false
        },

        plugins: {
          legend: {
            display: true,
            position: 'top',

            labels: {
              usePointStyle: true,
              boxWidth: 10,
              padding: 15,
              font: {
                size: 11
              }
            }
          },

          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.dataset.label}: ${Number(ctx.raw).toFixed(1)}`
            }
          }
        },

        scales: {

          y: {
            beginAtZero: false,

            min: 80,
            max: 300,

            ticks: {
              stepSize: 20,

              callback: (value) => `${value}`
            },

            title: {
              display: true,
              text: 'Driver Trend Index (Base Year = 100)',
              font: {
                size: 11
              }
            },

            grid: {
              color: '#f1f5f9'
            }
          },

          x: {
            grid: {
              display: false
            },

            ticks: {
              autoSkip: false
            }
          }
        }
      }
    });

  } catch (error) {

    console.error('Driver trend chart error:', error);

  }
}


async function loadSiteOfCareCostChart() {

  const ctx = document.getElementById('siteOfCareCostChart');

  if (!ctx) return;

  try {

    const response = await fetch('/api/analytics/site-of-care-cost');

    if (!response.ok) {
      throw new Error('Failed to load site-of-care data');
    }

    const data = await response.json();

    new Chart(ctx, {
      type: 'bar',

      data: {
        labels: data.labels,

        datasets: [{
          label: 'Average Medical Cost',
          data: data.values,
          borderRadius: 5
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            display: false
          },

          tooltip: {
            callbacks: {
              label: (ctx) =>
                `Average Cost: ₹ ${Number(ctx.raw).toFixed(2)}`
            }
          }
        },

        scales: {
          y: {
            beginAtZero: true,

            title: {
              display: true,
              text: 'Average Medical Cost'
            }
          },

          x: {
            title: {
              display: true,
              text: 'Site of Care'
            },

            grid: {
              display: false
            }
          }
        }
      }
    });

  } catch (error) {
    console.error('Site-of-care chart error:', error);
  }
}

// What-If Simulation Chart & Calculator
function initWhatIfChart() {
  const cmpCtx = document.getElementById('costComparisonChart');
  if (cmpCtx) {
    costComparisonChartInstance = new Chart(cmpCtx, {
      type: 'bar',
      data: {
        labels: ['Approved Budget', 'Uncontained Forecast', 'Contained Scenario'],
        datasets: [{
          data: [11.50, 12.80, 11.40],
          backgroundColor: ['#64748b', '#ef4444', '#10b981'],
          borderRadius: 6,
          barThickness: 34
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `₹ ${ctx.raw} Cr`
            }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 16,
            ticks: {
              stepSize: 4,
              callback: (val) => `${val}`
            },
            title: {
              display: true,
              text: 'Cost (₹ Cr)',
              font: { size: 11 }
            },
            grid: { color: '#f1f5f9' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }
}

// Interactive Scenario Runner
async function runWhatIfScenario() {
  const specRed = parseFloat(document.getElementById('specialtyDrugRed')?.value) || 0;
  const siteShift = parseFloat(document.getElementById('siteShift')?.value) || 0;
  const erRed = parseFloat(document.getElementById('erUtilRed')?.value) || 0;
  const provMix = parseFloat(document.getElementById('provMixOpt')?.value) || 0;
  const genInc = parseFloat(document.getElementById('genericIncrease')?.value) || 0;

  try {
    const res = await fetch('/api/simulate-what-if', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        specialty_drug_reduction: specRed,
        site_of_care_shift: siteShift,
        er_reduction: erRed,
        provider_mix_optimization: provMix,
        generic_increase: genInc
      })
    });

    if (res.ok) {
      const data = await res.json();
      updateWhatIfUI(data);
    } else {
      fallbackWhatIfCalculation(specRed, siteShift, erRed, provMix, genInc);
    }
  } catch (err) {
    fallbackWhatIfCalculation(specRed, siteShift, erRed, provMix, genInc);
  }
}

function fallbackWhatIfCalculation(specRed, siteShift, erRed, provMix, genInc) {
  const baseForecast = 12.80;
  const budgetBaseline = 11.50;

  const specSavings = baseForecast * (specRed / 100) * 0.50;
  const siteSavings = baseForecast * (siteShift / 100) * 0.25;
  const erSavings = baseForecast * (erRed / 100) * 0.35;
  const provSavings = baseForecast * (provMix / 100) * 0.20;
  const genSavings = baseForecast * (genInc / 100) * 0.08;

  const totalSavings = specSavings + siteSavings + erSavings + provSavings + genSavings;
  const scenarioForecast = Math.max(0, baseForecast - totalSavings);
  const savingsPct = (totalSavings / baseForecast) * 100;
  const budgetVariance = scenarioForecast - budgetBaseline;

  updateWhatIfUI({
    current_forecast: baseForecast,
    scenario_forecast: parseFloat(scenarioForecast.toFixed(2)),
    savings: parseFloat(totalSavings.toFixed(2)),
    savings_pct: parseFloat(savingsPct.toFixed(2)),
    budget_baseline: budgetBaseline,
    budget_variance: parseFloat(budgetVariance.toFixed(2)),
    budget_status: scenarioForecast <= budgetBaseline ? "WITHIN BUDGET" : "BUDGET OVERRUN RISK"
  });
}

function updateWhatIfUI(data) {
  const resCurrent = document.getElementById('resCurrent');
  const resScenario = document.getElementById('resScenario');
  const resSavings = document.getElementById('resSavings');
  const badge = document.getElementById('budgetProtectionBadge');
  const statusText = document.getElementById('budgetStatusText');
  const diffText = document.getElementById('budgetVarianceDiff');
  const conclusion = document.getElementById('scenarioConclusion');

  if (resCurrent) resCurrent.innerText = `₹ ${data.current_forecast.toFixed(2)} Cr`;
  if (resScenario) resScenario.innerText = `₹ ${data.scenario_forecast.toFixed(2)} Cr`;
  if (resSavings) resSavings.innerText = `₹ ${data.savings.toFixed(2)} Cr (${data.savings_pct.toFixed(2)}%)`;

  const isProtected = data.scenario_forecast <= 11.50;
  if (badge) {
    if (isProtected) {
      badge.style.background = '#ecfdf5';
      badge.style.borderColor = '#a7f3d0';
      statusText.innerText = 'BUDGET PROTECTED: WITHIN TARGET';
      statusText.style.color = '#065f46';
      diffText.innerText = `-₹ ${(11.50 - data.scenario_forecast).toFixed(2)} Cr Surplus`;
      diffText.style.color = '#047857';
    } else {
      badge.style.background = '#fef2f2';
      badge.style.borderColor = '#fecaca';
      statusText.innerText = 'BUDGET AT RISK: OVERRUN DETECTED';
      statusText.style.color = '#991b1b';
      diffText.innerText = `+₹ ${(data.scenario_forecast - 11.50).toFixed(2)} Cr Overrun`;
      diffText.style.color = '#b91c1c';
    }
  }

  if (conclusion) {
    if (isProtected) {
      conclusion.innerHTML = `By implementing the selected containment levers, you reduce medical spend to <strong style="color: var(--text-primary);">₹ ${data.scenario_forecast.toFixed(2)} Cr</strong>, successfully protecting the approved budget.`;
    } else {
      conclusion.innerHTML = `Current levers save ₹ ${data.savings.toFixed(2)} Cr, but medical spend is still projected at <strong style="color: #dc2626;">₹ ${data.scenario_forecast.toFixed(2)} Cr</strong> (+₹ ${(data.scenario_forecast - 11.50).toFixed(2)} Cr over budget). Increase lever intensity.`;
    }
  }

  if (costComparisonChartInstance) {
    costComparisonChartInstance.data.datasets[0].data = [11.50, data.current_forecast, data.scenario_forecast];
    costComparisonChartInstance.update();
  }
}

// Apply One-Click Executive What-If Preset
function applyWhatIfPreset(type) {
  const presets = {
    balanced: { spec: 12, site: 10, er: 10, prov: 8, gen: 10 },
    rx: { spec: 22, site: 5, er: 5, prov: 5, gen: 15 },
    diversion: { spec: 8, site: 18, er: 20, prov: 8, gen: 5 },
    reset: { spec: 0, site: 0, er: 0, prov: 0, gen: 0 }
  };

  const p = presets[type] || presets.balanced;

  function setLever(sliderId, boxId, val) {
    const s = document.getElementById(sliderId);
    const b = document.getElementById(boxId);
    if (s) s.value = val;
    if (b) b.value = val;
  }

  setLever('specialtyDrugRed', 'specBox', p.spec);
  setLever('siteShift', 'siteBox', p.site);
  setLever('erUtilRed', 'erBox', p.er);
  setLever('provMixOpt', 'provBox', p.prov);
  setLever('genericIncrease', 'genBox', p.gen);

  runWhatIfScenario();
}

// Export What-If Simulation Scenario to CSV
function exportWhatIfScenarioCSV() {
  const spec = parseFloat(document.getElementById('specBox')?.value || 0);
  const site = parseFloat(document.getElementById('siteBox')?.value || 0);
  const er = parseFloat(document.getElementById('erBox')?.value || 0);
  const prov = parseFloat(document.getElementById('provBox')?.value || 0);
  const gen = parseFloat(document.getElementById('genBox')?.value || 0);

  const baseline = 12.80;
  const targetCeiling = 11.50;

  // Calculate savings using the model's driver weights
  const specSavings = (spec / 100) * 0.32 * baseline;
  const siteSavings = (site / 100) * 0.16 * baseline;
  const erSavings = (er / 100) * 0.27 * baseline;
  const provSavings = (prov / 100) * 0.14 * baseline;
  const genSavings = (gen / 100) * 0.08 * baseline;

  const totalSavings = specSavings + siteSavings + erSavings + provSavings + genSavings;
  const scenarioForecast = Math.max(0, baseline - totalSavings);
  const savingsPct = (totalSavings / baseline) * 100;
  const varianceFromCeiling = scenarioForecast - targetCeiling;
  const status = scenarioForecast <= targetCeiling ? 'BUDGET PROTECTED' : 'BUDGET AT RISK';

  const rows = [
    ['TREND2ACTION - WHAT-IF COST CONTAINMENT SIMULATION BRIEF'],
    ['Generated At', new Date().toISOString()],
    ['Status', status],
    [''],
    ['--- LEVER ASSUMPTIONS ---', ''],
    ['Lever Name', 'Reduction %', 'Driver Weight', 'Monetary Savings (Cr)'],
    ['Specialty Drug Reduction', `${spec}%`, '32%', `INR ${specSavings.toFixed(3)} Cr`],
    ['Site-of-Care Redirection', `${site}%`, '16%', `INR ${siteSavings.toFixed(3)} Cr`],
    ['ER Avoidable Utilization', `${er}%`, '27%', `INR ${erSavings.toFixed(3)} Cr`],
    ['Provider Mix & Unit Cost', `${prov}%`, '14%', `INR ${provSavings.toFixed(3)} Cr`],
    ['Generic & Biosimilar Adoption', `${gen}%`, '8%', `INR ${genSavings.toFixed(3)} Cr`],
    [''],
    ['--- FINANCIAL SUMMARY ---', ''],
    ['Metric', 'Amount (Cr)'],
    ['Approved Budget Ceiling', `INR ${targetCeiling.toFixed(2)} Cr`],
    ['Baseline Uncontained Forecast', `INR ${baseline.toFixed(2)} Cr`],
    ['Total Policy Net Savings', `INR ${totalSavings.toFixed(2)} Cr (${savingsPct.toFixed(2)}%)`],
    ['Projected Scenario Spend', `INR ${scenarioForecast.toFixed(2)} Cr`],
    ['Variance from Budget Ceiling', `INR ${varianceFromCeiling > 0 ? '+' : ''}${varianceFromCeiling.toFixed(2)} Cr`],
    ['Budget Variance Outcome', status]
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Trend2Action_WhatIf_Scenario_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================
// USER PROFILE DROPDOWN INTERACTION
// ============================================================

function toggleProfileDropdown(event) {
  if (event) {
    event.stopPropagation();
  }
  const menu = document.getElementById('profileDropdownMenu');
  if (menu) {
    menu.classList.toggle('show');
  }
}

// Close dropdown when clicking outside
window.addEventListener('click', function(e) {
  const menu = document.getElementById('profileDropdownMenu');
  const btn = document.getElementById('userProfileBtn');
  if (menu && menu.classList.contains('show')) {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.classList.remove('show');
    }
  }
});

// ============================================================
// AI MEDICAL COST PREDICTION
// ============================================================

async function predictMedicalCost() {
  const btn = document.getElementById('predictButton');
  const errorBox = document.getElementById('predictionError');
  const valBox = document.getElementById('predictionValue');
  const msgBox = document.getElementById('predictionResultMessage');
  const statusBox = document.getElementById('predictionStatus');

  if (errorBox) errorBox.style.display = 'none';

  // Gather payload from input fields
  const payload = {
    age: parseFloat(document.getElementById('age')?.value || 45),
    bmi: parseFloat(document.getElementById('bmi')?.value || 27.5),
    gender: document.getElementById('gender')?.value || 'Male',
    smoking_status: document.getElementById('smoking_status')?.value || 'Never',
    physical_activity: document.getElementById('physical_activity')?.value || 'Moderate',
    stress_level: document.getElementById('stress_level')?.value || 'Low',
    diabetes: parseInt(document.getElementById('diabetes')?.value || 0),
    hypertension: parseInt(document.getElementById('hypertension')?.value || 0),
    heart_disease: parseInt(document.getElementById('heart_disease')?.value || 0),
    asthma: parseInt(document.getElementById('asthma')?.value || 0),
    daily_steps: parseInt(document.getElementById('daily_steps')?.value || 6500),
    sleep_hours: parseFloat(document.getElementById('sleep_hours')?.value || 7),
    doctor_visits: parseInt(document.getElementById('doctor_visits')?.value || 3),
    hospital_admissions: parseInt(document.getElementById('hospital_admissions')?.value || 1),
    emergency_visits: parseInt(document.getElementById('emergency_visits')?.value || 0),
    specialist_visits: parseInt(document.getElementById('specialist_visits')?.value || 2),
    lab_tests: parseInt(document.getElementById('lab_tests')?.value || 4),
    medication_count: parseInt(document.getElementById('medication_count')?.value || 3),
    average_length_of_stay_days: parseFloat(document.getElementById('average_length_of_stay_days')?.value || 2),
    insurance_type: document.getElementById('insurance_type')?.value || 'Private',
    insurance_coverage_percent: parseFloat(document.getElementById('insurance_coverage_percent')?.value || 80),
    city_type: document.getElementById('city_type')?.value || 'Urban',
    previous_year_medical_cost: parseFloat(document.getElementById('previous_year_medical_cost')?.value || 60000),
    out_of_network_rate: parseFloat(document.getElementById('out_of_network_rate')?.value || 10),
    generic_rate: parseFloat(document.getElementById('generic_rate')?.value || 75),
    pharmacy_spend: parseFloat(document.getElementById('pharmacy_spend')?.value || 5000),
    site_of_care: document.getElementById('site_of_care')?.value || 'Outpatient',
    provider_type: document.getElementById('provider_type')?.value || 'Hospital',
    provider_mix_index: parseFloat(document.getElementById('provider_mix_index')?.value || 1.1),
    unit_cost: parseFloat(document.getElementById('unit_cost')?.value || 1000),
    drug_category: document.getElementById('drug_category')?.value || 'Generic',
    drug_cost: parseFloat(document.getElementById('drug_cost')?.value || 500),
    prediction_month: document.getElementById('prediction_month')?.value || '2027-01'
  };

  // Button loading state
  const originalBtnHTML = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Calculating Estimate...</span>';
  }

  try {
    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || 'Failed to predict medical cost.');
    }

    const costVal = parseFloat(data.predicted_monthly_cost || 0);
    const formattedCost = costVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const periodStr = data.prediction_period || (document.getElementById('prediction_month')?.value || '2027-01');

    if (valBox) {
      valBox.innerText = `₹ ${formattedCost}`;
      valBox.style.color = '#0284c7';
    }

    const currencyBadge = document.getElementById('predictionCurrency');
    if (currencyBadge) {
      if (data.lower_confidence_band && data.upper_confidence_band) {
        currencyBadge.innerHTML = `INR / MONTH (${periodStr}) &nbsp;•&nbsp; <span style="color: #0369a1; font-weight: 600;">80% Actuarial CI: ₹ ${data.lower_confidence_band.toLocaleString('en-IN', {maximumFractionDigits:0})} – ₹ ${data.upper_confidence_band.toLocaleString('en-IN', {maximumFractionDigits:0})}</span>`;
      } else {
        currencyBadge.innerText = `INR / MONTH (${periodStr})`;
      }
    }

    // Dynamically update advisor button link
    const advisorBtn = document.getElementById('viewAdvisorBtn');
    if (advisorBtn) {
      const riskTier = costVal > 30000 ? 'high' : (costVal > 15000 ? 'moderate' : 'low');
      advisorBtn.href = `/advisor?predicted_cost=${costVal.toFixed(2)}&tier=${riskTier}&period=${periodStr}`;
    }

    if (msgBox) {
      const trendText = data.annual_trend_multiplier ? ` (Trend Factor: ${((data.annual_trend_multiplier - 1.0) * 100).toFixed(1)}% YoY)` : '';
      if (costVal > 30000) {
        msgBox.innerHTML = `<span style="color: #dc2626; font-weight: 700;">High-Cost Risk Profile for ${periodStr}:</span> Elevated pharmacy spend and inpatient utilization detected${trendText}. Prior authorization and disease management recommended.`;
      } else if (costVal > 15000) {
        msgBox.innerHTML = `<span style="color: #d97706; font-weight: 700;">Moderate Cost Profile for ${periodStr}:</span> Expected monthly utilization within normal benchmark range${trendText}.`;
      } else {
        msgBox.innerHTML = `<span style="color: #16a34a; font-weight: 700;">Low-Cost Profile for ${periodStr}:</span> Preventive lifestyle habits and low admission frequency keep projected cost well contained${trendText}.`;
      }
    }


    // Render dynamic tailored advisor options & AI Feature Attribution based on predicted cost
    const advisorContainer = document.getElementById('predictedAdvisorContainer');
    if (advisorContainer) {
      advisorContainer.style.display = 'block';

      // Compute Patient Feature Attribution (Explainability)
      let attributionPills = [];
      if (payload.pharmacy_spend > 4000 || payload.drug_category === 'Specialty') {
        attributionPills.push(`<span style="background: #fee2e2; color: #b91c1c; font-size: 11.5px; padding: 3px 8px; border-radius: 4px; font-weight: 600;">+ Specialty Rx & Pharmacy Load</span>`);
      }
      if (payload.hospital_admissions >= 1 || payload.emergency_visits >= 1) {
        attributionPills.push(`<span style="background: #ffedd5; color: #c2410c; font-size: 11.5px; padding: 3px 8px; border-radius: 4px; font-weight: 600;">+ Acute Care Utilization</span>`);
      }
      if (payload.diabetes === 1 || payload.hypertension === 1 || payload.heart_disease === 1 || payload.asthma === 1) {
        attributionPills.push(`<span style="background: #fef3c7; color: #b45309; font-size: 11.5px; padding: 3px 8px; border-radius: 4px; font-weight: 600;">+ Chronic Disease Complexity</span>`);
      }
      if (payload.out_of_network_rate > 15) {
        attributionPills.push(`<span style="background: #f1f5f9; color: #475569; font-size: 11.5px; padding: 3px 8px; border-radius: 4px; font-weight: 600;">+ Out-of-Network Exposure</span>`);
      }
      if (payload.physical_activity === 'High' || payload.daily_steps >= 8000) {
        attributionPills.push(`<span style="background: #dcfce7; color: #15803d; font-size: 11.5px; padding: 3px 8px; border-radius: 4px; font-weight: 600;">- Active Lifestyle Benefit</span>`);
      }

      let attributionHTML = '';
      if (attributionPills.length > 0) {
        attributionHTML = `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; text-align: left;">
            <div style="font-size: 11.5px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em;">
              <i class="fa-solid fa-microchip" style="color: var(--accent-blue);"></i> AI Feature Attribution (Spend Drivers for this Member):
            </div>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              ${attributionPills.join('')}
            </div>
          </div>
        `;
      }

      let advisorHTML = attributionHTML;

      if (costVal > 30000) {
        advisorHTML = `
          <div class="predicted-advisors-panel">
            <div class="predicted-advisors-title">
              <i class="fa-solid fa-lightbulb" style="color: #e11d48;"></i>
              <span>High-Cost Patient Savings Recommendations (Saves up to ₹ 17,600/mo):</span>
            </div>

            <div class="predicted-advisor-item">
              <div class="predicted-advisor-top">
                <span class="advisor-badge-pill badge-high">High Priority • Medicine Lever</span>
                <span class="advisor-savings-text">Saves ₹ 3,500 – ₹ 6,000/mo</span>
              </div>
              <div class="predicted-advisor-name">Switch to Quality Generic Alternatives for Costly Medicines</div>
              <div class="predicted-advisor-desc">Start with proven, lower-cost generic alternatives (biosimilars) and review doctor approvals every 3 months.</div>
              <a href="/advisor?predicted_cost=${costVal.toFixed(2)}&tier=high" class="predicted-advisor-link">
                <span>View Full Plan Details</span> <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>

            <div class="predicted-advisor-item">
              <div class="predicted-advisor-top">
                <span class="advisor-badge-pill badge-high">High Priority • Clinic Choice</span>
                <span class="advisor-savings-text">Saves ₹ 2,800 – ₹ 5,200/mo</span>
              </div>
              <div class="predicted-advisor-name">Choose Day-Care Clinics Over Overnight Hospital Stays</div>
              <div class="predicted-advisor-desc">Move routine treatments and minor procedures to specialized day-care clinics with the same safety at half the price.</div>
              <a href="/advisor?predicted_cost=${costVal.toFixed(2)}&tier=high" class="predicted-advisor-link">
                <span>View Full Plan Details</span> <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>

            <div class="predicted-advisor-item">
              <div class="predicted-advisor-top">
                <span class="advisor-badge-pill badge-high">High Priority • Personal Care</span>
                <span class="advisor-savings-text">Saves ₹ 3,200 – ₹ 6,400/mo</span>
              </div>
              <div class="predicted-advisor-name">Personal Nurse Support for High-Need Patients</div>
              <div class="predicted-advisor-desc">Assign a dedicated nurse to guide chronic patients and follow up within 48 hours of any hospital visit.</div>
              <a href="/advisor?predicted_cost=${costVal.toFixed(2)}&tier=high" class="predicted-advisor-link">
                <span>View Full Plan Details</span> <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>
          </div>
        `;
      } else if (costVal > 15000) {
        advisorHTML = `
          <div class="predicted-advisors-panel">
            <div class="predicted-advisors-title">
              <i class="fa-solid fa-lightbulb" style="color: #d97706;"></i>
              <span>Cost Optimization Opportunities (Saves up to ₹ 9,200/mo):</span>
            </div>

            <div class="predicted-advisor-item">
              <div class="predicted-advisor-top">
                <span class="advisor-badge-pill badge-mod">Medium Priority • Doctor Access</span>
                <span class="advisor-savings-text">Saves ₹ 1,500 – ₹ 3,000/mo</span>
              </div>
              <div class="predicted-advisor-name">Free 24/7 Doctor Phone & Video Advice</div>
              <div class="predicted-advisor-desc">Provide a 24/7 medical hotline so patients can check minor symptoms without an expensive emergency room bill.</div>
              <a href="/advisor?predicted_cost=${costVal.toFixed(2)}&tier=moderate" class="predicted-advisor-link">
                <span>View Full Plan Details</span> <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>

            <div class="predicted-advisor-item">
              <div class="predicted-advisor-top">
                <span class="advisor-badge-pill badge-mod">Medium Priority • Hospital Network</span>
                <span class="advisor-savings-text">Saves ₹ 2,000 – ₹ 3,800/mo</span>
              </div>
              <div class="predicted-advisor-name">Visit Top-Rated Partner Doctors & Hospitals</div>
              <div class="predicted-advisor-desc">Offer lower consultation fees when patients choose trusted in-network doctors with proven high recovery rates.</div>
              <a href="/advisor?predicted_cost=${costVal.toFixed(2)}&tier=moderate" class="predicted-advisor-link">
                <span>View Full Plan Details</span> <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>

            <div class="predicted-advisor-item">
              <div class="predicted-advisor-top">
                <span class="advisor-badge-pill badge-mod">Medium Priority • Pharmacy</span>
                <span class="advisor-savings-text">Saves ₹ 1,200 – ₹ 2,400/mo</span>
              </div>
              <div class="predicted-advisor-name">3-Month Home Delivery for Daily Medications</div>
              <div class="predicted-advisor-desc">Provide automated generic medicine refills with 90-day doorstep delivery to save patient trips and expenses.</div>
              <a href="/advisor?predicted_cost=${costVal.toFixed(2)}&tier=moderate" class="predicted-advisor-link">
                <span>View Full Plan Details</span> <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>
          </div>
        `;
      } else {
        advisorHTML = `
          <div class="predicted-advisors-panel">
            <div class="predicted-advisors-title">
              <i class="fa-solid fa-lightbulb" style="color: #16a34a;"></i>
              <span>Preventive Care & Billing Advice (Saves up to ₹ 4,000/mo):</span>
            </div>

            <div class="predicted-advisor-item">
              <div class="predicted-advisor-top">
                <span class="advisor-badge-pill badge-low">Low Priority • Prevention</span>
                <span class="advisor-savings-text">Saves ₹ 800 – ₹ 1,600/mo</span>
              </div>
              <div class="predicted-advisor-name">Smart Blood Pressure & Sugar Health Tracking</div>
              <div class="predicted-advisor-desc">Equip patients with easy smart monitors that share daily readings with doctors for early dietary guidance.</div>
              <a href="/advisor?predicted_cost=${costVal.toFixed(2)}&tier=low" class="predicted-advisor-link">
                <span>View Full Plan Details</span> <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>

            <div class="predicted-advisor-item">
              <div class="predicted-advisor-top">
                <span class="advisor-badge-pill badge-low">Low Priority • Billing Check</span>
                <span class="advisor-savings-text">Saves ₹ 500 – ₹ 1,500/mo</span>
              </div>
              <div class="predicted-advisor-name">Pre-Payment Hospital Bill Verification</div>
              <div class="predicted-advisor-desc">Review medical bills before payment to catch billing errors, duplicate fees, and unfair markups.</div>
              <a href="/advisor?predicted_cost=${costVal.toFixed(2)}&tier=low" class="predicted-advisor-link">
                <span>View Full Plan Details</span> <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>
          </div>
        `;
      }

      advisorContainer.innerHTML = advisorHTML;
    }

    if (statusBox) {
      statusBox.style.display = 'block';
      statusBox.innerHTML = `<i class="fa-solid fa-check-circle" style="color:#16a34a;"></i> Prediction & Advisor Recommendations generated successfully.`;
    }
  } catch (err) {
    if (errorBox) {
      errorBox.textContent = `Prediction Error: ${err.message}`;
      errorBox.style.display = 'block';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHTML;
    }
  }
}

// Period preset chip click handler
function setPeriodAndPredict(periodVal, btnElement) {
  const monthInput = document.getElementById('prediction_month');
  if (monthInput) {
    monthInput.value = periodVal;
  }
  updatePeriodChipActiveState(periodVal);
  if (typeof predictMedicalCost === 'function') {
    predictMedicalCost();
  }
}

// Update period chip active state
function updatePeriodChipActiveState(periodVal) {
  const chips = document.querySelectorAll('.btn-period-chip');
  chips.forEach(chip => {
    if (chip.getAttribute('data-period') === periodVal) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}



