import React, { useState, useMemo, useCallback } from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import api from '@/lib/api';
import { AlertCircle, CalendarIcon, ChevronRightIcon } from 'lucide-react-native';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDisplayDate } from '@/lib/date-utils';

export default function MonthInstallmentsScreen() {
  const { month } = useLocalSearchParams();
  const [installments, setInstallments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchInstallments = async () => {
    try {
      setError(null);
      const response = await api.get(`/loans/installments?month=${month}`);
      setInstallments(response.data.data);
    } catch (err: any) {
      console.error('Error fetching month installments:', err);
      setError(err.response?.data?.message || 'Failed to fetch installments');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (month) {
        fetchInstallments();
      }
    }, [month])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchInstallments();
  };

  const { paidAmount, unpaidAmount } = useMemo(() => {
    return installments.reduce(
      (acc, inst) => {
        const amount = parseFloat(inst.amount);
        if (inst.isPaid) {
          acc.paidAmount += amount;
        } else {
          acc.unpaidAmount += amount;
        }
        return acc;
      },
      { paidAmount: 0, unpaidAmount: 0 }
    );
  }, [installments]);

  const formattedMonth = month
    ? new Date(
        parseInt((month as string).split('-')[0]),
        parseInt((month as string).split('-')[1]) - 1
      ).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '';

  if (isLoading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-end justify-between border-b border-border bg-card px-6 py-6">
        <View>
          <Text className="mb-1 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Due In
          </Text>
          <Text className="text-3xl font-bold text-foreground">{formattedMonth}</Text>
        </View>
        <View className="items-end">
          <View className="flex-row gap-4">
            {paidAmount > 0 && (
              <View className="items-end">
                <Text className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Paid
                </Text>
                <Text className="text-xl font-bold text-success">
                  ₹{paidAmount.toLocaleString()}
                </Text>
              </View>
            )}
            {unpaidAmount > 0 && (
              <View className="items-end">
                <Text className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Unpaid
                </Text>
                <Text className="text-xl font-bold text-destructive">
                  ₹{unpaidAmount.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {error && (
        <View className="px-6 pt-4">
          <Alert variant="destructive" icon={AlertCircle}>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </View>
      )}

      <FlatList
        data={installments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            className="mx-6 my-2 rounded-2xl border border-border bg-card p-5"
            onPress={() =>
              router.push({ pathname: '/(settings)/loan-details', params: { id: item.loanId } })
            }>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-lg font-bold text-foreground">{item.loanName}</Text>
                <View className="mt-1 flex-row items-center gap-1.5">
                  <CalendarIcon size={12} color="#a3a3a3" />
                  <Text className="text-xs font-medium text-muted-foreground">
                    Due on {formatDisplayDate(item.date)}
                  </Text>
                </View>
              </View>
              <View className="mr-4 items-end">
                <Text
                  className={`text-lg font-bold ${
                    item.isPaid ? 'text-success' : 'text-destructive'
                  }`}>
                  ₹{parseFloat(item.amount).toLocaleString()}
                </Text>
              </View>
              <ChevronRightIcon size={20} color="#a3a3a3" style={{ opacity: 0.5 }} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center px-10 py-20">
            <Text className="text-center text-lg text-muted-foreground">
              No installments for this month.
            </Text>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
        contentContainerStyle={{ paddingVertical: 10 }}
      />
    </View>
  );
}
