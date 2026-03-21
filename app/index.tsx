import { Redirect } from 'expo-router';
import React from 'react';
import { useStore } from '@/lib/store';

export default function Index() {
  const { isLoggedIn } = useStore();

  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
