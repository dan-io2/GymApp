import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radii, spacing } from '../theme';

type AppCardProps = ViewProps & {
  children: ReactNode;
  raised?: boolean;
};

export function AppCard({ children, raised = false, style, ...props }: AppCardProps) {
  return (
    <View style={[styles.card, raised && styles.raised, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  raised: { backgroundColor: colors.surfaceElevated, borderColor: colors.borderStrong },
});
