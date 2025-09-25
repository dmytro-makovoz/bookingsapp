import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  customersAPI, 
  businessTypesAPI,
  magazinesAPI, 
  contentSizesAPI, 
  bookingsAPI, 
  leafletDeliveryAPI, 
  dashboardAPI 
} from '../../utils/api';
import api from '../../utils/api';

// Async thunks for customers
export const fetchCustomers = createAsyncThunk(
  'booking/fetchCustomers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await customersAPI.getAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customers');
    }
  }
);

export const createCustomer = createAsyncThunk(
  'booking/createCustomer',
  async (customerData, { rejectWithValue }) => {
    try {
      const response = await customersAPI.create(customerData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create customer');
    }
  }
);

// Async thunks for business types
export const fetchBusinessTypes = createAsyncThunk(
  'booking/fetchBusinessTypes',
  async (includeArchived = false, { rejectWithValue }) => {
    try {
      const response = await businessTypesAPI.getAll(includeArchived);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch business types');
    }
  }
);

export const createBusinessType = createAsyncThunk(
  'booking/createBusinessType',
  async (businessTypeData, { rejectWithValue }) => {
    try {
      const response = await businessTypesAPI.create(businessTypeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create business type');
    }
  }
);

// Async thunks for magazines
export const fetchMagazines = createAsyncThunk(
  'booking/fetchMagazines',
  async (includeArchived = false, { rejectWithValue }) => {
    try {
      const response = await magazinesAPI.getAll(includeArchived);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch magazines');
    }
  }
);

export const createMagazine = createAsyncThunk(
  'booking/createMagazine',
  async (magazineData, { rejectWithValue }) => {
    try {
      const response = await magazinesAPI.create(magazineData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create magazine');
    }
  }
);

// Async thunks for content sizes
export const fetchContentSizes = createAsyncThunk(
  'booking/fetchContentSizes',
  async (includeArchived = false, { rejectWithValue }) => {
    try {
      const response = await contentSizesAPI.getAll(includeArchived);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch content sizes');
    }
  }
);

export const createContentSize = createAsyncThunk(
  'booking/createContentSize',
  async (contentSizeData, { rejectWithValue }) => {
    try {
      const response = await contentSizesAPI.create(contentSizeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create content size');
    }
  }
);

// Async thunks for bookings
export const fetchBookings = createAsyncThunk(
  'booking/fetchBookings',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await bookingsAPI.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await bookingsAPI.create(bookingData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create booking');
    }
  }
);

// Async thunks for dashboard
export const fetchDashboardStats = createAsyncThunk(
  'booking/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard stats');
    }
  }
);

export const fetchCurrentIssueData = createAsyncThunk(
  'booking/fetchCurrentIssueData',
  async (magazineId, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getCurrentIssue(magazineId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch current issue data');
    }
  }
);

export const fetchPublications = createAsyncThunk(
  'booking/fetchPublications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getPublications();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch publications');
    }
  }
);

// Delete booking thunk
export const deleteBookingAsync = createAsyncThunk(
  'booking/deleteBookingAsync',
  async (bookingId, { rejectWithValue }) => {
    try {
      await api.delete(`/bookings/${bookingId}`);
      return bookingId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete booking');
    }
  }
);

const initialState = {
  customers: [],
  businessTypes: [],
  magazines: [],
  contentSizes: [],
  bookings: [],
  leafletDeliveries: [],
  dashboardStats: {},
  currentIssueData: null,
  publications: [],
  loading: {
    customers: false,
    businessTypes: false,
    magazines: false,
    contentSizes: false,
    bookings: false,
    leafletDeliveries: false,
    dashboard: false,
  },
  error: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateBooking: (state, action) => {
      const index = state.bookings.findIndex(b => b._id === action.payload._id);
      if (index !== -1) {
        state.bookings[index] = action.payload;
      }
    },
    deleteBooking: (state, action) => {
      state.bookings = state.bookings.filter(b => b._id !== action.payload);
    },
      updateCustomer: (state, action) => {
    const index = state.customers.findIndex(c => c._id === action.payload._id);
    if (index !== -1) {
      state.customers[index] = action.payload;
    }
  },
  deleteCustomer: (state, action) => {
    state.customers = state.customers.filter(c => c._id !== action.payload);
  },
  addCustomer: (state, action) => {
    state.customers.push(action.payload);
  },
  updateBusinessType: (state, action) => {
    const index = state.businessTypes.findIndex(bt => bt._id === action.payload._id);
    if (index !== -1) {
      state.businessTypes[index] = action.payload;
    }
  },
  deleteBusinessType: (state, action) => {
    state.businessTypes = state.businessTypes.filter(bt => bt._id !== action.payload);
  },
  addBusinessType: (state, action) => {
    state.businessTypes.push(action.payload);
  },
  updateMagazine: (state, action) => {
    const index = state.magazines.findIndex(m => m._id === action.payload._id);
    if (index !== -1) {
      state.magazines[index] = action.payload;
    }
  },
  deleteMagazine: (state, action) => {
    state.magazines = state.magazines.filter(m => m._id !== action.payload);
  },
  addMagazine: (state, action) => {
    state.magazines.push(action.payload);
  },
  updateContentSize: (state, action) => {
    const index = state.contentSizes.findIndex(cs => cs._id === action.payload._id);
    if (index !== -1) {
      state.contentSizes[index] = action.payload;
    }
  },
  deleteContentSize: (state, action) => {
    state.contentSizes = state.contentSizes.filter(cs => cs._id !== action.payload);
  },
  addContentSize: (state, action) => {
    state.contentSizes.push(action.payload);
  },
  },
  extraReducers: (builder) => {
    // Customers
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading.customers = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading.customers = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading.customers = false;
        state.error = action.payload;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.customers.push(action.payload);
      })

    // Business Types
      .addCase(fetchBusinessTypes.pending, (state) => {
        state.loading.businessTypes = true;
        state.error = null;
      })
      .addCase(fetchBusinessTypes.fulfilled, (state, action) => {
        state.loading.businessTypes = false;
        state.businessTypes = action.payload;
      })
      .addCase(fetchBusinessTypes.rejected, (state, action) => {
        state.loading.businessTypes = false;
        state.error = action.payload;
      })
      .addCase(createBusinessType.fulfilled, (state, action) => {
        state.businessTypes.push(action.payload);
      })

    // Magazines
      .addCase(fetchMagazines.pending, (state) => {
        state.loading.magazines = true;
        state.error = null;
      })
      .addCase(fetchMagazines.fulfilled, (state, action) => {
        state.loading.magazines = false;
        state.magazines = action.payload;
      })
      .addCase(fetchMagazines.rejected, (state, action) => {
        state.loading.magazines = false;
        state.error = action.payload;
      })
      .addCase(createMagazine.fulfilled, (state, action) => {
        state.magazines.push(action.payload);
      })

    // Content Sizes
      .addCase(fetchContentSizes.pending, (state) => {
        state.loading.contentSizes = true;
        state.error = null;
      })
      .addCase(fetchContentSizes.fulfilled, (state, action) => {
        state.loading.contentSizes = false;
        state.contentSizes = action.payload;
      })
      .addCase(fetchContentSizes.rejected, (state, action) => {
        state.loading.contentSizes = false;
        state.error = action.payload;
      })
      .addCase(createContentSize.fulfilled, (state, action) => {
        state.contentSizes.push(action.payload);
      })

    // Bookings
      .addCase(fetchBookings.pending, (state) => {
        state.loading.bookings = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading.bookings = false;
        state.bookings = action.payload;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading.bookings = false;
        state.error = action.payload;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.bookings.unshift(action.payload);
      })

    // Dashboard
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading.dashboard = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading.dashboard = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading.dashboard = false;
        state.error = action.payload;
      })
      .addCase(fetchCurrentIssueData.fulfilled, (state, action) => {
        state.currentIssueData = action.payload;
      })
      .addCase(fetchPublications.fulfilled, (state, action) => {
        state.publications = action.payload;
      })
      // Delete booking cases
      .addCase(deleteBookingAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBookingAsync.fulfilled, (state, action) => {
        state.loading = false;
        const bookingId = action.payload;
        state.bookings = state.bookings.filter(booking => booking._id !== bookingId);
      })
      .addCase(deleteBookingAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  updateBooking,
  deleteBooking,
  updateCustomer,
  deleteCustomer,
  addCustomer,
  updateBusinessType,
  deleteBusinessType,
  addBusinessType,
  updateMagazine,
  deleteMagazine,
  addMagazine,
  updateContentSize,
  deleteContentSize,
  addContentSize,
} = bookingSlice.actions;

export default bookingSlice.reducer; 