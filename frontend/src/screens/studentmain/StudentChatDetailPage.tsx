import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Image } from 'react-native';
import { ArrowLeft, Send, MoreVertical } from 'lucide-react-native';

interface StudentChatDetailPageProps {
  contact: {
    avatar: string;
    name: string;
    // add other fields if needed
  };
  messages: { sender: string; text: string }[];
  onBack: () => void;
}

const StudentChatDetailPage: React.FC<StudentChatDetailPageProps> = ({ contact, messages, onBack }) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim() === '') return;
    // logic to send the message (e.g., call backend or update state)
    console.log('Sending message:', newMessage);
    setNewMessage('');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.contactInfo}>
          <Image source={{ uri: contact.avatar }} style={styles.avatar} />
          <View>
            <Text style={styles.contactName}>{contact.name}</Text>
            <Text style={styles.onlineStatus}>Online</Text>
          </View>
        </View>
        <TouchableOpacity>
          <MoreVertical size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView style={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.message,
              msg.sender === 'me' ? styles.myMessage : styles.theirMessage
            ]}
          >
            <Text style={[
              styles.messageText,
              msg.sender === 'me' ? styles.myMessageText : styles.theirMessageText
            ]}>
              {msg.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Send size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f97316',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  onlineStatus: {
    fontSize: 12,
    color: '#fed7aa',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  message: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#f97316',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
  },
  messageText: {
    fontSize: 14,
  },
  myMessageText: {
    color: 'white',
  },
  theirMessageText: {
    color: '#374151',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginRight: 12,
    fontSize: 14,
  },
  sendButton: {
    padding: 8,
    backgroundColor: '#f97316',
    borderRadius: 20,
  },
});

export default StudentChatDetailPage;
