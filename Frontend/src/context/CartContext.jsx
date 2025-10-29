import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useMemo, 
  useCallback, 
  useEffect 
} from 'react';
// 1. Import useAuth to know if the user is logged in
import { useAuth } from './AuthContext'; 
import { CLIENT_BASE_URL } from '../components/others/clientApiUrl';

const CartContext = createContext();

// 2. Simplify the reducer
// The API is now the "source of truth", so we only need one action: SET_CART
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return {
        ...state,
        items: action.payload.items || [] // Ensure items is always an array
      };
    default:
      return state;
  }
};

const initialState = {
  items: []
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  // 3. Get the user's token and authentication status
  const { isAuthenticated, token } = useAuth(); 

  // 4. Fetch the cart from the API when the user logs in
  useEffect(() => {
    const fetchCart = async () => {
      // Only fetch if the user is logged in
      if (isAuthenticated) {
        try {
          const response = await fetch(`${CLIENT_BASE_URL}/api/v1/cart`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          if (data.success) {
            // Load the database cart into our local state
            dispatch({ type: 'SET_CART', payload: data.data });
          }
        } catch (error) {
          console.error("Failed to fetch cart:", error);
        }
      } else {
        // If user logs out, clear the local cart state
        dispatch({ type: 'SET_CART', payload: { items: [] } });
      }
    };

    fetchCart();
  }, [isAuthenticated, token]); // This effect runs whenever the user's auth state changes

  // 5. Re-write actions to call your API
  
  const addToCart = useCallback(async (product, quantity = 1) => {
    if (!isAuthenticated) {
      // Handle not-logged-in user (e.g., show a modal)
      console.log("Please log in to add items to your cart.");
      // You could also navigate to the login page here
      return;
    }
    
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product._id, quantity })
      });
      const data = await response.json();
      
      if (data.success) {
        // Sync our local state with the new cart from the server
        dispatch({ type: 'SET_CART', payload: data.data });
      } else {
        console.error("Error adding to cart:", data.message);
        // Here you can show an error toast to the user
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  }, [isAuthenticated, token]);

  const removeFromCart = useCallback(async (productId) => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/cart/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        dispatch({ type: 'SET_CART', payload: data.data });
      } else {
        console.error("Error removing from cart:", data.message);
      }
    } catch (error) {
      console.error("Failed to remove from cart:", error);
    }
  }, [isAuthenticated, token]);

  const updateQuantity = useCallback(async (productId, quantity) => {
    if (!isAuthenticated) return;
    
    if (quantity <= 0) {
      // Call removeFromCart if quantity is zero or less
      await removeFromCart(productId);
      return;
    }
    
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/cart/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity })
      });
      const data = await response.json();
      
      if (data.success) {
        dispatch({ type: 'SET_CART', payload: data.data });
      } else {
        console.error("Error updating quantity:", data.message);
      }
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  }, [isAuthenticated, token, removeFromCart]); // Add removeFromCart as a dependency

  const clearCart = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/cart`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        dispatch({ type: 'SET_CART', payload: data.data });
      } else {
        console.error("Error clearing cart:", data.message);
      }
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  }, [isAuthenticated, token]);

  // 6. Calculate values and memoize the context
  const cartItemsCount = state.items.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = state.items.reduce((total, item) => {
    return total + ((item.product?.price || 0) * item.quantity);
  }, 0);

  const value = useMemo(() => ({
    items: state.items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartItemsCount
  }), [
    state.items, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    cartTotal,
    cartItemsCount
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};