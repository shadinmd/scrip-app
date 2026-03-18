import { ExpoConfig } from 'expo/config';

export default (): ExpoConfig => {
  const env = process.env.EAS_BUILD_PROFILE ?? 'development';
  const isDev = env !== 'production';

  const packageName = isDev ? 'com.anonymous.scrip.dev' : 'com.anonymous.scrip';
  const icon = isDev ? './assets/images/dev-icon.png' : './assets/images/icon.png';
  const name = isDev ? 'scrip dev' : 'scrip';
  const androidGoogleServiceFile = isDev
    ? './scrip-dev-google-services.json'
    : './google-services.json';

  return {
    name,
    slug: 'scrip',
    version: '1.0.0',
    orientation: 'portrait',
    icon,
    scheme: 'scrip',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: packageName,
    },
    android: {
      googleServicesFile: androidGoogleServiceFile,
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        foregroundImage: icon,
        backgroundColor: '#000000',
      },
      package: packageName,
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      '@react-native-community/datetimepicker',
      'expo-notifications',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: 'a8c0798a-7e6e-4fbb-989e-6e43277845a1',
      },
    },
  };
};
