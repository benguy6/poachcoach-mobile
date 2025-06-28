import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StudentTabParamList } from '../App'; 


export type TabItem = {
  id: string;
  icon: string;
  iconOutline: string;
  isCenter?: boolean;
};

export interface BottomNavigationProps {
  activeTab: string;
  onTabPress: (tabId: keyof StudentTabParamList) => void;
  tabs: TabItem[];
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabPress,
  tabs,
}) => {
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
                (tab.isCenter
                  ? tab.icon
                  : activeTab === tab.id
                  ? tab.icon
                  : tab.iconOutline) as React.ComponentProps<typeof Ionicons>['name']
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