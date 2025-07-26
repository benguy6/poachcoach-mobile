import { useState, useEffect } from 'react';
import { streamChatClient } from '../services/streamClient';
import { getMultipleUserProfiles } from '../services/userProfileService';

interface RecentMessage {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
  channelId: string;
}

export const useRecentMessages = (maxMessages: number = 3, refreshKey: number = 0) => {
  const [messages, setMessages] = useState<RecentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentMessages = async () => {
      if (!streamChatClient?.userID) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetching recent messages for home page...');
        
        // Query recent channels with messages
        const filters = { 
          type: 'messaging',
          members: { $in: [streamChatClient.userID] }
        };
        const sort = [{ last_message_at: -1 }];
        const options = {
          watch: false,
          state: true,
          limit: maxMessages
        };

        const channelList = await streamChatClient.queryChannels(filters, sort, options);
        
        // Get all unique user IDs from channels to fetch their profile pictures
        const allUserIds = new Set<string>();
        channelList.forEach(channel => {
          Object.keys(channel.state.members || {}).forEach(userId => {
            allUserIds.add(userId);
          });
        });
        
        // Fetch profile pictures for all users
        const userProfiles = await getMultipleUserProfiles(Array.from(allUserIds));
        
        const recentMessages: RecentMessage[] = channelList.map((channel) => {
          const memberKeys = Object.keys(channel.state.members || {});
          const otherMemberKey = memberKeys.find(key => key !== streamChatClient.userID);
          const otherMember = otherMemberKey ? channel.state.members[otherMemberKey] : undefined;
          const lastMessage = channel.state.messages?.[channel.state.messages.length - 1];
          const unreadCount = streamChatClient.userID ? 
            channel.state.read[streamChatClient.userID]?.unread_messages || 0 : 0;

          // Determine display name based on channel data and member info
          let displayName = 'Unknown';
          if (channel.data?.name) {
            displayName = channel.data.name;
          } else if (channel.data?.coachName) {
            displayName = channel.data.coachName;
          } else if (channel.data?.studentName) {
            displayName = channel.data.studentName;
          } else if (otherMember?.user?.name) {
            displayName = otherMember.user.name;
          } else if (otherMember?.name) {
            displayName = otherMember.name;
          }

          // Get profile picture from user profiles
          let profilePicture = 'https://randomuser.me/api/portraits/men/1.jpg'; // fallback
          if (otherMemberKey && userProfiles[otherMemberKey]) {
            const userProfile = userProfiles[otherMemberKey];
            if (userProfile.profile_picture) {
              profilePicture = userProfile.profile_picture;
            }
          }

          // Format time
          let timeString = '';
          if (lastMessage?.created_at) {
            const messageTime = new Date(lastMessage.created_at);
            const now = new Date();
            const diffInHours = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60 * 60));
            
            if (diffInHours < 1) {
              const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
              timeString = diffInMinutes < 1 ? 'now' : `${diffInMinutes}m ago`;
            } else if (diffInHours < 24) {
              timeString = `${diffInHours}h ago`;
            } else {
              const diffInDays = Math.floor(diffInHours / 24);
              timeString = `${diffInDays}d ago`;
            }
          }

          return {
            id: channel.id,
            name: displayName,
            lastMessage: lastMessage?.text || 'No messages yet',
            time: timeString,
            unread: unreadCount,
            avatar: profilePicture,
            channelId: channel.id
          };
        });

        console.log('✅ Recent messages fetched:', recentMessages.length);
        setMessages(recentMessages);
      } catch (error) {
        console.error('❌ Failed to fetch recent messages:', error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentMessages();
  }, [streamChatClient?.userID, maxMessages, refreshKey]);

    return { messages, loading };
}; 