import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadStatements } from '../services/api';

interface LandingProps {
  onUploadComplete: () => void;
}

export default function Landing({ onUploadComplete }: LandingProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
    results?: any[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    setUploadStatus(null);

    try {
      const response = await uploadStatements(files);
      setUploadStatus({
        success: true,
        message: `Successfully uploaded ${response.totalTransactions} transactions`,
        results: response.results,
      });
      onUploadComplete();

      // Navigate to transactions page after a short delay
      setTimeout(() => {
        navigate('/transactions');
      }, 2000);
    } catch (error: any) {
      setUploadStatus({
        success: false,
        message: error.response?.data?.error || 'Upload failed. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-primary">SpendLens</div>
          </div>
          <nav className="flex gap-6 text-sm text-gray-600">
            <a href="#how-it-works" className="hover:text-primary">How it works</a>
            <a href="#security" className="hover:text-primary">Security</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Understand your spending in minutes
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your last 6-12 months of bank statements. We'll clean, enrich, and categorize every transaction for you.
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div
            className={`border-4 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-sky-50'
                : 'border-gray-300 hover:border-primary'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.csv"
              onChange={handleChange}
              disabled={uploading}
            />

            {uploading ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-lg text-gray-600">Uploading and parsing your statements...</p>
              </div>
            ) : (
              <>
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Drop your bank statements here
                </h3>
                <p className="text-gray-600 mb-4">or browse files (PDF or CSV)</p>
                <button
                  onClick={onButtonClick}
                  className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-secondary transition-colors"
                >
                  Browse Files
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  You can upload multiple statements at once
                </p>
              </>
            )}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              We never store your credentials, only the files you upload. Your data is processed securely and never shared.
            </p>
          </div>
        </div>

        {/* Upload Status */}
        {uploadStatus && (
          <div
            className={`rounded-lg p-4 ${
              uploadStatus.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <p
              className={`font-medium ${
                uploadStatus.success ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {uploadStatus.message}
            </p>
            {uploadStatus.success && uploadStatus.results && (
              <div className="mt-2 space-y-1">
                {uploadStatus.results.map((result, idx) => (
                  <p key={idx} className="text-sm text-green-700">
                    {result.fileName}: {result.transactionCount} transactions
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mt-12 flex items-center justify-center gap-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
              1
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">Upload</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold">
              2
            </div>
            <span className="ml-2 text-sm text-gray-500">Extract</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold">
              3
            </div>
            <span className="ml-2 text-sm text-gray-500">Review</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold">
              4
            </div>
            <span className="ml-2 text-sm text-gray-500">Insights</span>
          </div>
        </div>
      </main>

      {/* How it works section */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">Upload Statements</h3>
            <p className="text-gray-600">Upload 6-12 months of bank statements in PDF or CSV format</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Enhancement</h3>
            <p className="text-gray-600">Our AI enriches each transaction with context and categories</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Get Insights</h3>
            <p className="text-gray-600">View spending patterns, trends, and behavioral insights</p>
          </div>
        </div>
      </section>

      {/* Security section */}
      <section id="security" className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Your data is secure</h2>
          <p className="text-lg text-gray-600">
            We use industry-standard encryption and never store your banking credentials.
            Your uploaded statements are processed securely and can be deleted at any time.
          </p>
        </div>
      </section>
    </div>
  );
}
