import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image
} from 'react-native';
import { streamChatClient } from '../services/streamClient';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile } from '../services/userProfileService';

interface Message {
  id: string;
  text: string;
  user: {
    id: string;
    name?: string;
  };
  created_at: string;
}

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  channelId?: string;
  chatPartnerName?: string;
}

const ChatModal: React.FC<ChatModalProps> = ({ 
  visible, 
  onClose, 
  channelId, 
  chatPartnerName 
}) => {
  const [channel, setChannel] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!visible || !channelId) return;

    const loadChannel = async () => {
      if (!streamChatClient?.userID) {
        setError('Chat service not connected');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Modal Chat - Loading channel:', channelId);
        
        // Get the specific channel
        const channelInstance = streamChatClient.channel('messaging', channelId);
        await channelInstance.watch();
        
        console.log('✅ Modal Chat - Channel loaded successfully');
        setChannel(channelInstance);
        
        // Load existing messages
        const channelState = await channelInstance.query();
        const channelMessages = channelState.messages || [];
        
        // Get unique user IDs from messages to fetch their profile pictures
        const userIds = new Set<string>();
        channelMessages.forEach((msg: any) => {
          if (msg.user?.id) {
            userIds.add(msg.user.id);
          }
        });
        
        // Fetch profile pictures for all users in the conversation
        const profiles: Record<string, any> = {};
        for (const userId of userIds) {
          const profile = await getUserProfile(userId);
          if (profile) {
            profiles[userId] = profile;
          }
        }
        setUserProfiles(profiles);
        
        setMessages(channelMessages.map((msg: any) => ({
          id: msg.id,
          text: msg.text || '',
          user: {
            id: msg.user?.id || '',
            name: msg.user?.name || 'Unknown'
          },
          created_at: msg.created_at
        })));
        
        // Listen for new messages
        const handleNewMessage = (event: any) => {
          const newMsg = event.message;
          setMessages(prev => [...prev, {
            id: newMsg.id,
            text: newMsg.text || '',
            user: {
              id: newMsg.user?.id || '',
              name: newMsg.user?.name || 'Unknown'
            },
            created_at: newMsg.created_at
          }]);
        };
        
        channelInstance.on('message.new', handleNewMessage);
        
        // Cleanup function
        return () => {
          channelInstance.off('message.new', handleNewMessage);
        };
        
      } catch (err) {
        console.error('❌ Modal Chat - Failed to load channel:', err);
        setError('Failed to load chat');
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    setError(null);
    setMessages([]);
    setNewMessage('');
    
    const cleanup = loadChannel();
    
    // Cleanup on unmount or when channelId changes
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      }
    };
  }, [visible, channelId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !channel || sending) return;

    setSending(true);
    try {
      await channel.sendMessage({
        text: newMessage.trim()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    setSending(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.user.id === streamChatClient?.userID;
    const userProfile = userProfiles[item.user.id];
    const profilePicture = userProfile?.profile_picture || 'https://randomuser.me/api/portraits/men/1.jpg';
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.theirMessage
      ]}>
        {!isMyMessage && (
          <View style={styles.messageHeader}>
            <Image source={{ uri: profilePicture }} style={styles.messageAvatar} />
            <Text style={styles.senderName}>{item.user.name || 'Unknown'}</Text>
          </View>
        )}
        <Text style={[
          styles.messageText,
          isMyMessage ? styles.myMessageText : styles.theirMessageText
        ]}>
          {item.text}
        </Text>
        <Text style={styles.messageTime}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {chatPartnerName || 'Chat'}
          </Text>
        </View>
        
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#f97316" />
            <Text style={styles.loadingText}>Loading chat...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onClose}>
              <Text style={styles.retryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <KeyboardAvoidingView 
            style={styles.chatContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8 }}
            />
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type a message..."
                placeholderTextColor="#999"
                multiline
                maxLength={1000}
              />
              <TouchableOpacity 
                style={[styles.sendButton, { opacity: newMessage.trim() && !sending ? 1 : 0.5 }]}
                onPress={sendMessage}
                disabled={!newMessage.trim() || sending}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
    </Modal>
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
    paddingTop: 50, // Account for status bar
  },
  closeButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
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
    marginTop: 12,
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
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#f97316',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#f97316',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatModal; 