import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation from '../../components/BottomNavigation';

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
}

interface HomePageProps {
  navigation: any;
}

const HomePage: React.FC<HomePageProps> = ({ navigation }) => {
  const [notifications] = useState(2);
  const [activeTab, setActiveTab] = useState('home');

  const chats: Chat[] = [
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
    }
  ];

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    
    // Navigate based on tab selection
    switch (tabId) {
      case 'home':
        // Already on home, maybe refresh or scroll to top
        break;
      case 'calendar':
        navigation.navigate('Calendar');
        break;
      case 'booking':
        navigation.navigate('Booking');
        break;
      case 'chat':
        navigation.navigate('Chat');
        break;
      case 'wallet':
        navigation.navigate('Wallet');
        break;
      default:
        break;
    }
  };

  const handleMenuPress = () => {
    // Open side drawer or navigate to settings
    navigation.navigate('Settings');
  };

  const handleNotificationPress = () => {
    navigation.navigate('Notifications');
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#f97316" />
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleMenuPress} style={styles.headerButton}>
            <Ionicons name="menu" size={28} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.notificationContainer}
            onPress={handleNotificationPress}
          >
            <Ionicons name="notifications" size={24} color="white" />
            {notifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>
                  {notifications > 99 ? '99+' : notifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <TouchableOpacity style={styles.profileSection} onPress={handleProfilePress}>
          <View style={styles.profileContainer}>
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }}
              style={styles.profileImage}
            />
            <View style={styles.profileText}>
              <Text style={styles.greeting}>Hello, John!</Text>
              <Text style={styles.subGreeting}>Ready for your next session?</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fed7aa" />
          </View>
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statCard}>
              <Text style={styles.statLabel}>Level</Text>
              <Text style={styles.statValue}>Intermediate</Text>
              <Text style={styles.statSubtext}>Next test in 20:19:23</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statCard}>
              <Text style={styles.statLabel}>Awards</Text>
              <Text style={styles.statValue}>4</Text>
              <Text style={styles.statSubtext}>+33% month over month</Text>
            </TouchableOpacity>
          </View>

          {/* Upcoming Classes Card */}
          <View style={styles.upcomingCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Upcoming Classes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.upcomingContent}>
              <Text style={styles.upcomingTime}>20 Sep 9:30am</Text>
              <Text style={styles.upcomingDetails}>Cricket class with Coach Shreyas</Text>
              <View style={styles.upcomingFooter}>
                <Ionicons name="location-outline" size={14} color="#9ca3af" />
                <Text style={styles.upcomingLocation}>Sports Complex A</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Recent Messages Card */}
          <View style={styles.messagesCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Recent Messages</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Chat')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {chats.slice(0, 2).map(chat => (
              <TouchableOpacity 
                key={chat.id} 
                style={styles.chatItem}
                onPress={() => navigation.navigate('ChatDetail', { chatId: chat.id })}
              >
                <Image source={{ uri: chat.avatar }} style={styles.chatAvatar} />
                <View style={styles.chatContent}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.chatName}>{chat.name}</Text>
                    <Text style={styles.chatTime}>{chat.time}</Text>
                  </View>
                  <Text style={styles.chatMessage} numberOfLines={1}>
                    {chat.lastMessage}
                  </Text>
                </View>
                {chat.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>
                      {chat.unread > 99 ? '99+' : chat.unread}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f97316',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Space for bottom navigation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerButton: {
    padding: 4,
  },
  notificationContainer: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  profileText: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subGreeting: {
    fontSize: 16,
    color: '#fed7aa',
    marginTop: 4,
  },
  statsContainer: {
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  upcomingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: '600',
  },
  upcomingContent: {
    borderLeftWidth: 3,
    borderLeftColor: '#f97316',
    paddingLeft: 12,
  },
  upcomingTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  upcomingDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  upcomingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  upcomingLocation: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  messagesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  chatTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  chatMessage: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#f97316',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default HomePage;