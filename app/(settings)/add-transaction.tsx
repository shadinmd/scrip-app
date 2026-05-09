import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { useRouter } from 'expo-router';
import { getTodayStr, formatDisplayDate } from '@/lib/date-utils';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarIcon } from 'lucide-react-native';

const transactionSchema = z.object({
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Must be a positive number',
  }),
  type: z.enum(['debit', 'credit']),
  description: z.string().min(1, 'Description is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  categoryId: z.number().nullable().optional(),
  accountId: z.number({ error: 'Please select an account' }),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const AddTransactionScreen = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const router = useRouter();

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data.data);
    } catch (err: any) {
      console.error('Error fetching accounts:', err);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchCategories(), fetchAccounts()]);
      setIsLoading(false);
    };
    loadInitialData();
  }, []);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: '',
      type: 'debit',
      description: '',
      date: getTodayStr(),
      categoryId: null,
      accountId: 0,
    },
  });

  useEffect(() => {
    if (accounts.length > 0 && !watch('accountId')) {
      const defaultAcc = accounts.find((a) => a.isDefault);
      if (defaultAcc) setValue('accountId', defaultAcc.id);
      else setValue('accountId', accounts[0].id);
    }
  }, [accounts]);

  const currentDateValue = watch('date');
  const transactionType = watch('type');

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setValue('date', `${year}-${month}-${day}`);
    }
  };

  const onSubmit = async (data: TransactionFormValues) => {
    setIsSubmitting(true);
    try {
      const formattedData = {
        ...data,
        amount: parseFloat(data.amount),
      };

      await api.post('/transactions', formattedData);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Transaction added successfully',
      });
      router.back();
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      className="bg-background">
      <ScrollView className="flex-1 px-6">
        <View className="py-8">
          <Text className="mb-2 text-3xl font-bold text-foreground">Add Transaction</Text>
          <Text className="mb-8 text-muted-foreground">
            Record your income or expense to keep track of your budget.
          </Text>

          <View className="gap-6">
            <View className="gap-2">
              <Label className="text-sm font-bold">Transaction Type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row gap-4">
                    <TouchableOpacity
                      onPress={() => onChange('debit')}
                      className={`flex-1 items-center rounded-2xl border-2 py-4 ${
                        value === 'debit'
                          ? 'border-destructive bg-destructive/10'
                          : 'border-border bg-muted/20'
                      }`}>
                      <Text
                        className={`font-bold ${
                          value === 'debit' ? 'text-destructive' : 'text-muted-foreground'
                        }`}>
                        Expense
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onChange('credit')}
                      className={`flex-1 items-center rounded-2xl border-2 py-4 ${
                        value === 'credit'
                          ? 'border-success bg-success/10'
                          : 'border-border bg-muted/20'
                      }`}>
                      <Text
                        className={`font-bold ${
                          value === 'credit' ? 'text-success' : 'text-muted-foreground'
                        }`}>
                        Income
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>

            <View className="gap-2">
              <Label className="text-sm font-bold">Amount</Label>
              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="relative">
                    <Text
                      className={`absolute left-4 top-[14px] z-10 text-lg font-bold ${
                        transactionType === 'credit' ? 'text-success' : 'text-destructive'
                      }`}>
                      {transactionType === 'credit' ? '+' : '-'}₹
                    </Text>
                    <Input
                      placeholder="0.00"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="numeric"
                      className={`h-14 pl-12 text-lg font-bold ${errors.amount ? 'border-destructive' : ''}`}
                    />
                  </View>
                )}
              />
              {errors.amount && (
                <Text className="text-xs text-destructive">{errors.amount.message}</Text>
              )}
            </View>

            <View className="gap-2">
              <Label className="text-sm font-bold">Description</Label>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="What was this for?"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    className={`h-12 ${errors.description ? 'border-destructive' : ''}`}
                  />
                )}
              />
              {errors.description && (
                <Text className="text-xs text-destructive">{errors.description.message}</Text>
              )}
            </View>

            <View className="gap-2">
              <Label className="text-sm font-bold">Date</Label>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="h-12 flex-row items-center justify-between rounded-md border border-input bg-muted/20 px-4">
                <Text className="text-foreground">{formatDisplayDate(currentDateValue)}</Text>
                <CalendarIcon size={18} color="#a3a3a3" />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={new Date(currentDateValue)}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}
              {errors.date && (
                <Text className="text-xs text-destructive">{errors.date.message}</Text>
              )}
            </View>

            <View className="gap-2">
              <Label className="text-sm font-bold">Category</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row flex-wrap gap-2 pt-1">
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => onChange(value === cat.id ? null : cat.id)}
                        className={`rounded-xl border px-4 py-2 ${
                          value === cat.id
                            ? 'border-foreground bg-foreground'
                            : 'border-border bg-muted/20'
                        }`}>
                        <Text
                          className={`text-xs font-bold ${value === cat.id ? 'text-background' : 'text-muted-foreground'}`}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            </View>

            <View className="gap-2">
              <Label className="text-sm font-bold">Account</Label>
              <Controller
                control={control}
                name="accountId"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row flex-wrap gap-2 pt-1">
                    {accounts.map((acc) => (
                      <TouchableOpacity
                        key={acc.id}
                        onPress={() => onChange(acc.id)}
                        className={`rounded-xl border px-4 py-2 ${
                          value === acc.id
                            ? 'border-primary bg-primary'
                            : 'border-border bg-muted/20'
                        }`}>
                        <Text
                          className={`text-xs font-bold ${value === acc.id ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                          {acc.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
              {errors.accountId && (
                <Text className="text-xs text-destructive">{errors.accountId.message}</Text>
              )}
            </View>

            <View className="pb-12 pt-8">
              <Button
                onPress={handleSubmit(onSubmit)}
                className="h-14 rounded-2xl"
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-lg font-bold">Record Transaction</Text>
                )}
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddTransactionScreen;
