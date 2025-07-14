// CoachChatPage.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const dummyMessages = [
  { id: 1, sender: 'Student', text: 'Thanks for today\'s session!', time: '2 min ago' },
  { id: 2, sender: 'Coach', text: 'You did great — proud of your progress!', time: '1 min ago' },
];

const CoachChatPage = ({ navigation }: any) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) return;
    // Add logic to send message
    setMessage('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#fb923c" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat with John</Text>
        <View style={{ width: 24 }} /> {/* placeholder for alignment */}
      </View>

      {/* Chat Messages */}
      <ScrollView contentContainerStyle={styles.chatContainer}>
        {dummyMessages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.chatBubble,
              msg.sender === 'Coach' ? styles.chatRight : styles.chatLeft,
            ]}
          >
            <Text style={styles.chatText}>{msg.text}</Text>
            <Text style={styles.chatTime}>{msg.time}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
          style={styles.input}
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fb923c',
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  chatBubble: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: '75%',
  },
  chatLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#1f2937',
  },
  chatRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#fb923c',
  },
  chatText: {
    color: '#fff',
    fontSize: 14,
  },
  chatTime: {
    fontSize: 10,
    color: '#d1d5db',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  input: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 14,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#fb923c',
    borderRadius: 20,
    padding: 10,
  },
});

export default CoachChatPage;
