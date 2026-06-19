import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { getApiError } from '../services/api';

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    });
    if (!data?.success || !data?.data?.token) {
      return rejectWithValue('Login failed. Invalid server response.');
    }
    if (data.data.role !== 'customer') {
      return rejectWithValue('This is an admin account. Use the admin panel or sign in with a customer account.');
    }
    localStorage.setItem('dha_token', data.data.token);
    localStorage.setItem('dha_user', JSON.stringify(data.data));
    return data.data;
  } catch (err) {
    return rejectWithValue(getApiError(err));
  }
});

export const registerCustomer = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/customer-register', {
      ...userData,
      fullName: userData.fullName.trim(),
      fatherName: userData.fatherName.trim(),
      cnic: userData.cnic.trim(),
      phone: userData.phone.trim(),
      email: userData.email.trim().toLowerCase(),
      address: userData.address.trim(),
    });
    if (!data?.success || !data?.data?.user?.token) {
      return rejectWithValue('Registration failed. Invalid server response.');
    }
    localStorage.setItem('dha_token', data.data.user.token);
    localStorage.setItem('dha_user', JSON.stringify(data.data.user));
    return data.data.user;
  } catch (err) {
    return rejectWithValue(getApiError(err));
  }
});

let parsedUser = null;
try {
  const stored = localStorage.getItem('dha_user');
  if (stored) parsedUser = JSON.parse(stored);
} catch {
  localStorage.removeItem('dha_user');
  localStorage.removeItem('dha_token');
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: parsedUser,
    token: localStorage.getItem('dha_token') || null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('dha_token');
      localStorage.removeItem('dha_user');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.token = action.payload.token;
      })
      .addCase(registerCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
