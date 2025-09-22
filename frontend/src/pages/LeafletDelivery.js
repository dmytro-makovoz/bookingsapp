import React from 'react';
import Layout from '../components/Layout';
import { Truck, Plus } from 'lucide-react';

const LeafletDelivery = () => {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Leaflet Delivery</h1>
          <p className="mt-2 text-gray-600">Manage leaflet insertion bookings</p>
        </div>

        {/* Coming Soon Message */}
        <div className="text-center py-12">
          <Truck className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Leaflet Delivery Management</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            This section is under development. Soon you'll be able to manage leaflet insertion bookings 
            alongside your magazine space bookings.
          </p>
          <div className="mt-6">
            <button
              disabled
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-400 cursor-not-allowed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Leaflet Delivery (Coming Soon)
            </button>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="bg-white shadow rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Planned Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Leaflet Management</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Track leaflet insertion bookings</li>
                <li>• Link to existing customers</li>
                <li>• Quantity and description tracking</li>
                <li>• Delivery scheduling</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Reporting</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Revenue tracking</li>
                <li>• Delivery reports by issue</li>
                <li>• Customer leaflet history</li>
                <li>• Combined booking reports</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LeafletDelivery; 