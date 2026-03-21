import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { PlusIcon, TrashIcon, SparklesIcon, XIcon, CalendarIcon } from 'lucide-react-native';
import { MonthPicker } from '@/components/ui/month-picker';
import { getTodayStr, getCurrentMonthStr, formatDisplayDate } from '@/lib/date-utils';
import DateTimePicker from '@react-native-community/datetimepicker';

const installmentSchema = z.object({
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Must be a positive number',
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
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

export default function AddLoanScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [showAutoGenerator, setShowAutoGenerator] = useState(false);
  const [activeDatePickerIndex, setActiveDatePickerIndex] = useState<number | null>(null);

  const todayStr = getTodayStr();
  const currentMonthStr = getCurrentMonthStr();

  const today = new Date();
  const tenYearsLaterStr =
    today.getFullYear() + 10 + '-' + String(today.getMonth() + 1).padStart(2, '0');

  // Auto-generator states
  const [genAmount, setGenAmount] = useState('');
  const [genStartMonth, setGenStartMonth] = useState(currentMonthStr);
  const [genEndMonth, setGenEndMonth] = useState('');
  const [genDay, setGenDay] = useState('5');

  // Picker visibility states
  const [showStartPicker, setShowStartMonthPicker] = useState(false);
  const [showEndPicker, setShowEndMonthPicker] = useState(false);

  const { fetchLoans } = useStore();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      name: '',
      installments: [{ amount: '', date: todayStr }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'installments',
  });

  const installmentsWatch = watch('installments');

  const formatMonthDisplay = (value: string) => {
    if (!value) return 'Select Month';
    const [year, month] = value.split('-');
    const date = new Date(parseInt(year!), parseInt(month!) - 1);
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  const handleGenerate = () => {
    if (!genAmount || !genStartMonth || !genEndMonth || !genDay) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all generator fields',
      });
      return;
    }

    const start = new Date(genStartMonth + '-01');
    const end = new Date(genEndMonth + '-01');

    if (end < start) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'End month must be after start month',
      });
      return;
    }

    const newInstallments = [];
    let current = new Date(start);
    const dayNum = parseInt(genDay);

    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(dayNum).padStart(2, '0');

      newInstallments.push({
        amount: genAmount,
        date: `${year}-${month}-${day}`,
      });

      current.setMonth(current.getMonth() + 1);
    }

    replace(newInstallments);
    setShowAutoGenerator(false);
  };

  const onInstallmentDateChange = (index: number, event: any, selectedDate?: Date) => {
    setActiveDatePickerIndex(Platform.OS === 'ios' ? index : null);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setValue(`installments.${index}.date`, `${year}-${month}-${day}`);
    }
  };

  const onSubmit = async (data: LoanFormValues) => {
    setIsLoading(true);
    try {
      const formattedData = {
        name: data.name,
        installments: data.installments.map((inst) => ({
          amount: parseFloat(inst.amount),
          date: inst.date,
        })),
      };

      await api.post('/loans', formattedData);
      await fetchLoans();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Loan added successfully',
      });
      router.back();
    } catch (error: any) {
      console.error('Error adding loan:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <ScrollView className="flex-1 bg-background px-6" keyboardShouldPersistTaps="handled">
        <View className="py-8">
          <Text className="mb-2 text-3xl font-bold text-foreground">New Loan</Text>
          <Text className="mb-8 text-muted-foreground">
            Track your debt and upcoming installments.
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
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-lg border-primary/30"
                  onPress={() => setShowAutoGenerator(!showAutoGenerator)}>
                  <SparklesIcon size={14} color="#fff" style={{ marginRight: 6 }} />
                  <Text className="text-xs font-bold">Auto-Fill</Text>
                </Button>
              </View>

              {showAutoGenerator && (
                <View className="mb-6 gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-primary">Auto-Fill Generator</Text>
                    <TouchableOpacity onPress={() => setShowAutoGenerator(false)}>
                      <XIcon size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <View className="gap-3">
                    <View className="flex-row gap-3">
                      <View className="flex-1 gap-1">
                        <Text className="text-[10px] font-bold uppercase text-muted-foreground">
                          Monthly Amount
                        </Text>
                        <Input
                          placeholder="0.00"
                          value={genAmount}
                          onChangeText={setGenAmount}
                          keyboardType="numeric"
                          className="h-10 text-sm"
                        />
                      </View>
                      <View className="flex-1 gap-1">
                        <Text className="text-[10px] font-bold uppercase text-muted-foreground">
                          Day of Month
                        </Text>
                        <Input
                          placeholder="e.g. 5"
                          value={genDay}
                          onChangeText={setGenDay}
                          keyboardType="numeric"
                          className="h-10 text-sm"
                        />
                      </View>
                    </View>

                    <View className="flex-row gap-3">
                      <View className="flex-1 gap-1">
                        <Text className="text-[10px] font-bold uppercase text-muted-foreground">
                          Start Month
                        </Text>
                        <TouchableOpacity
                          onPress={() => setShowStartMonthPicker(true)}
                          className="h-10 justify-center rounded-md border border-input bg-muted/20 px-3">
                          <Text className="text-sm text-foreground">
                            {formatMonthDisplay(genStartMonth)}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View className="flex-1 gap-1">
                        <Text className="text-[10px] font-bold uppercase text-muted-foreground">
                          End Month
                        </Text>
                        <TouchableOpacity
                          onPress={() => setShowEndMonthPicker(true)}
                          className="h-10 justify-center rounded-md border border-input bg-muted/20 px-3">
                          <Text className="text-sm text-foreground">
                            {formatMonthDisplay(genEndMonth)}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Button size="sm" className="mt-2 h-10 rounded-xl" onPress={handleGenerate}>
                      <Text className="font-bold">Generate Schedule</Text>
                    </Button>
                  </View>
                </View>
              )}

              <MonthPicker
                visible={showStartPicker}
                value={genStartMonth}
                onChange={setGenStartMonth}
                maxDate={tenYearsLaterStr}
                onClose={() => setShowStartMonthPicker(false)}
              />
              <MonthPicker
                visible={showEndPicker}
                value={genEndMonth || genStartMonth}
                onChange={setGenEndMonth}
                minDate={genStartMonth}
                maxDate={tenYearsLaterStr}
                onClose={() => setShowEndMonthPicker(false)}
              />

              <View className="gap-4">
                {fields.map((field, index) => (
                  <View
                    key={field.id}
                    className="gap-4 rounded-xl border border-border bg-card p-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Installment #{index + 1}
                      </Text>
                      {fields.length > 1 && (
                        <TouchableOpacity onPress={() => remove(index)}>
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
                          name={`installments.${index}.amount`}
                          render={({ field: { onChange, value } }) => (
                            <Input
                              placeholder="0.00"
                              keyboardType="numeric"
                              onChangeText={onChange}
                              value={value}
                              className={
                                errors.installments?.[index]?.amount ? 'border-destructive' : ''
                              }
                            />
                          )}
                        />
                      </View>
                      <View className="flex-1 gap-1.5">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                          Date
                        </Label>
                        <TouchableOpacity
                          onPress={() => setActiveDatePickerIndex(index)}
                          className="h-10 flex-row items-center justify-between rounded-md border border-input bg-muted/20 px-3">
                          <Text className="text-xs text-foreground">
                            {formatDisplayDate(installmentsWatch[index]?.date || todayStr)}
                          </Text>
                          <CalendarIcon size={14} color="#a3a3a3" />
                        </TouchableOpacity>

                        {activeDatePickerIndex === index && (
                          <DateTimePicker
                            value={new Date(installmentsWatch[index]?.date || todayStr)}
                            mode="date"
                            display="default"
                            onChange={(e, date) => onInstallmentDateChange(index, e, date)}
                          />
                        )}
                      </View>
                    </View>
                  </View>
                ))}
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
                disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-lg font-bold">Save Loan</Text>
                )}
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
