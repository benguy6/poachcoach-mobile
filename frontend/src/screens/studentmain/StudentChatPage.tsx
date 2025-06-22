import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import BottomNavigation from '../../components/BottomNavigation';
import { studentTabs } from '../../constants/studentTabs';

import type { StackNavigationProp } from '@react-navigation/stack';

type StudentChatPageProps = {
  navigation: StackNavigationProp<any>;
};

const StudentChatPage = ({ navigation }: StudentChatPageProps) => {
  const chats = [
    {
      id: 1,
      name: 'Coach Vansh',
      lastMessage: 'Great progress in today\'s session!',
      time: '2 min ago',
      unread: 2,
      avatar: 'https://randomuser.me/api/portraits/men/4.jpg'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      lastMessage: 'Don\'t forget to bring your yoga mat tomorrow',
      time: '1 hour ago',
      unread: 0,
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg'
    },
    {
      id: 3,
      name: 'Michael Chen',
      lastMessage: 'How are you feeling after yesterday\'s session?',
      time: '3 hours ago',
      unread: 1,
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg'
    },
    {
      id: 4,
      name: 'Coach Shreyas',
      lastMessage: 'Practice those batting techniques we covered',
      time: '1 day ago',
      unread: 0,
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg'
    }
  ];

  // Handler for tab press
  const handleTabPress = (tabId: string) => {
    navigation.navigate(tabId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      
      <ScrollView style={styles.chatList}>
        {chats.map(chat => (
          <TouchableOpacity key={chat.id} style={styles.chatItem}>
            <Image source={{ uri: chat.avatar }} style={styles.avatar} />
            <View style={styles.chatContent}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>{chat.name}</Text>
                <Text style={styles.chatTime}>{chat.time}</Text>
              </View>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {chat.lastMessage}
              </Text>
            </View>
            {chat.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{chat.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <BottomNavigation
        activeTab="StudentChat"
        onTabPress={handleTabPress}
        tabs={studentTabs}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    paddingTop: 64,
    backgroundColor: '#f9fafb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  chatList: {
    flex: 1,
    padding: 20,
  },
  chatItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
  },
  unreadBadge: {
    width: 24,
    height: 24,
    backgroundColor: '#f97316',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default StudentChatPage;