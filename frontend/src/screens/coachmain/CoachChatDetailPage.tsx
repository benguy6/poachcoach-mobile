import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView 
} from 'react-native';
import { streamChatClient } from '../../services/streamClient';
import { Chat, Channel, MessageList, MessageInput, OverlayProvider } from 'stream-chat-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';

const CoachChatDetailPage = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the channel ID from navigation params
  const params = route.params as { channelId?: string; studentName?: string } | undefined;
  const { channelId, studentName } = params || {};

  useEffect(() => {
    const loadChannel = async () => {
      console.log('🔍 Coach Chat Detail - Checking conditions:', {
        channelId,
        hasStreamClient: !!streamChatClient,
        userConnected: streamChatClient?.userID,
        clientState: streamChatClient?.connectionId
      });

      if (!channelId) {
        console.log('❌ Missing channelId');
        setError('No channel ID provided');
        setLoading(false);
        return;
      }

      if (!streamChatClient?.userID) {
        console.log('❌ Stream Chat user not connected, waiting...');
        // Wait a bit for the client to connect
        setTimeout(() => {
          if (streamChatClient?.userID) {
            console.log('✅ Stream Chat client now ready, retrying...');
            loadChannel();
          } else {
            console.log('❌ Stream Chat client still not ready');
            setError('Chat service not connected. Please go back and try again.');
            setLoading(false);
          }
        }, 2000);
        return;
      }

      try {
        console.log('🔍 Loading channel:', channelId);
        
        // Get the specific channel
        const channelInstance = streamChatClient.channel('messaging', channelId);
        await channelInstance.watch();
        
        console.log('✅ Channel loaded successfully:', channelId);
        setChannel(channelInstance);
        setLoading(false);
      } catch (err) {
        console.error('❌ Failed to load channel:', err);
        setError('Failed to load chat');
        setLoading(false);
      }
    };

    loadChannel();
  }, [channelId]);

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !channel) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || 'Failed to load chat'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {studentName || channel.data?.name || 'Chat'}
        </Text>
      </View>
      
      <View style={styles.chatContainer}>
        {streamChatClient?.userID && channel ? (
          <OverlayProvider>
            <Chat client={streamChatClient as any}>
              <Channel channel={channel}>
                <MessageList />
                <MessageInput />
              </Channel>
            </Chat>
          </OverlayProvider>
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Connecting to chat...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#000', // Black theme for coaches
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CoachChatDetailPage; 