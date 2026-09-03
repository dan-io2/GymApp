import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ZodError } from 'zod';

import { AuthMessage } from '../components/AuthMessage';
import { AuthScreen } from '../components/AuthScreen';
import { AuthTextInput } from '../components/AuthTextInput';
import { PrimaryAuthButton } from '../components/PrimaryAuthButton';
import { useAuth } from '../context/AuthContext';
import { signInSchema } from '../schemas/authSchemas';
import { mapAuthError } from '../services/authErrors';

type SignInFieldErrors = {
  email?: string;
  password?: string;
};

export function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    setFieldErrors({});
    setFormError(null);

    const parsed = signInSchema.safeParse({ email, password });

    if (!parsed.success) {
      setFieldErrors(getSignInFieldErrors(parsed.error));
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn(parsed.data);
      router.replace('/');
    } catch (error) {
      setFormError(mapAuthError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      footerActionLabel="Create account"
      footerPrompt="New to GymApp?"
      onFooterAction={() => router.push('/sign-up')}
      subtitle="Sign in to continue tracking your nutrition."
      title="Welcome back"
    >
      <View style={styles.form}>
        {formError ? <AuthMessage message={formError} tone="error" /> : null}
        <AuthTextInput
          autoComplete="email"
          error={fieldErrors.email}
          inputMode="email"
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="you@example.com"
          textContentType="emailAddress"
          value={email}
        />
        <AuthTextInput
          autoComplete="password"
          error={fieldErrors.password}
          label="Password"
          onChangeText={setPassword}
          onSubmitEditing={handleSubmit}
          placeholder="Your password"
          returnKeyType="done"
          secureTextEntry
          textContentType="password"
          value={password}
        />
        <PrimaryAuthButton
          isLoading={isSubmitting}
          label="Sign in"
          loadingLabel="Signing in"
          onPress={handleSubmit}
        />
      </View>
    </AuthScreen>
  );
}

function getSignInFieldErrors(error: ZodError): SignInFieldErrors {
  const errors: SignInFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (field === 'email' && !errors.email) {
      errors.email = issue.message;
    }

    if (field === 'password' && !errors.password) {
      errors.password = issue.message;
    }
  }

  return errors;
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
});
