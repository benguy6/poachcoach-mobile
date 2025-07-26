import { supabase } from './supabase';

interface UserProfile {
  id: string;
  profile_picture?: string;
  first_name?: string;
  last_name?: string;
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('Users')
      .select('id, profile_picture, first_name, last_name')
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle no results gracefully

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    // If no user found, return null
    if (!data) {
      console.log(`No user profile found for userId: ${userId}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

export const getMultipleUserProfiles = async (userIds: string[]): Promise<Record<string, UserProfile>> => {
  try {
    const { data, error } = await supabase
      .from('Users')
      .select('id, profile_picture, first_name, last_name')
      .in('id', userIds);

    if (error) {
      console.error('Error fetching multiple user profiles:', error);
      return {};
    }

    const profilesMap: Record<string, UserProfile> = {};
    data?.forEach(profile => {
      profilesMap[profile.id] = profile;
    });

    return profilesMap;
  } catch (error) {
    console.error('Error in getMultipleUserProfiles:', error);
    return {};
  }
}; 