import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FeedScreen from '../screens/main/FeedScreen';
import CreatePostScreen from '../screens/main/CreatePostScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { Home, PlusSquare, User } from 'lucide-react-native';
import { colors } from '../theme/theme';
import { View, Text, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.surface,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.textPrimary,
        },
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          title: 'Moon Light',
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreatePostScreen}
        options={{
          tabBarIcon: ({ color, size }) => <PlusSquare color={color} size={size} />,
          title: 'New Post',
          tabBarLabel: 'New Post',
          headerShown: false, // Create screen has its own header
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          tabBarLabel: 'Profile',
          headerShown: false, // Profile screen has its own header
        }}
      />
    </Tab.Navigator>
  );
}
