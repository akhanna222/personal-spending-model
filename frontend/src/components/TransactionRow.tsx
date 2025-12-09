import { Transaction } from '../types';

interface TransactionRowProps {
  transaction: Transaction;
  showEnhanced: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onViewDetails: (transaction: Transaction) => void;
  getCategoryColor: (category: string) => string;
}

export default function TransactionRow({
  transaction,
  showEnhanced,
  isSelected,
  onSelect,
  onViewDetails,
  getCategoryColor,
}: TransactionRowProps) {
  const formatAmount = (amount: number, currency: string) => {
    const formatted = Math.abs(amount).toFixed(2);
    return `${currency === 'EUR' ? '€' : '$'}${formatted}`;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence?: number) => {
    if (!confidence) return 'N/A';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <tr
      className={`hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-sky-50' : ''}`}
      onClick={() => onViewDetails(transaction)}
    >
      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(transaction.id)}
          className="w-4 h-4 text-primary rounded"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDate(transaction.date)}
      </td>
      <td className="px-6 py-4">
        <div className="max-w-md">
          {showEnhanced && transaction.enhancedDescription ? (
            <>
              <p className="text-sm font-medium text-gray-900 truncate">
                {transaction.enhancedDescription}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {transaction.rawDescription}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-900 truncate">
              {transaction.rawDescription}
            </p>
          )}
          {transaction.merchant && (
            <p className="text-xs text-primary font-medium mt-1">
              {transaction.merchant}
            </p>
          )}
        </div>
      </td>
      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
        transaction.isIncome ? 'text-green-600' : 'text-gray-900'
      }`}>
        {transaction.isIncome && '+'}{formatAmount(transaction.amount, transaction.currency)}
      </td>
      <td className="px-6 py-4">
        {transaction.primaryCategory ? (
          <div className="space-y-1">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              getCategoryColor(transaction.primaryCategory)
            }`}>
              {transaction.primaryCategory.replace(/_/g, ' ')}
            </span>
            {transaction.detailedCategory && (
              <p className="text-xs text-gray-600">
                {transaction.detailedCategory.replace(/_/g, ' ')}
              </p>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">Uncategorized</span>
        )}
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`text-sm font-medium ${getConfidenceColor(transaction.categoryConfidence)}`}>
          {getConfidenceLabel(transaction.categoryConfidence)}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-primary hover:text-secondary text-sm font-medium">
          Details →
        </button>
      </td>
    </tr>
  );
}
