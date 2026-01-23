import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTransactions,
  enhanceTransactions,
  updateTransaction,
  getCategories,
} from '../services/api';
import { Transaction, Category } from '../types';
import TransactionRow from '../components/TransactionRow';
import TransactionDrawer from '../components/TransactionDrawer';

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [primaryCategories, setPrimaryCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [enhancing, setEnhancing] = useState(false);
  const [showEnhanced, setShowEnhanced] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [txnData, catData] = await Promise.all([
        getTransactions({
          search: searchQuery || undefined,
          primaryCategory: selectedCategory || undefined,
        }),
        getCategories(),
      ]);

      setTransactions(txnData.transactions);
      setCategories(catData.categories);
      setPrimaryCategories(catData.primaryCategories);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnhanceAll = async () => {
    if (transactions.length === 0) return;

    const unenhancedIds = transactions
      .filter(t => !t.enhancedDescription)
      .map(t => t.id);

    if (unenhancedIds.length === 0) {
      alert('All transactions are already enhanced!');
      return;
    }

    if (!confirm(`This will enhance ${unenhancedIds.length} transactions using AI. This may take a few minutes. Continue?`)) {
      return;
    }

    setEnhancing(true);
    try {
      await enhanceTransactions(unenhancedIds);
      await loadData(); // Reload to get enhanced data
      alert('Transactions enhanced successfully!');
    } catch (error: any) {
      alert(`Enhancement failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setEnhancing(false);
    }
  };

  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      await updateTransaction(id, updates);
      setTransactions(prev =>
        prev.map(t => (t.id === id ? { ...t, ...updates } : t))
      );
      setSelectedTransaction(null);
    } catch (error: any) {
      alert(`Update failed: ${error.response?.data?.error || error.message}`);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)));
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

  const enhancedCount = transactions.filter(t => t.enhancedDescription).length;
  const lowConfidenceCount = transactions.filter(t => (t.categoryConfidence || 0) < 0.7).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
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
              <span className="text-lg font-medium text-gray-700">Transactions</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/review')}
                className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-sky-50"
              >
                Review & Confirm
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary"
              >
                View Insights
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">AI Enhanced</p>
              <p className="text-2xl font-bold text-green-600">
                {enhancedCount} <span className="text-sm text-gray-500">({Math.round(enhancedCount / transactions.length * 100) || 0}%)</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Low Confidence</p>
              <p className="text-2xl font-bold text-orange-600">{lowConfidenceCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Selected</p>
              <p className="text-2xl font-bold text-primary">{selectedTransactions.size}</p>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Categories</option>
              {primaryCategories.map(cat => (
                <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-enhanced"
                checked={showEnhanced}
                onChange={(e) => setShowEnhanced(e.target.checked)}
                className="w-4 h-4 text-primary rounded"
              />
              <label htmlFor="show-enhanced" className="text-sm text-gray-700">
                Show AI descriptions
              </label>
            </div>

            <button
              onClick={handleEnhanceAll}
              disabled={enhancing || transactions.length === 0}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {enhancing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Enhancing...
                </>
              ) : (
                'Enhance All with AI'
              )}
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.size === transactions.length}
                        onChange={selectAll}
                        className="w-4 h-4 text-primary rounded"
                      />
                    </th>
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
                  {transactions.map(transaction => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      showEnhanced={showEnhanced}
                      isSelected={selectedTransactions.has(transaction.id)}
                      onSelect={toggleSelection}
                      onViewDetails={setSelectedTransaction}
                      getCategoryColor={getCategoryColor}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Transaction Drawer */}
      {selectedTransaction && (
        <TransactionDrawer
          transaction={selectedTransaction}
          categories={categories}
          primaryCategories={primaryCategories}
          onClose={() => setSelectedTransaction(null)}
          onUpdate={handleUpdateTransaction}
        />
      )}
    </div>
  );
}
