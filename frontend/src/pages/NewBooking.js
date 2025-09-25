import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  ArrowLeft,
  Plus,
  Copy,
  Trash2,
  Save,
  Calculator
} from 'lucide-react';
import Layout from '../components/Layout';
import { 
  fetchCustomers, 
  fetchMagazines, 
  fetchContentSizes 
} from '../store/slices/bookingSlice';
import api from '../utils/api';
import { toast } from 'react-toastify';

const magazineEntrySchema = yup.object({
  magazine: yup.string().required('Magazine is required'),
  contentSize: yup.string().required('Size is required'),
  contentType: yup.string().required('Type is required'),
  listPrice: yup.number().required('List price is required').min(0),
  discountPercentage: yup.number().min(0).max(100),
  discountValue: yup.number().min(0),
  startIssue: yup.string().required('Start issue is required'),
  finishIssue: yup.string(),
  isOngoing: yup.boolean()
});

const bookingSchema = yup.object({
  customer: yup.string().required('Customer is required'),
  magazineEntries: yup.array().of(magazineEntrySchema).min(1, 'At least one magazine entry is required'),
  additionalCharges: yup.number().min(0),
  notes: yup.string()
});

const NewBooking = () => {
  const { id } = useParams(); // Get booking ID from URL if editing
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { customers, magazines, contentSizes, loading } = useSelector((state) => state.booking);
  
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [existingBookings, setExistingBookings] = useState([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [availableIssues, setAvailableIssues] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);

  const { register, handleSubmit, control, formState: { errors }, watch, setValue, reset } = useForm({
    resolver: yupResolver(bookingSchema),
    defaultValues: {
      customer: '',
      magazineEntries: [{ 
        magazine: '', 
        contentSize: '', 
        contentType: 'Advert',
        listPrice: 0,
        discountPercentage: 0,
        discountValue: 0,
        startIssue: '',
        finishIssue: '',
        isOngoing: false
      }],
      additionalCharges: 0,
      notes: ''
    }
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'magazineEntries'
  });

  const watchedCustomer = watch('customer');
  const watchedEntries = watch('magazineEntries');

  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchMagazines());
    dispatch(fetchContentSizes());
    fetchContentTypes();
  }, [dispatch]);

  useEffect(() => {
    // If editing an existing booking, load it directly
    if (id) {
      loadExistingBooking(id);
    }
  }, [id]);

  useEffect(() => {
    if (watchedCustomer && !id) { // Only fetch customer bookings if not editing specific booking
      setSelectedCustomer(watchedCustomer);
      fetchCustomerBookings(watchedCustomer);
    }
  }, [watchedCustomer, id]);

  useEffect(() => {
    // Load available issues for selected magazines
    const magazineIds = watchedEntries.map(entry => entry.magazine).filter(Boolean);
    if (magazineIds.length > 0) {
      loadAvailableIssues(magazineIds);
    }
  }, [watchedEntries]);

  const fetchContentTypes = async () => {
    try {
      const response = await api.get('/content-types');
      setContentTypes(response.data);
    } catch (error) {
      console.error('Error fetching content types:', error);
      setContentTypes([
        { _id: 'default-1', name: 'Advert' },
        { _id: 'default-2', name: 'Article' },
        { _id: 'default-3', name: 'Puzzle' },
        { _id: 'default-4', name: 'Advertorial' },
        { _id: 'default-5', name: 'Front Cover' },
        { _id: 'default-6', name: 'In-house' }
      ]);
    }
  };

  const loadExistingBooking = async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      const booking = response.data;
      populateFormWithBooking(booking);
      setIsEditMode(true);
      setEditingBookingId(bookingId);
      setSelectedCustomer(booking.customer._id);
    } catch (error) {
      console.error('Error loading booking:', error);
      toast.error('Failed to load booking');
      navigate('/bookings');
    }
  };

  const fetchCustomerBookings = async (customerId) => {
    try {
      const response = await api.get(`/bookings/customer/${customerId}`);
      setExistingBookings(response.data);
      
      // If there are existing bookings and we're not editing a specific one, populate with the latest
      if (response.data.length > 0 && !id) {
        const latestBooking = response.data[0];
        populateFormWithBooking(latestBooking);
        setIsEditMode(true);
        setEditingBookingId(latestBooking._id);
      } else if (!id) {
        setIsEditMode(false);
        setEditingBookingId(null);
      }
    } catch (error) {
      console.error('Error fetching customer bookings:', error);
      setExistingBookings([]);
    }
  };

  const populateFormWithBooking = (booking) => {
    reset({
      customer: booking.customer._id,
      magazineEntries: booking.magazineEntries,
      additionalCharges: booking.additionalCharges || 0,
      notes: booking.notes || ''
    });
  };

  const loadAvailableIssues = async (magazineIds) => {
    const issueMap = {};
    for (const magazineId of magazineIds) {
      try {
        const magazine = magazines.find(m => m._id === magazineId);
        if (magazine && magazine.schedule && magazine.schedule.issues) {
          const currentDate = new Date();
          const availableIssues = magazine.schedule.issues.filter(issue => 
            new Date(issue.closeDate) >= currentDate
          );
          issueMap[magazineId] = availableIssues;
        }
      } catch (error) {
        console.error('Error loading issues for magazine:', magazineId, error);
      }
    }
    setAvailableIssues(issueMap);
  };

  const addRow = () => {
    append({
      magazine: '',
      contentSize: '',
      contentType: 'Advert',
      listPrice: 0,
      discountPercentage: 0,
      discountValue: 0,
      startIssue: '',
      finishIssue: '',
      isOngoing: false
    });
  };

  const copyRow = (index) => {
    const rowToCopy = watchedEntries[index];
    append({ ...rowToCopy });
  };

  const deleteRow = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const calculateRowTotal = (entry) => {
    const listPrice = Number(entry.listPrice) || 0;
    const discountValue = Number(entry.discountValue) || 0;
    return Math.max(0, listPrice - discountValue);
  };

  const calculateTotalValue = () => {
    const entriesTotal = watchedEntries.reduce((sum, entry) => {
      return sum + calculateRowTotal(entry);
    }, 0);
    return entriesTotal + (Number(watch('additionalCharges')) || 0);
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        customer: data.customer,
        magazineEntries: data.magazineEntries.map(entry => ({
          ...entry,
          listPrice: Number(entry.listPrice),
          discountPercentage: Number(entry.discountPercentage) || 0,
          discountValue: Number(entry.discountValue) || 0,
          isOngoing: Boolean(entry.isOngoing)
        })),
        additionalCharges: Number(data.additionalCharges) || 0,
        notes: data.notes
      };

      let response;
      if (isEditMode && editingBookingId) {
        response = await api.put(`/bookings/${editingBookingId}`, payload);
        toast.success('Booking updated successfully');
      } else {
        response = await api.post('/bookings', payload);
        toast.success('Booking created successfully');
      }

      navigate('/bookings');
    } catch (error) {
      console.error('Error saving booking:', error);
      toast.error(error.response?.data?.message || 'Error saving booking');
    }
  };

  const formatCurrency = (value) => `£${(value || 0).toFixed(2)}`;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/bookings')}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Bookings
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Edit Booking' : 'Add New Booking'}
            </h1>
            <p className="mt-2 text-gray-600">
              {isEditMode ? 'Modify existing booking entries' : 'Create a new booking for a customer'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Customer Selection */}
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Customer</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select the customer for this booking
                </p>
              </div>
              
              <div>
                <select
                  {...register('customer')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                {errors.customer && (
                  <p className="mt-1 text-sm text-red-600">{errors.customer.message}</p>
                )}
              </div>
            </div>

            {/* Magazine Entries Table */}
            {selectedCustomer && (
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Booking Details</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Configure magazine bookings for this customer
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addRow}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Row
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Magazine
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Size
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Type
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            List
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Discount %
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Discount £
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Total
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Start
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Finish
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Ongoing?
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {fields.map((field, index) => {
                          const entry = watchedEntries[index] || {};
                          const magazineIssues = availableIssues[entry.magazine] || [];
                          
                          return (
                            <tr key={field.id}>
                              <td className="px-3 py-4 whitespace-nowrap">
                                <select
                                  {...register(`magazineEntries.${index}.magazine`)}
                                  className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">Select</option>
                                  {magazines.map((magazine) => (
                                    <option key={magazine._id} value={magazine._id}>
                                      {magazine.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              
                              <td className="px-3 py-4 whitespace-nowrap">
                                <select
                                  {...register(`magazineEntries.${index}.contentSize`)}
                                  className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">Select</option>
                                  {contentSizes.map((size) => (
                                    <option key={size._id} value={size._id}>
                                      {size.description}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="px-3 py-4 whitespace-nowrap">
                                <select
                                  {...register(`magazineEntries.${index}.contentType`)}
                                  className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                  {contentTypes.map((type) => (
                                    <option key={type._id} value={type.name}>
                                      {type.name}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="px-3 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  {...register(`magazineEntries.${index}.listPrice`)}
                                  className="block w-20 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                              </td>

                              <td className="px-3 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  {...register(`magazineEntries.${index}.discountPercentage`)}
                                  className="block w-16 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                              </td>

                              <td className="px-3 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  {...register(`magazineEntries.${index}.discountValue`)}
                                  className="block w-20 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                              </td>

                              <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                {formatCurrency(calculateRowTotal(entry))}
                              </td>

                              <td className="px-3 py-4 whitespace-nowrap">
                                <select
                                  {...register(`magazineEntries.${index}.startIssue`)}
                                  className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">Select</option>
                                  {magazineIssues.map((issue) => (
                                    <option key={issue._id} value={issue.name}>
                                      {issue.name}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="px-3 py-4 whitespace-nowrap">
                                <select
                                  {...register(`magazineEntries.${index}.finishIssue`)}
                                  disabled={entry.isOngoing}
                                  className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                >
                                  <option value="">Select</option>
                                  {magazineIssues.map((issue) => (
                                    <option key={issue._id} value={issue.name}>
                                      {issue.name}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="px-3 py-4 whitespace-nowrap text-center">
                                <input
                                  type="checkbox"
                                  {...register(`magazineEntries.${index}.isOngoing`)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                              </td>

                              <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => copyRow(index)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Copy Row"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteRow(index)}
                                    disabled={fields.length === 1}
                                    className={`${
                                      fields.length === 1 
                                        ? 'text-gray-300 cursor-not-allowed' 
                                        : 'text-red-600 hover:text-red-900'
                                    }`}
                                    title="Delete Row"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Total and Notes */}
            {selectedCustomer && (
              <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Additional Charges
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">£</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register('additionalCharges')}
                        className="block w-full pl-7 pr-12 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total value of this booking:</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(calculateTotalValue())}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Additional Notes
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Any additional notes for this booking..."
                  />
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    {isEditMode ? 'Update Booking' : 'Save Booking'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default NewBooking; 