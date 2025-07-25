import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { streamChatClient } from '../../services/streamClient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';

interface Message {
  id: string;
  text: string;
  user: {
    id: string;
    name?: string;
  };
  created_at: string;
}

const StudentChatDetailPageSimple = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [channel, setChannel] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Get the channel ID from navigation params
  const params = route.params as { channelId?: string; coachName?: string } | undefined;
  const { channelId, coachName } = params || {};

  useEffect(() => {
    const loadChannel = async () => {
      if (!channelId || !streamChatClient?.userID) {
        setError('Invalid channel or user not connected');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Simple Chat - Loading channel:', channelId);
        
        // Get the specific channel
        const channelInstance = streamChatClient.channel('messaging', channelId);
        await channelInstance.watch();
        
        console.log('✅ Simple Chat - Channel loaded successfully');
        setChannel(channelInstance);
        
        // Load existing messages
        const channelState = await channelInstance.query();
        const channelMessages = channelState.messages || [];
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
        channelInstance.on('message.new', (event: any) => {
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
        });
        
        setLoading(false);
      } catch (err) {
        console.error('❌ Simple Chat - Failed to load channel:', err);
        setError('Failed to load chat');
        setLoading(false);
      }
    };

    if (streamChatClient?.userID) {
      loadChannel();
    } else {
      const checkClient = () => {
        if (streamChatClient?.userID) {
          loadChannel();
        } else {
          setTimeout(checkClient, 500);
        }
      };
      checkClient();
    }
  }, [channelId]);

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
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.theirMessage
      ]}>
        {!isMyMessage && (
          <Text style={styles.senderName}>{item.user.name || 'Unknown'}</Text>
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

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
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
          {coachName || 'Chat'}
        </Text>
      </View>
      
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          inverted={false}
          showsVerticalScrollIndicator={false}
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
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
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

export default StudentChatDetailPageSimple; 