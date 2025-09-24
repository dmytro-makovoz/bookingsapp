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
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import Layout from '../components/Layout';
import { 
  fetchBookings, 
  fetchCustomers, 
  fetchMagazines 
} from '../store/slices/bookingSlice';
import { bookingsAPI } from '../utils/api';
import { toast } from 'react-toastify';

const Bookings = () => {
  const dispatch = useDispatch();
  const { bookings, customers, magazines, loading } = useSelector((state) => state.booking);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [filters, setFilters] = useState({
    magazine: '',
    contentType: '',
    startIssue: '',
    finishIssue: '',
    showOngoing: false
  });
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  useEffect(() => {
    dispatch(fetchBookings());
    dispatch(fetchCustomers());
    dispatch(fetchMagazines());
  }, [dispatch]);

  useEffect(() => {
    let filtered = bookings;

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.contentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.note?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.magazine) {
      filtered = filtered.filter(booking => booking.magazines.some(mag => mag._id === filters.magazine));
    }
    if (filters.contentType) {
      filtered = filtered.filter(booking => booking.contentType === filters.contentType);
    }
    if (filters.startIssue) {
      filtered = filtered.filter(booking => 
        booking.firstIssue && booking.firstIssue.toLowerCase().includes(filters.startIssue.toLowerCase())
      );
    }
    if (filters.finishIssue) {
      filtered = filtered.filter(booking => 
        booking.lastIssue && booking.lastIssue.toLowerCase().includes(filters.finishIssue.toLowerCase())
      );
    }
    if (filters.showOngoing) {
      filtered = filtered.filter(booking => booking.isOngoing === true);
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aValue, bValue;

        switch (sortConfig.key) {
          case 'customer':
            aValue = a.customer?.name || '';
            bValue = b.customer?.name || '';
            break;
          case 'issue':
            aValue = a.firstIssue || '';
            bValue = b.firstIssue || '';
            break;
          case 'contentType':
            aValue = a.contentType || '';
            bValue = b.contentType || '';
            break;
          case 'size':
            aValue = a.contentSize?.size || 0;
            bValue = b.contentSize?.size || 0;
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
          default:
            aValue = a[sortConfig.key] || '';
            bValue = b[sortConfig.key] || '';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, filters, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      magazine: '',
      contentType: '',
      startIssue: '',
      finishIssue: '',
      showOngoing: false
    });
    setSortConfig({
      key: null,
      direction: 'asc'
    });
  };

  const handleDelete = async (bookingId) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await bookingsAPI.delete(bookingId);
        dispatch(fetchBookings()); // Refresh the list
        toast.success('Booking deleted successfully');
      } catch (error) {
        toast.error(error.response?.data?.message || 'An error occurred');
      }
    }
  };

  const formatCurrency = (amount) => `£${amount.toLocaleString()}`;

  // Calculate total space booked
  const calculateTotalSpace = () => {
    return filteredBookings.reduce((total, booking) => {
      return total + (booking.contentSize?.size || 0);
    }, 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Generate dynamic size icon based on booking size
  const generateSizeIcon = (size) => {
    if (!size) return <FileText className="h-5 w-5 text-blue-600" />;
    
    // Normalize size to create appropriate icon dimensions
    // Assuming common sizes range from 0.1 to 2.0 (full page = 1.0)
    const normalizedSize = Math.min(Math.max(size, 0.1), 2.0);
    
    // Create different icon styles based on size ranges
    if (size >= 1.5) {
      // Double page or very large ads - wide rectangle
      return (
        <div className="w-10 h-6 bg-gradient-to-r from-blue-500 to-blue-700 rounded flex items-center justify-center">
          <span className="text-white text-xs font-bold">XL</span>
        </div>
      );
    } else if (size >= 1.0) {
      // Full page - square
      return (
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded flex items-center justify-center">
          <span className="text-white text-xs font-bold">L</span>
        </div>
      );
    } else if (size >= 0.5) {
      // Half page - rectangle
      return (
        <div className="w-8 h-6 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded flex items-center justify-center">
          <span className="text-white text-xs font-bold">M</span>
        </div>
      );
    } else if (size >= 0.25) {
      // Quarter page - small rectangle
      return (
        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded flex items-center justify-center">
          <span className="text-white text-xs font-bold">S</span>
        </div>
      );
    } else {
      // Small ads - tiny rectangle
      return (
        <div className="w-5 h-4 bg-gradient-to-br from-red-500 to-red-700 rounded flex items-center justify-center">
          <span className="text-white text-xs font-bold">XS</span>
        </div>
      );
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const contentTypes = ['Advert', 'Article', 'Puzzle', 'Advertorial', 'Front Cover', 'In-house'];

  const hasActiveFilters = searchTerm || Object.values(filters).some(f => f === true || (f && f !== ''));

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
              <p className="mt-2 text-gray-600">Manage your magazine space bookings</p>
            </div>
            <Link
              to="/bookings/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </button>
              )}
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <select
              value={filters.magazine}
              onChange={(e) => setFilters({...filters, magazine: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Magazines</option>
              {magazines.map((magazine) => (
                <option key={magazine._id} value={magazine._id}>
                  {magazine.name}
                </option>
              ))}
            </select>

            <select
              value={filters.contentType}
              onChange={(e) => setFilters({...filters, contentType: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Content Types</option>
              {contentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Start Issue"
              value={filters.startIssue}
              onChange={(e) => setFilters({...filters, startIssue: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />

            <input
              type="text"
              placeholder="Finish Issue"
              value={filters.finishIssue}
              onChange={(e) => setFilters({...filters, finishIssue: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />

            <div className="flex items-center">
              <input
                id="showOngoing"
                type="checkbox"
                checked={filters.showOngoing}
                onChange={(e) => setFilters({...filters, showOngoing: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="showOngoing" className="ml-2 block text-sm text-gray-900">
                Show Ongoing Only
              </label>
            </div>
          </div>

          {/* Sorting Options */}
          <div className="flex flex-wrap items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <button
              onClick={() => handleSort('customer')}
              className="inline-flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              Customer {getSortIcon('customer')}
            </button>
            <button
              onClick={() => handleSort('issue')}
              className="inline-flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              Issue {getSortIcon('issue')}
            </button>
            <button
              onClick={() => handleSort('contentType')}
              className="inline-flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              Content Type {getSortIcon('contentType')}
            </button>
            <button
              onClick={() => handleSort('size')}
              className="inline-flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              Size {getSortIcon('size')}
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {loading.bookings ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading bookings...</p>
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <li key={booking._id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center">
                            {generateSizeIcon(booking.contentSize?.size)}
                          </div>
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {booking.customer?.name || 'Unknown Customer'}
                            </p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              {booking.contentType}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                              {booking.magazines?.map(mag => mag.name).join(', ') || 'No magazines'}
                            </span>
                            <span>
                              {booking.contentSize?.description || 'Unknown size'} ({booking.contentSize?.size || 0})
                            </span>
                            <span>
                              {booking.firstIssue} - {booking.isOngoing ? 'Ongoing' : (booking.lastIssue || 'Single issue')}
                            </span>
                          </div>
                          {booking.note && (
                            <p className="text-sm text-gray-500 mt-1 truncate">
                              Note: {booking.note}
                            </p>
                          )}
                        </div>
                        <div className="ml-4 flex-shrink-0 text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(booking.netValue)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Base: {formatCurrency(booking.basePrice)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          className="p-2 text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <Link
                          to={`/bookings/edit/${booking._id}`}
                          className="p-2 text-gray-400 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-md"
                          title="Edit Booking"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(booking._id)}
                          className="p-2 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md"
                          title="Delete Booking"
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
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || Object.values(filters).some(f => f) ? 
                'Try adjusting your search or filters.' : 
                'Get started by creating your first booking.'
              }
            </p>
            {!searchTerm && !Object.values(filters).some(f => f) && (
              <div className="mt-6">
                <Link
                  to="/bookings/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Booking
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        {filteredBookings.length > 0 && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredBookings.length}
                </p>
                <p className="text-sm text-gray-600">Total Bookings</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(filteredBookings.reduce((sum, booking) => sum + booking.netValue, 0))}
                </p>
                <p className="text-sm text-gray-600">Total Value</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {calculateTotalSpace().toFixed(3)}
                </p>
                <p className="text-sm text-gray-600">Total Space Booked</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredBookings.filter(b => b.status === 'Active').length}
                </p>
                <p className="text-sm text-gray-600">Active Bookings</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Bookings; 