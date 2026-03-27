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
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { useStore } from '@/lib/store';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Trash2Icon } from 'lucide-react-native';
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

const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  balance: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: 'Must be a valid number',
  }),
  isDefault: z.boolean().default(false),
});

type AccountFormValues = z.infer<typeof accountSchema>;

const EditAccountScreen = () => {
  const { id } = useLocalSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [pendingData, setPendingData] = useState<AccountFormValues | null>(null);

  const { fetchAccounts } = useStore();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      balance: '0',
      isDefault: false,
    },
  });

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const response = await api.get(`/accounts/${id}`);
        const account = response.data;
        reset({
          name: account.name,
          balance: account.balance.toString(),
          isDefault: account.isDefault,
        });
      } catch (error) {
        console.error('Error loading account:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load account details',
        });
        router.navigate('/accounts');
      } finally {
        setIsLoading(false);
      }
    };

    loadAccount();
  }, [id]);

  const handleConfirmUpdate = async () => {
    if (!pendingData) return;
    setIsSubmitting(true);
    setShowConfirmUpdate(false);
    try {
      const formattedData = {
        ...pendingData,
        balance: parseFloat(pendingData.balance),
      };

      await api.put(`/accounts/${id}`, formattedData);
      await fetchAccounts();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Account updated successfully',
      });
      router.navigate('/accounts');
    } catch (error: any) {
      console.error('Error updating account:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong',
      });
    } finally {
      setIsSubmitting(false);
      setPendingData(null);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setShowConfirmDelete(false);
    try {
      await api.delete(`/accounts/${id}`);
      await fetchAccounts();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Account deleted successfully',
      });
      router.navigate('/accounts');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to delete account',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const onSubmit = (data: AccountFormValues) => {
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
      className="bg-background">
      <ScrollView className="flex-1 px-6">
        <View className="py-8">
          <View className="mb-8 flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-foreground">Edit Account</Text>
              <Text className="text-muted-foreground">Modify your account details.</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowConfirmDelete(true)}
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
              <Label className="text-sm font-bold">Balance</Label>
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
                  <Checkbox checked={value} onCheckedChange={onChange} />
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
                  <Text className="text-lg font-bold">Update Account</Text>
                )}
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>

      <AlertDialog open={showConfirmUpdate} onOpenChange={setShowConfirmUpdate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update this account?
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

      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this account? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={handleConfirmDelete} className="bg-destructive">
              <Text className="text-destructive-foreground">Delete</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </KeyboardAvoidingView>
  );
};

export default EditAccountScreen;
