import { Redirect } from 'expo-router';
import { HomeIcon, MenuIcon, LandmarkIcon, ReceiptTextIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { NAV_THEME } from '@/lib/theme';
import React from 'react';
import { useStore } from '@/lib/store';
import { useUIStore } from '@/lib/ui-store';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationEventMap,
} from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { TabNavigationState, ParamListBase } from '@react-navigation/native';

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const { isLoggedIn } = useStore();
  const { openSidebar } = useUIStore();
  const insets = useSafeAreaInsets();

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  const theme = NAV_THEME[colorScheme ?? 'dark'];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{ paddingTop: insets.top + 10 }}
        className="flex-row items-center justify-between border-b border-border bg-background px-6 pb-4">
        <TouchableOpacity onPress={openSidebar} activeOpacity={0.7}>
          <MenuIcon size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Scrip</Text>
        <View className="w-6" />
      </View>

      <MaterialTopTabs
        tabBarPosition="bottom"
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.text,

          tabBarIndicatorStyle: {
            backgroundColor: theme.colors.primary,
            top: 0,
            height: 3,
          },
          tabBarStyle: {
            backgroundColor: theme.colors.card,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 5,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: 'bold',
            textTransform: 'none',
          },
        }}>
        <MaterialTopTabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <HomeIcon color={color} size={20} />,
          }}
        />
        <MaterialTopTabs.Screen
          name="transactions"
          options={{
            title: 'Transactions',
            tabBarIcon: ({ color }) => <ReceiptTextIcon color={color} size={20} />,
          }}
        />
        <MaterialTopTabs.Screen
          name="loans"
          options={{
            title: 'Loans',
            tabBarIcon: ({ color }) => <LandmarkIcon color={color} size={20} />,
          }}
        />
      </MaterialTopTabs>
    </View>
  );
}
