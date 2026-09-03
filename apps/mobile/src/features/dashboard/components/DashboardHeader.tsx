import { Pressable, StyleSheet, Text, View } from 'react-native';

type DashboardHeaderProps = {
  email?: string | null;
  onOpenSettings: () => void;
};

export function DashboardHeader({ email, onOpenSettings }: DashboardHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.identity}>
        <Text style={styles.brand}>GymApp</Text>
        <Text style={styles.greeting}>Welcome back{email ? `, ${email.split('@')[0]}` : ''}</Text>
      </View>
      <Pressable
        accessibilityLabel="Open account settings"
        accessibilityRole="button"
        hitSlop={10}
        onPress={onOpenSettings}
        style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
      >
        <Text style={styles.settingsIcon}>Settings</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  identity: {
    flex: 1,
    paddingRight: 16,
  },
  brand: {
    color: '#17211b',
    fontSize: 22,
    fontWeight: '900',
  },
  greeting: {
    color: '#617067',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  settingsButton: {
    alignItems: 'center',
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 92,
    paddingHorizontal: 12,
  },
  settingsIcon: {
    color: '#1f7a54',
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
});
