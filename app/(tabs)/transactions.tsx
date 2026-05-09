import {
  View,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Text } from '@/components/ui/text';
import React, {  useState, useCallback, useMemo } from 'react';
import {
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  CalendarIcon,
  XIcon,
  PlusIcon,
  AlertCircle,
} from 'lucide-react-native';
import { MonthPicker } from '@/components/ui/month-picker';
import { getCurrentMonthStr } from '@/lib/date-utils';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { useRouter, useFocusEffect } from 'expo-router';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import api from '@/lib/api';

interface TransactionHeader {
  type: 'header';
  date: string;
}

interface TransactionItemData {
  type: 'item';
  id: number;
  amount: string;
  transactionType: 'debit' | 'credit';
  description: string;
  date: string;
  category?: { name: string } | null;
}

type FlattenedItem = TransactionHeader | TransactionItemData;

export default function TransactionsScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactionPagination, setTransactionPagination] = useState<any>({
    page: 1,
    totalPages: 1,
    hasNextPage: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndMonthPicker] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchTransactions = async (params = {}, append = false) => {
    try {
      setError(null);
      const { page = 1, limit = 20, start_date, end_date, categoryIds } = params as any;
      let url = `/transactions?page=${page}&limit=${limit}`;
      if (start_date) url += `&start_date=${start_date}`;
      if (end_date) url += `&end_date=${end_date}`;
      if (categoryIds && categoryIds.length > 0) {
        url += `&categoryIds=${categoryIds.join(',')}`;
      }

      const response = await api.get(url);
      const { data, metadata } = response.data;

      setTransactions((prev) => (append ? [...prev, ...data] : data));
      setTransactionPagination({
        page: metadata.page,
        totalPages: metadata.totalPages,
        hasNextPage: metadata.hasNextPage,
      });
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.response?.data?.message || 'Failed to fetch transactions');
    }
  };

  const getFilterParams = useCallback(
    (page = 1) => {
      const params: any = { page, limit: 20 };
      if (selectedCategoryIds.length > 0) params.categoryIds = selectedCategoryIds;
      if (startDate) params.start_date = `${startDate}-01`;
      if (endDate) params.end_date = `${endDate}-31`;
      return params;
    },
    [selectedCategoryIds, startDate, endDate]
  );

  useFocusEffect(
    useCallback(() => {
      const loadInitial = async () => {
        if (transactions.length === 0) setIsLoading(true);
        await Promise.all([fetchCategories(), fetchTransactions(getFilterParams(1))]);
        setIsLoading(false);
      };
      loadInitial();
    }, [selectedCategoryIds, startDate, endDate])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions(getFilterParams(1));
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (!transactionPagination?.hasNextPage || loadingMore) return;

    setLoadingMore(true);
    await fetchTransactions(getFilterParams((transactionPagination?.page || 1) + 1), true);
    setLoadingMore(false);
  };

  const clearFilters = () => {
    setSelectedCategoryIds([]);
    setStartDate('');
    setEndDate('');
  };

  const toggleCategory = (id: number | null) => {
    if (id === null) {
      setSelectedCategoryIds([]);
    } else {
      setSelectedCategoryIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    }
  };

  const formatMonthDisplay = (value: string) => {
    if (!value) return 'Any';
    try {
      const [year, month] = value.split('-');
      const date = new Date(parseInt(year!), parseInt(month!) - 1);
      return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    } catch (e) {
      return 'Any';
    }
  };

  // Flatten data for FlashList with headers
  const flattenedData = useMemo<FlattenedItem[]>(() => {
    if (!transactions || transactions.length === 0) return [];

    const grouped = transactions.reduce((acc: any, transaction) => {
      const date = transaction.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(transaction);
      return acc;
    }, {});

    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    const result: FlattenedItem[] = [];
    sortedDates.forEach((date) => {
      result.push({ type: 'header', date });
      grouped[date].forEach((t: any) => {
        result.push({ type: 'item', ...t, transactionType: t.type });
      });
    });

    return result;
  }, [transactions]);

  const renderHeader = () => (
    <View className="border-b border-border bg-background">
      {error && (
        <View className="px-6 pt-4">
          <Alert variant="destructive" icon={AlertCircle}>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </View>
      )}
      <View className="pb-4 pt-4">
        <View className="mb-4 flex-row items-center justify-between px-6">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-1"
            contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
            <TouchableOpacity
              onPress={() => setShowStartPicker(true)}
              className={`flex-row items-center gap-2 rounded-full border px-4 py-2 ${startDate ? 'border-primary bg-primary' : 'border-border bg-muted/20'}`}>
              <CalendarIcon size={14} color={startDate ? '#000' : '#a3a3a3'} />
              <Text
                className={`text-xs font-bold ${startDate ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                From: {formatMonthDisplay(startDate)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowEndMonthPicker(true)}
              className={`flex-row items-center gap-2 rounded-full border px-4 py-2 ${endDate ? 'border-primary bg-primary' : 'border-border bg-muted/20'}`}>
              <CalendarIcon size={14} color={endDate ? '#000' : '#a3a3a3'} />
              <Text
                className={`text-xs font-bold ${endDate ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                To: {formatMonthDisplay(endDate)}
              </Text>
            </TouchableOpacity>

            {(startDate || endDate || selectedCategoryIds.length > 0) && (
              <TouchableOpacity
                onPress={clearFilters}
                className="flex-row items-center gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-4 py-2">
                <XIcon size={14} color="#ef4444" />
                <Text className="text-xs font-bold text-destructive">Clear</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <TouchableOpacity
            onPress={() => router.push('/(settings)/add-transaction')}
            className="ml-4 h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
            <PlusIcon size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-6"
          contentContainerStyle={{ gap: 8, paddingRight: 40 }}>
          <TouchableOpacity
            onPress={() => toggleCategory(null)}
            className={`rounded-xl border px-5 py-2 ${selectedCategoryIds.length === 0 ? 'border-foreground bg-foreground' : 'border-border bg-muted/20'}`}>
            <Text
              className={`text-xs font-bold ${selectedCategoryIds.length === 0 ? 'text-background' : 'text-muted-foreground'}`}>
              All
            </Text>
          </TouchableOpacity>

          {(categories || []).map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => toggleCategory(cat.id)}
              className={`rounded-xl border px-5 py-2 ${selectedCategoryIds.includes(cat.id) ? 'border-foreground bg-foreground' : 'border-border bg-muted/20'}`}>
              <Text
                className={`text-xs font-bold ${selectedCategoryIds.includes(cat.id) ? 'text-background' : 'text-muted-foreground'}`}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderListItem = ({ item }: ListRenderItemInfo<FlattenedItem>) => {
    if (item.type === 'header') {
      return (
        <View className="border-y border-border/50 bg-muted/30 px-6 py-2">
          <Text className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            {new Date(item.date).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
      );
    }
    return <TransactionItem transaction={item} />;
  };

  if (isLoading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlashList<FlattenedItem>
        data={flattenedData}
        keyExtractor={(item) =>
          item.type === 'header' ? `header-${item.date}` : item.id.toString()
        }
        renderItem={renderListItem}
        getItemType={(item) => item.type}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={() =>
          loadingMore ? (
            <View className="items-center py-6">
              <ActivityIndicator color="#fff" />
            </View>
          ) : (
            <View className="h-10" />
          )
        }
        ListEmptyComponent={() => (
          <View className="mx-6 mt-10 items-center justify-center rounded-[32px] border-2 border-dashed border-muted bg-muted/10 px-6 py-20">
            <Text className="text-lg font-medium text-muted-foreground">No transactions found</Text>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
      />

      <MonthPicker
        visible={showStartPicker}
        value={startDate || getCurrentMonthStr()}
        onChange={setStartDate}
        onClose={() => setShowStartPicker(false)}
      />
      <MonthPicker
        visible={showEndPicker}
        value={endDate || startDate || getCurrentMonthStr()}
        onChange={setEndDate}
        minDate={startDate}
        onClose={() => setShowEndMonthPicker(false)}
      />
    </View>
  );
}

const TransactionItem = React.memo(({ transaction }: { transaction: TransactionItemData }) => {
  const router = useRouter();
  const isCredit = transaction.transactionType === 'credit';

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
        <View
          className={`h-11 w-11 items-center justify-center rounded-2xl ${isCredit ? 'bg-success' : 'bg-destructive'}`}>
          {isCredit ? (
            <ArrowDownLeftIcon size={18} color="#fff" />
          ) : (
            <ArrowUpRightIcon size={18} color="#fff" />
          )}
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-base font-bold text-foreground" numberOfLines={1}>
            {transaction.description}
          </Text>
          <Text className="text-xs font-medium text-muted-foreground" numberOfLines={1}>
            {transaction.category?.name || 'Uncategorized'}
          </Text>
        </View>
      </View>
      <Text className={`text-base font-bold ${isCredit ? 'text-success' : 'text-destructive'}`}>
        {isCredit ? '+' : '-'}₹{Math.abs(parseFloat(transaction.amount)).toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
});
