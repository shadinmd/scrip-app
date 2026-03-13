import { Stack, Redirect } from 'expo-router';
import React from 'react';
import { useAuthStore } from '@/lib/store';

export default function AuthLayout() {
  const { isLoggedIn } = useAuthStore();

  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ title: 'Login' }} />
    </Stack>
  );
}
