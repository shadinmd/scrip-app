import { Stack } from 'expo-router';
import React from 'react';

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="add-loan" 
        options={{ 
          title: 'Add New Loan',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="loan-details" 
        options={{ 
          title: 'Loan Details',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="add-transaction" 
        options={{ 
          title: 'Add Transaction',
          headerBackTitle: 'Back',
        }} 
      />
    </Stack>
  );
}
