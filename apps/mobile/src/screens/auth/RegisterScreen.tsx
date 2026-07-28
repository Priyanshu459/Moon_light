import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { colors, typography, layout } from '../../theme/theme';

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleRegister = async () => {
    if (!email || !username || !password || !displayName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/register', {
        email,
        username,
        password,
        fullName: displayName, // Map displayName to fullName for the backend DTO
      });
      
      const { accessToken, user } = response.data;
      await login(accessToken, user);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      Alert.alert('Error', Array.isArray(message) ? message[0] : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join Moon Light today</Text>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={colors.textSecondary}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Display Name"
          placeholderTextColor={colors.textSecondary}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkButton}>
          <Text style={styles.linkText}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: layout.spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: layout.spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: layout.spacing.xxl,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: layout.radius.md,
    padding: layout.spacing.md,
    marginBottom: layout.spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.primary,
    padding: layout.spacing.md,
    borderRadius: layout.radius.md,
    alignItems: 'center',
    marginTop: layout.spacing.md,
  },
  buttonText: {
    ...typography.h3,
    color: colors.background,
  },
  linkButton: {
    marginTop: layout.spacing.xl,
    alignItems: 'center',
  },
  linkText: {
    ...typography.body,
    color: colors.primary,
  },
});
