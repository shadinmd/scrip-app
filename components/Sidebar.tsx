import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useStore } from '@/lib/store';
import { useUIStore } from '@/lib/ui-store';
import { UserIcon, SettingsIcon, LogOutIcon, XIcon, ChevronRightIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.75;

export const Sidebar = () => {
  const { isSidebarOpen, closeSidebar } = useUIStore();
  const { user, logout } = useStore();
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isSidebarOpen ? 0 : -SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: isSidebarOpen ? 0.5 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSidebarOpen]);

  const handleNavigate = (path: any) => {
    closeSidebar();
    router.push(path);
  };

  const handleLogout = async () => {
    closeSidebar();
    await logout();
  };

  if (!isSidebarOpen && slideAnim._value === -SIDEBAR_WIDTH) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={closeSidebar}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#000',
            opacity: overlayOpacity,
          }}
        />
      </TouchableWithoutFeedback>

      {/* Sidebar Content */}
      <Animated.View
        style={{
          width: SIDEBAR_WIDTH,
          height: '100%',
          backgroundColor: '#0a0a0a', // dark background for app-like feel
          transform: [{ translateX: slideAnim }],
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
        }}
        className="border-r border-border shadow-2xl">
        <View className="mb-8 flex-row items-center justify-between px-6">
          <Text className="text-2xl font-bold tracking-tighter text-primary">Scrip</Text>
          <TouchableOpacity onPress={closeSidebar}>
            <XIcon size={24} className="text-muted-foreground" />
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View className="border-y border-border/50 bg-muted/20 px-6 py-4">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Text className="text-xl font-bold text-primary-foreground">
                {user?.username?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold" numberOfLines={1}>
                {user?.username}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView className="mt-4 flex-1">
          <SidebarItem
            icon={UserIcon}
            label="My Profile"
            onPress={() => handleNavigate('/(settings)/profile')}
          />
          <SidebarItem
            icon={SettingsIcon}
            label="Settings"
            onPress={() => handleNavigate('/(settings)/settings')}
          />
        </ScrollView>

        <View className="border-t border-border/50 p-6">
          <TouchableOpacity onPress={handleLogout} className="flex-row items-center gap-3 py-3">
            <LogOutIcon size={20} color="#ef4444" />
            <Text className="text-lg font-bold text-destructive">Logout</Text>
          </TouchableOpacity>
          <Text className="mt-6 text-center text-xs font-medium text-muted-foreground">
            Version 1.0.0
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const SidebarItem = ({ icon: Icon, label, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className="flex-row items-center justify-between px-6 py-4">
    <View className="flex-row items-center gap-4">
      <View className="h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
        <Icon size={18} color="#fff" />
      </View>
      <Text className="text-base font-semibold">{label}</Text>
    </View>
    <ChevronRightIcon size={16} color="#fff" style={{ opacity: 0.5 }} />
  </TouchableOpacity>
);
