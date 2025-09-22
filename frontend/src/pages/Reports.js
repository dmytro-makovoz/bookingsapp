import React from 'react';
import Layout from '../components/Layout';
import { BarChart3, Download, Filter } from 'lucide-react';

const Reports = () => {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="mt-2 text-gray-600">Generate detailed reports and analytics</p>
        </div>

        {/* Coming Soon Message */}
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Advanced Reporting</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            Comprehensive reporting features are under development. Soon you'll have access to 
            detailed analytics, custom filters, and exportable reports.
          </p>
          <div className="mt-6 flex justify-center space-x-3">
            <button
              disabled
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-400 cursor-not-allowed"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter Reports (Coming Soon)
            </button>
            <button
              disabled
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-500 bg-white cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data (Coming Soon)
            </button>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Reports</h3>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Available Reports</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Customer booking summaries</li>
                <li>• Magazine revenue breakdown</li>
                <li>• Content type analysis</li>
                <li>• Issue planning reports</li>
                <li>• Financial summaries</li>
                <li>• Space utilization reports</li>
              </ul>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Supported Formats</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• CSV for Excel compatibility</li>
                <li>• PDF for professional reports</li>
                <li>• Custom date range filtering</li>
                <li>• Multi-criteria filtering</li>
                <li>• Scheduled report delivery</li>
                <li>• Real-time data updates</li>
              </ul>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Dashboard</h3>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Key Metrics</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Revenue trends over time</li>
                <li>• Customer lifetime value</li>
                <li>• Space booking efficiency</li>
                <li>• Popular content types</li>
                <li>• Seasonal patterns</li>
                <li>• Profit margin analysis</li>
              </ul>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Views</h3>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Flexible Filtering</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Filter by customer, magazine, issue</li>
                <li>• Date range selection</li>
                <li>• Content type filtering</li>
                <li>• Status-based reports</li>
                <li>• Revenue threshold filters</li>
                <li>• Custom field combinations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Current Capabilities */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">What's Available Now</h3>
          <p className="text-blue-800 text-sm mb-4">
            While advanced reporting is in development, you can currently access basic reports through:
          </p>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Dashboard analytics with pie charts and revenue breakdowns</li>
            <li>• Individual customer booking summaries</li>
            <li>• Publications revenue overview</li>
            <li>• Current issue space allocation analysis</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default Reports; 