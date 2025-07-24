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

const StudentChatDetailPage = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the channel ID from navigation params
  const params = route.params as { channelId?: string; coachName?: string } | undefined;
  const { channelId, coachName } = params || {};

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;
    
    const loadChannel = async () => {
      console.log('🔍 Chat Detail - Checking conditions (attempt ' + (retryCount + 1) + '):', {
        channelId,
        hasStreamClient: !!streamChatClient,
        userConnected: streamChatClient?.userID,
        clientState: streamChatClient?.connectionId,
        clientReady: streamChatClient?._isUsingServerAuth
      });

      if (!channelId) {
        console.log('❌ Missing channelId');
        setError('No channel ID provided');
        setLoading(false);
        return;
      }

      // Enhanced client ready checks
      if (!streamChatClient || !streamChatClient.userID) {
        retryCount++;
        if (retryCount <= maxRetries) {
          console.log(`❌ Stream Chat client not fully ready, retrying... (${retryCount}/${maxRetries})`);
          console.log(`   - User ID: ${streamChatClient?.userID || 'missing'}`);
          console.log(`   - Has Client: ${!!streamChatClient}`);
          
          setTimeout(() => {
            loadChannel();
          }, 1000 * retryCount); // Progressive delay
          return;
        } else {
          console.log('❌ Stream Chat client failed to initialize after maximum retries');
          setError('Chat service failed to connect. Please go back and try again.');
          setLoading(false);
          return;
        }
      }

      try {
        console.log('🔍 Loading channel:', channelId);
        
        // Get the specific channel - client should be ready at this point
        const channelInstance = streamChatClient.channel('messaging', channelId);
        await channelInstance.watch();
        
        console.log('✅ Channel loaded successfully:', channelId);
        
        // Additional delay to ensure Stream Chat client is fully ready for component rendering
        setTimeout(() => {
          setChannel(channelInstance);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error('❌ Failed to load channel:', err);
        retryCount++;
        if (retryCount <= maxRetries) {
          console.log(`🔄 Retrying channel load... (${retryCount}/${maxRetries})`);
          setTimeout(() => {
            loadChannel();
          }, 1000 * retryCount);
        } else {
          setError('Failed to load chat after multiple attempts');
          setLoading(false);
        }
      }
    };

    // Check if client is already ready, otherwise wait for it
    if (streamChatClient?.userID) {
      console.log('🚀 Stream Chat user connected, proceeding with channel load');
      loadChannel();
    } else {
      console.log('⏳ Stream Chat user not connected, waiting...');
      
      // Listen for client ready state with timeout
      let attempts = 0;
      const maxAttempts = 20; // 10 seconds total
      
      const checkClientReady = () => {
        attempts++;
        console.log(`🔍 Checking Stream Chat readiness (${attempts}/${maxAttempts}):`, {
          hasClient: !!streamChatClient,
          userID: streamChatClient?.userID,
          wsState: streamChatClient?.wsConnection?.connectionState,
          connectionId: streamChatClient?.connectionId
        });
        
        if (streamChatClient?.userID) {
          console.log('🚀 Stream Chat became ready, loading channel');
          loadChannel();
        } else if (attempts >= maxAttempts) {
          console.log('❌ Stream Chat failed to connect after maximum attempts');
          setError('Failed to connect to chat service. Please try again.');
          setLoading(false);
        } else {
          setTimeout(checkClientReady, 500);
        }
      };
      
      // Start checking immediately
      checkClientReady();
    }
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
          {coachName || channel.data?.name || 'Chat'}
        </Text>
      </View>
      
      <View style={styles.chatContainer}>
        {streamChatClient?.userID && channel && streamChatClient?._hasConnectionRecovered !== false ? (
          (() => {
            try {
              return (
                <OverlayProvider>
                  <Chat client={streamChatClient as any}>
                    <Channel channel={channel}>
                      <MessageList />
                      <MessageInput />
                    </Channel>
                  </Chat>
                </OverlayProvider>
              );
            } catch (error) {
              console.error('❌ Error rendering Stream Chat components:', error);
              return (
                <View style={styles.centerContainer}>
                  <Text style={styles.errorText}>
                    Failed to initialize chat interface. Please go back and try again.
                  </Text>
                  <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.retryButtonText}>Go Back</Text>
                  </TouchableOpacity>
                </View>
              );
            }
          })()
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>
              {streamChatClient?.userID ? 'Initializing chat interface...' : 'Connecting to chat service...'}
            </Text>
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
    backgroundColor: '#f97316',
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
    backgroundColor: '#f97316',
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

export default StudentChatDetailPage;
