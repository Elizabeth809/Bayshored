import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CLIENT_BASE_URL } from '../components/others/clientApiUrl';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  isAuthenticated: false,
  cartCount: 0,
  wishlistCount: 0
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
      return {
        ...state,
        loading: true
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        cartCount: action.payload.cartCount || 0,
        wishlistCount: action.payload.wishlistCount || 0
      };
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        cartCount: 0,
        wishlistCount: 0
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
        loading: false
      };
    case 'UPDATE_CART_COUNT':
      return {
        ...state,
        cartCount: action.payload
      };
    case 'UPDATE_WISHLIST_COUNT':
      return {
        ...state,
        wishlistCount: action.payload
      };
    case 'UPDATE_USER': // Add this new case
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await fetch(`${CLIENT_BASE_URL}/api/v1/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            dispatch({ type: 'SET_USER', payload: data.data.user });
            
            // Fetch cart and wishlist counts
            await fetchCartCount(token);
            await fetchWishlistCount(token);
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

  const fetchCartCount = async (token) => {
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'UPDATE_CART_COUNT', payload: data.data.itemsCount || 0 });
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const fetchWishlistCount = async (token) => {
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/wishlist`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'UPDATE_WISHLIST_COUNT', payload: data.data.itemsCount || 0 });
      }
    } catch (error) {
      console.error('Error fetching wishlist count:', error);
    }
  };

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.data.requiresVerification) {
          return { success: true, requiresVerification: true, data };
        }
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            token: data.data.token,
            user: data.data.user
          }
        });
        
        // Fetch cart and wishlist counts after login
        await fetchCartCount(data.data.token);
        await fetchWishlistCount(data.data.token);
        
        return { success: true, data };
      } else {
        dispatch({ type: 'LOGIN_FAIL' });
        return { success: false, message: data.message };
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAIL' });
      return { success: false, message: 'Network error occurred' };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'REGISTER_START' });
    
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, data };
      } else {
        dispatch({ type: 'REGISTER_FAIL' });
        return { success: false, message: data.message };
      }
    } catch (error) {
      dispatch({ type: 'REGISTER_FAIL' });
      return { success: false, message: 'Network error occurred' };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (data.success) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            token: data.data.token,
            user: data.data.user
          }
        });
        
        // Fetch cart and wishlist counts after verification
        await fetchCartCount(data.data.token);
        await fetchWishlistCount(data.data.token);
        
        return { success: true, data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Network error occurred' };
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const updateCartCount = (count) => {
    dispatch({ type: 'UPDATE_CART_COUNT', payload: count });
  };

  const updateWishlistCount = (count) => {
    dispatch({ type: 'UPDATE_WISHLIST_COUNT', payload: count });
  };

  // Add this new function
  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
    cartCount: state.cartCount,
    wishlistCount: state.wishlistCount,
    login,
    register,
    verifyOtp,
    logout,
    updateCartCount,
    updateWishlistCount,
    updateUser // Add this to the context value
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