import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkAuth } from '../store/slices/authSlice';

const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check auth status on app load
    dispatch(checkAuth());
  }, [dispatch]);

  return children;
};

export default AuthProvider; 