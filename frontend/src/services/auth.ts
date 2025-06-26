import AsyncStorage from '@react-native-async-storage/async-storage';

export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('accessToken');
  } catch (e) {
    console.error('Failed to get token:', e);
    return null;
  }
};

export const setToken = async (token: string) => {
  try {
    await AsyncStorage.setItem('accessToken', token);
  } catch (e) {
    console.error('Failed to set token:', e);
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('accessToken');
  } catch (e) {
    console.error('Failed to remove token:', e);
  }
};