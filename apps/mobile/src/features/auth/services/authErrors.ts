import { AuthApiError, AuthError, AuthWeakPasswordError } from '@supabase/supabase-js';

export type AppAuthErrorCode =
  | 'invalid_credentials'
  | 'invalid_email'
  | 'weak_password'
  | 'user_already_registered'
  | 'email_signup_disabled'
  | 'rate_limited'
  | 'network_failure'
  | 'unexpected';

export class AuthUserFacingError extends Error {
  readonly code: AppAuthErrorCode;

  readonly status?: number;

  readonly diagnosticMessage?: string;

  constructor({
    code,
    message,
    status,
    diagnosticMessage,
  }: {
    code: AppAuthErrorCode;
    message: string;
    status?: number;
    diagnosticMessage?: string;
  }) {
    super(message);
    this.name = 'AuthUserFacingError';
    this.code = code;
    this.status = status;
    this.diagnosticMessage = diagnosticMessage;
  }
}

export function mapAuthError(error: unknown): AuthUserFacingError {
  if (error instanceof AuthUserFacingError) {
    return error;
  }

  const authCode = getAuthErrorCode(error);
  const rawMessage = getErrorMessage(error);
  const message = rawMessage.toLowerCase();
  const status = getAuthErrorStatus(error);
  const diagnosticMessage = rawMessage || undefined;

  switch (authCode) {
    case 'invalid_credentials':
      return createAuthError({
        code: 'invalid_credentials',
        message: 'The email or password you entered is incorrect.',
        status,
        diagnosticMessage,
      });
    case 'email_address_invalid':
    case 'email_address_not_authorized':
    case 'validation_failed':
      return createAuthError({
        code: 'invalid_email',
        message: 'Enter a valid email address.',
        status,
        diagnosticMessage,
      });
    case 'weak_password':
      return createAuthError({
        code: 'weak_password',
        message: getWeakPasswordMessage(error, rawMessage),
        status,
        diagnosticMessage,
      });
    case 'email_exists':
    case 'user_already_exists':
    case 'identity_already_exists':
      return createAuthError({
        code: 'user_already_registered',
        message: 'An account with this email already exists. Try signing in instead.',
        status,
        diagnosticMessage,
      });
    case 'signup_disabled':
    case 'email_provider_disabled':
    case 'provider_disabled':
      return createAuthError({
        code: 'email_signup_disabled',
        message: 'Account registration is currently unavailable. Please try again later.',
        status,
        diagnosticMessage,
      });
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return createAuthError({
        code: 'rate_limited',
        message: 'Too many attempts. Please wait a moment and try again.',
        status,
        diagnosticMessage,
      });
    case 'request_timeout':
      return createAuthError({
        code: 'network_failure',
        message: 'Unable to connect. Check your internet connection and try again.',
        status,
        diagnosticMessage,
      });
    default:
      break;
  }

  if (status === 400 && (message.includes('invalid login') || message.includes('credentials'))) {
    return createAuthError({
      code: 'invalid_credentials',
      message: 'The email or password you entered is incorrect.',
      status,
      diagnosticMessage,
    });
  }

  if (message.includes('already registered') || message.includes('already exists')) {
    return createAuthError({
      code: 'user_already_registered',
      message: 'An account with this email already exists. Try signing in instead.',
      status,
      diagnosticMessage,
    });
  }

  if (message.includes('invalid email')) {
    return createAuthError({
      code: 'invalid_email',
      message: 'Enter a valid email address.',
      status,
      diagnosticMessage,
    });
  }

  if (message.includes('email signups are disabled') || message.includes('signup disabled')) {
    return createAuthError({
      code: 'email_signup_disabled',
      message: 'Account registration is currently unavailable. Please try again later.',
      status,
      diagnosticMessage,
    });
  }

  if (
    message.includes('rate limit') ||
    message.includes('too many') ||
    message.includes('email rate limit')
  ) {
    return createAuthError({
      code: 'rate_limited',
      message: 'Too many attempts. Please wait a moment and try again.',
      status,
      diagnosticMessage,
    });
  }

  if (message.includes('password') && (message.includes('weak') || message.includes('short'))) {
    return createAuthError({
      code: 'weak_password',
      message: getWeakPasswordMessage(error, rawMessage),
      status,
      diagnosticMessage,
    });
  }

  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('failed to fetch')
  ) {
    return createAuthError({
      code: 'network_failure',
      message: 'Unable to connect. Check your internet connection and try again.',
      status,
      diagnosticMessage,
    });
  }

  return createAuthError({
    code: 'unexpected',
    message: "We couldn't create your account. Please try again.",
    status,
    diagnosticMessage,
  });
}

export function logAuthErrorDiagnostic(error: unknown, context: string): void {
  if (!isDevelopment()) {
    return;
  }

  const authError = error instanceof AuthUserFacingError ? error : mapAuthError(error);

  console.warn('[Auth]', context, {
    code: authError.code,
    name: getErrorName(error),
    status: authError.status,
    message: authError.diagnosticMessage ?? authError.message,
  });
}

function createAuthError({
  code,
  message,
  status,
  diagnosticMessage,
}: {
  code: AppAuthErrorCode;
  message: string;
  status?: number;
  diagnosticMessage?: string;
}) {
  return new AuthUserFacingError({
    code,
    message,
    status,
    diagnosticMessage,
  });
}

function getAuthErrorCode(error: unknown): string | undefined {
  if (error instanceof AuthError) {
    return error.code;
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const maybeCode = (error as { code?: unknown }).code;
    return typeof maybeCode === 'string' ? maybeCode : undefined;
  }

  return undefined;
}

function getAuthErrorStatus(error: unknown): number | undefined {
  if (error instanceof AuthApiError) {
    return error.status;
  }

  if (error instanceof AuthError) {
    return error.status;
  }

  if (typeof error === 'object' && error !== null && 'status' in error) {
    const maybeStatus = (error as { status?: unknown }).status;
    return typeof maybeStatus === 'number' ? maybeStatus : undefined;
  }

  return undefined;
}

function getWeakPasswordMessage(error: unknown, rawMessage: string): string {
  if (error instanceof AuthWeakPasswordError) {
    if (error.reasons.includes('length')) {
      return 'Password must be at least 8 characters.';
    }

    if (error.reasons.includes('characters')) {
      return 'Password must include a stronger mix of characters.';
    }

    if (error.reasons.includes('pwned')) {
      return 'Choose a password that has not appeared in a known data breach.';
    }
  }

  if (rawMessage) {
    return normalizePasswordMessage(rawMessage);
  }

  return 'Password does not meet the current requirements.';
}

function normalizePasswordMessage(message: string): string {
  const trimmed = message.trim();

  if (!trimmed) {
    return 'Password does not meet the current requirements.';
  }

  return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    return typeof maybeMessage === 'string' ? maybeMessage : '';
  }

  return '';
}

function getErrorName(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.name;
  }

  if (typeof error === 'object' && error !== null && 'name' in error) {
    const maybeName = (error as { name?: unknown }).name;
    return typeof maybeName === 'string' ? maybeName : undefined;
  }

  return undefined;
}

function isDevelopment(): boolean {
  return typeof __DEV__ === 'boolean' ? __DEV__ : process.env.NODE_ENV !== 'production';
}
