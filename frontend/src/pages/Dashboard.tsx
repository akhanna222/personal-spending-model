import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInsights, exportCSV } from '../services/api';
import { BehavioralInsights } from '../types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<BehavioralInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const data = await getInsights();
      setInsights(data);
    } catch (error) {
      console.error('Error loading insights:', error);
      alert('Failed to load insights. Please ensure you have uploaded and categorized transactions.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await exportCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'spendlens_transactions.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Generating your spending insights...</p>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-lg text-gray-600 mb-4">Unable to generate insights. Please ensure you have uploaded and categorized transactions.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary"
          >
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;
  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const COLORS = [
    '#0ea5e9', '#f97316', '#8b5cf6', '#ec4899', '#10b981',
    '#f59e0b', '#ef4444', '#06b6d4', '#6366f1', '#14b8a6',
  ];

  const categoryPieData = insights.categoryBreakdown.slice(0, 8).map(cat => ({
    name: cat.primaryCategory.replace(/_/g, ' '),
    value: cat.totalAmount,
    percentage: cat.percentage,
  }));

  const selectedCategoryData = selectedCategory
    ? insights.categoryBreakdown.find(c => c.primaryCategory === selectedCategory)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-2xl font-bold text-primary"
              >
                SpendLens
              </button>
              <span className="text-gray-300">|</span>
              <span className="text-lg font-medium text-gray-700">Spending Dashboard</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/transactions')}
                className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-sky-50"
              >
                View Transactions
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300"
              >
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Spending Patterns for {formatMonth(insights.period.start)} – {formatMonth(insights.period.end)}
          </h1>
          <p className="text-gray-600">Here's how you earn and spend money over time</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Average Monthly Income</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(insights.summary.avgMonthlyIncome)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Average Monthly Spend</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(insights.summary.avgMonthlySpend)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Savings Rate</p>
            <p className="text-3xl font-bold text-primary">
              {insights.summary.savingsRate.toFixed(1)}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Recurring Payments</p>
            <p className="text-3xl font-bold text-purple-600">
              {insights.summary.recurringPaymentsCount}
            </p>
          </div>
        </div>

        {/* Income vs Spend Over Time */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Income vs Spend Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={insights.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={formatMonth} />
              <YAxis tickFormatter={(value) => `€${value}`} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={formatMonth}
              />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
              <Line type="monotone" dataKey="spend" stroke="#ef4444" strokeWidth={2} name="Spend" />
              <Line type="monotone" dataKey="net" stroke="#0ea5e9" strokeWidth={2} name="Net" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Two Column Layout for Charts */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Spend by Category (Pie) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Spend by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(data) => setSelectedCategory(
                    insights.categoryBreakdown.find(c => c.primaryCategory.replace(/_/g, ' ') === data.name)?.primaryCategory || null
                  )}
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top 5 Detailed Categories */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Spending Categories</h2>
            <div className="space-y-4">
              {insights.categoryBreakdown.slice(0, 5).map((cat, idx) => (
                <div key={cat.primaryCategory}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {cat.primaryCategory.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(cat.totalAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: COLORS[idx % COLORS.length],
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{cat.percentage.toFixed(1)}% of total spend</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Drill-down */}
        {selectedCategoryData && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedCategoryData.primaryCategory.replace(/_/g, ' ')} Breakdown
              </h2>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close ×
              </button>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={selectedCategoryData.detailedBreakdown.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="detailedCategory"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tickFormatter={(value) => value.replace(/_/g, ' ').substring(0, 20)}
                />
                <YAxis tickFormatter={(value) => `€${value}`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => label.replace(/_/g, ' ')}
                />
                <Bar dataKey="amount" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Spending Patterns */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Spending Pattern Analysis</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {formatCurrency(insights.spending_patterns.fixed)}
              </div>
              <p className="text-sm text-gray-600">Fixed Costs</p>
              <p className="text-xs text-gray-500 mt-1">Rent, utilities, loans</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-600 mb-2">
                {formatCurrency(insights.spending_patterns.variable)}
              </div>
              <p className="text-sm text-gray-600">Variable Costs</p>
              <p className="text-xs text-gray-500 mt-1">Groceries, transport</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {formatCurrency(insights.spending_patterns.discretionary)}
              </div>
              <p className="text-sm text-gray-600">Discretionary</p>
              <p className="text-xs text-gray-500 mt-1">Entertainment, shopping</p>
            </div>
          </div>
        </div>

        {/* Recurring Payments */}
        {insights.recurringPayments.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recurring Payments Detected</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.recurringPayments.map((payment, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 truncate">{payment.merchant}</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {formatCurrency(payment.amount)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-600 capitalize">{payment.frequency}</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {payment.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights Cards */}
        <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Key Insights</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {insights.insights.map((insight, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-gray-800">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Forecast */}
        {insights.forecast && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">3-Month Spending Forecast</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {insights.forecast.nextThreeMonths.map((forecast, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">{formatMonth(forecast.month)}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(forecast.expectedSpend)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Confidence: <span className="font-medium capitalize">{forecast.confidence}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
