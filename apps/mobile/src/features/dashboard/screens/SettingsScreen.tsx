import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  AppButton,
  AppCard,
  AppIcon,
  AppScreen,
  type AppIconName,
  SectionHeader,
} from '@/design/components';
import { accents, colors, radii, spacing, typography } from '@/design/theme';
import { AuthMessage } from '@/features/auth/components/AuthMessage';
import { useAuth } from '@/features/auth/context/AuthContext';
import { mapAuthError } from '@/features/auth/services/authErrors';

export function SettingsScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) return;
    setErrorMessage(null);
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      setErrorMessage(mapAuthError(error).message);
      setIsSigningOut(false);
    }
  }

  return (
    <AppScreen>
      <View>
        <Text style={styles.kicker}>Account and tools</Text>
        <Text accessibilityRole="header" style={styles.title}>
          More
        </Text>
      </View>

      <AppCard raised style={styles.accountCard}>
        <View style={styles.avatar}>
          <AppIcon color={colors.accent} name="person-outline" size={26} />
        </View>
        <View style={styles.accountCopy}>
          <Text style={styles.accountLabel}>Signed in</Text>
          <Text numberOfLines={1} style={styles.email}>
            {user?.email ?? 'GymApp account'}
          </Text>
        </View>
      </AppCard>

      {errorMessage ? <AuthMessage message={errorMessage} tone="error" /> : null}

      <View style={styles.section}>
        <SectionHeader title="Nutrition" />
        <AppCard style={styles.list}>
          <DisclosureRow
            color={accents.nutrition.foreground}
            icon="options-outline"
            label="Nutrition goals"
            onPress={() => router.push('/goals/edit')}
          />
          <DisclosureRow
            color={accents.analytics.foreground}
            icon="heart-outline"
            label="Favorites"
            onPress={() => router.push('/find-food')}
          />
          <DisclosureRow
            color={accents.carbohydrate.foreground}
            icon="restaurant-outline"
            label="Saved meals"
            onPress={() => router.push('/saved-meals')}
          />
          <DisclosureRow
            color={accents.weight.foreground}
            icon="create-outline"
            label="Custom food"
            onPress={() => router.push('/manual-food')}
          />
        </AppCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Preferences" />
        <AppCard style={styles.list}>
          <DisclosureRow
            color={colors.warning}
            icon="notifications-outline"
            label="Reminders"
            onPress={() => router.push('/reminders')}
          />
          <DisclosureRow
            color={accents.weight.foreground}
            icon="scale-outline"
            label="Weight and units"
            onPress={() => router.push('/progress')}
          />
        </AppCard>
      </View>

      <AppButton
        icon="log-out-outline"
        label={isSigningOut ? 'Signing out' : 'Sign out'}
        loading={isSigningOut}
        onPress={() => void handleSignOut()}
        tone="danger"
      />
    </AppScreen>
  );
}

function DisclosureRow({
  color,
  icon,
  label,
  onPress,
}: {
  color: string;
  icon: AppIconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.rowIcon, { backgroundColor: `${color}1F` }]}>
        <AppIcon color={color} name={icon} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <AppIcon color={colors.textMuted} name="chevron-forward" size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kicker: { ...typography.caption, color: colors.accent, textTransform: 'uppercase' },
  title: { ...typography.screenTitle, color: colors.textPrimary, marginTop: spacing.xxs },
  accountCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.accentMuted,
    borderRadius: radii.card,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  accountCopy: { flex: 1 },
  accountLabel: { ...typography.micro, color: colors.textMuted, textTransform: 'uppercase' },
  email: { ...typography.bodyStrong, color: colors.textPrimary, marginTop: spacing.xxs },
  section: { gap: spacing.sm },
  list: { paddingVertical: 0 },
  row: {
    alignItems: 'center',
    borderBottomColor: colors.borderSubtle,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 58,
  },
  rowPressed: { opacity: 0.6 },
  rowIcon: {
    alignItems: 'center',
    borderRadius: radii.medium,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  rowLabel: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1 },
});
