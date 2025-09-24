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
import api from '../utils/api';
import { toast } from 'react-toastify';

const bookingSchema = yup.object().shape({
  customer: yup.string().required('Customer is required'),
  contentSize: yup.string().required('Content size is required'),
  magazines: yup.array().min(1, 'At least one magazine is required'),
  contentType: yup.string(), // Remove .required() to make it optional
  basePrice: yup.number().required('Base price is required').min(0),
  firstIssue: yup.string().required('First issue is required'),
  discountPercentage: yup.number().min(0).max(100),
  discountValue: yup.number().min(0),
  additionalCharges: yup.number().min(0),
  netValue: yup.number().min(0),
  isOngoing: yup.boolean(),
  lastIssue: yup.string(),
  note: yup.string()
});

const NewBooking = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { 
    customers, 
    magazines, 
    contentSizes, 
    loading 
  } = useSelector((state) => state.booking);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: yupResolver(bookingSchema),
    defaultValues: {
      discountPercentage: 0,
      discountValue: 0,
      additionalCharges: 0,
      isOngoing: false,
      netValue: 0
    }
  });

  const [selectedMagazines, setSelectedMagazines] = useState([]);
  const [selectedContentSize, setSelectedContentSize] = useState(null);
  const [basePrice, setBasePrice] = useState(0);
  const [availableIssues, setAvailableIssues] = useState([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [magazinePrices, setMagazinePrices] = useState([]);

  const watchedValues = watch();
  const watchedContentSize = watch('contentSize');
  const watchedIsOngoing = watch('isOngoing');

  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchMagazines());
    dispatch(fetchContentSizes());
    fetchContentTypes();
  }, [dispatch]);

  const fetchContentTypes = async () => {
    try {
      const response = await api.get('/content-types');
      setContentTypes(response.data);
    } catch (error) {
      console.error('Error fetching content types:', error);
      // Fallback to default content types if API fails
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

  // Clear last issue when ongoing is checked
  useEffect(() => {
    if (watchedIsOngoing) {
      setValue('lastIssue', '');
    }
  }, [watchedIsOngoing, setValue]);

  // Calculate available issues from selected magazines
  useEffect(() => {
    if (selectedMagazines.length > 0) {
      const issues = [];
      selectedMagazines.forEach(magazineId => {
        const magazine = magazines.find(m => m._id === magazineId);
        if (magazine) {
          // Only include non-hidden issues
          const visibleIssues = magazine.issues.filter(issue => !issue.hidden);
          visibleIssues.forEach(issue => {
            issues.push({
              id: `${magazineId}_${issue.name}`,
              name: issue.name,
              magazineName: magazine.name,
              displayName: `${magazine.name} - ${issue.name}`,
              startDate: issue.startDate
            });
          });
        }
      });
      // Sort by start date
      issues.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      setAvailableIssues(issues);
    } else {
      setAvailableIssues([]);
    }
  }, [selectedMagazines, magazines]);

  // Calculate pricing when content size or magazines change
  useEffect(() => {
    const calculatePrice = async () => {
      if (watchedContentSize && selectedMagazines.length > 0) {
        try {
          // Get prices for each magazine
          const pricePromises = selectedMagazines.map(async magazineId => {
            const response = await contentSizesAPI.getPrice(watchedContentSize, magazineId);
            const magazine = magazines.find(m => m._id === magazineId);
            return {
              magazineId,
              magazineName: magazine?.name || 'Unknown',
              basePrice: response.data.price,
              discountPercentage: watchedValues.discountPercentage || 0,
              discountValue: 0,
              additionalCharges: 0
            };
          });
          
          const prices = await Promise.all(pricePromises);
          setMagazinePrices(prices);
          
          const totalBasePrice = prices.reduce((sum, p) => sum + p.basePrice, 0);
          setBasePrice(totalBasePrice);
          setValue('basePrice', totalBasePrice);
        } catch (error) {
          console.error('Error calculating price:', error);
        }
      }
    };

    calculatePrice();
  }, [watchedContentSize, selectedMagazines, setValue, magazines, watchedValues.discountPercentage]);

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
        netValue: data.netValue // Use the calculated netValue from the form
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
      const newSelection = prev.includes(magazineId) 
        ? prev.filter(id => id !== magazineId)
        : [...prev, magazineId];
      
      // Update the form value as well
      setValue('magazines', newSelection);
      return newSelection;
    });
  };

  const handleSelectAllMagazines = () => {
    const allMagazineIds = magazines.map(m => m._id);
    const areAllSelected = magazines.length > 0 && selectedMagazines.length === magazines.length;
    
    if (areAllSelected) {
      setSelectedMagazines([]);
      setValue('magazines', []);
    } else {
      setSelectedMagazines(allMagazineIds);
      setValue('magazines', allMagazineIds);
    }
  };

  const handleContentSizeChange = (e) => {
    const value = e.target.value;
    setSelectedContentSize(value);
    setValue('contentSize', value);
  };

  const formatCurrency = (amount) => `£${amount.toFixed(2)}`;

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
          <h1 className="text-3xl font-bold text-gray-900">Create New Booking</h1>
          <p className="mt-2 text-gray-600">Create a new magazine space booking</p>
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
                          {customer.name} {customer.businessName && `- ${customer.businessName}`}
                        </option>
                      ))}
                    </select>
                    {errors.customer && (
                      <p className="mt-1 text-sm text-red-600">{errors.customer.message}</p>
                    )}
                  </div>

                  {/* Magazine Selection */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Magazines *
                      </label>
                      <button
                        type="button"
                        onClick={handleSelectAllMagazines}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {selectedMagazines.length === magazines.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                      {magazines.map((magazine) => {
                        const visibleIssuesCount = magazine.issues.filter(issue => !issue.hidden).length;
                        return (
                          <label key={magazine._id} className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedMagazines.includes(magazine._id)}
                              onChange={() => handleMagazineSelection(magazine._id)}
                              className="form-checkbox h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {magazine.name} ({visibleIssuesCount} available issues)
                            </span>
                          </label>
                        );
                      })}
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
                  {/* Content Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Content Size *
                    </label>
                    <select
                      {...register('contentSize')}
                      onChange={handleContentSizeChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select content size</option>
                      {contentSizes.map((size) => (
                        <option key={size._id} value={size._id}>
                          {size.name} ({size.width}" x {size.height}")
                        </option>
                      ))}
                    </select>
                    {errors.contentSize && (
                      <p className="mt-1 text-sm text-red-600">{errors.contentSize.message}</p>
                    )}
                  </div>

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
                      {contentTypes.map((type) => (
                        <option key={type._id} value={type.name}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Schedule</h3>
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
                    <select
                      {...register('firstIssue')}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select first issue</option>
                      {availableIssues.map((issue) => (
                        <option key={issue.id} value={issue.name}>
                          {issue.displayName}
                        </option>
                      ))}
                    </select>
                    {errors.firstIssue && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstIssue.message}</p>
                    )}
                  </div>

                  {/* Last Issue */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Issue
                    </label>
                    <select
                      {...register('lastIssue')}
                      disabled={watchedIsOngoing}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select last issue (optional)</option>
                      {availableIssues.map((issue) => (
                        <option key={issue.id} value={issue.name}>
                          {issue.displayName}
                        </option>
                      ))}
                    </select>
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
                  Pricing breakdown by magazine and total values.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                {/* Magazine Pricing Table */}
                {magazinePrices.length > 0 && (
                  <div className="mb-6">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Magazine
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Base Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Discount %
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Discount £
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Extra Charge
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {magazinePrices.map((magazine) => {
                            const discountAmount = (magazine.basePrice * (watchedValues.discountPercentage || 0)) / 100;
                            const total = magazine.basePrice - discountAmount + (watchedValues.additionalCharges || 0) / magazinePrices.length;
                            return (
                              <tr key={magazine.magazineId}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {magazine.magazineName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(magazine.basePrice)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {watchedValues.discountPercentage || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(discountAmount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency((watchedValues.additionalCharges || 0) / magazinePrices.length)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {formatCurrency(total)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Total Value Controls */}
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Total Base Price
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">£</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={basePrice}
                        readOnly
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md bg-gray-50"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

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

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-900">Total value of this booking:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(watchedValues.netValue || 0)}
                      </span>
                    </div>
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
              disabled={loading.bookings}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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