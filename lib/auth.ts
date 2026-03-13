import * as Keychain from 'react-native-keychain';

export const storeTokens = async (accessToken: string, refreshToken: string) => {
  await Keychain.setGenericPassword('auth', JSON.stringify({ accessToken, refreshToken }));
};

export const getTokens = async () => {
  const credentials = await Keychain.getGenericPassword();

  if (credentials) {
    try {
      return JSON.parse(credentials.password);
    } catch (e) {
      return null;
    }
  }

  return null;
};

export const clearTokens = async () => {
  await Keychain.resetGenericPassword();
};
