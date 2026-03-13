import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { CheckCircle2Icon, CircleIcon, Trash2Icon, CalendarIcon } from 'lucide-react-native';

export default function LoanDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [loan, setLoan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { fetchLoans } = useAuthStore();
  const router = useRouter();

  const fetchLoanDetails = async () => {
    try {
      const response = await api.get(`/loans/${id}`);
      setLoan(response.data);
    } catch (error) {
      console.error('Error fetching loan details:', error);
      Alert.alert('Error', 'Could not load loan details');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLoanDetails();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLoanDetails();
  };

  const handleTogglePaid = async (installmentId: number) => {
    try {
      await api.patch(`/loans/installments/${installmentId}/toggle-paid`);
      setLoan((prev: any) => ({
        ...prev,
        installments: prev.installments.map((inst: any) =>
          inst.id === installmentId ? { ...inst, isPaid: !inst.isPaid } : inst
        ),
      }));
      fetchLoans();
    } catch (error) {
      console.error('Error toggling paid state:', error);
      Alert.alert('Error', 'Could not update installment');
    }
  };

  const handleDeleteLoan = async () => {
    Alert.alert(
      'Delete Loan',
      'Are you sure you want to delete this loan and all its installments?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/loans/${id}`);
              await fetchLoans();
              router.back();
            } catch (error) {
              console.error('Error deleting loan:', error);
              Alert.alert('Error', 'Could not delete loan');
            }
          },
        },
      ]
    );
  };

  // Sort and number installments
  const processedInstallments = useMemo(() => {
    if (!loan?.installments) return [];

    // 1. Sort chronologically by date first to determine the true installment number
    const chronological = [...loan.installments].sort((a, b) => a.date.localeCompare(b.date));

    // 2. Map to include the original index (#1, #2, etc)
    const numbered = chronological.map((inst, index) => ({
      ...inst,
      displayIndex: index + 1,
    }));

    // 3. Sort for display: Unpaid first, then Paid
    return numbered.sort((a, b) => {
      if (a.isPaid === b.isPaid) {
        // If both same state, keep chronological
        return a.date.localeCompare(b.date);
      }
      return a.isPaid ? 1 : -1; // Unpaid (false) comes first (-1)
    });
  }, [loan?.installments]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!loan) return null;

  const totalAmount = loan.installments.reduce(
    (s: number, inst: any) => s + parseFloat(inst.amount),
    0
  );
  const paidAmount = loan.installments
    .filter((inst: any) => inst.isPaid)
    .reduce((s: number, inst: any) => s + parseFloat(inst.amount), 0);
  const progress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }>
        <View className="py-8">
          <View className="mb-6 flex-row items-start justify-between">
            <View className="mr-4 flex-1">
              <Text className="mb-1 text-3xl font-bold text-foreground">{loan.name}</Text>
              <Text className="text-muted-foreground">
                Started on {new Date(loan.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleDeleteLoan}
              className="h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
              <Trash2Icon size={22} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {/* Progress Card */}
          <View className="mb-10 rounded-[32px] border border-border bg-card p-6 shadow-sm">
            <View className="mb-4 flex-row items-end justify-between">
              <View>
                <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Remaining Balance
                </Text>
                <Text className="text-3xl font-bold text-foreground">
                  ₹{(totalAmount - paidAmount).toFixed(2)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-sm font-bold text-primary">{progress.toFixed(0)}%</Text>
              </View>
            </View>

            <View className="mb-6 h-3 w-full overflow-hidden rounded-full bg-muted">
              <View className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </View>

            <View className="flex-row justify-between">
              <View>
                <Text className="mb-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                  Total Paid
                </Text>
                <Text className="text-lg font-bold text-green-600 dark:text-green-400">
                  ₹{paidAmount.toFixed(0)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="mb-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                  Total Value
                </Text>
                <Text className="text-lg font-bold text-foreground">₹{totalAmount.toFixed(0)}</Text>
              </View>
            </View>
          </View>

          {/* Installments List */}
          <Text className="mb-6 text-xl font-bold text-foreground">Payment Schedule</Text>
          <View className="mb-12 gap-3">
            {processedInstallments.map((inst: any) => (
              <TouchableOpacity
                key={inst.id}
                activeOpacity={0.7}
                onPress={() => handleTogglePaid(inst.id)}
                className={`flex-row items-center justify-between rounded-2xl border p-5 ${
                  inst.isPaid ? 'border-transparent bg-muted/10' : 'border-border bg-card'
                }`}>
                <View className="flex-row items-center gap-4">
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-full ${
                      inst.isPaid ? 'bg-green-600' : 'bg-muted'
                    }`}>
                    {inst.isPaid ? (
                      <CheckCircle2Icon size={20} color="#000" />
                    ) : (
                      <CircleIcon size={20} color="#a3a3a3" />
                    )}
                  </View>
                  <View>
                    <Text
                      className={`text-base font-bold ${inst.isPaid ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      Installment #{inst.displayIndex}
                    </Text>
                    <View className="mt-0.5 flex-row items-center gap-1.5">
                      <CalendarIcon size={12} color="#a3a3a3" />
                      <Text className="text-xs text-muted-foreground">
                        {new Date(inst.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text
                  className={`text-lg font-bold ${inst.isPaid ? 'text-muted-foreground' : 'text-foreground'}`}>
                  ₹{parseFloat(inst.amount).toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
