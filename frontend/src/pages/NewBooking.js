import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout';
import { 
  fetchCustomers, 
  fetchMagazines, 
  fetchContentSizes, 
  createBooking 
} from '../store/slices/bookingSlice';
import { contentSizesAPI } from '../utils/api';
import { toast } from 'react-toastify';

const bookingSchema = yup.object().shape({
  customer: yup.string().required('Customer is required'),
  contentSize: yup.string().required('Content size is required'),
  magazines: yup.array().min(1, 'At least one magazine is required'),
  contentType: yup.string().required('Content type is required'),
  basePrice: yup.number().required('Base price is required').min(0),
  firstIssue: yup.string().required('First issue is required'),
  discountPercentage: yup.number().min(0).max(100),
  discountValue: yup.number().min(0),
  additionalCharges: yup.number().min(0),
});

const NewBooking = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { customers, magazines, contentSizes, loading } = useSelector((state) => state.booking);
  const [selectedMagazines, setSelectedMagazines] = useState([]);
  const [basePrice, setBasePrice] = useState(0);
  const [netValue, setNetValue] = useState(0);
  
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    resolver: yupResolver(bookingSchema),
    defaultValues: {
      discountPercentage: 0,
      discountValue: 0,
      additionalCharges: 0,
      isOngoing: false
    }
  });

  const watchedFields = watch();

  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchMagazines());
    dispatch(fetchContentSizes());
  }, [dispatch]);

  // Calculate pricing when content size or magazines change
  useEffect(() => {
    const calculatePrice = async () => {
      if (watchedFields.contentSize && selectedMagazines.length > 0) {
        try {
          // Get prices for each magazine and use the average
          const pricePromises = selectedMagazines.map(magazineId =>
            contentSizesAPI.getPrice(watchedFields.contentSize, magazineId)
          );
          
          const prices = await Promise.all(pricePromises);
          const avgPrice = prices.reduce((sum, p) => sum + p.data.price, 0) / prices.length;
          setBasePrice(avgPrice);
          setValue('basePrice', avgPrice);
        } catch (error) {
          console.error('Error calculating price:', error);
        }
      }
    };

    calculatePrice();
  }, [watchedFields.contentSize, selectedMagazines, setValue]);

  // Calculate net value when pricing fields change
  useEffect(() => {
    const discountAmount = (basePrice * (watchedFields.discountPercentage || 0)) / 100 + (watchedFields.discountValue || 0);
    const calculated = Math.max(0, basePrice - discountAmount + (watchedFields.additionalCharges || 0));
    setNetValue(calculated);
  }, [basePrice, watchedFields.discountPercentage, watchedFields.discountValue, watchedFields.additionalCharges]);

  const onSubmit = async (data) => {
    try {
      const bookingData = {
        ...data,
        magazines: selectedMagazines,
        basePrice,
        netValue
      };

      await dispatch(createBooking(bookingData)).unwrap();
      toast.success('Booking created successfully');
      navigate('/bookings');
    } catch (error) {
      toast.error(error.message || 'An error occurred');
    }
  };

  const handleMagazineSelection = (magazineId) => {
    setSelectedMagazines(prev => {
      if (prev.includes(magazineId)) {
        return prev.filter(id => id !== magazineId);
      } else {
        return [...prev, magazineId];
      }
    });
  };

  const contentTypes = ['Advert', 'Article', 'Puzzle', 'Advertorial', 'Front Cover', 'In-house'];

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
          <h1 className="text-3xl font-bold text-gray-900">New Booking</h1>
          <p className="mt-2 text-gray-600">Create a new magazine space booking</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Booking Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer *
                </label>
                <select
                  {...register('customer')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select customer...</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} - {customer.businessCategory}
                    </option>
                  ))}
                </select>
                {errors.customer && (
                  <p className="text-red-600 text-sm mt-1">{errors.customer.message}</p>
                )}
              </div>

              {/* Content Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Size *
                </label>
                <select
                  {...register('contentSize')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select content size...</option>
                  {contentSizes.map((size) => (
                    <option key={size._id} value={size._id}>
                      {size.description} ({size.size} pages)
                    </option>
                  ))}
                </select>
                {errors.contentSize && (
                  <p className="text-red-600 text-sm mt-1">{errors.contentSize.message}</p>
                )}
              </div>

              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type *
                </label>
                <select
                  {...register('contentType')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select content type...</option>
                  {contentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.contentType && (
                  <p className="text-red-600 text-sm mt-1">{errors.contentType.message}</p>
                )}
              </div>

              {/* First Issue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Issue *
                </label>
                <input
                  type="text"
                  {...register('firstIssue')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Nov25"
                />
                {errors.firstIssue && (
                  <p className="text-red-600 text-sm mt-1">{errors.firstIssue.message}</p>
                )}
              </div>

              {/* Last Issue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Issue
                </label>
                <input
                  type="text"
                  {...register('lastIssue')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Dec25 (leave blank if ongoing)"
                />
              </div>

              {/* Ongoing checkbox */}
              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('isOngoing')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    This is an ongoing booking (no end date)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Magazines */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Magazines *</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {magazines.map((magazine) => (
                <div
                  key={magazine._id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedMagazines.includes(magazine._id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => handleMagazineSelection(magazine._id)}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedMagazines.includes(magazine._id)}
                      onChange={() => {}}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-gray-900">{magazine.name}</p>
                      <p className="text-xs text-gray-500">{magazine.issues.length} issues</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {selectedMagazines.length === 0 && (
              <p className="text-red-600 text-sm mt-2">At least one magazine is required</p>
            )}
          </div>

          {/* Pricing */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={basePrice}
                  readOnly
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('discountPercentage')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('discountValue')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Charges (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('additionalCharges')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Net Value:</span>
                <span className="text-lg font-bold text-gray-900">£{netValue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                {...register('note')}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional notes about this booking..."
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/bookings')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading.bookings}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              {loading.bookings ? 'Creating...' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default NewBooking; 