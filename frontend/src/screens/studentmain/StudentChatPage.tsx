import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  Image,
  StyleSheet,
  Dimensions
} from 'react-native';
import LoadingOverlay from '../../components/LoadingOverlay';
import { streamChatClient, connectUser } from '../../services/streamClient';
import { Chat, Channel, MessageList, MessageInput, OverlayProvider } from 'stream-chat-expo';
import { getToken } from '../../services/auth';
import { getAvailableCoaches } from '../../services/api';
import { getMultipleUserProfiles } from '../../services/userProfileService';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import ChatModal from '../../components/ChatModal';

const { width } = Dimensions.get('window');

const StudentChatPage = () => {
  const route = useRoute();
  const navigation = useNavigation();
  
  // Get route parameters if navigating to a specific chat
  const params = route.params as { channelId?: string; coachId?: string; coachName?: string } | undefined;
  const { channelId, coachId, coachName } = params || {};
  const [clientReady, setClientReady] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [availableCoaches, setAvailableCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});

  // Handle direct channel navigation (when coming from "Chat First" button)
  useEffect(() => {
    const handleDirectChannelNavigation = async () => {
      if (channelId && clientReady && streamChatClient && streamChatClient.userID) {
        try {
          console.log('🔍 Direct channel navigation - Channel ID:', channelId);
          console.log('🔍 Stream client user ID:', streamChatClient.userID);
          
          // Navigate directly to StudentChatDetail instead of using modal
          (navigation as any).navigate('StudentChatDetail', {
            channelId: channelId,
            coachName: coachName || 'Coach'
          });
          
        } catch (error) {
          console.error('❌ Failed to navigate to direct channel:', error);
        }
      } else {
        console.log('🔍 Direct channel navigation conditions not met:', {
          channelId,
          clientReady,
          hasStreamClient: !!streamChatClient,
          streamClientConnected: streamChatClient?.userID
        });
      }
    };

    handleDirectChannelNavigation();
  }, [channelId, clientReady, streamChatClient]);

  useEffect(() => {
    const setup = async () => {
      try {
        setLoading(true);
        // Get user ID from secure storage
        const storedUserId = await SecureStore.getItemAsync('userId');
        if (!storedUserId) {
          throw new Error('No user ID found');
        }
        setUserId(storedUserId);
        
        // Get auth token
        const authToken = await getToken();
        if (!authToken) {
          throw new Error('No authentication token found');
        }

        // Connect to Stream Chat
        await connectUser(storedUserId);
        
        // Wait a moment for client to fully initialize
        setTimeout(() => {
          if (streamChatClient.userID) {
            console.log('✅ Stream Chat client ready with user:', streamChatClient.userID);
            setClientReady(true);
          } else {
            console.log('❌ Stream Chat client not properly connected');
            setError('Failed to connect to chat service');
          }
        }, 1000);
        
        // Get available coaches
        const coachesData = await getAvailableCoaches(authToken);
        const uniqueCoaches = coachesData.coaches
          .map((coach: any) => ({
            id: coach.id,
            name: `${coach.first_name} ${coach.last_name}`,
            profilePicture: coach.profile_picture || 'https://randomuser.me/api/portraits/men/1.jpg',
            sport: coach.sport || 'General',
            online: Math.random() > 0.5 // Random online status for demo
          }))
          .filter((coach: any) => coach.id !== storedUserId);

        setAvailableCoaches(uniqueCoaches);
        
        // Get existing channels
        const filters = { type: 'messaging', members: { $in: [storedUserId] } };
        const sort = [{ last_message_at: -1 as const }];
        const channelList = await streamChatClient.queryChannels(filters, sort, { watch: true });
        
        // Get all unique user IDs from channels to fetch their profile pictures
        const allUserIds = new Set<string>();
        channelList.forEach(channel => {
          Object.keys(channel.state.members || {}).forEach(userId => {
            allUserIds.add(userId);
          });
        });
        
        // Fetch profile pictures for all users
        const profiles = await getMultipleUserProfiles(Array.from(allUserIds));
        setUserProfiles(profiles);
        
        setChannels(channelList);
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to setup chat:', err);
        setError('Failed to connect to chat');
        setLoading(false);
      }
    };
    
    setup();
    return () => { 
      streamChatClient.disconnectUser().catch(console.error);
    };
  }, []);

  const handleStartChat = async (coach: any) => {
    try {
      const channelId = `chat-${userId}-${coach.id}`;
      const channel = streamChatClient.channel('messaging', channelId, {
        members: [userId!, coach.id],
      });
      
      await channel.create();
      setSelectedChannel(channel);
    } catch (error) {
      console.error('Failed to create channel:', error);
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingOverlay 
          visible={true} 
          message="Loading your messages..." 
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Conversations */}
        <Text style={styles.sectionTitle}>Conversation</Text>
        {channels.length > 0 ? (
          <View style={styles.whiteBox}>
            {channels.map((channel) => {
              const memberKeys = Object.keys(channel.state.members);
              const otherMemberKey = memberKeys.find(key => key !== userId);
              const otherMember = otherMemberKey ? channel.state.members[otherMemberKey] : undefined;
              const lastMessage = channel.state.messages[channel.state.messages.length - 1];
              const unreadCount = userId ? channel.state.read[userId]?.unread_messages || 0 : 0;
              
              return (
                <TouchableOpacity 
                  key={channel.id} 
                  style={styles.conversationItem}
                  onPress={() => setSelectedChannel(channel)}
                >
                  <Image 
                    source={{ 
                      uri: otherMemberKey && userProfiles[otherMemberKey]?.profile_picture 
                        ? userProfiles[otherMemberKey].profile_picture 
                        : 'https://randomuser.me/api/portraits/men/1.jpg'
                    }} 
                    style={styles.conversationAvatar} 
                  />
                  <View style={styles.conversationContent}>
                    <Text style={styles.conversationName}>
                      {channel.data?.name || otherMember?.user?.name || otherMember?.name || 'Coach'}
                    </Text>
                    <Text style={styles.conversationLastMessage} numberOfLines={1}>
                      {lastMessage?.text || 'No messages yet'}
                    </Text>
                  </View>
                  {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>{unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No conversations yet</Text>
            <Text style={styles.emptyStateSubtitle}>Start a chat with a coach to begin messaging!</Text>
          </View>
        )}

        {/* Your Groups */}
        <Text style={styles.sectionTitle}>Your groups</Text>
        {channels.filter(channel => channel.state.members && Object.keys(channel.state.members).length > 2).length > 0 ? (
          <View style={styles.whiteBox}>
            {channels
              .filter(channel => channel.state.members && Object.keys(channel.state.members).length > 2)
              .map((channel) => (
                <TouchableOpacity 
                  key={channel.id} 
                  style={styles.groupCard}
                  onPress={() => setSelectedChannel(channel)}
                >
                  <View style={styles.groupCardHeader}>
                    <Text style={styles.groupName} numberOfLines={1}>
                      {channel.data?.name || 'Group Chat'}
                    </Text>
                    <Text style={styles.groupTime}>23 min ago</Text>
                    <Ionicons name="star" size={16} color="#fbbf24" />
                  </View>
                  <View style={styles.groupCardFooter}>
                    <View style={styles.groupStats}>
                      <Ionicons name="chatbubble-outline" size={16} color="#666" />
                      <Text style={styles.groupStatsText}>320+</Text>
                    </View>
                    <View style={styles.groupMembers}>
                      {Object.keys(channel.state.members).slice(0, 4).map((memberId, index) => (
                        <Image 
                          key={memberId}
                          source={{ uri: 'https://randomuser.me/api/portraits/men/' + (index + 1) + '.jpg' }} 
                          style={[styles.groupMemberAvatar, { marginLeft: index > 0 ? -8 : 0 }]} 
                        />
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No groups yet</Text>
            <Text style={styles.emptyStateSubtitle}>Join group sessions to see them here!</Text>
          </View>
        )}
      </ScrollView>

            {/* Chat Modal */}
      <ChatModal
        visible={!!selectedChannel}
        onClose={() => setSelectedChannel(null)}
        channelId={selectedChannel?.id}
        chatPartnerName={selectedChannel?.data?.name || 'Chat'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f97316',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginTop: 16,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  searchButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  messagesSection: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 24,
  },
  bigMessagesTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f97316',
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  whiteBox: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  contactsScroll: {
    paddingHorizontal: 0,
  },
  contactItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 60,
  },
  contactAvatarContainer: {
    position: 'relative',
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f97316',
    borderWidth: 2,
    borderColor: '#fff',
  },
  contactName: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  conversationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  conversationLastMessage: {
    fontSize: 14,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  groupCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 0,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  groupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  groupTime: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  groupCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupStatsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  groupMembers: {
    flexDirection: 'row',
  },
  groupMemberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#fbbf24',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 8,
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#fbbf24',
    textAlign: 'center',
  },
});

export default StudentChatPage;