import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Home, Search, PlusSquare, Bell, User } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, layout } from '../theme/theme';
import * as Haptics from 'expo-haptics';

export const FloatingNavBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Map icon
          const getIcon = () => {
            const color = isFocused ? colors.primary : colors.textMuted;
            const size = 24;
            switch (route.name) {
              case 'Feed': return <Home color={color} size={size} />;
              case 'Search': return <Search color={color} size={size} />;
              case 'Create': return <PlusSquare color={colors.textOnPrimary} size={size} />;
              case 'Notifications': return <Bell color={color} size={size} />;
              case 'Profile': return <User color={color} size={size} />;
              default: return null;
            }
          };

          const isCenter = route.name === 'Create';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tabButton, isCenter && styles.centerButton]}
              activeOpacity={0.8}
            >
              <AnimatedIcon isFocused={isFocused} isCenter={isCenter}>
                {getIcon()}
              </AnimatedIcon>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
};

const AnimatedIcon = ({ children, isFocused, isCenter }: any) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(isFocused ? 1.15 : 1, {
            damping: 15,
            stiffness: 200,
          }),
        },
      ],
    };
  });

  return (
    <Animated.View style={[animatedStyle, isCenter && styles.centerIconContainer]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: layout.spacing.lg,
    left: layout.spacing.lg,
    right: layout.spacing.lg,
    height: 64,
    borderRadius: layout.radius.full,
    overflow: 'hidden', // to ensure blur doesn't bleed out of radius
  },
  blurContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.spacing.sm,
    backgroundColor: 'rgba(23, 24, 34, 0.4)', // tint the blur slightly
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    flex: 1.2,
  },
  centerIconContainer: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  }
});
