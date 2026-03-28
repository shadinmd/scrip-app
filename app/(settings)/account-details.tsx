import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import Toast from 'react-native-toast-message';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/lib/api';
import { ArrowUpRightIcon, PencilIcon, WalletIcon } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';

export default function AccountDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [account, setAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [accRes, transRes] = await Promise.all([
        api.get(`/accounts/${id}`),
        api.get(`/transactions?accountId=${id}&limit=20`),
      ]);
      setAccount(accRes.data);
      setTransactions(transRes.data.data);
    } catch (error) {
      console.error('Error fetching account details:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not load account details',
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!account) return null;

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 py-6">
        <View className="mb-6 flex-row items-start justify-between">
          <View className="mr-4 flex-1">
            <Text className="mb-1 text-3xl font-bold text-foreground">{account.name}</Text>
            {account.isDefault && (
              <View className="mt-1 self-start rounded-full bg-primary/20 px-3 py-1">
                <Text className="text-[10px] font-bold uppercase text-primary">
                  Default Account
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/(settings)/edit-account', params: { id } })}
            className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <PencilIcon size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View className="mb-10 rounded-[32px] border border-border bg-card p-7 shadow-sm">
          <View className="mb-1 flex-row items-center gap-2">
            <WalletIcon size={14} color="#a3a3a3" />
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current Balance
            </Text>
          </View>
          <Text className="text-4xl font-bold tracking-tight text-foreground">
            ₹
            {parseFloat(account.balance).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
      </View>
      <View className="px-6">
        <Text className="mb-2 text-xl font-bold text-foreground">Recent Transactions</Text>
      </View>
      <View className="flex-1">
        <FlashList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <TransactionItem transaction={item} />}
          ListEmptyComponent={() => (
            <View className="mx-6 items-center justify-center rounded-3xl border-2 border-dashed border-muted bg-muted/10 py-12">
              <Text className="font-medium text-muted-foreground">
                No transactions for this account
              </Text>
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </View>
  );
}

const TransactionItem = ({ transaction }: { transaction: any }) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: '/(settings)/edit-transaction',
          params: { id: transaction.id },
        })
      }
      className="flex-row items-center justify-between border-b border-border/30 px-6 py-4">
      <View className="mr-4 flex-1 flex-row items-center">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-destructive">
          <ArrowUpRightIcon size={18} color="#fff" />
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-base font-bold text-foreground" numberOfLines={1}>
            {transaction.description}
          </Text>
          <Text className="text-xs font-medium text-muted-foreground" numberOfLines={1}>
            {transaction.category?.name || 'Uncategorized'} •{' '}
            {new Date(transaction.date).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Text className="text-base font-bold text-destructive">
        -₹{Math.abs(parseFloat(transaction.amount)).toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
};
