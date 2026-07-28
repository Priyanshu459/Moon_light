import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { colors, typography, layout } from '../../theme/theme';

export default function LoginScreen({ navigation }: any) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!emailOrUsername || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', {
        email: emailOrUsername.includes('@') ? emailOrUsername : undefined,
        username: !emailOrUsername.includes('@') ? emailOrUsername : undefined,
        password,
      });
      
      const { accessToken, user } = response.data;
      await login(accessToken, user);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Moon Light</Text>
      <Text style={styles.subtitle}>Welcome back</Text>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email or Username"
          placeholderTextColor={colors.textSecondary}
          value={emailOrUsername}
          onChangeText={setEmailOrUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkButton}>
          <Text style={styles.linkText}>Don't have an account? Sign up</Text>
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
    color: colors.primary,
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
