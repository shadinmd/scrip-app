import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Alert,
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
import { useStore } from '@/lib/store';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { formatDisplayDate } from '@/lib/date-utils';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarIcon, Trash2Icon } from 'lucide-react-native';

const transactionSchema = z.object({
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Must be a positive number',
  }),
  description: z.string().min(1, 'Description is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  categoryId: z.number().nullable().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const EditTransactionScreen = () => {
  const { id } = useLocalSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { categories, fetchCategories, fetchTransactions, fetchSummary } = useStore();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: '',
      description: '',
      date: '',
      categoryId: null,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchCategories();
        const response = await api.get(`/transactions/${id}`);
        const transaction = response.data;

        reset({
          amount: Math.abs(parseFloat(transaction.amount)).toString(),
          description: transaction.description,
          date: transaction.date,
          categoryId: transaction.categoryId || null,
        });
      } catch (error) {
        console.error('Error loading transaction:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load transaction details',
        });
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const currentDateValue = watch('date');

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

      await api.put(`/transactions/${id}`, formattedData);
      await Promise.all([fetchTransactions({ page: 1, limit: 20 }), fetchSummary()]);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Transaction updated successfully',
      });
      router.back();
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            await api.delete(`/transactions/${id}`);
            await Promise.all([fetchTransactions({ page: 1, limit: 20 }), fetchSummary()]);
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'Transaction deleted successfully',
            });
            router.back();
          } catch (error: any) {
            console.error('Error deleting transaction:', error);
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: error.response?.data?.message || 'Failed to delete transaction',
            });
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
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
          <View className="mb-8 flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-foreground">Edit Expense</Text>
              <Text className="text-muted-foreground">Modify your transaction details.</Text>
            </View>
            <TouchableOpacity
              onPress={handleDelete}
              disabled={isDeleting}
              className="h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
              {isDeleting ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Trash2Icon size={22} color="#ef4444" />
              )}
            </TouchableOpacity>
          </View>

          <View className="gap-6">
            <View className="gap-2">
              <Label className="text-sm font-bold">Amount</Label>
              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="relative">
                    <Text className="absolute left-4 top-[14px] z-10 text-lg font-bold text-muted-foreground">
                      $
                    </Text>
                    <Input
                      placeholder="0.00"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="numeric"
                      className={`h-14 pl-10 text-lg font-bold ${errors.amount ? 'border-destructive' : ''}`}
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
                <Text className="text-foreground">
                  {currentDateValue ? formatDisplayDate(currentDateValue) : 'Select Date'}
                </Text>
                <CalendarIcon size={18} color="#a3a3a3" />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={currentDateValue ? new Date(currentDateValue) : new Date()}
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

            <View className="pb-12 pt-8">
              <Button
                onPress={handleSubmit(onSubmit)}
                className="h-14 rounded-2xl"
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-lg font-bold">Update Expense</Text>
                )}
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditTransactionScreen;
