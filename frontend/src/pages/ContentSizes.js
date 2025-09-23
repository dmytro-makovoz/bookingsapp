import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Layers,
  DollarSign,
  X,
  Archive,
  ArchiveRestore
} from 'lucide-react';

import { 
  fetchContentSizes, 
  fetchMagazines,
  addContentSize, 
  updateContentSize, 
  deleteContentSize 
} from '../store/slices/bookingSlice';
import { contentSizesAPI } from '../utils/api';
import { toast } from 'react-toastify';

const contentSizeSchema = yup.object().shape({
  description: yup.string().required('Description is required'),
  size: yup.number().required('Size is required').min(0.001, 'Size must be at least 0.001').max(999.999, 'Size cannot exceed 999.999'),
  pricing: yup.array().of(
    yup.object().shape({
      magazine: yup.string().required('Magazine is required'),
      price: yup.number().required('Price is required').min(0, 'Price must be positive'),
    })
  ).min(1, 'At least one magazine pricing is required'),
});

const ContentSizeModal = ({ contentSize, onClose, onSave }) => {
  const { magazines } = useSelector((state) => state.booking);
  const { register, handleSubmit, control, formState: { errors }, reset, watch } = useForm({
    resolver: yupResolver(contentSizeSchema),
    defaultValues: contentSize || { 
      description: '', 
      size: 0.25, 
      pricing: [{ magazine: '', price: 50 }] 
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'pricing'
  });

  const onSubmit = (data) => {
    const formattedData = {
      ...data,
      size: parseFloat(data.size),
      pricing: data.pricing.map(p => ({
        ...p,
        price: parseFloat(p.price)
      }))
    };
    onSave(formattedData);
    reset();
  };

  useEffect(() => {
    reset(contentSize || { description: '', size: 0.25, pricing: [{ magazine: '', price: 50 }] });
  }, [contentSize, reset]);

  const availableMagazines = magazines.filter(mag => 
    !fields.some(field => field.magazine === mag._id)
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {contentSize ? 'Edit Content Size' : 'Add New Content Size'}
        </h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                {...register('description')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. Quarter Page, Half Page"
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size (pages)
              </label>
              <input
                type="number"
                step="0.001"
                {...register('size')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. 0.25, 0.5, 1.0"
              />
              {errors.size && (
                <p className="text-red-600 text-sm mt-1">{errors.size.message}</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Magazine Pricing
              </label>
              {availableMagazines.length > 0 && (
                <button
                  type="button"
                  onClick={() => append({ magazine: '', price: 50 })}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Magazine
                </button>
              )}
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Pricing {index + 1}</h4>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Magazine
                      </label>
                      <select
                        {...register(`pricing.${index}.magazine`)}
                        className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select magazine...</option>
                        {magazines.map((magazine) => (
                          <option key={magazine._id} value={magazine._id}>
                            {magazine.name}
                          </option>
                        ))}
                      </select>
                      {errors.pricing?.[index]?.magazine && (
                        <p className="text-red-600 text-xs mt-1">{errors.pricing[index].magazine.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Price (£)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`pricing.${index}.price`)}
                        className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. 50.00"
                      />
                      {errors.pricing?.[index]?.price && (
                        <p className="text-red-600 text-xs mt-1">{errors.pricing[index].price.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.pricing && (
              <p className="text-red-600 text-sm mt-1">{errors.pricing.message}</p>
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
              {contentSize ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ContentSizes = () => {
  const dispatch = useDispatch();
  const { contentSizes, magazines, loading } = useSelector((state) => state.booking);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContentSize, setEditingContentSize] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContentSizes, setFilteredContentSizes] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    dispatch(fetchContentSizes(showArchived));
    dispatch(fetchMagazines());
  }, [dispatch, showArchived]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredContentSizes(
        contentSizes.filter(cs =>
          cs.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredContentSizes(contentSizes);
    }
  }, [contentSizes, searchTerm]);

  const handleSave = async (data) => {
    try {
      if (editingContentSize) {
        const response = await contentSizesAPI.update(editingContentSize._id, data);
        dispatch(updateContentSize(response.data));
        toast.success('Content size updated successfully');
      } else {
        const response = await contentSizesAPI.create(data);
        dispatch(addContentSize(response.data));
        toast.success('Content size created successfully');
      }
      setIsModalOpen(false);
      setEditingContentSize(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  const handleDelete = async (contentSizeId) => {
    if (window.confirm('Are you sure you want to delete this content size?')) {
      try {
        await contentSizesAPI.delete(contentSizeId);
        dispatch(deleteContentSize(contentSizeId));
        toast.success('Content size deleted successfully');
      } catch (error) {
        toast.error(error.response?.data?.message || 'An error occurred');
      }
    }
  };

  const handleArchiveToggle = async (contentSize) => {
    try {
      const response = await contentSizesAPI.archive(contentSize._id, !contentSize.archived);
      dispatch(updateContentSize(response.data));
      toast.success(`Content size ${contentSize.archived ? 'unarchived' : 'archived'} successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  const openModal = (contentSize = null) => {
    setEditingContentSize(contentSize);
    setIsModalOpen(true);
  };

  const getMagazineName = (magazineId) => {
    const magazine = magazines.find(m => m._id === magazineId);
    return magazine ? magazine.name : 'Unknown Magazine';
  };

  return (
    <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Sizes</h1>
          <p className="mt-2 text-gray-600">Manage advertising sizes with magazine-specific pricing</p>
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
                  placeholder="Search content sizes..."
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
            Add Content Size
          </button>
        </div>

        {/* Content Sizes List */}
        {loading.contentSizes ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading content sizes...</p>
          </div>
        ) : filteredContentSizes.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredContentSizes.map((contentSize) => (
                <li key={contentSize._id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Layers className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <p className={`text-sm font-medium truncate ${contentSize.archived ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {contentSize.description}
                            </p>
                            {contentSize.archived && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                Archived
                              </span>
                            )}
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {contentSize.size} pages
                            </span>
                          </div>
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-2">
                              {contentSize.pricing.map((pricing, index) => (
                                <div key={index} className="flex items-center text-xs text-gray-600 bg-green-50 rounded-full px-2 py-1">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {getMagazineName(pricing.magazine)}: £{pricing.price}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleArchiveToggle(contentSize)}
                          className={`p-2 focus:outline-none focus:ring-2 rounded-md ${
                            contentSize.archived 
                              ? 'text-gray-400 hover:text-green-600 focus:ring-green-500' 
                              : 'text-gray-400 hover:text-yellow-600 focus:ring-yellow-500'
                          }`}
                          title={contentSize.archived ? 'Unarchive' : 'Archive'}
                        >
                          {contentSize.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => openModal(contentSize)}
                          className="p-2 text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(contentSize._id)}
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
            <Layers className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No content sizes found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first content size.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={() => openModal()}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Content Size
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <ContentSizeModal
            contentSize={editingContentSize}
            onClose={() => {
              setIsModalOpen(false);
              setEditingContentSize(null);
            }}
            onSave={handleSave}
          />
        )}
    </div>
  );
};

export default ContentSizes; 