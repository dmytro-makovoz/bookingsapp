import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Truck, Plus, Edit, Trash2, Search } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import { leafletDeliveryAPI, customersAPI, magazinesAPI } from '../utils/api';

const LeafletDelivery = () => {
  const [leafletDeliveries, setLeafletDeliveries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [magazines, setMagazines] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    customer: '',
    magazine: '',
    startIssue: '',
    finishIssue: '',
    quantity: '',
    charge: '',
    note: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deliveriesResponse, customersResponse, magazinesResponse] = await Promise.all([
        leafletDeliveryAPI.getAll(),
        customersAPI.getAll(),
        magazinesAPI.getAll()
      ]);
      
      setLeafletDeliveries(deliveriesResponse.data);
      setCustomers(customersResponse.data);
      setMagazines(magazinesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showErrorToast('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await leafletDeliveryAPI.update(editingItem._id, formData);
        showSuccessToast('Leaflet delivery updated successfully');
      } else {
        await leafletDeliveryAPI.create(formData);
        showSuccessToast('Leaflet delivery created successfully');
      }
      
      setIsModalOpen(false);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving leaflet delivery:', error);
      showErrorToast(error.response?.data?.message || 'Failed to save leaflet delivery');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      customer: item.customer?._id,
      magazine: item.magazine?._id,
      startIssue: item.startIssue,
      finishIssue: item.finishIssue,
      quantity: item.quantity.toString(),
      charge: item.charge.toString(),
      note: item.note || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leaflet delivery?')) {
      return;
    }

    try {
      await leafletDeliveryAPI.delete(id);
      showSuccessToast('Leaflet delivery deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting leaflet delivery:', error);
      showErrorToast('Failed to delete leaflet delivery');
    }
  };

  const resetForm = () => {
    setFormData({
      customer: '',
      magazine: '',
      startIssue: '',
      finishIssue: '',
      quantity: '',
      charge: '',
      note: ''
    });
  };

  const openModal = () => {
    resetForm();
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const filteredDeliveries = leafletDeliveries.filter(delivery =>
    delivery.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.magazine?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.startIssue.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.finishIssue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Leaflet Delivery</h1>
          <p className="mt-2 text-gray-600">Manage leaflet insertion bookings</p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search deliveries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={openModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Leaflet Delivery
          </button>
        </div>

        {/* Leaflet Deliveries Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredDeliveries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Magazine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issues
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Charge
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDeliveries.map((delivery) => (
                    <tr key={delivery._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {delivery.customer?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {delivery.customer?.businessCategory}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {delivery.magazine?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {delivery.startIssue} - {delivery.finishIssue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {delivery.quantity.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        £{delivery.charge.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          delivery.status === 'Active' ? 'bg-green-100 text-green-800' :
                          delivery.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {delivery.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(delivery)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(delivery._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Truck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No leaflet deliveries</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new leaflet delivery.</p>
              <div className="mt-6">
                <button
                  onClick={openModal}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Leaflet Delivery
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingItem ? 'Edit Leaflet Delivery' : 'Add New Leaflet Delivery'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer
                    </label>
                    <select
                      value={formData.customer}
                      onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Customer</option>
                      {customers.map((customer) => (
                        <option key={customer._id} value={customer._id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Magazine
                    </label>
                    <select
                      value={formData.magazine}
                      onChange={(e) => setFormData({ ...formData, magazine: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Magazine</option>
                      {magazines.map((magazine) => (
                        <option key={magazine._id} value={magazine._id}>
                          {magazine.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Issue
                      </label>
                      <input
                        type="text"
                        value={formData.startIssue}
                        onChange={(e) => setFormData({ ...formData, startIssue: e.target.value })}
                        required
                        placeholder="e.g. Nov25"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Finish Issue
                      </label>
                      <input
                        type="text"
                        value={formData.finishIssue}
                        onChange={(e) => setFormData({ ...formData, finishIssue: e.target.value })}
                        required
                        placeholder="e.g. Nov25"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        required
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Charge (£)
                      </label>
                      <input
                        type="number"
                        value={formData.charge}
                        onChange={(e) => setFormData({ ...formData, charge: e.target.value })}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note (Optional)
                    </label>
                    <textarea
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional notes..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      {editingItem ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LeafletDelivery; 