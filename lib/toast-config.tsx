import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info,  CheckCircle2, XCircle } from 'lucide-react-native';
import { ToastConfig } from 'react-native-toast-message';
import { View } from 'react-native';

export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }) => (
    <View className="px-4 w-full">
      <Alert icon={CheckCircle2} className="border-green-600/50">
        {text1 && <AlertTitle className="text-green-600">{text1}</AlertTitle>}
        {text2 && <AlertDescription>{text2}</AlertDescription>}
      </Alert>
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View className="px-4 w-full">
      <Alert icon={XCircle} variant="destructive">
        {text1 && <AlertTitle>{text1}</AlertTitle>}
        {text2 && <AlertDescription>{text2}</AlertDescription>}
      </Alert>
    </View>
  ),
  info: ({ text1, text2 }) => (
    <View className="px-4 w-full">
      <Alert icon={Info} className="border-blue-600/50">
        {text1 && <AlertTitle className="text-blue-600">{text1}</AlertTitle>}
        {text2 && <AlertDescription>{text2}</AlertDescription>}
      </Alert>
    </View>
  ),
};
