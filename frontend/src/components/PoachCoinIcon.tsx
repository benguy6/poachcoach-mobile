import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PoachCoinIconProps {
  size?: number;
  color?: string;
  backgroundColor?: string;
}

const PoachCoinIcon: React.FC<PoachCoinIconProps> = ({ 
  size = 20, 
  color = '#f97316',
  backgroundColor = '#fed7aa'
}) => {
  return (
    <View style={[
      styles.container, 
      { 
        width: size, 
        height: size, 
        backgroundColor,
        borderRadius: size / 2
      }
    ]}>
      <Text style={[
        styles.text, 
        { 
          color, 
          fontSize: size * 0.6,
          fontWeight: 'bold'
        }
      ]}>
        P
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f97316',
  },
  text: {
    fontWeight: 'bold',
  },
});

export default PoachCoinIcon; 