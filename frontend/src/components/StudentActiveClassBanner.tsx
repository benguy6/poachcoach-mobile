import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StudentActiveClassBannerProps {
  visible: boolean;
  session: any;
  attendanceStatus?: 'present' | 'absent' | 'late' | 'pending';
  onPress: () => void;
}

const StudentActiveClassBanner: React.FC<StudentActiveClassBannerProps> = ({
  visible,
  session,
  attendanceStatus = 'pending',
  onPress
}) => {
  if (!visible || !session) return null;

  const getStatusColor = () => {
    switch (attendanceStatus) {
      case 'present':
        return '#10b981'; // Green
      case 'absent':
        return '#ef4444'; // Red
      case 'late':
      case 'pending':
        return '#f97316'; // Orange
      default:
        return '#f97316'; // Orange for pending
    }
  };

  const getStatusText = () => {
    switch (attendanceStatus) {
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      case 'late':
      case 'pending':
        return 'Late';
      default:
        return 'Late';
    }
  };

  const getStatusIcon = () => {
    switch (attendanceStatus) {
      case 'present':
        return 'checkmark-circle';
      case 'absent':
        return 'close-circle';
      case 'late':
      case 'pending':
        return 'time';
      default:
        return 'time';
    }
  };

  return (
    <TouchableOpacity style={styles.banner} onPress={onPress}>
      <View style={styles.bannerContent}>
        <View style={styles.leftSection}>
          <Text style={styles.bannerTitle}>Class has started</Text>
          <Text style={styles.classTitle}>
            {session.session_name || 'Active Class'}
          </Text>
          <Text style={styles.classTime}>
            {(() => {
              let startTime = session.start_time;
              let endTime = session.end_time;
              
              // Handle datetime strings (extract time part for display)
              if (startTime && startTime.includes('T')) {
                startTime = startTime.split('T')[1].split(':').slice(0, 2).join(':');
              }
              if (endTime && endTime.includes('T')) {
                endTime = endTime.split('T')[1].split(':').slice(0, 2).join(':');
              }
              
              return `${startTime} - ${endTime}`;
            })()}
          </Text>
        </View>
        
        <View style={styles.rightSection}>
          <View style={[
            styles.statusBox,
            { backgroundColor: attendanceStatus === 'present' ? '#10b981' : '#fef3c7' }
          ]}>
            <Ionicons 
              name={getStatusIcon() as any} 
              size={16} 
              color={attendanceStatus === 'present' ? 'white' : '#f97316'} 
            />
            <Text style={[
              styles.statusBoxText,
              { color: attendanceStatus === 'present' ? 'white' : '#f97316' }
            ]}>
              {getStatusText()}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#f97316" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 120, // Higher above navigation bar
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#f97316',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f97316',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  classTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  classTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 8,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f97316',
  },
  statusBoxText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default StudentActiveClassBanner; 