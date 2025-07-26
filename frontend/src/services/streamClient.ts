import { StreamChat } from 'stream-chat';
import { getStreamChatToken } from './api';
import { getToken } from './auth';
import { getUserProfile } from './userProfileService';

// Initialize with default API key - this will be replaced if needed
let streamChatClient = StreamChat.getInstance('f66tvjfhee3x');

// Export getter function to ensure we always get the current client
export { streamChatClient };

// Function to connect a user to Stream Chat
export const connectUser = async (userId: string, userToken?: string): Promise<void> => {
  try {
    if (userToken) {
      // Get user profile to get the actual name
      const userProfile = await getUserProfile(userId);
      const displayName = userProfile 
        ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || `User ${userId}`
        : `User ${userId}`;
      
      await streamChatClient.connectUser(
        {
          id: userId,
          name: displayName
        },
        userToken
      );
    } else {
      // Get proper token from backend
      const authToken = await getToken();
      if (!authToken) {
        throw new Error('No authentication token available');
      }
      
      const streamData = await getStreamChatToken(authToken);
      console.log('🔍 Stream Chat data received:', { 
        apiKey: streamData.apiKey, 
        hasToken: !!streamData.token 
      });
      
      // If we get a different API key, create a new client instance
      if (streamData.apiKey && streamData.apiKey !== 'f66tvjfhee3x') {
        console.log('🔄 Creating new Stream Chat client with API key:', streamData.apiKey);
        streamChatClient = StreamChat.getInstance(streamData.apiKey);
      }
      
      // Get user profile to get the actual name
      const userProfile = await getUserProfile(userId);
      const displayName = userProfile 
        ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || `User ${userId}`
        : `User ${userId}`;
      
      await streamChatClient.connectUser(
        {
          id: userId,
          name: displayName
        },
        streamData.token
      );
    }
    console.log('✅ User connected to Stream Chat:', userId);
  } catch (error) {
    console.error('❌ Failed to connect user to Stream Chat:', error);
    throw error;
  }
};

// Function to disconnect user
export const disconnectUser = async (): Promise<void> => {
  try {
    await streamChatClient.disconnectUser();
    console.log('User disconnected from Stream Chat');
  } catch (error) {
    console.error('Failed to disconnect user from Stream Chat:', error);
  }
}; 