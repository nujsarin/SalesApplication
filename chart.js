/* ============================================================
   chart.js — Chart.js wrapper helpers
   ============================================================ */
'use strict';

window.ChartUtil = {
  _instances: {},

  defaults() {
    Chart.defaults.font.family = "'Inter','Sarabun',system-ui,sans-serif";
    Chart.defaults.color = '#888';
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.plugins.tooltip.backgroundColor = '#1A1A1A';
    Chart.defaults.plugins.tooltip.titleColor = '#F5C842';
    Chart.defaults.plugins.tooltip.bodyColor = '#fff';
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.displayColors = false;
  },

  destroy(id) {
    if (this._instances[id]) {
      this._instances[id].destroy();
      delete this._instances[id];
    }
  },

  // ── Line Chart: SO Pace vs Plan ────────────────────────────
  renderPaceChart(canvasId, labels, actual, planned) {
    this.destroy(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    this._instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Actual',
            data: actual,
            borderColor: '#F5C842',
            backgroundColor: 'rgba(245,200,66,0.08)',
            borderWidth: 2.5,
            pointRadius: 3,
            pointBackgroundColor: '#F5C842',
            tension: 0.3,
            fill: true,
          },
          {
            label: 'Plan',
            data: planned,
            borderColor: '#ccc',
            borderWidth: 1.5,
            borderDash: [5, 4],
            pointRadius: 0,
            tension: 0.3,
            fill: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 8, font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              font: { size: 10 },
              callback: v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v
            }
          }
        },
        plugins: {
          legend: { display: true, position: 'bottom',
            labels: { boxWidth: 10, padding: 12, font: { size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ฿${new Intl.NumberFormat('th-TH').format(ctx.parsed.y)}`
            }
          }
        }
      }
    });
  },

  // ── Bar Chart: Monthly Summary ─────────────────────────────
  renderBarChart(canvasId, labels, data, color = '#F5C842') {
    this.destroy(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    this._instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: color,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              font: { size: 10 },
              callback: v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => `฿${new Intl.NumberFormat('th-TH').format(ctx.parsed.y)}`
            }
          }
        }
      }
    });
  },

  // ── Doughnut Chart: Tier Progress ─────────────────────────
  renderDonut(canvasId, value, max, color) {
    this.destroy(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    const pct = Math.min(value / max, 1);
    this._instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [pct, 1 - pct],
          backgroundColor: [color, '#F2F2F2'],
          borderWidth: 0,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        cutout: '78%',
        plugins: { tooltip: { enabled: false } }
      }
    });
  },

  // ── Billing Group Bar ──────────────────────────────────────
  renderGroupBar(canvasId, labels, data) {
    this.destroy(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    const colors = ['#F5C842','#FDCD72','#1A1A1A','#888','#ddd'];
    this._instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderRadius: 6,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              font: { size: 10 },
              callback: v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v
            }
          },
          y: { grid: { display: false }, ticks: { font: { size: 10 } } }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => `฿${new Intl.NumberFormat('th-TH').format(ctx.parsed.x)}`
            }
          }
        }
      }
    });
  }
};
