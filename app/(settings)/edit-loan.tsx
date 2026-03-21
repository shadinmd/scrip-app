import { useEffect, useMemo, useState } from 'react';
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
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PlusIcon, TrashIcon, XIcon, CalendarIcon, CoinsIcon } from 'lucide-react-native';
import { getTodayStr, formatDisplayDate } from '@/lib/date-utils';
import DateTimePicker from '@react-native-community/datetimepicker';

const installmentSchema = z.object({
  id: z.number().optional(),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Must be a positive number',
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  isPaid: z.boolean().optional(),
});

const loanSchema = z
  .object({
    name: z.string().min(1, 'Loan name is required'),
    installments: z.array(installmentSchema).min(1, 'At least one installment is required'),
  })
  .superRefine((data, ctx) => {
    const months = data.installments.map((inst) => inst.date.substring(0, 7));
    const hasDuplicateMonths = months.some((month, index) => months.indexOf(month) !== index);

    if (hasDuplicateMonths) {
      ctx.addIssue({
        code: 'custom',
        message: 'Each installment must be in a different month',
        path: ['installments'],
      });
    }
  });

type LoanFormValues = z.infer<typeof loanSchema>;

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function EditLoanScreen() {
  const { id } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdjustPending, setShowAdjustPending] = useState(false);
  const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);
  const [pendingData, setPendingData] = useState<LoanFormValues | null>(null);
  const [activeDatePickerIndex, setActiveDatePickerIndex] = useState<number | null>(null);

  const todayStr = getTodayStr();

  const today = new Date();

  // Adjust pending states
  const [adjustAmount, setAdjustAmount] = useState('');

  const { fetchLoans } = useStore();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      name: '',
      installments: [{ amount: '', date: todayStr }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'installments',
  });

  const installmentsWatch = watch('installments');

  const processedFields = useMemo(() => {
    const chronologicalDates = [...installmentsWatch]
      .map((inst) => inst.date)
      .sort((a, b) => a.localeCompare(b));

    const mapped = fields.map((field, index) => {
      const inst = installmentsWatch[index];
      const rank = inst ? chronologicalDates.indexOf(inst.date) + 1 : index + 1;
      return {
        ...field,
        originalIndex: index,
        displayRank: rank,
        isPaid: inst?.isPaid || false,
        date: inst?.date || '',
      };
    });

    return mapped.sort((a, b) => {
      if (a.isPaid !== b.isPaid) {
        return a.isPaid ? 1 : -1;
      }
      return a.date.localeCompare(b.date);
    });
  }, [fields, installmentsWatch]);

  const handleAdjustPending = () => {
    const appendValue = parseFloat(adjustAmount);
    if (isNaN(appendValue)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid amount',
      });
      return;
    }

    const updatedInstallments = installmentsWatch.map((inst) => {
      if (!inst.isPaid) {
        const currentAmount = parseFloat(inst.amount) || 0;
        return {
          ...inst,
          amount: (currentAmount + appendValue).toFixed(2),
        };
      }
      return inst;
    });

    setValue('installments', updatedInstallments);
    setShowAdjustPending(false);
    setAdjustAmount('');
    Toast.show({
      type: 'info',
      text1: 'Adjusted',
      text2: `Added ₹${appendValue} to all pending installments`,
    });
  };

  useEffect(() => {
    const fetchLoan = async () => {
      try {
        const response = await api.get(`/loans/${id}`);
        const loan = response.data;
        reset({
          name: loan.name,
          installments: loan.installments.map((inst: any) => ({
            id: inst.id,
            amount: inst.amount.toString(),
            date: inst.date,
            isPaid: inst.isPaid,
          })),
        });
      } catch (error) {
        console.error('Error fetching loan:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Could not load loan details',
        });
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoan();
  }, [id]);

  const onInstallmentDateChange = (index: number, event: any, selectedDate?: Date) => {
    setActiveDatePickerIndex(Platform.OS === 'ios' ? index : null);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setValue(`installments.${index}.date`, `${year}-${month}-${day}`);
    }
  };

  const handleConfirmUpdate = async () => {
    if (!pendingData) return;

    setIsSaving(true);
    setShowConfirmUpdate(false);
    try {
      const formattedData = {
        name: pendingData.name,
        installments: pendingData.installments.map((inst) => ({
          amount: parseFloat(inst.amount),
          date: inst.date,
          isPaid: inst.isPaid || false,
        })),
      };

      await api.put(`/loans/${id}`, formattedData);
      await fetchLoans();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Loan updated successfully',
      });
      router.back();
    } catch (error: any) {
      console.error('Error updating loan:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong',
      });
    } finally {
      setIsSaving(false);
      setPendingData(null);
    }
  };

  const onSubmit = (data: LoanFormValues) => {
    setPendingData(data);
    setShowConfirmUpdate(true);
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <ScrollView className="flex-1 bg-background px-6" keyboardShouldPersistTaps="handled">
        <View className="py-8">
          <Text className="mb-2 text-3xl font-bold text-foreground">Edit Loan</Text>
          <Text className="mb-8 text-muted-foreground">
            Modify your loan name or payment schedule.
          </Text>

          <View className="gap-6">
            <View className="gap-2">
              <Label className="text-sm font-bold">Loan Name</Label>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="e.g. Car Loan, Home Mortgage"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                )}
              />
              {errors.name && (
                <Text className="text-xs text-destructive">{errors.name.message}</Text>
              )}
            </View>

            <View className="border-t border-border pt-4">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-lg font-bold text-foreground">Installments</Text>
                <View className="flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-lg border-primary/30"
                    onPress={() => {
                      setShowAdjustPending(!showAdjustPending);
                    }}>
                    <CoinsIcon size={14} color="#fff" style={{ marginRight: 6 }} />
                    <Text className="text-xs font-bold">Adjust Pending</Text>
                  </Button>
                </View>
              </View>

              {showAdjustPending && (
                <View className="mb-6 gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-primary">
                      Adjust Pending Installments
                    </Text>
                    <TouchableOpacity onPress={() => setShowAdjustPending(false)}>
                      <XIcon size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <View className="gap-3">
                    <View className="gap-1">
                      <Text className="text-[10px] font-bold uppercase text-muted-foreground">
                        Amount to Add (or subtract if negative)
                      </Text>
                      <View className="flex-row gap-2">
                        <Input
                          placeholder="e.g. 500"
                          value={adjustAmount}
                          onChangeText={setAdjustAmount}
                          keyboardType="numeric"
                          className="h-10 flex-1 text-sm"
                        />
                        <Button
                          size="sm"
                          className="h-10 rounded-xl px-4"
                          onPress={handleAdjustPending}>
                          <Text className="font-bold">Apply</Text>
                        </Button>
                      </View>
                      <Text className="mt-1 text-[10px] text-muted-foreground">
                        This will be added to every installment that is not marked as "Paid".
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View className="gap-4">
                {processedFields.map((field) => {
                  const { originalIndex, displayRank, isPaid } = field;
                  return (
                    <View
                      key={field.id}
                      className="gap-4 rounded-xl border border-border bg-card p-4">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            Installment #{displayRank}
                          </Text>
                          {isPaid && (
                            <View className="rounded-full bg-green-600/20 px-2 py-0.5">
                              <Text className="text-[8px] font-bold uppercase text-green-600">
                                Paid
                              </Text>
                            </View>
                          )}
                        </View>
                        {fields.length > 1 && !isPaid && (
                          <TouchableOpacity onPress={() => remove(originalIndex)}>
                            <TrashIcon size={16} color="#ef4444" />
                          </TouchableOpacity>
                        )}
                      </View>

                      <View className="flex-row gap-3">
                        <View className="flex-1 gap-1.5">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                            Amount
                          </Label>
                          <Controller
                            control={control}
                            name={`installments.${originalIndex}.amount`}
                            render={({ field: { onChange, value } }) => (
                              <Input
                                placeholder="0.00"
                                keyboardType="numeric"
                                onChangeText={onChange}
                                value={value}
                                editable={!isPaid}
                                className={cn(
                                  errors.installments?.[originalIndex]?.amount
                                    ? 'border-destructive'
                                    : '',
                                  isPaid && 'bg-muted/50 opacity-70'
                                )}
                              />
                            )}
                          />
                        </View>
                        <View className="flex-1 gap-1.5">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                            Date
                          </Label>
                          <TouchableOpacity
                            onPress={() => !isPaid && setActiveDatePickerIndex(originalIndex)}
                            activeOpacity={isPaid ? 1 : 0.7}
                            className={cn(
                              'h-10 flex-row items-center justify-between rounded-md border border-input bg-muted/20 px-3',
                              isPaid && 'bg-muted/50 opacity-70'
                            )}>
                            <Text className="text-xs text-foreground">
                              {formatDisplayDate(
                                installmentsWatch[originalIndex]?.date || todayStr
                              )}
                            </Text>
                            {!isPaid && <CalendarIcon size={14} color="#a3a3a3" />}
                          </TouchableOpacity>

                          {activeDatePickerIndex === originalIndex && (
                            <DateTimePicker
                              value={new Date(installmentsWatch[originalIndex]?.date || todayStr)}
                              mode="date"
                              display="default"
                              onChange={(e, date) =>
                                onInstallmentDateChange(originalIndex, e, date)
                              }
                            />
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              <Button
                variant="outline"
                className="mt-4 h-12 rounded-xl border-dashed border-muted"
                onPress={() => append({ amount: '', date: todayStr })}>
                <PlusIcon size={16} color="#a3a3a3" style={{ marginRight: 8 }} />
                <Text className="text-muted-foreground">Add Custom Installment</Text>
              </Button>

              {errors.installments && (
                <Text className="mt-2 text-sm font-bold text-destructive">
                  {errors.installments.message || (errors.installments as any).root?.message}
                </Text>
              )}
            </View>

            <View className="pb-12 pt-8">
              <Button
                onPress={handleSubmit(onSubmit)}
                className="h-14 rounded-2xl"
                disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-lg font-bold">Update Loan</Text>
                )}
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>

      <AlertDialog open={showConfirmUpdate} onOpenChange={setShowConfirmUpdate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Loan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update this loan? This will replace your entire payment
              schedule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={handleConfirmUpdate}>
              <Text>Update</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </KeyboardAvoidingView>
  );
}
