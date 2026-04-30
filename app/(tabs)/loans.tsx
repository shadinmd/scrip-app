import {
  View,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Text } from '@/components/ui/text';
import React, { useEffect, useState, useMemo } from 'react';
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
  const { loans, error, fetchLoans, loansPagination, loanProjections, fetchLoanProjections } =
    useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchLoans({ page: 1, limit: 10, showCompleted });
    fetchLoanProjections();
  }, [showCompleted]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchLoans({ page: 1, limit: 10, showCompleted }, false),
      fetchLoanProjections(),
    ]);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (loansPagination.hasNextPage && !loadingMore) {
      setLoadingMore(true);
      await fetchLoans({ page: loansPagination.page + 1, limit: 10, showCompleted }, true);
      setLoadingMore(false);
    }
  };

  const totalLoanAmount = useMemo(() => {
    return loans.reduce((sum, loan) => {
      return sum + loan.installments.reduce((s, inst) => s + parseFloat(inst.amount), 0);
    }, 0);
  }, [loans]);

  const totalPaidAmount = useMemo(() => {
    return loans.reduce((sum, loan) => {
      return (
        sum +
        loan.installments
          .filter((inst: any) => inst.isPaid)
          .reduce((s: number, inst: any) => s + parseFloat(inst.amount), 0)
      );
    }, 0);
  }, [loans]);

  const maxProjectionValue = useMemo(() => {
    return Math.max(...loanProjections.map((p) => p.value), 0);
  }, [loanProjections]);

  const renderHeader = () => (
    <View>
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

      {/* Projected Payments Bar Chart */}
      {loanProjections.length > 0 && (
        <View className="mt-8 px-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Projected Payments
            </Text>
            <Text className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
              Full Forecast
            </Text>
          </View>
          <View className="rounded-2xl border border-border bg-card p-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-col">
                <View className="h-32 flex-row items-end">
                  {loanProjections.map((d, i) => {
                    const height =
                      maxProjectionValue > 0 ? (d.value / maxProjectionValue) * 100 : 0;
                    return (
                      <View
                        key={i}
                        className="mx-2 items-center justify-end"
                        style={{ width: 50, height: '100%' }}>
                        <Text className="mb-1 text-[7px] font-extrabold text-foreground">
                          ₹{(d.value / 1000).toFixed(1)}k
                        </Text>
                        <View
                          className="w-full rounded-t-sm bg-destructive"
                          style={{ height: `${Math.max(height * 0.85, 5)}%` }}
                        />
                      </View>
                    );
                  })}
                </View>
                <View className="mt-2 flex-row border-t border-border/50 pt-2">
                  {loanProjections.map((d, i) => (
                    <View key={i} className="mx-2 items-center" style={{ width: 50 }}>
                      <Text
                        className="text-[8px] font-bold text-muted-foreground"
                        numberOfLines={1}>
                        {d.label.split(' ')[0]}
                      </Text>
                      <Text className="text-[7px] font-medium text-muted-foreground/60">
                        {d.label.split(' ')[1]}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Loans List Header */}
      <View className="mt-10 px-6">
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold tracking-tight text-foreground">Active Loans</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowCompleted(!showCompleted)}
              className={`mt-1.5 flex-row items-center gap-1.5 self-start rounded-full border px-3 py-1 ${
                showCompleted ? 'border-primary/50 bg-primary/10' : 'border-border bg-muted/20'
              }`}>
              <View
                className={`h-2 w-2 rounded-full ${
                  showCompleted ? 'bg-primary' : 'bg-muted-foreground/50'
                }`}
              />
              <Text
                className={`text-[10px] font-bold uppercase tracking-widest ${
                  showCompleted ? 'text-primary' : 'text-muted-foreground'
                }`}>
                {showCompleted ? 'All Loans' : 'Active Only'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            className="h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg"
            onPress={() => router.push('/(settings)/add-loan')}>
            <PlusIcon size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return <View className="h-12" />;
    return (
      <View className="py-6">
        <ActivityIndicator color="#fff" />
      </View>
    );
  };

  const renderEmpty = () => (
    <View className="px-6 py-12">
      <View className="items-center justify-center rounded-3xl border-2 border-dashed border-muted bg-muted/20 py-12">
        <Text className="px-10 text-center text-lg font-medium text-muted-foreground">
          {showCompleted
            ? "You don't have any loans tracked yet."
            : "No active loans. Switch to 'All Loans' to see your history."}
        </Text>
        <Button className="mt-6 rounded-xl" onPress={() => router.push('/(settings)/add-loan')}>
          <Text>Add Your First Loan</Text>
        </Button>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={loans}
        renderItem={({ item }) => (
          <View className="px-6">
            <LoanItem loan={item} />
          </View>
        )}
        ItemSeparatorComponent={() => <View className="h-4" />}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ paddingBottom: 20 }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      />
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
