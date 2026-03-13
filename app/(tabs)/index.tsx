import { View, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import React, { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/lib/store';
import { WalletIcon, ArrowUpRightIcon, ArrowDownLeftIcon } from 'lucide-react-native';
import { LineChart } from 'react-native-wagmi-charts';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function HomeScreen() {
  const { transactions, fetchTransactions } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTransactions(1, 50);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions(1, 50);
    setRefreshing(false);
  };

  const chartData = useMemo(() => {
    if (transactions.length === 0) {
      return [{ timestamp: Date.now(), value: 0 }];
    }

    // Get the most recent 3 dates that have transactions
    const uniqueDates = Array.from(new Set(transactions.map((t) => t.date)))
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 3)
      .reverse();

    const data = uniqueDates.map((dateString) => {
      const dayTotal = transactions
        .filter((t) => t.date === dateString)
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

      return {
        timestamp: new Date(dateString).getTime(),
        value: dayTotal,
      };
    });

    if (data.length === 0) {
      return [{ timestamp: Date.now(), value: 0 }];
    }

    return data;
  }, [transactions]);

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View className="px-6 pt-6">
        {/* Balance Card */}
        <View className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <View className="mb-1 flex-row items-center gap-2">
            <WalletIcon size={14} className="text-muted-foreground" />
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Balance
            </Text>
          </View>
          <Text className="text-3xl font-bold tracking-tight text-foreground">₹12,450.00</Text>

          <View className="mt-6 flex-row gap-10 border-t border-border pt-5">
            <View>
              <Text className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                Income
              </Text>
              <Text className="text-lg font-bold text-green-600 dark:text-green-400">+₹4,200</Text>
            </View>
            <View>
              <Text className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                Expenses
              </Text>
              <Text className="text-lg font-bold text-destructive">-₹1,850</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Activity Chart */}
      <View className="mt-8 px-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Activity (Last 3 Data Days)
          </Text>
          <Text className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
            Daily Total
          </Text>
        </View>
        <View className="overflow-hidden rounded-2xl border border-border bg-card p-4">
          <LineChart.Provider data={chartData}>
            <LineChart height={150} width={SCREEN_WIDTH - 80}>
              <LineChart.Path color="#525252" width={4}>
                <LineChart.Gradient color="#525252" opacity={0.2} />
              </LineChart.Path>
              <LineChart.CursorCrosshair color="#525252">
                <LineChart.Tooltip 
                  textStyle={{ color: '#fff', fontWeight: 'bold' }} 
                  cursorGlowColor="#525252"
                />
              </LineChart.CursorCrosshair>
            </LineChart>
            
            {/* Simple Y-Axis Labels */}
            <View className="flex-row justify-between mt-2 px-2">
              {chartData.map((d, i) => (
                <View key={i} className="items-center">
                  <Text className="text-[10px] font-bold text-muted-foreground">
                    {new Date(d.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                  <Text className="text-[11px] font-bold text-foreground mt-0.5">
                    ₹{d.value.toFixed(0)}
                  </Text>
                </View>
              ))}
            </View>
          </LineChart.Provider>
        </View>
      </View>

      {/* Recent Transactions List */}
      <View className="mb-8 mt-10 px-6">
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="text-2xl font-bold tracking-tight">Recent Activity</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text className="text-sm font-bold text-primary">See All</Text>
          </TouchableOpacity>
        </View>

        <View className="gap-2">
          {transactions.slice(0, 5).length > 0 ? (
            transactions
              .slice(0, 5)
              .map((item) => <TransactionItem key={item.id} transaction={item} />)
          ) : (
            <View className="items-center justify-center rounded-2xl border-2 border-dashed border-muted bg-muted/20 py-10">
              <Text className="font-medium text-muted-foreground">No transactions yet</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const TransactionItem = ({ transaction }: { transaction: any }) => {
  const isIncome = parseFloat(transaction.amount) > 0;

  return (
    <TouchableOpacity activeOpacity={0.7} className="flex-row items-center justify-between py-3">
      <View className="flex-row items-center flex-1 mr-4">
        <View
          className="h-12 w-12 items-center justify-center rounded-2xl bg-destructive">
          <ArrowUpRightIcon size={20} color="#fff" />
        </View>
        <View className="flex-1 ml-4">
          <Text className="text-base font-bold text-foreground" numberOfLines={1}>
            {transaction.description}
          </Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {transaction.category?.name || 'Uncategorized'} •{' '}
            {new Date(transaction.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
      </View>
      <Text className="text-base font-bold text-destructive">
        -₹{Math.abs(parseFloat(transaction.amount)).toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
};
