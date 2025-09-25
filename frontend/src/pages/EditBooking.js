import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NewBooking from './NewBooking';

const EditBooking = () => {
  // Since NewBooking now handles both creation and editing,
  // we can just render it and it will detect edit mode based on the presence of a booking ID
  return <NewBooking />;
};

export default EditBooking; 