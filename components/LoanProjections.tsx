import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';

interface ProjectionData {
  timestamp: number;
  paid: number;
  unpaid: number;
  value: number;
  lastDate: string;
  label: string;
  rawMonth: string;
}

interface LoanProjectionsProps {
  projections: ProjectionData[];
}

export const LoanProjections = ({ projections }: LoanProjectionsProps) => {
  const router = useRouter();

  const maxProjectionValue = useMemo(() => {
    return Math.max(...projections.map((p) => p.value), 0);
  }, [projections]);

  const lastUnpaidDate = useMemo(() => {
    const lastUnpaid = [...projections].reverse().find((p) => p.unpaid > 0);
    if (!lastUnpaid) return null;

    return new Date(lastUnpaid.lastDate).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [projections]);

  if (projections.length === 0) return null;

  return (
    <View className="mt-8 px-6">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Projected Payments
        </Text>
        <View className="flex-row gap-2">
          <View className="flex-row items-center gap-1">
            <View className="h-2 w-2 rounded-full bg-success" />
            <Text className="text-[10px] font-bold text-muted-foreground">Paid</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="h-2 w-2 rounded-full bg-destructive" />
            <Text className="text-[10px] font-bold text-muted-foreground">Unpaid</Text>
          </View>
        </View>
      </View>
      <View className="rounded-2xl border border-border bg-card p-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-col">
            <View className="h-32 flex-row items-end">
              {projections.map((d, i) => {
                const totalHeight = maxProjectionValue > 0 ? (d.value / maxProjectionValue) * 100 : 0;
                const paidHeight = d.value > 0 ? (d.paid / d.value) * 100 : 0;
                const unpaidHeight = d.value > 0 ? (d.unpaid / d.value) * 100 : 0;

                return (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push({
                        pathname: '/(settings)/month-installments',
                        params: { month: d.rawMonth },
                      })
                    }
                    className="mx-2 items-center justify-end"
                    style={{ width: 50, height: '100%' }}>
                    <Text className="mb-1 text-[7px] font-extrabold text-foreground">
                      ₹{(d.value / 1000).toFixed(1)}k
                    </Text>
                    <View
                      className="w-full overflow-hidden rounded-t-sm"
                      style={{ height: `${Math.max(totalHeight * 0.85, 5)}%` }}>
                      <View style={{ height: `${unpaidHeight}%` }} className="bg-destructive" />
                      <View style={{ height: `${paidHeight}%` }} className="bg-success" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View className="mt-2 flex-row border-t border-border/50 pt-2">
              {projections.map((d, i) => (
                <View key={i} className="mx-2 items-center" style={{ width: 50 }}>
                  <Text className="text-[8px] font-bold text-muted-foreground" numberOfLines={1}>
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
      {lastUnpaidDate && (
        <View className="mt-4 flex-row items-center justify-center gap-2 rounded-xl bg-primary/5 py-3">
          <Text className="text-xs font-medium text-muted-foreground">Debt-free by</Text>
          <Text className="text-sm font-bold text-primary">{lastUnpaidDate}</Text>
        </View>
      )}
    </View>
  );
};
