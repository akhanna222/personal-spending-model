import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransactions } from '../services/api';
import { Transaction } from '../types';
import TransactionRow from '../components/TransactionRow';
import TransactionDrawer from '../components/TransactionDrawer';
import { getCategories, updateTransaction } from '../services/api';
import { Category } from '../types';

export default function Review() {
  const navigate = useNavigate();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [lowConfidenceTransactions, setLowConfidenceTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [primaryCategories, setPrimaryCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'low-confidence' | 'edited'>('low-confidence');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [txnData, catData] = await Promise.all([
        getTransactions({ limit: 1000 }),
        getCategories(),
      ]);

      const transactions = txnData.transactions;
      setAllTransactions(transactions);

      // Filter low confidence transactions
      const lowConf = transactions.filter(
        t => !t.primaryCategory || !t.categoryConfidence || t.categoryConfidence < 0.7
      );
      setLowConfidenceTransactions(lowConf);

      setCategories(catData.categories);
      setPrimaryCategories(catData.primaryCategories);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      await updateTransaction(id, updates);
      setAllTransactions(prev =>
        prev.map(t => (t.id === id ? { ...t, ...updates } : t))
      );
      setLowConfidenceTransactions(prev =>
        prev.map(t => (t.id === id ? { ...t, ...updates } : t))
      );
      setSelectedTransaction(null);
    } catch (error: any) {
      alert(`Update failed: ${error.response?.data?.error || error.message}`);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      INCOME: 'bg-green-100 text-green-800',
      FOOD_AND_DRINK: 'bg-orange-100 text-orange-800',
      RENT_AND_UTILITIES: 'bg-blue-100 text-blue-800',
      TRANSPORTATION: 'bg-yellow-100 text-yellow-800',
      ENTERTAINMENT: 'bg-purple-100 text-purple-800',
      SHOPPING: 'bg-pink-100 text-pink-800',
      MEDICAL: 'bg-red-100 text-red-800',
      TRAVEL: 'bg-cyan-100 text-cyan-800',
      EDUCATION: 'bg-indigo-100 text-indigo-800',
      PERSONAL_CARE: 'bg-teal-100 text-teal-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const categorizedCount = allTransactions.filter(t => t.primaryCategory).length;
  const categorizedPct = allTransactions.length > 0
    ? Math.round((categorizedCount / allTransactions.length) * 100)
    : 0;

  const displayedTransactions = activeTab === 'all'
    ? allTransactions
    : activeTab === 'low-confidence'
    ? lowConfidenceTransactions
    : []; // TODO: Add edited transactions tracking

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
              <span className="text-lg font-medium text-gray-700">Review & Confirm</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/transactions')}
                className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-sky-50"
              >
                Back to Transactions
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary"
              >
                Generate Insights →
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-3 gap-8">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
              <p className="text-3xl font-bold text-gray-900">{allTransactions.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Auto-Categorized Confidently</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-green-600">{categorizedPct}%</p>
                <p className="text-sm text-gray-500">({categorizedCount} transactions)</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Needing Attention</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-orange-600">
                  {Math.round((lowConfidenceTransactions.length / allTransactions.length) * 100) || 0}%
                </p>
                <p className="text-sm text-gray-500">({lowConfidenceTransactions.length} transactions)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-lg shadow">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Transactions
            </button>
            <button
              onClick={() => setActiveTab('low-confidence')}
              className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === 'low-confidence'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Low Confidence Only
              {lowConfidenceTransactions.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs">
                  {lowConfidenceTransactions.length}
                </span>
              )}
            </button>
          </div>

          {/* Transactions List */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading transactions...</p>
              </div>
            ) : displayedTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  All transactions look good!
                </h3>
                <p className="text-gray-600 mb-6">
                  All transactions have been confidently categorized. You're ready to view insights.
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-secondary"
                >
                  Generate Insights →
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedTransactions.map(transaction => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      showEnhanced={true}
                      isSelected={false}
                      onSelect={() => {}}
                      onViewDetails={setSelectedTransaction}
                      getCategoryColor={getCategoryColor}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Call to Action */}
        {!loading && displayedTransactions.length > 0 && (
          <div className="mt-6 bg-sky-50 border border-sky-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to see your insights?
                </h3>
                <p className="text-gray-700">
                  Review the low-confidence transactions above or proceed to generate your spending insights.
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-secondary whitespace-nowrap"
              >
                Generate Insights →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Transaction Drawer */}
      {selectedTransaction && (
        <TransactionDrawer
          transaction={selectedTransaction}
          categories={categories}
          primaryCategories={primaryCategories}
          onClose={() => setSelectedTransaction(null)}
          onUpdate={handleUpdateTransaction}
          getCategoryColor={getCategoryColor}
        />
      )}
    </div>
  );
}
