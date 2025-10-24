import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('admin_token'),
  loading: true,
  isAuthenticated: false,
  isAdmin: false
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true
      };
    case 'LOGIN_SUCCESS':
      localStorage.setItem('admin_token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isAdmin: action.payload.user.role === 'admin',
        loading: false
      };
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
    case 'LOGOUT':
      localStorage.removeItem('admin_token');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: false,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isAdmin: action.payload.role === 'admin',
        loading: false
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if admin is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('admin_token');
      
      if (token) {
        try {
          const response = await fetch('http://localhost:5000/api/v1/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.data.user.role === 'admin') {
              dispatch({ type: 'SET_USER', payload: data.data.user });
            } else {
              dispatch({ type: 'AUTH_ERROR' });
            }
          } else {
            dispatch({ type: 'AUTH_ERROR' });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          dispatch({ type: 'AUTH_ERROR' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.data.user.role === 'admin') {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            token: data.data.token,
            user: data.data.user
          }
        });
        return { success: true, data };
      } else if (data.success && data.data.user.role !== 'admin') {
        dispatch({ type: 'LOGIN_FAIL' });
        return { success: false, message: 'Access denied. Admin privileges required.' };
      } else {
        dispatch({ type: 'LOGIN_FAIL' });
        return { success: false, message: data.message };
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAIL' });
      return { success: false, message: 'Network error occurred' };
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
    isAdmin: state.isAdmin,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};