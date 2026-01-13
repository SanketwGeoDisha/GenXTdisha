import React, { useState } from 'react';
import { generateReport } from './api';
import ReportDisplay from './components/ReportDisplay';
import { Loader2, Search, GraduationCap } from 'lucide-react';

function App() {
  const [collegeName, setCollegeName] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!collegeName.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const data = await generateReport(collegeName);
      if (data && data.report) {
        setReport(data.report);
      } else {
        setError('No data received from the server. Please try again.');
      }
    } catch (err) {
      console.error('Report generation error:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to generate report. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-indigo-600 rounded-full shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl tracking-tight mb-4">
            GenXT<span className="text-indigo-600">Disha</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-500">
            Generate comprehensive AI-powered evaluation reports for any college instantly.
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-16">
          <form onSubmit={handleGenerate} className="relative">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center bg-white rounded-xl shadow-xl">
                <div className="pl-6 text-gray-400">
                  <Search className="w-6 h-6" />
                </div>
                <input
                  type="text"
                  className="block w-full px-6 py-5 text-lg text-gray-900 placeholder-gray-400 bg-transparent border-none rounded-xl focus:ring-0 focus:outline-none"
                  placeholder="Enter college name (e.g. IIT Bombay)..."
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={loading || !collegeName.trim()}
                  className="absolute right-3 top-3 bottom-3 px-8 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Generate Report'
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center justify-center animate-fade-in">
              <span className="font-medium mr-2">Error:</span> {error}
            </div>
          )}
        </div>

        {/* Report Section */}
        {report && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-8 bg-indigo-600 rounded-full"></span>
              Analysis Report for {collegeName}
            </h2>
            <ReportDisplay report={report} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
