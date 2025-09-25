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
  X,
  Archive,
  ArchiveRestore,
  Calendar,
  Clock
} from 'lucide-react';

import { 
  fetchMagazines, 
  addMagazine, 
  updateMagazine, 
  deleteMagazine 
} from '../store/slices/bookingSlice';
import { magazinesAPI, schedulesAPI } from '../utils/api';
import { toast } from 'react-toastify';

const magazineSchema = yup.object().shape({
  name: yup.string().required('Magazine name is required'),
  schedule: yup.string().required('Schedule is required'),
  pageConfigurations: yup.array().of(
    yup.object().shape({
      issueName: yup.string().required('Issue name is required'),
      totalPages: yup.number().required('Total pages is required').min(1, 'Must be at least 1 page')
    })
  )
});

const MagazineModal = ({ magazine, onClose, onSave }) => {
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleIssues, setScheduleIssues] = useState([]);

  const { register, handleSubmit, control, formState: { errors }, reset, watch, setValue } = useForm({
    resolver: yupResolver(magazineSchema),
    defaultValues: magazine || { pageConfigurations: [] }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'pageConfigurations'
  });

  const watchedSchedule = watch('schedule');

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    if (magazine) {
      reset({
        name: magazine.name,
        schedule: magazine.schedule?._id || magazine.schedule,
        pageConfigurations: magazine.pageConfigurations || []
      });
      
      if (magazine.schedule) {
        setSelectedSchedule(magazine.schedule);
        setScheduleIssues(magazine.schedule.issues || []);
      }
    }
  }, [magazine, reset]);

  useEffect(() => {
    if (watchedSchedule) {
      const schedule = schedules.find(s => s._id === watchedSchedule);
      if (schedule) {
        setSelectedSchedule(schedule);
        setScheduleIssues(schedule.issues || []);
        
        // Initialize page configurations for all issues in the schedule
        const newPageConfigurations = schedule.issues.map(issue => {
          const existing = (magazine?.pageConfigurations || []).find(pc => pc.issueName === issue.name);
          return {
            issueName: issue.name,
            totalPages: existing?.totalPages || 40
          };
        });
        
        replace(newPageConfigurations);
      }
    }
  }, [watchedSchedule, schedules, magazine, replace]);

  const fetchSchedules = async () => {
    try {
      const response = await schedulesAPI.getAll();
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Error fetching schedules');
    }
  };

  const onSubmit = (data) => {
    onSave(data);
    reset();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isCloseDatePast = (closeDate) => {
    return new Date(closeDate) < new Date();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {magazine ? 'Edit Magazine' : 'Add Magazine'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Magazine Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Magazine Name
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g., Local Advertiser"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Schedule Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule
            </label>
            <select
              {...register('schedule')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a schedule</option>
              {schedules.map((schedule) => (
                <option key={schedule._id} value={schedule._id}>
                  {schedule.name} ({schedule.issues.length} issues)
                </option>
              ))}
            </select>
            {errors.schedule && (
              <p className="mt-1 text-sm text-red-600">{errors.schedule.message}</p>
            )}
          </div>

          {/* Schedule Preview */}
          {selectedSchedule && scheduleIssues.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Schedule Preview: {selectedSchedule.name}
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {scheduleIssues.map((issue, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-1 px-2 bg-white rounded text-sm"
                    >
                      <span className="font-medium">{issue.name}</span>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className={isCloseDatePast(issue.closeDate) ? 'text-red-600' : 'text-gray-600'}>
                          Close: {formatDate(issue.closeDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Page Configurations */}
          {fields.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Page Configuration for Each Issue
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {fields.map((field, index) => {
                  const issue = scheduleIssues.find(i => i.name === field.issueName);
                  const isPast = issue && isCloseDatePast(issue.closeDate);
                  
                  return (
                    <div
                      key={field.id}
                      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {field.issueName}
                          </span>
                          {issue && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className={`text-xs ${isPast ? 'text-red-600' : 'text-gray-500'}`}>
                                Close: {formatDate(issue.closeDate)}
                              </span>
                              {isPast && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Closed
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <input
                          type="hidden"
                          {...register(`pageConfigurations.${index}.issueName`)}
                        />
                        <div className="flex items-center space-x-2">
                          <label className="text-xs text-gray-600">Pages:</label>
                          <input
                            type="number"
                            min="1"
                            {...register(`pageConfigurations.${index}.totalPages`)}
                            className="w-20 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        {errors.pageConfigurations?.[index]?.totalPages && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.pageConfigurations[index].totalPages.message}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!watchedSchedule}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                watchedSchedule 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {magazine ? 'Update' : 'Create'} Magazine
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMagazine, setSelectedMagazine] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    dispatch(fetchMagazines());
  }, [dispatch]);

  const handleCreateMagazine = async (magazineData) => {
    try {
      const response = await magazinesAPI.create(magazineData);
      dispatch(addMagazine(response.data));
      setShowModal(false);
      toast.success('Magazine created successfully');
    } catch (error) {
      console.error('Error creating magazine:', error);
      toast.error(error.response?.data?.message || 'Error creating magazine');
    }
  };

  const handleUpdateMagazine = async (magazineData) => {
    try {
      const response = await magazinesAPI.update(selectedMagazine._id, magazineData);
      dispatch(updateMagazine(response.data));
      setShowModal(false);
      setSelectedMagazine(null);
      toast.success('Magazine updated successfully');
    } catch (error) {
      console.error('Error updating magazine:', error);
      toast.error(error.response?.data?.message || 'Error updating magazine');
    }
  };

  const handleDeleteMagazine = async (magazineId) => {
    if (window.confirm('Are you sure you want to delete this magazine?')) {
      try {
        await magazinesAPI.delete(magazineId);
        dispatch(deleteMagazine(magazineId));
        toast.success('Magazine deleted successfully');
      } catch (error) {
        console.error('Error deleting magazine:', error);
        toast.error('Error deleting magazine');
      }
    }
  };

  const handleArchiveMagazine = async (magazine) => {
    try {
      const newArchivedState = !magazine.archived;
      await magazinesAPI.archive(magazine._id, newArchivedState);
      dispatch(updateMagazine({ ...magazine, archived: newArchivedState }));
      toast.success(`Magazine ${newArchivedState ? 'archived' : 'unarchived'} successfully`);
    } catch (error) {
      console.error('Error archiving magazine:', error);
      toast.error('Error archiving magazine');
    }
  };

  const filteredMagazines = magazines.filter(magazine =>
    magazine.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div>
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Magazines</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage your magazines and their page configurations by schedule
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => {
              setSelectedMagazine(null);
              setShowModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Magazine
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search magazines..."
          />
        </div>
      </div>

      {/* Magazine Cards */}
      <div className="mt-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredMagazines.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No magazines</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new magazine.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredMagazines.map((magazine) => (
              <div
                key={magazine._id}
                className="bg-white shadow rounded-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-900">
                      {magazine.name}
                      {magazine.archived && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Archived
                        </span>
                      )}
                    </h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleArchiveMagazine(magazine)}
                        className="text-orange-600 hover:text-orange-900"
                        title={magazine.archived ? 'Unarchive' : 'Archive'}
                      >
                        {magazine.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMagazine(magazine);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMagazine(magazine._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    {magazine.schedule ? (
                      <>
                        <div className="flex items-center space-x-2 mb-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">
                            Schedule: {magazine.schedule.name}
                          </span>
                        </div>
                        
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Issues & Pages
                          </h5>
                          {magazine.schedule.issues && magazine.schedule.issues.map((issue, index) => {
                            const pageConfig = magazine.pageConfigurations?.find(pc => pc.issueName === issue.name);
                            const isPast = new Date(issue.closeDate) < new Date();
                            
                            return (
                              <div
                                key={index}
                                className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md text-sm"
                              >
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900">{issue.name}</span>
                                  {isPast && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                      Closed
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4">
                                  <span className="text-gray-600">
                                    {pageConfig?.totalPages || 40} pages
                                  </span>
                                  <div className="flex items-center space-x-1">
                                    <span className={`text-xs ${isPast ? 'text-red-600' : 'text-gray-500'}`}>
                                      {formatDate(issue.closeDate)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No schedule assigned</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <MagazineModal
          magazine={selectedMagazine}
          onClose={() => {
            setShowModal(false);
            setSelectedMagazine(null);
          }}
          onSave={selectedMagazine ? handleUpdateMagazine : handleCreateMagazine}
        />
      )}
    </div>
  );
};

export default Magazines; 