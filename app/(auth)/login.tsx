import {
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import api from '@/lib/api';
import { useStore } from '@/lib/store';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginScreen = () => {
  const login = useStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      const { accessToken, refreshToken } = response.data;

      await login(accessToken, refreshToken);
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Something went wrong. Please try again.';
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          className="bg-background px-12 py-10">
          <View className="mb-10 items-center">
            <Text className="text-6xl font-extrabold tracking-tighter text-primary">Scrip</Text>
          </View>
          <View className="w-full">
            <View className="mb-6">
              <Text className="text-3xl font-bold text-foreground">Login</Text>
              <Text className="mt-1 text-muted-foreground">
                Enter your email and password to access your account.
              </Text>
            </View>
            <View className="gap-5">
              <View className="gap-2">
                <Label nativeID="email-label" className="text-sm font-medium">
                  Email
                </Label>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="name@example.com"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      aria-labelledby="email-label"
                      className={errors.email ? 'border-destructive' : ''}
                    />
                  )}
                />
                {errors.email && (
                  <Text className="text-sm text-destructive">{errors.email.message}</Text>
                )}
              </View>
              <View className="gap-2">
                <Label nativeID="password-label" className="text-sm font-medium">
                  Password
                </Label>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="••••••••"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry
                      aria-labelledby="password-label"
                      className={errors.password ? 'border-destructive' : ''}
                      autoCapitalize="none"
                    />
                  )}
                />
                {errors.password && (
                  <Text className="text-sm text-destructive">{errors.password.message}</Text>
                )}
              </View>
            </View>
            <View className="pt-8">
              <Button
                onPress={handleSubmit(onSubmit)}
                className="h-14 w-full rounded-2xl"
                disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-lg font-bold">Sign In</Text>
                )}
              </Button>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
