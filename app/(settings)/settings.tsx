import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import React from 'react';

export default function SettingsScreen() {
  return (
    <View className="flex-1 items-center justify-center p-6 bg-background">
      <Text className="text-2xl font-bold">Settings</Text>
      <Text className="text-muted-foreground mt-2">More settings coming soon...</Text>
    </View>
  );
}
