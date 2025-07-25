import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ActiveClassBannerProps {
  activeClass: {
    id: string;
    sport: string;
    studentsAttending: number;
    startTime: string;
    endTime: string;
  };
  onPress: () => void;
  onEndClass: () => void;
}

const ActiveClassBanner: React.FC<ActiveClassBannerProps> = ({
  activeClass,
  onPress,
  onEndClass,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.banner} onPress={onPress}>
        <View style={styles.leftContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="play-circle" size={24} color="#22c55e" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.classTitle}>
              {activeClass.sport} Class in Progress
            </Text>
            <Text style={styles.classDetails}>
              {activeClass.studentsAttending} students • {activeClass.startTime} - {activeClass.endTime}
            </Text>
          </View>
        </View>
        <View style={styles.rightContent}>
          <TouchableOpacity style={styles.endButton} onPress={onEndClass}>
            <Text style={styles.endButtonText}>End</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  banner: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  classTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  classDetails: {
    color: '#9ca3af',
    fontSize: 14,
  },
  rightContent: {
    marginLeft: 12,
  },
  endButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  endButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ActiveClassBanner; 