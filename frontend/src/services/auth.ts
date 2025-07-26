import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';

// Get token from Supabase session (with auto-refresh)
export const getToken = async (): Promise<string | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    if (!session) {
      console.log('No active session found');
      return null;
    }
    
    // Check if token is expired and refresh if needed
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      console.log('Token expired, refreshing...');
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Error refreshing session:', refreshError);
        return null;
      }
      
      if (refreshedSession) {
        return refreshedSession.access_token;
      }
    }
    
    return session.access_token;
  } catch (e) {
    console.error('Error in getToken:', e);
    return null;
  }
};

// Legacy function for backward compatibility
export const getTokenLegacy = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync('accessToken');
  } catch (e) {
    return null;
  }
};

export const setToken = async (token: string) => {
  try {
    await SecureStore.setItemAsync('accessToken', token);
  } catch (e) {
    console.error('Failed to set token:', e);
  }
};

export const removeToken = async () => {
  try {
    await SecureStore.deleteItemAsync('accessToken');
  } catch (e) {
    console.error('Failed to remove token:', e);
  }
};

// Force refresh the current session
export const refreshSession = async (): Promise<string | null> => {
  try {
    console.log('🔄 Forcing session refresh...');
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('❌ Error refreshing session:', error);
      return null;
    }
    
    if (!session) {
      console.log('❌ No session after refresh');
      return null;
    }
    
    console.log('✅ Session refreshed successfully');
    return session.access_token;
  } catch (e) {
    console.error('❌ Error in refreshSession:', e);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (e) {
    console.error('Error checking authentication:', e);
    return false;
  }
};

// Sign out user and clear all tokens
export const signOut = async () => {
  try {
    console.log('🔄 Signing out user...');
    await supabase.auth.signOut();
    await removeToken(); // Clear legacy token
    console.log('✅ User signed out successfully');
  } catch (e) {
    console.error('❌ Error signing out:', e);
  }
};

// Handle authentication errors by signing out if token refresh fails
export const handleAuthError = async (error: any): Promise<boolean> => {
  if (error.message && (
    error.message.includes('Invalid or expired token') ||
    error.message.includes('Authentication failed') ||
    error.message.includes('Failed to refresh')
  )) {
    console.log('🔐 Authentication error detected, signing out...');
    await signOut();
    return false; // Indicates user should be redirected to login
  }
  return true; // Indicates error was not auth-related
};