import { signInSchema, signUpSchema } from '../authSchemas';

describe('auth schemas', () => {
  it('accepts valid sign-in input', () => {
    expect(
      signInSchema.parse({
        email: 'person@example.com',
        password: 'password123',
      }),
    ).toEqual({
      email: 'person@example.com',
      password: 'password123',
    });
  });

  it('rejects invalid sign-in email input', () => {
    expect(() =>
      signInSchema.parse({
        email: 'not-an-email',
        password: 'password123',
      }),
    ).toThrow('Enter a valid email address.');
  });

  it('rejects weak sign-up passwords before calling Supabase', () => {
    expect(() =>
      signUpSchema.parse({
        email: 'person@example.com',
        password: 'short',
        confirmPassword: 'short',
      }),
    ).toThrow('Password must be at least 8 characters.');
  });

  it('rejects sign-up when passwords do not match', () => {
    expect(() =>
      signUpSchema.parse({
        email: 'person@example.com',
        password: 'password123',
        confirmPassword: 'different123',
      }),
    ).toThrow('Passwords do not match.');
  });
});
