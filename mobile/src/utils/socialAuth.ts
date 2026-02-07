import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import { Platform, Alert } from 'react-native';
import { authService } from '../services/authService';

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export type SocialAuthResult = { success: true } | { success: false; error: string };

export async function signInWithApple(): Promise<SocialAuthResult> {
  if (Platform.OS !== 'ios') {
    return { success: false, error: 'Apple Sign-In is only available on iOS.' };
  }
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      return { success: false, error: 'Apple did not return an identity token.' };
    }
    const fullName =
      credential.fullName?.givenName || credential.fullName?.familyName
        ? [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ')
        : undefined;
    await authService.loginWithApple(credential.identityToken, fullName);
    return { success: true };
  } catch (e: any) {
    if (e.code === 'ERR_REQUEST_CANCELED') {
      return { success: false, error: 'Canceled' };
    }
    return { success: false, error: e.message || 'Apple Sign-In failed.' };
  }
}

export async function signInWithGoogle(): Promise<SocialAuthResult> {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    Alert.alert(
      'Configuration needed',
      'Google Sign-In requires EXPO_PUBLIC_GOOGLE_CLIENT_ID in your app config. Add your Google OAuth Web client ID (same as backend GOOGLE_CLIENT_ID).',
    );
    return { success: false, error: 'Google Client ID not configured.' };
  }
  try {
    const redirectUri = AuthSession.makeRedirectUri({ useProxy: false });
    const request = await AuthSession.loadAsync(
      {
        clientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
      },
      GOOGLE_DISCOVERY,
    );
    const result = await request.promptAsync(GOOGLE_DISCOVERY);
    if (result.type !== 'success') {
      return { success: false, error: result.type === 'cancel' ? 'Canceled' : 'Google sign-in was not completed.' };
    }
    const params = result.params as Record<string, string>;
    const code = params.code;
    if (!code) {
      return { success: false, error: 'No authorization code from Google.' };
    }
    const tokenResult = await AuthSession.exchangeCodeAsync(
      {
        clientId,
        code,
        redirectUri,
        extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
      },
      GOOGLE_DISCOVERY,
    );
    const tokenResponse = tokenResult as { idToken?: string; id_token?: string };
    const idToken = tokenResponse.idToken ?? tokenResponse.id_token;
    if (!idToken) {
      Alert.alert(
        'Google Sign-In',
        'ID token was not returned. Ensure your Google OAuth client has OpenID Connect enabled. For native ID token, consider @react-native-google-signin/google-signin.',
      );
      return { success: false, error: 'Google did not return an ID token.' };
    }
    await authService.loginWithGoogle(idToken);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Google Sign-In failed.' };
  }
}
