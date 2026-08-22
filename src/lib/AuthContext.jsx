import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const {
        data: { user: currentUser },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
    } catch (error) {
      console.error('User auth check failed:', error);

      setUser(null);
      setIsAuthenticated(false);

      // A missing session is normal for a logged-out user.
      // Only store an auth error for actual auth failures.
      if (error?.status === 401 || error?.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required',
        });
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const checkAppState = async () => {
    try {
      setAuthError(null);
      setIsLoadingPublicSettings(false);

      await checkUserAuth();
    } catch (error) {
      console.error('Unexpected app state error:', error);

      setAuthError({
        type: 'unknown',
        message: error?.message || 'An unexpected error occurred',
      });

      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    checkAppState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;

      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);

      setAuthError({
        type: 'logout_error',
        message: error?.message || 'Failed to log out',
      });
    }
  };

  const navigateToLogin = () => {
    // Supabase handles authentication through your application's
    // login page rather than the old Base44 redirect.
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
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
