import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import { isAuthenticated, clearAuthData } from '../utils/auth';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkAuth = () => {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        // Clear any stale auth data
        clearAuthData();
        
        // Only show toast if user was previously logged in
        if (user || token) {
          toast.error('Your session has expired. Please login again.');
          dispatch(logout());
        }
      }
    };

    checkAuth();
    
    // Check auth status every minute while component is mounted
    const interval = setInterval(checkAuth, 60000);
    
    return () => clearInterval(interval);
  }, [dispatch, user, token]);

  // If not authenticated, redirect to login with return URL
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute; 