import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User,
  Building,
  FileText
} from 'lucide-react';
import Layout from '../components/Layout';
import { 
  fetchCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer 
} from '../store/slices/bookingSlice';
import { customersAPI } from '../utils/api';
import { toast } from 'react-toastify';

const customerSchema = yup.object().shape({
  name: yup.string().required('Customer name is required'),
  businessCategory: yup.string().required('Business category is required'),
  bookingNote: yup.string(),
});

const CustomerModal = ({ customer, onClose, onSave }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(customerSchema),
    defaultValues: customer || {}
  });

  const onSubmit = (data) => {
    onSave(data);
    reset();
  };

  useEffect(() => {
    reset(customer || {});
  }, [customer, reset]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {customer ? 'Edit Customer' : 'Add New Customer'}
        </h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name
            </label>
            <input
              type="text"
              {...register('name')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., JP Plumbing"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Category
            </label>
            <input
              type="text"
              {...register('businessCategory')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Plumbing and Heating Services"
            />
            {errors.businessCategory && (
              <p className="text-red-600 text-sm mt-1">{errors.businessCategory.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Booking Note (Optional)
            </label>
            <textarea
              {...register('bookingNote')}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Must go in first 11 pages"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {customer ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Customers = () => {
  const dispatch = useDispatch();
  const { customers, loading } = useSelector((state) => state.booking);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredCustomers(
        customers.filter(customer =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.businessCategory.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredCustomers(customers);
    }
  }, [customers, searchTerm]);

  const handleSave = async (data) => {
    try {
      if (editingCustomer) {
        const response = await customersAPI.update(editingCustomer._id, data);
        dispatch(updateCustomer(response.data));
        toast.success('Customer updated successfully');
      } else {
        const response = await customersAPI.create(data);
        dispatch(createCustomer(response.data));
        toast.success('Customer created successfully');
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customersAPI.delete(customerId);
        dispatch(deleteCustomer(customerId));
        toast.success('Customer deleted successfully');
      } catch (error) {
        toast.error(error.response?.data?.message || 'An error occurred');
      }
    }
  };

  const openModal = (customer = null) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="mt-2 text-gray-600">Manage your customer database</p>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </button>
        </div>

        {/* Customers List */}
        {loading.customers ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading customers...</p>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <li key={customer._id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {customer.name}
                            </p>
                          </div>
                          <div className="flex items-center mt-1 space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-1" />
                              {customer.businessCategory}
                            </div>
                            {customer.bookingNote && (
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-1" />
                                <span className="truncate max-w-xs">{customer.bookingNote}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openModal(customer)}
                          className="p-2 text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer._id)}
                          className="p-2 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first customer.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={() => openModal()}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <CustomerModal
            customer={editingCustomer}
            onClose={() => {
              setIsModalOpen(false);
              setEditingCustomer(null);
            }}
            onSave={handleSave}
          />
        )}
      </div>
    </Layout>
  );
};

export default Customers; 