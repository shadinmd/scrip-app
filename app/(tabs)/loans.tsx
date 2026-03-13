import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { LandmarkIcon, PlusIcon, ChevronRightIcon, CalendarIcon } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { useRouter } from 'expo-router';

export default function LoansScreen() {
  const { loans, fetchLoans } = useAuthStore();
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
    return sum + loan.installments
      .filter(inst => inst.isPaid)
      .reduce((s, inst) => s + parseFloat(inst.amount), 0);
  }, 0);

  return (
    <View className="flex-1 bg-background">
      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        {/* Loans Summary */}
        <View className="px-6 pt-6">
          <View className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <View className="flex-row items-center gap-2 mb-1">
              <LandmarkIcon size={14} color="#a3a3a3" />
              <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                Total Debt
              </Text>
            </View>
            <Text className="text-foreground text-3xl font-bold tracking-tight">
              ₹{(totalLoanAmount - totalPaidAmount).toFixed(2)}
            </Text>
            
            <View className="flex-row mt-6 pt-5 border-t border-border gap-10">
              <View>
                <Text className="text-muted-foreground text-[10px] font-extrabold uppercase tracking-widest mb-1">Total Loan</Text>
                <Text className="text-foreground text-lg font-bold">₹{totalLoanAmount.toFixed(0)}</Text>
              </View>
              <View>
                <Text className="text-muted-foreground text-[10px] font-extrabold uppercase tracking-widest mb-1">Total Paid</Text>
                <Text className="text-green-600 dark:text-green-400 text-lg font-bold">₹{totalPaidAmount.toFixed(0)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Loans List */}
        <View className="px-6 mt-10 mb-8">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold tracking-tight text-foreground">Active Loans</Text>
            <TouchableOpacity 
              activeOpacity={0.7} 
              className="h-10 w-10 bg-primary items-center justify-center rounded-full shadow-lg"
              onPress={() => router.push('/(settings)/add-loan')}
            >
              <PlusIcon size={20} color="#000" />
            </TouchableOpacity>
          </View>

          <View className="gap-4">
            {loans.length > 0 ? (
              loans.map((loan) => (
                <LoanItem key={loan.id} loan={loan} />
              ))
            ) : (
              <View className="items-center justify-center py-12 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
                <Text className="text-muted-foreground font-medium text-lg text-center px-10">
                  You don't have any active loans tracked yet.
                </Text>
                <Button 
                  className="mt-6 rounded-xl" 
                  onPress={() => router.push('/(settings)/add-loan')}
                >
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
      className="bg-card p-5 rounded-2xl border border-border"
      onPress={() => router.push({
        pathname: '/(settings)/loan-details',
        params: { id: loan.id }
      })}
    >
      <View className="flex-row justify-between items-start mb-4">
        <View>
          <Text className="text-lg font-bold text-foreground mb-1">{loan.name}</Text>
          <View className="flex-row items-center gap-1.5">
            <CalendarIcon size={12} color="#a3a3a3" />
            <Text className="text-xs text-muted-foreground font-medium">
              {remainingInstallments} installments left
            </Text>
          </View>
        </View>
        <ChevronRightIcon size={20} color="#a3a3a3" style={{ opacity: 0.5 }} />
      </View>

      <View className="flex-row justify-between items-end mb-2">
        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Progress</Text>
        <Text className="text-sm font-bold text-foreground">{progress.toFixed(0)}% Paid</Text>
      </View>
      
      {/* Progress Bar */}
      <View className="h-2 w-full bg-muted rounded-full overflow-hidden mb-4">
        <View 
          className="h-full bg-primary" 
          style={{ width: `${progress}%` }}
        />
      </View>

      <View className="flex-row justify-between">
        <View>
          <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Paid</Text>
          <Text className="text-base font-bold text-green-600 dark:text-green-400">₹{paid.toFixed(0)}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Remaining</Text>
          <Text className="text-base font-bold text-foreground">₹{(total - paid).toFixed(0)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
