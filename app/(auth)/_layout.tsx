import { Stack, Redirect } from 'expo-router';
import React from 'react';
import { useStore } from '@/lib/store';

export default function AuthLayout() {
  const { isLoggedIn } = useStore();

  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ title: 'Login' }} />
    </Stack>
  );
}
