import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  FileText,
  Plus,
  Download,
  X
} from 'lucide-react';
import Layout from '../components/Layout';
import { 
  fetchBookings, 
  fetchCustomers, 
  fetchMagazines,
  deleteBookingAsync 
} from '../store/slices/bookingSlice';
import { bookingsAPI, schedulesAPI } from '../utils/api';
import { toast } from 'react-toastify';

const Bookings = () => {
  const dispatch = useDispatch();
  const { bookings, customers, magazines } = useSelector((state) => state.booking);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState('');
  const [availableIssues, setAvailableIssues] = useState([]);
  const [currentIssue, setCurrentIssue] = useState(null);
  const [flattenedBookings, setFlattenedBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, [dispatch]);

  // Fallback to stop loading after component mounts
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 15000); // Stop loading after 15 seconds regardless

    return () => clearTimeout(fallbackTimer);
  }, [loading]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      // Add timeout fallback - stop loading after 10 seconds regardless
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 10000);

      await Promise.all([
        dispatch(fetchBookings()),
        dispatch(fetchCustomers()),
        dispatch(fetchMagazines()),
        loadAvailableIssues(),
        loadCurrentIssue()
      ]);

      clearTimeout(timeout);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Flatten bookings into individual magazine entries for the table
    const flattened = [];
    bookings.forEach(booking => {
      booking.magazineEntries?.forEach(entry => {
        flattened.push({
          id: `${booking._id}_${entry._id || entry.magazine}`,
          bookingId: booking._id,
          customer: booking.customer,
          magazine: entry.magazine,
          contentSize: entry.contentSize,
          contentType: entry.contentType,
          total: entry.totalPrice,
          startIssue: entry.startIssue,
          finishIssue: entry.finishIssue,
          isOngoing: entry.isOngoing,
          createdAt: booking.createdAt
        });
      });
    });
    setFlattenedBookings(flattened);
  }, [bookings]);

  useEffect(() => {
    // Apply search and issue filtering
    let filtered = flattenedBookings;

    // Apply search term (search customers)
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply issue filtering
    if (selectedIssue) {
      filtered = filtered.filter(entry => {
        // Show entries where the selected issue falls within the booking's date range
        if (entry.startIssue === selectedIssue) return true;
        if (entry.isOngoing && entry.startIssue <= selectedIssue) return true;
        if (!entry.isOngoing && entry.finishIssue && 
            entry.startIssue <= selectedIssue && entry.finishIssue >= selectedIssue) return true;
        return false;
      });
    }

    setFilteredBookings(filtered);
  }, [flattenedBookings, searchTerm, selectedIssue]);

  useEffect(() => {
    // Set default filter to current issue when it's loaded
    if (currentIssue && !selectedIssue) {
      setSelectedIssue(currentIssue);
    }
  }, [currentIssue, selectedIssue]);

  const loadAvailableIssues = async () => {
    try {
      const response = await schedulesAPI.getAll();
      const allIssues = [];
      
      response.data.forEach(schedule => {
        schedule.issues.forEach(issue => {
          if (!allIssues.some(i => i.name === issue.name)) {
            allIssues.push({
              name: issue.name,
              closeDate: issue.closeDate
            });
          }
        });
      });

      // Sort issues by close date
      allIssues.sort((a, b) => new Date(a.closeDate) - new Date(b.closeDate));
      setAvailableIssues(allIssues);
    } catch (error) {
      console.error('Error loading available issues:', error);
    }
  };

  const loadCurrentIssue = async () => {
    try {
      const response = await bookingsAPI.getCurrentIssue();
      setCurrentIssue(response.data.currentIssue);
    } catch (error) {
      console.error('Error loading current issue:', error);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await dispatch(deleteBookingAsync(bookingId)).unwrap();
        toast.success('Booking deleted successfully');
      } catch (error) {
        console.error('Error deleting booking:', error);
        toast.error(error || 'Error deleting booking');
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedIssue('');
  };

  const formatCurrency = (value) => `£${(value || 0).toFixed(2)}`;

  const formatIssueRange = (startIssue, finishIssue, isOngoing) => {
    if (isOngoing) {
      return `${startIssue} Ongoing`;
    }
    if (finishIssue && finishIssue !== startIssue) {
      return `${startIssue}-${finishIssue}`;
    }
    return startIssue;
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
            <p className="mt-2 text-gray-600">Manage your magazine space bookings</p>
          </div>
          <Link
            to="/bookings/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add/Edit Booking
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
            {/* Customer Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search Customers"
                />
              </div>
            </div>

            {/* Issue Filter */}
            <div className="min-w-0 flex-1 max-w-xs">
              <select
                value={selectedIssue}
                onChange={(e) => setSelectedIssue(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Issues</option>
                {availableIssues.map((issue) => (
                  <option key={issue.name} value={issue.name}>
                    {issue.name}
                    {currentIssue === issue.name && ' (Current)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {(searchTerm || selectedIssue) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredBookings.length} booking entries
          {selectedIssue && ` for ${selectedIssue}`}
          {selectedIssue === currentIssue && ' (Current Issue)'}
        </div>

        {/* Bookings Table */}
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
          {loading && bookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedIssue 
                  ? 'Try adjusting your search or filters.' 
                  : 'Get started by creating your first booking.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Magazine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Start
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Finish
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.customer?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {entry.magazine?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {entry.contentSize?.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {entry.contentType}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(entry.total)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {entry.startIssue}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {entry.isOngoing ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Ongoing
                            </span>
                          ) : (
                            entry.finishIssue || '-'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/bookings/${entry.bookingId}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/bookings/edit/${entry.bookingId}`}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit Booking"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteBooking(entry.bookingId)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Booking"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Bookings; 