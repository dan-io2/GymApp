import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { SettingsScreen } from '../SettingsScreen';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
  }),
}));

jest.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const authContext = jest.requireMock('@/features/auth/context/AuthContext') as {
  useAuth: jest.Mock;
};

describe('SettingsScreen', () => {
  it('shows the signed-in email and keeps sign out available', async () => {
    const signOut = jest.fn().mockResolvedValue(undefined);

    authContext.useAuth.mockReturnValue({
      signOut,
      user: {
        email: 'test@example.com',
      },
    });

    render(<SettingsScreen />);

    expect(screen.getByText('Signed in as test@example.com.')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1);
    });
  });
});
