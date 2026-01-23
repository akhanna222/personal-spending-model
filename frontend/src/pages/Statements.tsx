import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';

interface BankStatement {
  id: string;
  file_name: string;
  file_type: string;
  upload_date: string;
  total_transactions: number;
  date_range_start?: string;
  date_range_end?: string;
  metadata?: any;
}

interface StatementStats {
  totalStatements: number;
  totalTransactions: number;
  earliestDate?: string;
  latestDate?: string;
}

export default function Statements() {
  const navigate = useNavigate();
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [stats, setStats] = useState<StatementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statementsRes, statsRes] = await Promise.all([
        axios.get(`http://localhost:3001/api/statements?page=${page}&limit=20`),
        axios.get('http://localhost:3001/api/statements/stats'),
      ]);

      setStatements(statementsRes.data.statements || []);
      setTotalPages(statementsRes.data.pagination?.pages || 1);
      setStats(statsRes.data.stats);
    } catch (error: any) {
      console.error('Load error:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteStatement = async (id: string, fileName: string) => {
    if (!confirm(`Delete "${fileName}"? All associated transactions will be removed.`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3001/api/statements/${id}`);
      await loadData();
      alert('Statement deleted successfully');
    } catch (error: any) {
      console.error('Delete error:', error);
      alert('Failed to delete statement');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading statements...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bank Statements</h1>
          <p className="text-gray-600 mt-1">View and manage all uploaded statements</p>

          {/* Stats */}
          {stats && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600">Total Statements</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStatements}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalTransactions.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600">Earliest Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.earliestDate ? formatDate(stats.earliestDate) : 'N/A'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600">Latest Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.latestDate ? formatDate(stats.latestDate) : 'N/A'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Statements List */}
        {statements.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No statements uploaded yet.</p>
            <p className="text-gray-400 mt-2">Go to the Upload page to add your first statement.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-6 py-3 bg-sky-600 text-white rounded-md hover:bg-sky-700"
            >
              Upload Statement
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Upload Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transactions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Range
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {statements.map((statement) => (
                    <tr key={statement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {statement.file_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(statement.upload_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{statement.total_transactions}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {statement.date_range_start && statement.date_range_end ? (
                          <>
                            {formatDate(statement.date_range_start)} -{' '}
                            {formatDate(statement.date_range_end)}
                          </>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {statement.file_type?.split('/')[1]?.toUpperCase() || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => deleteStatement(statement.id, statement.file_name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
