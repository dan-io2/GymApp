import { Pressable, StyleSheet, Text } from 'react-native';

type OnboardingButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
};

export function OnboardingButton({
  disabled = false,
  label,
  onPress,
  variant = 'primary',
}: OnboardingButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' ? styles.secondary : styles.primary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === 'secondary' ? styles.secondaryLabel : styles.primaryLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: '#1f8a5b',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: '#c8d2c8',
    borderWidth: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
  },
  primaryLabel: {
    color: '#ffffff',
  },
  secondaryLabel: {
    color: '#17211b',
  },
  disabled: {
    opacity: 0.58,
  },
  pressed: {
    opacity: 0.88,
  },
});
