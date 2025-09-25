import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Calendar,
  Clock,
  X,
  Archive,
  ArchiveRestore,
  GripVertical
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const scheduleSchema = yup.object({
  name: yup.string().required('Schedule name is required'),
  issues: yup.array().of(
    yup.object().shape({
      name: yup.string().required('Issue name is required'),
      closeDate: yup.date().required('Close date is required'),
      sortOrder: yup.number().required('Sort order is required').min(0)
    })
  ).min(1, 'At least one issue is required')
});

const ScheduleModal = ({ schedule, onClose, onSave }) => {
  const { register, handleSubmit, control, formState: { errors }, reset, watch } = useForm({
    resolver: yupResolver(scheduleSchema),
    defaultValues: schedule || { 
      issues: [{ 
        name: '', 
        closeDate: new Date().toISOString().split('T')[0], 
        sortOrder: 0 
      }] 
    }
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'issues'
  });

  const [draggedItem, setDraggedItem] = useState(null);

  const onSubmit = (data) => {
    // Convert dates to ISO strings and update sort orders based on array position
    const formattedData = {
      ...data,
      issues: data.issues.map((issue, index) => ({
        ...issue,
        closeDate: new Date(issue.closeDate).toISOString(),
        sortOrder: index
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

  useEffect(() => {
    if (schedule) {
      reset({
        name: schedule.name,
        issues: schedule.issues.map(issue => ({
          ...issue,
          closeDate: new Date(issue.closeDate).toISOString().split('T')[0]
        }))
      });
    }
  }, [schedule, reset]);

  const currentDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {schedule ? 'Edit Schedule' : 'Add Schedule'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Schedule Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Name
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g., Monthly, BiMonthly"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Issues */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Issues
              </label>
              <button
                type="button"
                onClick={() => append({ 
                  name: '', 
                  closeDate: new Date().toISOString().split('T')[0],
                  sortOrder: fields.length 
                })}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Issue
              </button>
            </div>
            
            {errors.issues && (
              <p className="mb-2 text-sm text-red-600">{errors.issues.message}</p>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {fields.map((field, index) => {
                const existingIssue = schedule?.issues.find(issue => issue.name === watch(`issues.${index}.name`));
                const isCloseDatePast = existingIssue && new Date(existingIssue.closeDate) < new Date();
                
                return (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg bg-gray-50 cursor-move"
                  >
                    <GripVertical className="h-5 w-5 text-gray-400" />
                    
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Issue Name
                        </label>
                        <input
                          type="text"
                          {...register(`issues.${index}.name`)}
                          placeholder="e.g., Dec25, Jan26"
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.issues?.[index]?.name && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.issues[index].name.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Close Date {isCloseDatePast && <span className="text-red-600">(Past - Cannot modify)</span>}
                        </label>
                        <input
                          type="date"
                          {...register(`issues.${index}.closeDate`)}
                          disabled={isCloseDatePast}
                          className={`block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            isCloseDatePast ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                          }`}
                        />
                        {errors.issues?.[index]?.closeDate && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.issues[index].closeDate.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className={`p-2 rounded-md ${
                        fields.length === 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-red-600 hover:bg-red-100'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {schedule ? 'Update' : 'Create'} Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Schedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await api.get('/schedules');
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Error fetching schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (scheduleData) => {
    try {
      const response = await api.post('/schedules', scheduleData);
      setSchedules([response.data, ...schedules]);
      setShowModal(false);
      toast.success('Schedule created successfully');
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error(error.response?.data?.message || 'Error creating schedule');
    }
  };

  const handleUpdateSchedule = async (scheduleData) => {
    try {
      const response = await api.put(`/schedules/${selectedSchedule._id}`, scheduleData);
      setSchedules(schedules.map(s => s._id === selectedSchedule._id ? response.data : s));
      setShowModal(false);
      setSelectedSchedule(null);
      toast.success('Schedule updated successfully');
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error(error.response?.data?.message || 'Error updating schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await api.delete(`/schedules/${scheduleId}`);
        setSchedules(schedules.filter(s => s._id !== scheduleId));
        toast.success('Schedule deleted successfully');
      } catch (error) {
        console.error('Error deleting schedule:', error);
        toast.error('Error deleting schedule');
      }
    }
  };

  const filteredSchedules = schedules.filter(schedule =>
    schedule.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isCloseDatePast = (closeDate) => {
    return new Date(closeDate) < new Date();
  };

  return (
    <div>
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Schedules</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage issue schedules with close dates for booking management
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => {
              setSelectedSchedule(null);
              setShowModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
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
            placeholder="Search schedules..."
          />
        </div>
      </div>

      {/* Schedule Cards */}
      <div className="mt-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No schedules</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new schedule.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredSchedules.map((schedule) => (
              <div
                key={schedule._id}
                className="bg-white shadow rounded-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-900">
                      {schedule.name}
                    </h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                      Issues ({schedule.issues.length})
                    </h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {schedule.issues.map((issue, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md"
                        >
                          <span className="text-sm font-medium text-gray-900">
                            {issue.name}
                          </span>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className={`text-sm ${
                              isCloseDatePast(issue.closeDate) 
                                ? 'text-red-600 font-medium' 
                                : 'text-gray-600'
                            }`}>
                              {formatDate(issue.closeDate)}
                            </span>
                            {isCloseDatePast(issue.closeDate) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Closed
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ScheduleModal
          schedule={selectedSchedule}
          onClose={() => {
            setShowModal(false);
            setSelectedSchedule(null);
          }}
          onSave={selectedSchedule ? handleUpdateSchedule : handleCreateSchedule}
        />
      )}
    </div>
  );
};

export default Schedules; 