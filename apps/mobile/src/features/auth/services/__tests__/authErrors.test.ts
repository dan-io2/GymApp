import { AuthApiError } from '@supabase/supabase-js';

import { mapAuthError } from '../authErrors';

describe('mapAuthError', () => {
  it('maps invalid credentials to a friendly message', () => {
    const error = new AuthApiError('Invalid login credentials', 400, 'invalid_credentials');

    expect(mapAuthError(error).message).toBe('The email or password you entered is incorrect.');
  });

  it('maps email send rate limits to an actionable retry message', () => {
    const error = new AuthApiError('email rate limit exceeded', 429, 'over_email_send_rate_limit');

    expect(mapAuthError(error)).toMatchObject({
      code: 'rate_limited',
      message: 'Too many attempts. Please wait a moment and try again.',
      status: 429,
    });
  });

  it('maps disabled email signup to an actionable availability message', () => {
    const error = new AuthApiError('Email signups are disabled', 400, 'email_provider_disabled');

    expect(mapAuthError(error)).toMatchObject({
      code: 'email_signup_disabled',
      message: 'Account registration is currently unavailable. Please try again later.',
    });
  });

  it('maps duplicate registration to a friendly message', () => {
    const error = new AuthApiError('User already registered', 422, 'user_already_exists');

    expect(mapAuthError(error).message).toBe(
      'An account with this email already exists. Try signing in instead.',
    );
  });

  it('maps invalid email errors to a field-actionable message', () => {
    const error = new AuthApiError('Invalid email', 400, 'email_address_invalid');

    expect(mapAuthError(error)).toMatchObject({
      code: 'invalid_email',
      message: 'Enter a valid email address.',
    });
  });

  it('maps weak password details to the safest available requirement', () => {
    const error = new AuthApiError('Password must be at least 8 characters', 422, 'weak_password');

    expect(mapAuthError(error)).toMatchObject({
      code: 'weak_password',
      message: 'Password must be at least 8 characters.',
    });
  });

  it('maps network errors to a connection message', () => {
    expect(mapAuthError(new Error('Failed to fetch')).message).toBe(
      'Unable to connect. Check your internet connection and try again.',
    );
  });

  it('uses a generic message for unexpected errors', () => {
    expect(mapAuthError(new Error('Internal auth service detail'))).toMatchObject({
      code: 'unexpected',
      message: "We couldn't create your account. Please try again.",
      diagnosticMessage: 'Internal auth service detail',
    });
  });

  it('does not remap existing app auth errors', () => {
    const mapped = mapAuthError(
      new AuthApiError('email rate limit exceeded', 429, 'over_email_send_rate_limit'),
    );

    expect(mapAuthError(mapped)).toBe(mapped);
  });
});
