import { useState, useEffect } from 'react';
import { Transaction, Category } from '../types';
import { getDetailedCategories } from '../services/api';

interface TransactionDrawerProps {
  transaction: Transaction;
  categories: Category[];
  primaryCategories: string[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  getCategoryColor: (category: string) => string;
}

export default function TransactionDrawer({
  transaction,
  categories,
  primaryCategories,
  onClose,
  onUpdate,
  getCategoryColor,
}: TransactionDrawerProps) {
  const [editedPrimary, setEditedPrimary] = useState(transaction.primaryCategory || '');
  const [editedDetailed, setEditedDetailed] = useState(transaction.detailedCategory || '');
  const [detailedOptions, setDetailedOptions] = useState<Category[]>([]);

  useEffect(() => {
    if (editedPrimary) {
      loadDetailedCategories(editedPrimary);
    }
  }, [editedPrimary]);

  const loadDetailedCategories = async (primary: string) => {
    try {
      const response = await getDetailedCategories(primary);
      setDetailedOptions(response.detailedCategories);
      // Reset detailed category if it doesn't match new primary
      const validDetailed = response.detailedCategories.find(
        c => c.DETAILED === editedDetailed
      );
      if (!validDetailed && response.detailedCategories.length > 0) {
        setEditedDetailed(response.detailedCategories[0].DETAILED);
      }
    } catch (error) {
      console.error('Error loading detailed categories:', error);
    }
  };

  const handleSave = () => {
    onUpdate(transaction.id, {
      primaryCategory: editedPrimary,
      detailedCategory: editedDetailed,
    });
  };

  const selectedCategory = categories.find(c => c.DETAILED === editedDetailed);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Basic Info */}
          <div className="space-y-4 mb-8">
            <div>
              <label className="text-sm font-medium text-gray-500">Date</label>
              <p className="text-lg text-gray-900">{transaction.date}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Amount</label>
              <p className={`text-2xl font-bold ${
                transaction.isIncome ? 'text-green-600' : 'text-gray-900'
              }`}>
                {transaction.isIncome && '+'}{transaction.currency === 'EUR' ? '€' : '$'}
                {Math.abs(transaction.amount).toFixed(2)}
              </p>
            </div>

            {transaction.merchant && (
              <div>
                <label className="text-sm font-medium text-gray-500">Merchant</label>
                <p className="text-lg font-semibold text-primary">{transaction.merchant}</p>
              </div>
            )}
          </div>

          {/* Descriptions */}
          <div className="space-y-4 mb-8">
            <div>
              <label className="text-sm font-medium text-gray-500">Raw Bank Description</label>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                {transaction.rawDescription}
              </p>
            </div>

            {transaction.enhancedDescription && (
              <div>
                <label className="text-sm font-medium text-gray-500">AI-Enhanced Description</label>
                <p className="text-sm text-gray-900 bg-sky-50 p-3 rounded-lg border border-sky-200">
                  {transaction.enhancedDescription}
                </p>
              </div>
            )}
          </div>

          {/* Attributes */}
          {(transaction.channel || transaction.isRecurring) && (
            <div className="mb-8">
              <label className="text-sm font-medium text-gray-500 mb-2 block">Attributes</label>
              <div className="flex gap-2">
                {transaction.channel && transaction.channel !== 'unknown' && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {transaction.channel}
                  </span>
                )}
                {transaction.isRecurring && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                    Recurring
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Category Selection */}
          <div className="mb-8 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorization</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Category
                </label>
                <select
                  value={editedPrimary}
                  onChange={(e) => setEditedPrimary(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select primary category</option>
                  {primaryCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {editedPrimary && detailedOptions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Category
                  </label>
                  <select
                    value={editedDetailed}
                    onChange={(e) => setEditedDetailed(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {detailedOptions.map(cat => (
                      <option key={cat.DETAILED} value={cat.DETAILED}>
                        {cat.DETAILED.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedCategory && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">{selectedCategory.DESCRIPTION}</p>
                </div>
              )}
            </div>

            {transaction.categoryConfidence !== undefined && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-500">AI Confidence</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        transaction.categoryConfidence >= 0.8
                          ? 'bg-green-500'
                          : transaction.categoryConfidence >= 0.6
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${transaction.categoryConfidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {Math.round(transaction.categoryConfidence * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t pt-6">
            <button
              onClick={handleSave}
              className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-secondary transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
