import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { store } from './store/store';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import BookingDashboard from './pages/BookingDashboard';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import Bookings from './pages/Bookings';
import NewBooking from './pages/NewBooking';
import EditBooking from './pages/EditBooking';
import LeafletDelivery from './pages/LeafletDelivery';
import Reports from './pages/Reports';
import UserProfile from './pages/UserProfile';
import ProtectedRoute from './components/ProtectedRoute';
import AuthProvider from './components/AuthProvider';
import './index.css';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <BookingDashboard />
                </ProtectedRoute>
              } />
              <Route path="/customers" element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/bookings" element={
                <ProtectedRoute>
                  <Bookings />
                </ProtectedRoute>
              } />
              <Route path="/bookings/new" element={
                <ProtectedRoute>
                  <NewBooking />
                </ProtectedRoute>
              } />
              <Route path="/bookings/edit/:id" element={
                <ProtectedRoute>
                  <EditBooking />
                </ProtectedRoute>
              } />
              <Route path="/leaflet-delivery" element={
                <ProtectedRoute>
                  <LeafletDelivery />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <ToastContainer
              position="top-right"
              autoClose={4000}
              hideProgressBar={false}
              newestOnTop={true}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
              limit={3}
              toastStyle={{
                fontSize: '14px',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </Provider>
  );
}

export default App; 