import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Tag,
  X,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const contentTypeSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  description: yup.string()
});

const ContentTypeModal = ({ contentType, onClose, onSave }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(contentTypeSchema),
    defaultValues: contentType || { name: '', description: '' }
  });

  useEffect(() => {
    if (contentType) {
      reset(contentType);
    }
  }, [contentType, reset]);

  const onSubmit = async (data) => {
    try {
      if (contentType) {
        await api.put(`/content-types/${contentType._id}`, data);
        toast.success('Content type updated successfully');
      } else {
        await api.post('/content-types', data);
        toast.success('Content type created successfully');
      }
      onSave();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {contentType ? 'Edit Content Type' : 'Add Content Type'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              {...register('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Advert, Article, Editorial"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional description of this content type"
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {contentType ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ContentTypes = () => {
  const [contentTypes, setContentTypes] = useState([]);
  const [filteredContentTypes, setFilteredContentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingContentType, setEditingContentType] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchContentTypes();
  }, [showArchived]);

  useEffect(() => {
    // Filter content types based on search term
    const filtered = contentTypes.filter(contentType =>
      contentType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contentType.description && contentType.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredContentTypes(filtered);
  }, [contentTypes, searchTerm]);

  const fetchContentTypes = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/content-types?includeArchived=${showArchived}`);
      setContentTypes(response.data);
    } catch (error) {
      toast.error('Error fetching content types');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (contentType) => {
    setEditingContentType(contentType);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingContentType(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to archive this content type?')) {
      try {
        await api.delete(`/content-types/${id}`);
        toast.success('Content type archived successfully');
        fetchContentTypes();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error archiving content type');
      }
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.put(`/content-types/${id}/restore`);
      toast.success('Content type restored successfully');
      fetchContentTypes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error restoring content type');
    }
  };

  const handleModalSave = () => {
    fetchContentTypes();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Content Types</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage content types for your bookings (e.g. Advert, Article, Editorial)
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Content Type
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search content types..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showArchived"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="showArchived" className="ml-2 block text-sm text-gray-700">
            Show archived
          </label>
        </div>
      </div>

      {/* Content Types List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredContentTypes.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No content types found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first content type.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Content Type
                </button>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredContentTypes.map((contentType) => (
              <li key={contentType._id} className={`px-6 py-4 ${contentType.archived ? 'bg-gray-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className={`text-sm font-medium ${contentType.archived ? 'text-gray-500' : 'text-gray-900'}`}>
                        {contentType.name}
                        {contentType.isDefault && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Default
                          </span>
                        )}
                        {contentType.archived && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Archived
                          </span>
                        )}
                      </h3>
                    </div>
                    {contentType.description && (
                      <p className={`mt-1 text-sm ${contentType.archived ? 'text-gray-400' : 'text-gray-600'}`}>
                        {contentType.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {contentType.archived ? (
                      <button
                        onClick={() => handleRestore(contentType._id)}
                        className="text-green-600 hover:text-green-900"
                        title="Restore"
                      >
                        <ArchiveRestore className="h-4 w-4" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(contentType)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {!contentType.isDefault && (
                          <button
                            onClick={() => handleDelete(contentType._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Archive"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ContentTypeModal
          contentType={editingContentType}
          onClose={() => setShowModal(false)}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

export default ContentTypes; 