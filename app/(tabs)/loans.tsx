import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import {
  LandmarkIcon,
  PlusIcon,
  ChevronRightIcon,
  CalendarIcon,
  AlertCircle,
} from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { useRouter } from 'expo-router';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoansScreen() {
  const { loans, error, fetchLoans } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchLoans();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLoans();
    setRefreshing(false);
  };

  const totalLoanAmount = loans.reduce((sum, loan) => {
    return sum + loan.installments.reduce((s, inst) => s + parseFloat(inst.amount), 0);
  }, 0);

  const totalPaidAmount = loans.reduce((sum, loan) => {
    return (
      sum +
      loan.installments
        .filter((inst) => inst.isPaid)
        .reduce((s, inst) => s + parseFloat(inst.amount), 0)
    );
  }, 0);

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
        {/* Loans Summary */}
        <View className="px-6 pt-6">
          <View className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <View className="mb-1 flex-row items-center gap-2">
              <LandmarkIcon size={14} color="#a3a3a3" />
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Debt
              </Text>
            </View>
            <Text className="text-3xl font-bold tracking-tight text-foreground">
              ₹{(totalLoanAmount - totalPaidAmount).toFixed(2)}
            </Text>

            <View className="mt-6 flex-row gap-10 border-t border-border pt-5">
              <View>
                <Text className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Total Loan
                </Text>
                <Text className="text-lg font-bold text-foreground">
                  ₹{totalLoanAmount.toFixed(0)}
                </Text>
              </View>
              <View>
                <Text className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Total Paid
                </Text>
                <Text className="text-lg font-bold text-green-600 dark:text-green-400">
                  ₹{totalPaidAmount.toFixed(0)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Loans List */}
        <View className="mb-8 mt-10 px-6">
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-2xl font-bold tracking-tight text-foreground">Active Loans</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              className="h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg"
              onPress={() => router.push('/(settings)/add-loan')}>
              <PlusIcon size={20} color="#000" />
            </TouchableOpacity>
          </View>

          <View className="gap-4">
            {loans.length > 0 ? (
              loans.map((loan) => <LoanItem key={loan.id} loan={loan} />)
            ) : (
              <View className="items-center justify-center rounded-3xl border-2 border-dashed border-muted bg-muted/20 py-12">
                <Text className="px-10 text-center text-lg font-medium text-muted-foreground">
                  You don't have any active loans tracked yet.
                </Text>
                <Button
                  className="mt-6 rounded-xl"
                  onPress={() => router.push('/(settings)/add-loan')}>
                  <Text>Add Your First Loan</Text>
                </Button>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const LoanItem = ({ loan }: { loan: any }) => {
  const router = useRouter();

  const total = loan.installments.reduce((s: number, inst: any) => s + parseFloat(inst.amount), 0);
  const paid = loan.installments
    .filter((inst: any) => inst.isPaid)
    .reduce((s: number, inst: any) => s + parseFloat(inst.amount), 0);

  const progress = total > 0 ? (paid / total) * 100 : 0;
  const remainingInstallments = loan.installments.filter((inst: any) => !inst.isPaid).length;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className="rounded-2xl border border-border bg-card p-5"
      onPress={() =>
        router.push({
          pathname: '/(settings)/loan-details',
          params: { id: loan.id },
        })
      }>
      <View className="mb-4 flex-row items-start justify-between">
        <View>
          <Text className="mb-1 text-lg font-bold text-foreground">{loan.name}</Text>
          <View className="flex-row items-center gap-1.5">
            <CalendarIcon size={12} color="#a3a3a3" />
            <Text className="text-xs font-medium text-muted-foreground">
              {remainingInstallments} installments left
            </Text>
          </View>
        </View>
        <ChevronRightIcon size={20} color="#a3a3a3" style={{ opacity: 0.5 }} />
      </View>

      <View className="mb-2 flex-row items-end justify-between">
        <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Progress
        </Text>
        <Text className="text-sm font-bold text-foreground">{progress.toFixed(0)}% Paid</Text>
      </View>

      {/* Progress Bar */}
      <View className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <View className="h-full bg-primary" style={{ width: `${progress}%` }} />
      </View>

      <View className="flex-row justify-between">
        <View>
          <Text className="mb-0.5 text-[10px] font-bold uppercase text-muted-foreground">Paid</Text>
          <Text className="text-base font-bold text-green-600 dark:text-green-400">
            ₹{paid.toFixed(0)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="mb-0.5 text-[10px] font-bold uppercase text-muted-foreground">
            Remaining
          </Text>
          <Text className="text-base font-bold text-foreground">₹{(total - paid).toFixed(0)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
