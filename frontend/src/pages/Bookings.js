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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Layout from '../components/Layout';
import { 
  fetchBookings, 
  fetchCustomers, 
  fetchMagazines,
  fetchContentSizes,
  deleteBookingAsync 
} from '../store/slices/bookingSlice';
import api, { bookingsAPI } from '../utils/api';
import { toast } from 'react-toastify';

const Bookings = () => {
  const dispatch = useDispatch();
  const { bookings, customers, magazines, contentSizes } = useSelector((state) => state.booking);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBookings, setFilteredBookings] = useState([]);

  const [selectedMagazine, setSelectedMagazine] = useState('');
  const [selectedContentSize, setSelectedContentSize] = useState('');
  const [selectedContentType, setSelectedContentType] = useState('');
  const [selectedStartIssue, setSelectedStartIssue] = useState('');
  const [selectedFinishIssue, setSelectedFinishIssue] = useState('');
  const [selectedIssue, setSelectedIssue] = useState('');
  const [hasSetDefaultIssue, setHasSetDefaultIssue] = useState(false);

  const [flattenedBookings, setFlattenedBookings] = useState([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [uniqueStartIssues, setUniqueStartIssues] = useState([]);
  const [uniqueFinishIssues, setUniqueFinishIssues] = useState([]);
  const [uniqueIssues, setUniqueIssues] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [paginatedBookings, setPaginatedBookings] = useState([]);

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

  // Helper function to compare issue names chronologically  
  const compareIssues = (issueA, issueB) => {
    const monthMap = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
      'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    
    const parseIssue = (issue) => {
      const match = issue.match(/^([A-Za-z]{3})(\d{2})$/);
      if (match) {
        const month = monthMap[match[1]];
        const year = parseInt(match[2]);
        return (2000 + year) * 100 + (month || 0);
      }
      return issue; // fallback to string comparison
    };
    
    const valA = parseIssue(issueA);
    const valB = parseIssue(issueB);
    
    if (typeof valA === 'number' && typeof valB === 'number') {
      return valA - valB;
    }
    
    return issueA.localeCompare(issueB);
  };

  // Helper function to check if a booking is active during a specific issue
  const isBookingActiveInIssue = (booking, targetIssue) => {
    const startIssue = booking.startIssue ? booking.startIssue.toString().trim() : '';
    const finishIssue = booking.finishIssue ? booking.finishIssue.toString().trim() : '';
    const targetIssueTrimmed = targetIssue.toString().trim();
    
    // If booking is ongoing, it's active if it started at or before the target issue
    if (booking.isOngoing) {
      return compareIssues(startIssue, targetIssueTrimmed) <= 0;
    }
    
    // For non-ongoing bookings, check if target issue falls within the start-finish range
    return compareIssues(startIssue, targetIssueTrimmed) <= 0 && 
           compareIssues(targetIssueTrimmed, finishIssue) <= 0;
  };

  // Function to get current issue based on issue periods (start to end date)
  const getCurrentIssue = () => {
    const now = new Date();
    let currentIssue = null;
    // Go through all schedules and their issues to find the current period
    schedules.forEach(schedule => {
      if (!schedule.issues || schedule.issues.length === 0) return;

      // Sort issues by sortOrder to ensure proper chronological order
      const sortedIssues = [...schedule.issues].sort((a, b) => a.sortOrder - b.sortOrder);

      // Calculate periods for each issue
      for (let i = 0; i < sortedIssues.length; i++) {
        const issue = sortedIssues[i];
        const closeDate = new Date(issue.closeDate);

        let startDate;
        if (i === 0) {
          if (sortedIssues.length > 1) {
            // Calculate average period from the available issues
            const totalPeriods = sortedIssues.length - 1;
            let totalDays = 0;
            for (let j = 1; j < sortedIssues.length; j++) {
              const currentClose = new Date(sortedIssues[j].closeDate);
              const previousClose = new Date(sortedIssues[j - 1].closeDate);
              totalDays += Math.abs((currentClose - previousClose) / (1000 * 60 * 60 * 24));
            }
            const avgPeriodDays = Math.round(totalDays / totalPeriods);
            
            startDate = new Date(closeDate);
            startDate.setDate(startDate.getDate() - avgPeriodDays);
          } else {
            // Single issue, assume 30 days
            startDate = new Date(closeDate);
            startDate.setDate(startDate.getDate() - 30);
          }
        } else {
          startDate = new Date(sortedIssues[i - 1].closeDate);
          startDate.setDate(startDate.getDate() + 1); // Day after previous issue's close
        }

        const isCurrentPeriod = now >= startDate && now <= closeDate;

        // Check if today falls within this issue's period
        if (isCurrentPeriod) {
          currentIssue = issue.name;
          break; // Found the current issue, stop searching
        }
      }

      // If we found a current issue in this schedule, stop searching other schedules
      if (currentIssue) return;
    });

    // Fallback logic: if no current period found, find the closest upcoming issue
    if (!currentIssue) {
      let closestUpcomingIssue = null;
      let shortestTimeToStart = Infinity;

      schedules.forEach(schedule => {
        if (!schedule.issues || schedule.issues.length === 0) return;
        
        const sortedIssues = [...schedule.issues].sort((a, b) => a.sortOrder - b.sortOrder);
        
        for (let i = 0; i < sortedIssues.length; i++) {
          const issue = sortedIssues[i];
          const closeDate = new Date(issue.closeDate);
          
          let startDate;
          if (i === 0) {
            if (sortedIssues.length > 1) {
              const nextClose = new Date(sortedIssues[1].closeDate);
              const periodDays = Math.abs((nextClose - closeDate) / (1000 * 60 * 60 * 24));
              startDate = new Date(closeDate);
              startDate.setDate(startDate.getDate() - periodDays);
            } else {
              startDate = new Date(closeDate);
              startDate.setDate(startDate.getDate() - 30);
            }
          } else {
            startDate = new Date(sortedIssues[i - 1].closeDate);
            startDate.setDate(startDate.getDate() + 1);
          }
          
          // Find closest upcoming issue
          if (startDate > now) {
            const timeToStart = startDate - now;
            if (timeToStart < shortestTimeToStart) {
              shortestTimeToStart = timeToStart;
              closestUpcomingIssue = issue.name;
            }
          }
        }
      });

      if (closestUpcomingIssue) {
        currentIssue = closestUpcomingIssue;
      }
    }

    // Final fallback to calendar-based current issue
    if (!currentIssue) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[now.getMonth()];
      const year = now.getFullYear().toString().slice(-2);
      currentIssue = `${month}${year}`;
    }

    return currentIssue;
  };

  // Load schedules to determine current issue
  const loadSchedules = async () => {
    try {
      const response = await api.get('/schedules');
      setSchedules(response.data);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

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
        dispatch(fetchContentSizes()),
        loadContentTypes(),
        loadSchedules()
      ]);

      clearTimeout(timeout);
    } catch (error) {
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Flatten bookings into individual magazine entries for the table
    const flattened = [];
    const startIssues = new Set();
    const finishIssues = new Set();
    
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
        
        // Collect unique issues - ensure we're working with strings and handle undefined/null values
        if (entry.startIssue && entry.startIssue.toString().trim()) {
          startIssues.add(entry.startIssue.toString().trim());
        }
        if (entry.finishIssue && !entry.isOngoing && entry.finishIssue.toString().trim()) {
          finishIssues.add(entry.finishIssue.toString().trim());
        }
      });
    });
    
    setFlattenedBookings(flattened);
    
    // Use the helper function for sorting issues
    const sortIssues = (a, b) => compareIssues(a, b);
    
    setUniqueStartIssues(Array.from(startIssues).sort(sortIssues));
    setUniqueFinishIssues(Array.from(finishIssues).sort(sortIssues));
    
    // Combine start and finish issues for the general issues filter
    const allIssues = new Set([...startIssues, ...finishIssues]);
    setUniqueIssues(Array.from(allIssues).sort(sortIssues));
  }, [bookings]);

  // Set default issue filter to current issue when issues are first loaded
  useEffect(() => {
    if (uniqueIssues.length > 0 && !hasSetDefaultIssue) {
      const currentIssue = getCurrentIssue();
      // Check if current issue exists in the available issues
      if (currentIssue && uniqueIssues.includes(currentIssue)) {
        setSelectedIssue(currentIssue);
      }
      setHasSetDefaultIssue(true);
    }
  }, [uniqueIssues, schedules, hasSetDefaultIssue]);

  useEffect(() => {
    // Apply all filters
    let filtered = flattenedBookings;

    // Apply search term (search customers)
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply magazine filter
    if (selectedMagazine) {
      filtered = filtered.filter(entry => entry.magazine?._id === selectedMagazine);
    }

    // Apply content size filter
    if (selectedContentSize) {
      filtered = filtered.filter(entry => entry.contentSize?._id === selectedContentSize);
    }

    // Apply content type filter
    if (selectedContentType) {
      filtered = filtered.filter(entry => entry.contentType === selectedContentType);
    }

    // Apply issue filter (shows bookings active during the selected issue period)
    if (selectedIssue) {
      filtered = filtered.filter(entry => {
        return isBookingActiveInIssue(entry, selectedIssue);
      });
    }

    // Apply start issue filter - ensure both values are strings and trimmed
    if (selectedStartIssue) {
      filtered = filtered.filter(entry => {
        const entryStartIssue = entry.startIssue ? entry.startIssue.toString().trim() : '';
        const selectedStartIssueTrimmed = selectedStartIssue.toString().trim();
        return entryStartIssue === selectedStartIssueTrimmed;
      });
    }

    // Apply finish issue filter - ensure both values are strings and trimmed
    if (selectedFinishIssue) {
      if (selectedFinishIssue === 'ONGOING') {
        // Filter for ongoing entries
        filtered = filtered.filter(entry => entry.isOngoing === true);
      } else {
        // Filter for specific finish issue
        filtered = filtered.filter(entry => {
          const entryFinishIssue = entry.finishIssue ? entry.finishIssue.toString().trim() : '';
          const selectedFinishIssueTrimmed = selectedFinishIssue.toString().trim();
          return entryFinishIssue === selectedFinishIssueTrimmed;
        });
      }
    }



    setFilteredBookings(filtered);
  }, [flattenedBookings, searchTerm, selectedMagazine, selectedContentSize, selectedContentType, selectedIssue, selectedStartIssue, selectedFinishIssue]);

  // Pagination effect
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedBookings(filteredBookings.slice(startIndex, endIndex));
  }, [filteredBookings, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMagazine, selectedContentSize, selectedContentType, selectedIssue, selectedStartIssue, selectedFinishIssue]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredBookings.length);

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Generate page numbers for pagination display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) pageNumbers.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };





  const loadContentTypes = async () => {
    try {
      const response = await bookingsAPI.getAll();
      // Extract unique content types from existing bookings
      const types = new Set();
      response.data.forEach(booking => {
        booking.magazineEntries?.forEach(entry => {
          if (entry.contentType) {
            types.add(entry.contentType);
          }
        });
      });
      setContentTypes(Array.from(types).sort());
    } catch (error) {
      console.error('Error loading content types:', error);
      // Fallback to default content types
      setContentTypes(['Advert', 'Article', 'Puzzle', 'Advertorial', 'Front Cover', 'In-house']);
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
    setSelectedMagazine('');
    setSelectedContentSize('');
    setSelectedContentType('');
    setSelectedStartIssue('');
    setSelectedFinishIssue('');
    
    // Reset issue filter to current issue if it exists
    const currentIssue = getCurrentIssue();
    if (currentIssue && uniqueIssues.includes(currentIssue)) {
      setSelectedIssue(currentIssue);
    } else {
      setSelectedIssue('');
    }
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

  // Calculate totals
  const totalValue = filteredBookings.reduce((sum, entry) => sum + (entry.total || 0), 0);
  const totalSize = filteredBookings.reduce((sum, entry) => sum + (entry.contentSize?.size || 0), 0);

  // Export to CSV functionality
  const exportToCSV = () => {
    const headers = [
      'Customer',
      'Magazine', 
      'Size',
      'Type',
      'Total',
      'Start Issue',
      'Finish Issue',
      'Additional Notes'
    ];

    const csvData = filteredBookings.map(entry => {
      // Find the original booking to get the notes
      const originalBooking = bookings.find(booking => booking._id === entry.bookingId);
      const additionalNotes = originalBooking?.notes || '';

      return [
        entry.customer?.name || '',
        entry.magazine?.name || '',
        entry.contentSize?.description || '',
        entry.contentType || '',
        (entry.total || 0).toFixed(2),
        entry.startIssue || '',
        entry.isOngoing ? 'Ongoing' : (entry.finishIssue || ''),
        additionalNotes
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          {/* Customer Search Row */}
          <div className="w-full">
            <div className="relative max-w-md">
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

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Magazine Filter */}
            <div>
              <select
                value={selectedMagazine}
                onChange={(e) => setSelectedMagazine(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Magazines</option>
                {magazines.map((magazine) => (
                  <option key={magazine._id} value={magazine._id}>
                    {magazine.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Size Filter */}
            <div>
              <select
                value={selectedContentSize}
                onChange={(e) => setSelectedContentSize(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Sizes</option>
                {contentSizes.map((size) => (
                  <option key={size._id} value={size._id}>
                    {size.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={selectedContentType}
                onChange={(e) => setSelectedContentType(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                {contentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Issue Filter */}
            <div>
              <select
                value={selectedIssue}
                onChange={(e) => setSelectedIssue(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Issues</option>
                {uniqueIssues.map((issue) => {
                  const currentIssue = getCurrentIssue();
                  const isCurrent = currentIssue && issue === currentIssue;
                  return (
                    <option key={issue} value={issue}>
                      {isCurrent ? `${issue} (Current)` : issue}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Start Issue Filter */}
            <div>
              <select
                value={selectedStartIssue}
                onChange={(e) => setSelectedStartIssue(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Start Issues</option>
                {uniqueStartIssues.map((issue) => (
                  <option key={issue} value={issue}>
                    {issue}
                  </option>
                ))}
              </select>
            </div>

            {/* Finish Issue Filter */}
            <div>
              <select
                value={selectedFinishIssue}
                onChange={(e) => setSelectedFinishIssue(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Finish Issues</option>
                <option value="ONGOING">Ongoing</option>
                {uniqueFinishIssues.map((issue) => (
                  <option key={issue} value={issue}>
                    {issue}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedMagazine || selectedContentSize || selectedContentType || selectedIssue || selectedStartIssue || selectedFinishIssue) && (
            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Results Summary and Export */}
        <div className="mt-4 space-y-3">
          {/* Summary Statistics */}
          {filteredBookings.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{filteredBookings.length}</div>
                <div className="text-sm text-gray-500">Total Entries</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{formatCurrency(totalValue)}</div>
                <div className="text-sm text-gray-500">Total Value</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{totalPages}</div>
                <div className="text-sm text-gray-500">Total Pages</div>
              </div>
            </div>
          )}

          {/* Pagination and Export */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {filteredBookings.length > 0 ? (
                <>
                  Showing {startIndex}-{endIndex} of {filteredBookings.length} booking entries
                                   {flattenedBookings.length !== filteredBookings.length && (
                     <span> (filtered from {flattenedBookings.length} total)</span>
                   )}
                                    {(searchTerm || selectedMagazine || selectedContentSize || selectedContentType || selectedIssue || selectedStartIssue || selectedFinishIssue) && (
                   <span> with active filters</span>
                 )}
                </>
              ) : (
                <>No booking entries found</>
              )}
            </div>
            
            {filteredBookings.length > 0 && (
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            )}
          </div>
        </div>
        {/* Bookings Table */}
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
          {loading && bookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">Loading bookings...</p>
            </div>
          ) : paginatedBookings.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedMagazine || selectedContentSize || selectedContentType || selectedIssue || selectedStartIssue || selectedFinishIssue
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
                  {paginatedBookings.map((entry) => (
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
          
          {flattenedBookings.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              {/* Items per page selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="border border-gray-300 rounded text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-700">entries</span>
              </div>

              {/* Page navigation */}
              <div className="flex items-center space-x-2">
                {totalPages > 1 ? (
                  <>
                    {/* Previous button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md ${
                        currentPage === 1
                          ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {getPageNumbers().map((pageNum, index) => (
                        <button
                          key={index}
                          onClick={() => typeof pageNum === 'number' && handlePageChange(pageNum)}
                          disabled={pageNum === '...'}
                          className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md ${
                            pageNum === currentPage
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : pageNum === '...'
                              ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-default'
                              : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50 hover:text-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    {/* Next button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md ${
                        currentPage === totalPages
                          ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </>
                ) : (
                  <div className="text-sm text-gray-500">
                    Page 1 of 1
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Bookings;