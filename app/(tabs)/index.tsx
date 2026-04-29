import { View, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import React, { useState, useMemo, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { ArrowUpRightIcon, ArrowDownLeftIcon, AlertCircle } from 'lucide-react-native';
import { LineChart } from 'react-native-wagmi-charts';
import { formatInTimeZone } from 'date-fns-tz';
import { startOfMonth, addMonths, endOfMonth, format } from 'date-fns';
import { useRouter, useFocusEffect } from 'expo-router';
import { TIMEZONE } from '@/lib/date-utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function HomeScreen() {
  const { summary, recentTransactions, loans, error, fetchSummary, fetchLoans } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      Promise.all([fetchSummary(), fetchLoans()]);
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSummary(), fetchLoans()]);
    setRefreshing(false);
  };

  const currentMonthSummary = useMemo(() => {
    if (!summary) return { expenses: 0, income: 0, count: 0, dailyAvg: 0 };
    const today = new Date();

    return {
      expenses: summary.currentMonth.expenses,
      income: summary.currentMonth.income,
      count: summary.currentMonth.count,
      dailyAvg: summary.currentMonth.expenses / Math.max(today.getDate(), 1),
    };
  }, [summary]);

  const nextMonthInstallments = useMemo(() => {
    const nextMonth = addMonths(new Date(), 1);
    const start = format(startOfMonth(nextMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(nextMonth), 'yyyy-MM-dd');

    let total = 0;
    let count = 0;

    loans.forEach((loan) => {
      loan.installments.forEach((inst) => {
        if (inst.date >= start && inst.date <= end) {
          total += parseFloat(inst.amount);
          count++;
        }
      });
    });

    return { total, count };
  }, [loans]);

  const chartData = useMemo(() => {
    if (!summary) return [];

    return summary.dailyActivity.map((day) => {
      const date = new Date(day.date);
      return {
        timestamp: date.getTime(),
        value: day.total,
        label: formatInTimeZone(date, TIMEZONE, 'EEE'),
      };
    });
  }, [summary]);

  return (
    <ScrollView
      className="flex-1 bg-background"
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
      <View className="px-6 pt-6">
        <View className="rounded-[32px] border border-border bg-card p-7 shadow-sm">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <View className="mb-1 flex-row items-center gap-2">
                <View className="h-2 w-2 rounded-full bg-destructive" />
                <Text className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Expenses
                </Text>
              </View>
              <Text className="text-2xl font-bold tracking-tight text-foreground">
                ₹
                {currentMonthSummary.expenses.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
            <View className="h-10 border-l border-border/50" />
            <View className="items-end">
              <View className="mb-1 flex-row items-center gap-2">
                <View className="h-2 w-2 rounded-full bg-success" />
                <Text className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Income
                </Text>
              </View>
              <Text className="text-2xl font-bold tracking-tight text-foreground">
                ₹
                {currentMonthSummary.income.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row items-center justify-between border-t border-border/50 pt-5">
            <View>
              <Text className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                Next Month's Dues
              </Text>
              <Text className="text-lg font-bold text-primary">
                ₹{nextMonthInstallments.total.toLocaleString()}
              </Text>
            </View>
            <View className="h-8 border-l border-border/50" />
            <View className="items-end">
              <Text className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                Daily Avg
              </Text>
              <Text className="text-lg font-bold text-destructive">
                ₹
                {currentMonthSummary.dailyAvg.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="mt-8 px-6">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Weekly Activity
          </Text>
          <Text className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
            Last 7 Days
          </Text>
        </View>
        <View className="overflow-hidden rounded-2xl border border-border bg-card p-4">
          {chartData.length > 0 && (
            <LineChart.Provider data={chartData}>
              <LineChart height={150} width={SCREEN_WIDTH - 80}>
                <LineChart.Path color="#525252" width={4}>
                  <LineChart.Gradient color="#525252" opacity={0.2} />
                </LineChart.Path>
                <LineChart.CursorCrosshair color="#525252">
                  <LineChart.Tooltip textStyle={{ color: '#fff', fontWeight: 'bold' }} />
                </LineChart.CursorCrosshair>
              </LineChart>

              <View className="mt-4 flex-row justify-between">
                {chartData.map((d, i) => (
                  <View key={i} className="items-center">
                    <Text className="text-[10px] font-bold text-muted-foreground">{d.label}</Text>
                    <Text className="mt-0.5 text-[9px] font-bold text-foreground/60">
                      {d.value > 0 ? `₹${(d.value / 1000).toFixed(1)}k` : '0'}
                    </Text>
                  </View>
                ))}
              </View>
            </LineChart.Provider>
          )}
        </View>
      </View>

      <View className="mb-8 mt-10 px-6">
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="text-2xl font-bold tracking-tight">Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/transactions')} activeOpacity={0.7}>
            <Text className="text-sm font-bold text-primary">See All</Text>
          </TouchableOpacity>
        </View>

        <View className="gap-2">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((item) => <TransactionItem key={item.id} transaction={item} />)
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
  const isCredit = transaction.type === 'credit';

  return (
    <TouchableOpacity activeOpacity={0.7} className="flex-row items-center justify-between py-3">
      <View className="mr-4 flex-1 flex-row items-center">
        <View
          className={`h-12 w-12 items-center justify-center rounded-2xl ${isCredit ? 'bg-success' : 'bg-destructive'}`}>
          {isCredit ? (
            <ArrowDownLeftIcon size={20} color="#fff" />
          ) : (
            <ArrowUpRightIcon size={20} color="#fff" />
          )}
        </View>
        <View className="ml-4 flex-1">
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
      <Text className={`text-base font-bold ${isCredit ? 'text-success' : 'text-destructive'}`}>
        {isCredit ? '+' : '-'}₹{Math.abs(parseFloat(transaction.amount)).toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
};
