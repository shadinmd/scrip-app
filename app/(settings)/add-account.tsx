import React, { useState } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { useStore } from '@/lib/store';
import { useRouter } from 'expo-router';

const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  balance: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: 'Must be a valid number',
  }),
  isDefault: z.boolean().default(false),
});

type AccountFormValues = z.infer<typeof accountSchema>;

const AddAccountScreen = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchAccounts } = useStore();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      balance: '0',
      isDefault: false,
    },
  });

  const onSubmit = async (data: AccountFormValues) => {
    setIsSubmitting(true);
    try {
      const formattedData = {
        ...data,
        balance: parseFloat(data.balance),
      };

      await api.post('/accounts', formattedData);
      await fetchAccounts();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Account created successfully',
      });
      router.back();
    } catch (error: any) {
      console.error('Error adding account:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      className="bg-background">
      <ScrollView className="flex-1 px-6">
        <View className="py-8">
          <Text className="mb-2 text-3xl font-bold text-foreground">Add Account</Text>
          <Text className="mb-8 text-muted-foreground">
            Create a new account to track your balances and transactions.
          </Text>

          <View className="gap-6">
            <View className="gap-2">
              <Label className="text-sm font-bold">Account Name</Label>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="e.g. HDFC Bank, Cash, Credit Card"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    className={`h-12 ${errors.name ? 'border-destructive' : ''}`}
                  />
                )}
              />
              {errors.name && (
                <Text className="text-xs text-destructive">{errors.name.message}</Text>
              )}
            </View>

            <View className="gap-2">
              <Label className="text-sm font-bold">Initial Balance</Label>
              <Controller
                control={control}
                name="balance"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="relative">
                    <Text className="absolute left-4 top-[14px] z-10 text-lg font-bold text-muted-foreground">
                      ₹
                    </Text>
                    <Input
                      placeholder="0.00"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="numeric"
                      className={`h-14 pl-10 text-lg font-bold ${errors.balance ? 'border-destructive' : ''}`}
                    />
                  </View>
                )}
              />
              {errors.balance && (
                <Text className="text-xs text-destructive">{errors.balance.message}</Text>
              )}
            </View>

            <View className="flex-row items-center gap-3 py-2">
              <Controller
                control={control}
                name="isDefault"
                render={({ field: { onChange, value } }) => (
                  <Checkbox
                    checked={value}
                    onCheckedChange={onChange}
                  />
                )}
              />
              <Label className="text-sm font-medium">Set as Default Account</Label>
            </View>

            <View className="pb-12 pt-8">
              <Button
                onPress={handleSubmit(onSubmit)}
                className="h-14 rounded-2xl"
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-lg font-bold">Create Account</Text>
                )}
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddAccountScreen;
