import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ZodError } from 'zod';

import { AuthMessage } from '../components/AuthMessage';
import { AuthScreen } from '../components/AuthScreen';
import { AuthTextInput } from '../components/AuthTextInput';
import { PrimaryAuthButton } from '../components/PrimaryAuthButton';
import { useAuth } from '../context/AuthContext';
import { signUpSchema } from '../schemas/authSchemas';
import { mapAuthError } from '../services/authErrors';

type SignUpFieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<SignUpFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSuccessMessage(null);

    const parsed = signUpSchema.safeParse({ email, password, confirmPassword });

    if (!parsed.success) {
      setFieldErrors(getSignUpFieldErrors(parsed.error));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUp(parsed.data);

      if (result.requiresEmailConfirmation) {
        setSuccessMessage(
          'Account created. Check your email to confirm your account before signing in.',
        );
        return;
      }

      router.replace('/');
    } catch (error) {
      setFormError(mapAuthError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      footerActionLabel="Sign in"
      footerPrompt="Already have an account?"
      onFooterAction={() => router.replace('/sign-in')}
      subtitle="Create your account now. Nutrition onboarding comes next."
      title="Create account"
    >
      <View style={styles.form}>
        {formError ? <AuthMessage message={formError} tone="error" /> : null}
        {successMessage ? <AuthMessage message={successMessage} tone="success" /> : null}
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
          autoComplete="new-password"
          error={fieldErrors.password}
          label="Password"
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          textContentType="newPassword"
          value={password}
        />
        <AuthTextInput
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
          label="Confirm password"
          onChangeText={setConfirmPassword}
          onSubmitEditing={handleSubmit}
          placeholder="Repeat your password"
          returnKeyType="done"
          secureTextEntry
          textContentType="newPassword"
          value={confirmPassword}
        />
        <PrimaryAuthButton
          isLoading={isSubmitting}
          label="Create account"
          loadingLabel="Creating account"
          onPress={handleSubmit}
        />
      </View>
    </AuthScreen>
  );
}

function getSignUpFieldErrors(error: ZodError): SignUpFieldErrors {
  const errors: SignUpFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (field === 'email' && !errors.email) {
      errors.email = issue.message;
    }

    if (field === 'password' && !errors.password) {
      errors.password = issue.message;
    }

    if (field === 'confirmPassword' && !errors.confirmPassword) {
      errors.confirmPassword = issue.message;
    }
  }

  return errors;
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
});
