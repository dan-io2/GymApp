import { render, screen } from '@testing-library/react-native';

import { WelcomeScreen } from '../components/WelcomeScreen';

describe('WelcomeScreen', () => {
  it('renders the foundation welcome content', () => {
    render(<WelcomeScreen />);

    expect(screen.getByText('GymApp')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Nutrition tracking for lifters' })).toBeTruthy();
  });
});
