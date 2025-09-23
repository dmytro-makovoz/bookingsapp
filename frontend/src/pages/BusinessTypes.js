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
  Building2,
  Tag,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import { 
  fetchBusinessTypes, 
  addBusinessType,
  updateBusinessType, 
  deleteBusinessType 
} from '../store/slices/bookingSlice';
import { businessTypesAPI } from '../utils/api';
import { toast } from 'react-toastify';

const businessTypeSchema = yup.object().shape({
  section: yup.string().required('Section is required'),
});

const BusinessTypeModal = ({ businessType, onClose, onSave }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(businessTypeSchema),
    defaultValues: businessType || {}
  });

  const onSubmit = (data) => {
    onSave(data);
    reset();
  };

  useEffect(() => {
    reset(businessType || {});
  }, [businessType, reset]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {businessType ? 'Edit Business Type' : 'Add New Business Type'}
        </h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section
            </label>
            <input
              type="text"
              {...register('section')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="e.g. Restaurant & Food Service"
            />
            {errors.section && (
              <p className="text-red-600 text-sm mt-1">{errors.section.message}</p>
            )}
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
              {businessType ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BusinessTypes = () => {
  const dispatch = useDispatch();
  const { businessTypes, loading } = useSelector((state) => state.booking);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusinessType, setEditingBusinessType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBusinessTypes, setFilteredBusinessTypes] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    dispatch(fetchBusinessTypes(showArchived));
  }, [dispatch, showArchived]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredBusinessTypes(
        businessTypes.filter(businessType =>
          businessType.section.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredBusinessTypes(businessTypes);
    }
  }, [businessTypes, searchTerm]);

  const handleSave = async (data) => {
    try {
      if (editingBusinessType) {
        const response = await businessTypesAPI.update(editingBusinessType._id, data);
        dispatch(updateBusinessType(response.data));
        toast.success('Business type updated successfully');
      } else {
        const response = await businessTypesAPI.create(data);
        dispatch(addBusinessType(response.data));
        toast.success('Business type created successfully');
      }
      setIsModalOpen(false);
      setEditingBusinessType(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  const handleDelete = async (businessTypeId) => {
    if (window.confirm('Are you sure you want to delete this business type? This action cannot be undone if customers are using this type.')) {
      try {
        await businessTypesAPI.delete(businessTypeId);
        dispatch(deleteBusinessType(businessTypeId));
        toast.success('Business type deleted successfully');
      } catch (error) {
        toast.error(error.response?.data?.message || 'An error occurred');
      }
    }
  };

  const handleArchiveToggle = async (businessType) => {
    try {
      const response = await businessTypesAPI.archive(businessType._id, !businessType.archived);
      dispatch(updateBusinessType(response.data));
      toast.success(`Business type ${businessType.archived ? 'unarchived' : 'archived'} successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  const openModal = (businessType = null) => {
    setEditingBusinessType(businessType);
    setIsModalOpen(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Business Types</h1>
        <p className="mt-2 text-gray-600">Manage business type categories for customer classification</p>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search business types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Archive Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showArchived"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showArchived" className="text-sm text-gray-700">
              Show archived
            </label>
          </div>
        </div>
        
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Business Type
        </button>
      </div>

        {/* Business Types List */}
        {loading.businessTypes ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading business types...</p>
          </div>
        ) : filteredBusinessTypes.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredBusinessTypes.map((businessType) => (
                <li key={businessType._id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <p className={`text-sm font-medium truncate ${businessType.archived ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {businessType.section}
                            </p>
                            {businessType.archived && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                Archived
                              </span>
                            )}
                          </div>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <Tag className="h-4 w-4 mr-1" />
                            <span>Business Category</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleArchiveToggle(businessType)}
                          className={`p-2 focus:outline-none focus:ring-2 rounded-md ${
                            businessType.archived 
                              ? 'text-gray-400 hover:text-green-600 focus:ring-green-500' 
                              : 'text-gray-400 hover:text-yellow-600 focus:ring-yellow-500'
                          }`}
                          title={businessType.archived ? 'Unarchive' : 'Archive'}
                        >
                          {businessType.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => openModal(businessType)}
                          className="p-2 text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(businessType._id)}
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
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No business types found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first business type.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={() => openModal()}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Business Type
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <BusinessTypeModal
            businessType={editingBusinessType}
            onClose={() => {
              setIsModalOpen(false);
              setEditingBusinessType(null);
            }}
            onSave={handleSave}
          />
        )}
    </div>
  );
};

export default BusinessTypes; 