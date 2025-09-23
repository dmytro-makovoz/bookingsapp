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
import BusinessTypes from './pages/BusinessTypes';
import Magazines from './pages/Magazines';
import ContentSizes from './pages/ContentSizes';
import Bookings from './pages/Bookings';
import NewBooking from './pages/NewBooking';
import LeafletDelivery from './pages/LeafletDelivery';
import Reports from './pages/Reports';
import UserProfile from './pages/UserProfile';
import './index.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/dashboard" element={<BookingDashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/business-types" element={<BusinessTypes />} />
            <Route path="/magazines" element={<Magazines />} />
            <Route path="/content-sizes" element={<ContentSizes />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/bookings/new" element={<NewBooking />} />
            <Route path="/leaflet-delivery" element={<LeafletDelivery />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<UserProfile />} />
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
    </Provider>
  );
}

export default App; 