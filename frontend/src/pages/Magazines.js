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
  BookOpen,
  FileText,
  X,
  Archive,
  ArchiveRestore,
  GripVertical,
  Eye,
  EyeOff
} from 'lucide-react';

import { 
  fetchMagazines, 
  addMagazine, 
  updateMagazine, 
  deleteMagazine 
} from '../store/slices/bookingSlice';
import { magazinesAPI } from '../utils/api';
import { toast } from 'react-toastify';

const magazineSchema = yup.object().shape({
  name: yup.string().required('Magazine name is required'),
  issues: yup.array().of(
    yup.object().shape({
      name: yup.string().required('Issue name is required'),
      totalPages: yup.number().required('Total pages is required').min(1, 'Must be at least 1 page'),
      startDate: yup.date().required('Start date is required'),
      sortOrder: yup.number().required('Sort order is required').min(0),
      hidden: yup.boolean()
    })
  ).min(1, 'At least one issue is required'),
});

const MagazineModal = ({ magazine, onClose, onSave }) => {
  const { register, handleSubmit, control, formState: { errors }, reset, watch, setValue } = useForm({
    resolver: yupResolver(magazineSchema),
    defaultValues: magazine || { issues: [{ name: '', totalPages: 40, startDate: '', sortOrder: 0, hidden: false }] }
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'issues'
  });

  const [draggedItem, setDraggedItem] = useState(null);
  const watchedIssues = watch('issues');

  const onSubmit = (data) => {
    // Convert dates to ISO strings and update sort orders based on array position
    const formattedData = {
      ...data,
      issues: data.issues.map((issue, index) => ({
        ...issue,
        startDate: new Date(issue.startDate).toISOString(),
        totalPages: parseInt(issue.totalPages),
        sortOrder: index, // Use array index as sort order
        hidden: Boolean(issue.hidden)
      }))
    };
    onSave(formattedData);
    reset();
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedItem !== null && draggedItem !== dropIndex) {
      move(draggedItem, dropIndex);
    }
    setDraggedItem(null);
  };

  const toggleHidden = (index) => {
    const currentValue = watchedIssues[index]?.hidden || false;
    setValue(`issues.${index}.hidden`, !currentValue);
  };

  useEffect(() => {
    if (magazine) {
      const formattedMagazine = {
        ...magazine,
        issues: magazine.issues.map(issue => ({
          ...issue,
          startDate: new Date(issue.startDate).toISOString().split('T')[0],
          hidden: issue.hidden || false
        }))
      };
      reset(formattedMagazine);
    }
  }, [magazine, reset]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {magazine ? 'Edit Magazine' : 'Add New Magazine'}
        </h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Magazine Name
            </label>
            <input
              type="text"
              {...register('name')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Mytown Magazine"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Issues
              </label>
              <button
                type="button"
                onClick={() => append({ name: '', totalPages: 40, startDate: '', sortOrder: fields.length, hidden: false })}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Issue
              </button>
            </div>
            
            <div className="text-xs text-gray-500 mb-2">
              Drag issues to reorder them
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {fields.map((field, index) => (
                <div 
                  key={field.id} 
                  className={`border border-gray-200 rounded-lg p-3 ${
                    watchedIssues[index]?.hidden ? 'bg-gray-50 border-dashed' : 'bg-white'
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                      <button
                        type="button"
                        onClick={() => toggleHidden(index)}
                        className={`p-1 rounded ${
                          watchedIssues[index]?.hidden 
                            ? 'text-gray-400 hover:text-gray-600' 
                            : 'text-green-600 hover:text-green-800'
                        }`}
                        title={watchedIssues[index]?.hidden ? 'Show in bookings' : 'Hide from bookings'}
                      >
                        {watchedIssues[index]?.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      {watchedIssues[index]?.hidden && (
                        <span className="text-xs text-gray-500 italic">Hidden from bookings</span>
                      )}
                    </div>
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
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Issue Name
                      </label>
                      <input
                        type="text"
                        {...register(`issues.${index}.name`)}
                        className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. Nov25"
                      />
                      {errors.issues?.[index]?.name && (
                        <p className="text-red-600 text-xs mt-1">{errors.issues[index].name.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Total Pages
                      </label>
                      <input
                        type="number"
                        {...register(`issues.${index}.totalPages`)}
                        className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                      />
                      {errors.issues?.[index]?.totalPages && (
                        <p className="text-red-600 text-xs mt-1">{errors.issues[index].totalPages.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        {...register(`issues.${index}.startDate`)}
                        className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.issues?.[index]?.startDate && (
                        <p className="text-red-600 text-xs mt-1">{errors.issues[index].startDate.message}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Hidden field for sortOrder */}
                  <input type="hidden" {...register(`issues.${index}.sortOrder`)} value={index} />
                  {/* Hidden field for hidden status */}
                  <input type="hidden" {...register(`issues.${index}.hidden`)} />
                </div>
              ))}
            </div>
            {errors.issues && (
              <p className="text-red-600 text-sm mt-1">{errors.issues.message}</p>
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
              {magazine ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Magazines = () => {
  const dispatch = useDispatch();
  const { magazines, loading } = useSelector((state) => state.booking);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMagazine, setEditingMagazine] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMagazines, setFilteredMagazines] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    dispatch(fetchMagazines(showArchived));
  }, [dispatch, showArchived]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredMagazines(
        magazines.filter(magazine =>
          magazine.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredMagazines(magazines);
    }
  }, [magazines, searchTerm]);

  const handleSave = async (data) => {
    try {
      if (editingMagazine) {
        const response = await magazinesAPI.update(editingMagazine._id, data);
        dispatch(updateMagazine(response.data));
        toast.success('Magazine updated successfully');
      } else {
        const response = await magazinesAPI.create(data);
        dispatch(addMagazine(response.data));
        toast.success('Magazine created successfully');
      }
      setIsModalOpen(false);
      setEditingMagazine(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  const handleDelete = async (magazineId) => {
    if (window.confirm('Are you sure you want to delete this magazine?')) {
      try {
        await magazinesAPI.delete(magazineId);
        dispatch(deleteMagazine(magazineId));
        toast.success('Magazine deleted successfully');
      } catch (error) {
        toast.error(error.response?.data?.message || 'An error occurred');
      }
    }
  };

  const handleArchiveToggle = async (magazine) => {
    try {
      const response = await magazinesAPI.archive(magazine._id, !magazine.archived);
      dispatch(updateMagazine(response.data));
      toast.success(`Magazine ${magazine.archived ? 'unarchived' : 'archived'} successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  const openModal = (magazine = null) => {
    setEditingMagazine(magazine);
    setIsModalOpen(true);
  };

  return (
    <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Magazines</h1>
          <p className="mt-2 text-gray-600">Manage your magazine publications and issues</p>
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
                  placeholder="Search magazines..."
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
            Add Magazine
          </button>
        </div>

        {/* Magazines List */}
        {loading.magazines ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading magazines...</p>
          </div>
        ) : filteredMagazines.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredMagazines.map((magazine) => (
                <li key={magazine._id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {magazine.name}
                            </p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {magazine.issues.length} issues
                            </span>
                            {magazine.issues.some(issue => issue.hidden) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Some hidden
                              </span>
                            )}
                          </div>
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-2">
                              {magazine.issues.slice(0, 3).map((issue, index) => (
                                <div key={index} className={`flex items-center text-xs rounded-full px-2 py-1 ${
                                  issue.hidden 
                                    ? 'text-gray-400 bg-gray-100 border border-dashed border-gray-300' 
                                    : 'text-gray-500 bg-gray-100'
                                }`}>
                                  <FileText className="h-3 w-3 mr-1" />
                                  {issue.name} ({issue.totalPages}p)
                                  {issue.hidden && <EyeOff className="h-3 w-3 ml-1" />}
                                </div>
                              ))}
                              {magazine.issues.length > 3 && (
                                <span className="text-xs text-gray-500 px-2 py-1">
                                  +{magazine.issues.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openModal(magazine)}
                          className="p-2 text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(magazine._id)}
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
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No magazines found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first magazine.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={() => openModal()}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Magazine
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <MagazineModal
            magazine={editingMagazine}
            onClose={() => {
              setIsModalOpen(false);
              setEditingMagazine(null);
            }}
            onSave={handleSave}
          />
        )}
    </div>
  );
};

export default Magazines; 