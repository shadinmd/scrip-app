import {
  View,
  Alert,
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
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginScreen = () => {
  const login = useAuthStore((state) => state.login);
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
      rememberMe: false,
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
      Alert.alert('Login Failed', message);
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
                    />
                  )}
                />
                {errors.password && (
                  <Text className="text-sm text-destructive">{errors.password.message}</Text>
                )}
              </View>
              <View className="flex-row items-center gap-3">
                <Controller
                  control={control}
                  name="rememberMe"
                  render={({ field: { onChange, value } }) => (
                    <Checkbox
                      checked={value}
                      onCheckedChange={onChange}
                      aria-labelledby="remember-label"
                    />
                  )}
                />
                <Label nativeID="remember-label" className="text-sm">
                  Remember me
                </Label>
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
          <View className="mt-12 flex-row justify-center gap-1">
            <Text className="text-muted-foreground">Don't have an account?</Text>
            <Text className="font-semibold text-primary">Sign Up</Text>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
