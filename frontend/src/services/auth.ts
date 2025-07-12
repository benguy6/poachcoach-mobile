import * as SecureStore from 'expo-secure-store';

export const getToken = async (): Promise<string | null> => {
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