import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout';
import { 
  fetchCustomers, 
  fetchMagazines, 
  fetchContentSizes
} from '../store/slices/bookingSlice';
import { contentSizesAPI, bookingsAPI } from '../utils/api';
import api from '../utils/api';
import { toast } from 'react-toastify';

const bookingSchema = yup.object().shape({
  customer: yup.string().required('Customer is required'),
  contentSize: yup.string().required('Content size is required'),
  magazines: yup.array().min(1, 'At least one magazine is required'),
  contentType: yup.string(),
  basePrice: yup.number().required('Base price is required').min(0),
  firstIssue: yup.string().required('First issue is required'),
  discountPercentage: yup.number().min(0).max(100),
  discountValue: yup.number().min(0),
  additionalCharges: yup.number().min(0),
  netValue: yup.number().min(0),
  isOngoing: yup.boolean(),
  lastIssue: yup.string(),
  note: yup.string(),
  status: yup.string()
});

const EditBooking = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { customers, magazines, contentSizes, loading } = useSelector((state) => state.booking);
  
  const [selectedMagazines, setSelectedMagazines] = useState([]);
  const [selectedContentSize, setSelectedContentSize] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [booking, setBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(true);

  const { 
    register, 
    handleSubmit, 
    watch, 
    setValue, 
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(bookingSchema),
    defaultValues: {
      discountPercentage: 0,
      discountValue: 0,
      additionalCharges: 0,
      isOngoing: false,
      status: 'Active'
    }
  });

  const watchedContentSize = watch('contentSize');
  const watchedValues = watch(['discountPercentage', 'discountValue', 'additionalCharges']);

  // Load initial data
  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchMagazines());
    dispatch(fetchContentSizes());
  }, [dispatch]);

  // Load booking data
  useEffect(() => {
    const loadBooking = async () => {
      try {
        setLoadingBooking(true);
        const response = await bookingsAPI.getById(id);
        const bookingData = response.data;
        setBooking(bookingData);

        // Pre-populate form fields
        reset({
          customer: bookingData.customer._id,
          contentSize: bookingData.contentSize._id,
          magazines: bookingData.magazines.map(m => m._id),
          contentType: bookingData.contentType || '',
          basePrice: bookingData.basePrice,
          firstIssue: bookingData.firstIssue,
          lastIssue: bookingData.lastIssue || '',
          isOngoing: bookingData.isOngoing,
          note: bookingData.note || '',
          discountPercentage: bookingData.discountPercentage || 0,
          discountValue: bookingData.discountValue || 0,
          additionalCharges: bookingData.additionalCharges || 0,
          netValue: bookingData.netValue,
          status: bookingData.status
        });

        setSelectedMagazines(bookingData.magazines.map(m => m._id));
        setSelectedContentSize(bookingData.contentSize._id);
        setBasePrice(bookingData.basePrice);
      } catch (error) {
        console.error('Error loading booking:', error);
        toast.error('Failed to load booking data');
        navigate('/bookings');
      } finally {
        setLoadingBooking(false);
      }
    };

    if (id) {
      loadBooking();
    }
  }, [id, reset, navigate]);

  // Calculate base price when content size or magazines change
  useEffect(() => {
    const calculatePrice = async () => {
      if (watchedContentSize && selectedMagazines.length > 0) {
        try {
          const response = await contentSizesAPI.getById(watchedContentSize);
          const contentSize = response.data;
          
          let totalPrice = 0;
          for (const magazineId of selectedMagazines) {
            const pricing = contentSize.pricing.find(p => p.magazine.toString() === magazineId);
            if (pricing) {
              totalPrice += pricing.price;
            }
          }
          
          setBasePrice(totalPrice);
          setValue('basePrice', totalPrice);
        } catch (error) {
          console.error('Error calculating price:', error);
        }
      }
    };

    calculatePrice();
  }, [watchedContentSize, selectedMagazines, setValue]);

  // Calculate net value when pricing fields change
  useEffect(() => {
    const discountAmount = (basePrice * (watchedValues.discountPercentage || 0)) / 100 + (watchedValues.discountValue || 0);
    const calculated = Math.max(0, basePrice - discountAmount + (watchedValues.additionalCharges || 0));
    setValue('netValue', calculated);
  }, [basePrice, watchedValues.discountPercentage, watchedValues.discountValue, watchedValues.additionalCharges, setValue]);

  const onSubmit = async (data) => {
    try {
      const bookingData = {
        ...data,
        magazines: selectedMagazines,
        basePrice,
        netValue: data.netValue
      };

      await bookingsAPI.update(id, bookingData);
      toast.success('Booking updated successfully');
      navigate('/bookings');
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  const handleMagazineSelection = (magazineId) => {
    setSelectedMagazines(prev => {
      const newSelection = prev.includes(magazineId) 
        ? prev.filter(id => id !== magazineId)
        : [...prev, magazineId];
      
      setValue('magazines', newSelection);
      return newSelection;
    });
  };

  const handleContentSizeChange = (e) => {
    const value = e.target.value;
    setSelectedContentSize(value);
    setValue('contentSize', value);
  };

  if (loadingBooking) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading booking...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/bookings')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Bookings
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Booking</h1>
          <p className="mt-2 text-gray-600">Update booking details</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Customer and Magazine Selection */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Customer & Publication</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select the customer and magazines for this booking.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="grid grid-cols-1 gap-6">
                  {/* Customer Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Customer *
                    </label>
                    <select
                      {...register('customer')}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

                  {/* Magazine Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Magazines *
                    </label>
                    <div className="mt-2 grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                      {magazines.map((magazine) => (
                        <label key={magazine._id} className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedMagazines.includes(magazine._id)}
                            onChange={() => handleMagazineSelection(magazine._id)}
                            className="form-checkbox h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-sm text-gray-700">{magazine.name}</span>
                        </label>
                      ))}
                    </div>
                    {errors.magazines && (
                      <p className="mt-1 text-sm text-red-600">{errors.magazines.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Details */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Content Details</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Specify the content type and size for this booking.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="grid grid-cols-1 gap-6">
                  {/* Content Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Content Type
                    </label>
                    <select
                      {...register('contentType')}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select content type</option>
                      <option value="Advert">Advert</option>
                      <option value="Article">Article</option>
                      <option value="Puzzle">Puzzle</option>
                      <option value="Advertorial">Advertorial</option>
                      <option value="Front Cover">Front Cover</option>
                      <option value="In-house">In-house</option>
                    </select>
                  </div>

                  {/* Content Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Content Size *
                    </label>
                    <select
                      value={selectedContentSize}
                      onChange={handleContentSizeChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select content size</option>
                      {contentSizes.map((size) => (
                        <option key={size._id} value={size._id}>
                          {size.description} ({size.size})
                        </option>
                      ))}
                    </select>
                    {errors.contentSize && (
                      <p className="mt-1 text-sm text-red-600">{errors.contentSize.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Pricing</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Set the pricing details for this booking.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="grid grid-cols-1 gap-6">
                  {/* Base Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Base Price *
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">£</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        {...register('basePrice')}
                        value={basePrice}
                        readOnly
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md bg-gray-50"
                        placeholder="0.00"
                      />
                    </div>
                    {errors.basePrice && (
                      <p className="mt-1 text-sm text-red-600">{errors.basePrice.message}</p>
                    )}
                  </div>

                  {/* Discount Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Discount Percentage
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        step="0.01"
                        max="100"
                        {...register('discountPercentage')}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="0"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Discount Value */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Discount Value
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">£</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        {...register('discountValue')}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Additional Charges */}
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
                        {...register('additionalCharges')}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Net Value */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Net Value
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">£</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        {...register('netValue')}
                        readOnly
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md bg-gray-50"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Scheduling</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Set the issue scheduling for this booking.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="grid grid-cols-1 gap-6">
                  {/* First Issue */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      First Issue *
                    </label>
                    <input
                      type="text"
                      {...register('firstIssue')}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="e.g., January 2024"
                    />
                    {errors.firstIssue && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstIssue.message}</p>
                    )}
                  </div>

                  {/* Ongoing Checkbox */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('isOngoing')}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      This is an ongoing booking
                    </label>
                  </div>

                  {/* Last Issue */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Issue
                    </label>
                    <input
                      type="text"
                      {...register('lastIssue')}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="e.g., December 2024 (leave empty for ongoing)"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      {...register('status')}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Additional Information</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add any additional notes or information.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Note
                  </label>
                  <textarea
                    rows={3}
                    {...register('note')}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/bookings')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading.createBooking}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading.createBooking ? 'Updating...' : 'Update Booking'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditBooking; 