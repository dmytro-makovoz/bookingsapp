import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Users, 
  BookOpen, 
  FileText, 
  Truck, 
  DollarSign,
  TrendingUp,
  Calendar,
  Eye
} from 'lucide-react';
import Layout from '../components/Layout';
import { 
  fetchDashboardStats, 
  fetchCurrentIssueData, 
  fetchPublications,
  fetchMagazines
} from '../store/slices/bookingSlice';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#f97316'];

const StatCard = ({ title, value, icon: Icon, color, change }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="text-lg font-medium text-gray-900">
              {typeof value === 'number' && title.includes('£') ? `£${value.toLocaleString()}` : value}
            </dd>
          </dl>
        </div>
      </div>
      {change !== undefined && change !== null && (
        <div className="mt-2">
          <div className="flex items-center text-sm">
            <TrendingUp className={`h-4 w-4 mr-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
            <span className="text-gray-500 ml-2">from last month</span>
          </div>
        </div>
      )}
    </div>
  </div>
);

const BookingDashboard = () => {
  const dispatch = useDispatch();
  const { 
    dashboardStats, 
    currentIssueData, 
    publications, 
    magazines,
    loading 
  } = useSelector((state) => state.booking);
  
  const [selectedMagazine, setSelectedMagazine] = useState('');

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchPublications());
    dispatch(fetchMagazines());
  }, [dispatch]);

  useEffect(() => {
    if (magazines.length > 0 && !selectedMagazine) {
      setSelectedMagazine(magazines[0]._id);
    }
  }, [magazines, selectedMagazine]);

  useEffect(() => {
    if (selectedMagazine) {
      dispatch(fetchCurrentIssueData(selectedMagazine));
    }
  }, [dispatch, selectedMagazine]);

  const formatCurrency = (value) => `£${value.toLocaleString()}`;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Magazine Booking Dashboard</h1>
          <p className="mt-2 text-gray-600">Overview of your magazine advertising business</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Customers"
            value={dashboardStats.totalCustomers || 0}
            icon={Users}
            color="text-blue-600"
            change={dashboardStats.customerChange}
          />
          <StatCard
            title="Active Magazines"
            value={dashboardStats.totalMagazines || 0}
            icon={BookOpen}
            color="text-green-600"
            change={dashboardStats.magazineChange}
          />
          <StatCard
            title="Active Bookings"
            value={dashboardStats.totalBookings || 0}
            icon={FileText}
            color="text-purple-600"
            change={dashboardStats.bookingChange}
          />
          <StatCard
            title="Leaflet Deliveries"
            value={dashboardStats.totalLeafletDeliveries || 0}
            icon={Truck}
            color="text-orange-600"
            change={dashboardStats.leafletDeliveryChange}
          />
        </div>

        {/* Revenue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Booking Revenue"
            value={formatCurrency(dashboardStats.totalBookingValue || 0)}
            icon={DollarSign}
            color="text-green-600"
            change={dashboardStats.bookingValueChange}
          />
          <StatCard
            title="Leaflet Revenue"
            value={formatCurrency(dashboardStats.totalLeafletValue || 0)}
            icon={Truck}
            color="text-blue-600"
            change={dashboardStats.leafletValueChange}
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(dashboardStats.totalRevenue || 0)}
            icon={DollarSign}
            color="text-yellow-600"
            change={dashboardStats.totalRevenueChange}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Current Issue Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Current Issue Breakdown</h2>
              {magazines.length > 0 && (
                <select
                  value={selectedMagazine}
                  onChange={(e) => setSelectedMagazine(e.target.value)}
                  className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {magazines.map((magazine) => (
                    <option key={magazine._id} value={magazine._id}>
                      {magazine.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {currentIssueData ? (
              <>
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900">{currentIssueData.magazine}</h3>
                  <p className="text-sm text-gray-600">
                    Issue: {currentIssueData.currentIssue?.name} • 
                    Total Pages: {currentIssueData.totalPages} • 
                    Booked: {currentIssueData.totalBookedPages}
                  </p>
                  <p className="text-sm text-gray-600">
                    Available: {currentIssueData.unallocatedPages} pages ({((currentIssueData.unallocatedPages / currentIssueData.totalPages) * 100).toFixed(1)}%)
                  </p>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={currentIssueData.breakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ contentType, percentage }) => `${contentType}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="pages"
                      >
                        {currentIssueData.breakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} pages`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Breakdown Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {currentIssueData.breakdown.map((item, index) => (
                      <div key={item.contentType} className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-gray-600">
                          {item.contentType}: {item.pages} pages ({item.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2" />
                  <p>No current issue data available</p>
                </div>
              </div>
            )}
          </div>

          {/* Publications Revenue */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Publications Revenue</h2>
            {publications.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={publications}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="magazine.name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis tickFormatter={(value) => `£${value}`} />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                    <Bar dataKey="totalValue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <BarChart className="h-8 w-8 mx-auto mb-2" />
                  <p>No publications data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Publications Summary Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Publications Summary</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Revenue breakdown by magazine and content type
            </p>
          </div>
          <div className="border-t border-gray-200">
            {publications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Magazine
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Bookings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Content Types
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {publications.map((pub) => (
                      <tr key={pub.magazine.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {pub.magazine.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {pub.totalBookings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(pub.totalValue)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="space-y-1">
                            {pub.contentTypeBreakdown.map((content) => (
                              <div key={content.contentType} className="flex justify-between">
                                <span>{content.contentType}:</span>
                                <span>{content.count} ({formatCurrency(content.value)})</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p>No publications data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <a
              href="/bookings/new"
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FileText className="h-4 w-4 mr-2" />
              New Booking
            </a>
            <a
              href="/leaflet-delivery"
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <Truck className="h-4 w-4 mr-2" />
              Leaflet Delivery
            </a>
            <a
              href="/customers"
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Customers
            </a>
            <a
              href="/magazines"
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Manage Magazines
            </a>
            <a
              href="/reports"
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Reports
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookingDashboard; 