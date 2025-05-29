import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { supabase } from '../services/supabase';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');

  const handleChangePassword = async () => {
    const { error } = await supabase.auth.update({ password });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Password updated!');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set New Password</Text>
      <TextInput
        placeholder="New password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <TouchableOpacity onPress={handleChangePassword} style={styles.button}>
        <Text style={styles.buttonText}>Update Password</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 16 },
  input: { borderWidth: 1, padding: 10, marginBottom: 12, borderRadius: 8 },
  button: { backgroundColor: '#000', padding: 12, borderRadius: 8 },
  buttonText: { color: '#fff', textAlign: 'center' },
});
