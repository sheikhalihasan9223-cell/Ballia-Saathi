import React, { createContext, useState, useContext, useEffect } from 'react';
import { localClient } from '@/api/localClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState({
    id: 'local',
    public_settings: { auth_required: false },
  });

  useEffect(() => {
    checkAppState();
  }, []);

  useEffect(() => {
    const handleRoleUpdate = (event) => {
      const updatedUser = event.detail;
      setUser((currentUser) => {
        if (!currentUser || !updatedUser) return currentUser;
        if (currentUser.id !== updatedUser.id && currentUser.email !== updatedUser.email) return currentUser;
        return { ...currentUser, ...updatedUser };
      });
    };

    window.addEventListener('ballia-saathi-user-role-updated', handleRoleUpdate);
    return () => window.removeEventListener('ballia-saathi-user-role-updated', handleRoleUpdate);
  }, []);

  const checkAppState = async () => {
    setIsLoadingPublicSettings(false);
    setAuthError(null);
    setAppPublicSettings({ id: 'local', public_settings: { auth_required: false } });
    await checkUserAuth();
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await localClient.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      if (error?.status !== 401) {
        console.error('User auth check failed:', error);
      }
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
    }
  };

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      await localClient.auth.logout(window.location.href);
    } else {
      await localClient.auth.logout();
    }
  };

  const navigateToLogin = () => {
    localClient.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
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
      checkAppState
    }}>
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
