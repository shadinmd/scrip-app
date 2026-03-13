import { Redirect } from 'expo-router';
import React from 'react';
import { useAuthStore } from '@/lib/store';

export default function Index() {
  const { isLoggedIn } = useAuthStore();

  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
