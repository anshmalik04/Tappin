import AsyncStorage from '@react-native-async-storage/async-storage';
import { Amplify } from 'aws-amplify';
import {
  confirmSignIn,
  fetchAuthSession,
  signIn,
  signOut,
} from 'aws-amplify/auth';

// Configure Amplify with your Cognito details
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_bLzA6w9vl',
      userPoolClientId: '7knjcs2alfcc9pk6sbj57mffhk',
      loginWith: {
        phone: true,
      },
    },
  },
});

const TOKEN_KEY = 'tappin_jwt';
const USER_KEY = 'tappin_user';

// Step 1 — Send OTP to phone number
export async function requestOTP(phoneNumber) {
  try {
    const formatted = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber.replace(/\D/g, '')}`;

    const result = await signIn({
      username: formatted,
      options: {
        authFlowType: 'CUSTOM_WITHOUT_SRP',
      },
    });

    return { success: true, result };
  } catch (error) {
    // If Amplify thinks someone's already signed in but our session is broken,
    // sign out and retry once.
    if (error.name === 'UserAlreadyAuthenticatedException' || error.message?.includes('already a signed in user')) {
      try {
        await signOut();
        const formatted = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber.replace(/\D/g, '')}`;
        const retryResult = await signIn({
          username: formatted,
          options: {
            authFlowType: 'CUSTOM_WITHOUT_SRP',
          },
        });
        return { success: true, result: retryResult };
      } catch (retryError) {
        console.error('requestOTP retry error:', retryError);
        return { success: false, error: retryError.message };
      }
    }

    console.error('requestOTP error:', error);
    return { success: false, error: error.message };
  }
}

// Step 2 — Verify OTP code
export async function verifyOTP(otp) {
    try {
      const result = await confirmSignIn({ challengeResponse: otp });
      console.log('confirmSignIn result:', JSON.stringify(result, null, 2));
      
      if (result.isSignedIn) {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (token) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      }

      return { success: true, token };
    }

    return { success: false, error: 'Sign in not completed' };
  } catch (error) {
    console.error('verifyOTP error:', error);
    return { success: false, error: error.message };
  }
}

// Get stored JWT token
export async function getToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// Check if user is logged in
export async function isLoggedIn() {
  try {
    const session = await fetchAuthSession();
    return !!session.tokens?.idToken;
  } catch {
    return false;
  }
}

// Refresh token
export async function refreshToken() {
  try {
    const session = await fetchAuthSession({ forceRefresh: true });
    const token = session.tokens?.idToken?.toString();
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
    return token;
  } catch (error) {
    console.error('refreshToken error:', error);
    return null;
  }
}

// Sign out
export async function logout() {
  try {
    await signOut();
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    return { success: true };
  } catch (error) {
    console.error('logout error:', error);
    return { success: false, error: error.message };
  }
}