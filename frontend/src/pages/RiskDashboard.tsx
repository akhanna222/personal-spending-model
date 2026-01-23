import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';

interface RiskPattern {
  id: string;
  pattern_type: string;
  pattern_name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  detected_at: string;
  timeframe?: string;
  amount_involved?: number;
  recommendation?: string;
  affected_transactions?: any[];
}

interface RiskStats {
  totalPatterns: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  withFeedback: number;
  averageConfidence: number;
}

export default function RiskDashboard() {
  const navigate = useNavigate();
  const [patterns, setPatterns] = useState<RiskPattern[]>([]);
  const [stats, setStats] = useState<RiskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<RiskPattern | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState(false);

  // Feedback state
  const [isAccurate, setIsAccurate] = useState(true);
  const [isRelevant, setIsRelevant] = useState(true);
  const [feedbackNotes, setFeedbackNotes] = useState('');

  // Edit state
  const [editedDescription, setEditedDescription] = useState('');
  const [editedRecommendation, setEditedRecommendation] = useState('');
  const [editedSeverity, setEditedSeverity] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [patternsRes, statsRes] = await Promise.all([
        axios.get('http://localhost:3001/api/risks/patterns'),
        axios.get('http://localhost:3001/api/risks/stats'),
      ]);

      setPatterns(patternsRes.data.patterns || []);
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

  const analyzeRisks = async () => {
    try {
      setAnalyzing(true);
      await axios.post('http://localhost:3001/api/risks/analyze', {});
      await loadData();
      alert('Risk analysis complete!');
    } catch (error: any) {
      console.error('Analysis error:', error);
      alert(error.response?.data?.error || 'Failed to analyze risks');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleEditPattern = () => {
    if (!selectedPattern) return;

    setEditedDescription(selectedPattern.description);
    setEditedRecommendation(selectedPattern.recommendation || '');
    setEditedSeverity(selectedPattern.severity);
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (!selectedPattern) return;

    try {
      await axios.patch(
        `http://localhost:3001/api/risks/patterns/${selectedPattern.id}`,
        {
          description: editedDescription,
          recommendation: editedRecommendation,
          severity: editedSeverity,
        }
      );

      setEditMode(false);
      await loadData();
      alert('Pattern updated successfully!');
    } catch (error: any) {
      console.error('Update error:', error);
      alert('Failed to update pattern');
    }
  };

  const submitFeedback = async () => {
    if (!selectedPattern) return;

    try {
      await axios.post('http://localhost:3001/api/risks/feedback', {
        patternId: selectedPattern.id,
        isAccurate,
        isRelevant,
        isActionable: true,
        notes: feedbackNotes,
      });

      setFeedbackMode(false);
      setFeedbackNotes('');
      setSelectedPattern(null);
      await loadData();
      alert('Feedback submitted! The system will learn from your input.');
    } catch (error: any) {
      console.error('Feedback error:', error);
      alert('Failed to submit feedback');
    }
  };

  const dismissPattern = async (patternId: string) => {
    if (!confirm('Dismiss this pattern? You can view dismissed patterns later.')) return;

    try {
      await axios.delete(`http://localhost:3001/api/risks/patterns/${patternId}`);
      await loadData();
    } catch (error: any) {
      console.error('Dismiss error:', error);
      alert('Failed to dismiss pattern');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading risk analysis...</p>
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Risk Analysis</h1>
              <p className="text-gray-600 mt-1">
                AI-powered behavioral pattern detection
              </p>
            </div>
            <button
              onClick={analyzeRisks}
              disabled={analyzing}
              className="px-6 py-3 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-50 transition"
            >
              {analyzing ? 'Analyzing...' : '🔍 Analyze Risks'}
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600">Total Patterns</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPatterns}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-600">Critical</p>
                <p className="text-2xl font-bold text-red-900">{stats.bySeverity.critical}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-600">High</p>
                <p className="text-2xl font-bold text-orange-900">{stats.bySeverity.high}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-600">Medium</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.bySeverity.medium}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600">Low</p>
                <p className="text-2xl font-bold text-blue-900">{stats.bySeverity.low}</p>
              </div>
            </div>
          )}
        </div>

        {/* Patterns List */}
        {patterns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">
              No risk patterns detected yet.
            </p>
            <p className="text-gray-400 mt-2">
              Upload transactions and click "Analyze Risks" to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {patterns.map((pattern) => (
              <div
                key={pattern.id}
                className={`bg-white rounded-lg shadow-md border-l-4 p-6 ${getSeverityColor(pattern.severity)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {pattern.pattern_name}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(pattern.severity)}`}>
                        {pattern.severity.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {(pattern.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>

                    <p className="text-gray-700 mb-3">{pattern.description}</p>

                    {pattern.recommendation && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                        <p className="text-sm font-medium text-blue-900">💡 Recommendation:</p>
                        <p className="text-sm text-blue-800 mt-1">{pattern.recommendation}</p>
                      </div>
                    )}

                    <div className="flex gap-4 text-sm text-gray-600">
                      {pattern.timeframe && <span>⏱️ {pattern.timeframe}</span>}
                      {pattern.amount_involved && (
                        <span>💰 ${pattern.amount_involved.toFixed(2)}</span>
                      )}
                      <span>📅 {new Date(pattern.detected_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedPattern(pattern);
                        handleEditPattern();
                      }}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPattern(pattern);
                        setFeedbackMode(true);
                      }}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                    >
                      📝 Feedback
                    </button>
                    <button
                      onClick={() => dismissPattern(pattern.id)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                    >
                      ✖️ Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editMode && selectedPattern && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Edit Pattern</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Severity
                  </label>
                  <select
                    value={editedSeverity}
                    onChange={(e) => setEditedSeverity(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recommendation
                  </label>
                  <textarea
                    value={editedRecommendation}
                    onChange={(e) => setEditedRecommendation(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {feedbackMode && selectedPattern && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Submit Feedback</h2>
              <p className="text-gray-600 mb-6">
                Help the AI learn! Your feedback improves future pattern detection.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">Is this pattern accurate?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsAccurate(true)}
                      className={`px-4 py-2 rounded ${
                        isAccurate ? 'bg-green-500 text-white' : 'bg-gray-200'
                      }`}
                    >
                      👍 Yes
                    </button>
                    <button
                      onClick={() => setIsAccurate(false)}
                      className={`px-4 py-2 rounded ${
                        !isAccurate ? 'bg-red-500 text-white' : 'bg-gray-200'
                      }`}
                    >
                      👎 No
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">Is this pattern relevant?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsRelevant(true)}
                      className={`px-4 py-2 rounded ${
                        isRelevant ? 'bg-green-500 text-white' : 'bg-gray-200'
                      }`}
                    >
                      👍 Yes
                    </button>
                    <button
                      onClick={() => setIsRelevant(false)}
                      className={`px-4 py-2 rounded ${
                        !isRelevant ? 'bg-red-500 text-white' : 'bg-gray-200'
                      }`}
                    >
                      👎 No
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Any additional context..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setFeedbackMode(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={submitFeedback}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
