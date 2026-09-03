import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

type PrimaryAuthButtonProps = {
  label: string;
  loadingLabel: string;
  isLoading: boolean;
  onPress: () => void;
};

export function PrimaryAuthButton({
  label,
  loadingLabel,
  isLoading,
  onPress,
}: PrimaryAuthButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isLoading, busy: isLoading }}
      disabled={isLoading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isLoading && styles.disabled,
        pressed && !isLoading && styles.pressed,
      ]}
    >
      {isLoading ? <ActivityIndicator color="#ffffff" /> : null}
      <Text style={styles.label}>{isLoading ? loadingLabel : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#1f7a54',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  disabled: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
