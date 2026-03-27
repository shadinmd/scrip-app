import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import {
  WalletIcon,
  PlusIcon,
  ChevronRightIcon,
  AlertCircle,
  CreditCardIcon,
} from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { useRouter } from 'expo-router';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AccountsScreen() {
  const { accounts, error, fetchAccounts } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAccounts();
    setRefreshing(false);
  };

  const totalBalance = accounts.reduce((sum, account) => {
    return sum + parseFloat(account.balance);
  }, 0);

  const defaultAccount = accounts.find((a) => a.isDefault);

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }>
        {error && (
          <View className="px-6 pt-4">
            <Alert variant="destructive" icon={AlertCircle}>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </View>
        )}

        {/* Accounts Summary */}
        <View className="px-6 pt-6">
          <View className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <View className="mb-1 flex-row items-center gap-2">
              <WalletIcon size={14} color="#a3a3a3" />
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Balance
              </Text>
            </View>
            <Text className="text-3xl font-bold tracking-tight text-foreground">
              ₹
              {totalBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>

            {defaultAccount && (
              <View className="mt-4 flex-row items-center gap-2 rounded-xl bg-primary/10 px-3 py-2">
                <View className="h-2 w-2 rounded-full bg-primary" />
                <Text className="text-xs font-bold text-primary">
                  Default: {defaultAccount.name}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Accounts List */}
        <View className="mb-8 mt-10 px-6">
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-2xl font-bold tracking-tight text-foreground">Your Accounts</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              className="h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg"
              onPress={() => router.push('/(settings)/add-account')}>
              <PlusIcon size={20} color="#000" />
            </TouchableOpacity>
          </View>

          <View className="gap-4">
            {accounts.length > 0 ? (
              accounts.map((account) => <AccountItem key={account.id} account={account} />)
            ) : (
              <View className="items-center justify-center rounded-3xl border-2 border-dashed border-muted bg-muted/20 py-12">
                <Text className="px-10 text-center text-lg font-medium text-muted-foreground">
                  You don't have any accounts added yet.
                </Text>
                <Button
                  className="mt-6 rounded-xl"
                  onPress={() => router.push('/(settings)/add-account')}>
                  <Text>Add Your First Account</Text>
                </Button>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const AccountItem = ({ account }: { account: any }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className="rounded-2xl border border-border bg-card p-5"
      onPress={() => {
        router.push({ pathname: '/(settings)/account-details', params: { id: account.id } });
      }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-muted/20">
            <CreditCardIcon size={24} color={account.isDefault ? '#fff' : '#a3a3a3'} />
          </View>
          <View className="ml-4 flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-bold text-foreground">{account.name}</Text>
              {account.isDefault && (
                <View className="rounded-full bg-primary/20 px-2 py-0.5">
                  <Text className="text-[8px] font-bold uppercase text-primary">Default</Text>
                </View>
              )}
            </View>
            <Text className="text-sm font-medium text-muted-foreground">
              Balance: ₹{parseFloat(account.balance).toLocaleString()}
            </Text>
          </View>
        </View>
        <ChevronRightIcon size={20} color="#a3a3a3" style={{ opacity: 0.5 }} />
      </View>
    </TouchableOpacity>
  );
};
