import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Tab {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
  isCenter?: boolean;
}

interface BottomNavigationProps {
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabPress }) => {
  const tabs: Tab[] = [
    {
      id: 'home',
      icon: 'home',
      iconOutline: 'home-outline',
    },
    {
      id: 'calendar',
      icon: 'calendar',
      iconOutline: 'calendar-outline',
    },
    {
      id: 'booking',
      icon: 'add',
      iconOutline: 'add',
      isCenter: true,
    },
    {
      id: 'chat',
      icon: 'chatbubble',
      iconOutline: 'chatbubble-outline',
    },
    {
      id: 'wallet',
      icon: 'wallet',
      iconOutline: 'wallet-outline',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              tab.isCenter && styles.centerTabButton,
              activeTab === tab.id && !tab.isCenter && styles.activeTabButton,
            ]}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                tab.isCenter
                  ? tab.icon
                  : activeTab === tab.id
                  ? tab.icon
                  : tab.iconOutline
              }
              size={tab.isCenter ? 28 : 24}
              color={
                tab.isCenter
                  ? 'white'
                  : activeTab === tab.id
                  ? '#f97316'
                  : '#9ca3af'
              }
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tabButton: {
    padding: 8,
    borderRadius: 20,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  centerTabButton: {
    backgroundColor: '#f97316',
    padding: 12,
    borderRadius: 25,
    shadowColor: '#f97316',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default BottomNavigation;