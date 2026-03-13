import { Tabs, Redirect, useRouter } from 'expo-router';
import { HomeIcon, MenuIcon, LandmarkIcon, ReceiptTextIcon, PlusIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { NAV_THEME } from '@/lib/theme';
import React from 'react';
import { useAuthStore } from '@/lib/store';
import { useUIStore } from '@/lib/ui-store';
import { TouchableOpacity, View } from 'react-native';

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const { isLoggedIn } = useAuthStore();
  const { openSidebar } = useUIStore();
  const router = useRouter();

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: NAV_THEME[colorScheme ?? 'dark'].colors.primary,
        headerShown: true,
        headerLeft: () => (
          <TouchableOpacity onPress={openSidebar} className="ml-6 mr-2" activeOpacity={0.7}>
            <MenuIcon size={24} color="#fff" />
          </TouchableOpacity>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color }) => <ReceiptTextIcon color={color} size={24} />,
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.push('/(settings)/add-transaction')}
              className="mr-6"
              activeOpacity={0.7}
            >
              <View className="h-9 w-9 items-center justify-center rounded-full bg-primary">
                <PlusIcon size={20} color="#000" />
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: 'Loans',
          tabBarIcon: ({ color }) => <LandmarkIcon color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
