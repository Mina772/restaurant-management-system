import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, setAccessToken, apiError } from '../../api/client.js';

/**
 * On boot, try to silently restore a session via the refresh cookie.
 */
export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/refresh');
    setAccessToken(data.data.accessToken);
    const me = await api.get('/auth/me');
    return me.data.data.user;
  } catch (err) {
    return rejectWithValue(apiError(err));
  }
});

export const login = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', creds);
    setAccessToken(data.data.accessToken);
    return data.data.user;
  } catch (err) {
    return rejectWithValue(apiError(err, 'Login failed'));
  }
});

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', payload);
    setAccessToken(data.data.accessToken);
    return data.data.user;
  } catch (err) {
    return rejectWithValue(apiError(err, 'Registration failed'));
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    setAccessToken(null);
  }
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, status: 'idle', error: null, booted: false },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.booted = true;
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.user = null;
        state.booted = true;
      })
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;

export const selectUser = (s) => s.auth.user;
export const selectIsAuthed = (s) => Boolean(s.auth.user);
