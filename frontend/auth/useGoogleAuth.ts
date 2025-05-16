import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect } from 'react';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

WebBrowser.maybeCompleteAuthSession();

// Update this type to match your navigator
type RootStackParamList = {
  CoachSignupScreen2: { email: string };
  StudentSignupScreen2: { email: string };
  // add other screens here if needed
};

export function useGoogleAuth(targetScreen: keyof RootStackParamList) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '97113922202-248m0e61hsp2dj9qoe8v27tdt5n2p2i0.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);

      signInWithCredential(auth, credential)
        .then(userCred => {
          const email = userCred.user.email || '';
          console.log('✅ Signed in as:', email);

          // Navigate to CoachSignupScreen2 and pass the email
          navigation.navigate(targetScreen, { email });
        })
        .catch(err => {
          console.error('❌ Firebase sign-in error:', err);
        });
    }
  }, [response]);

  return {
    promptAsync,
    request,
  };
}
