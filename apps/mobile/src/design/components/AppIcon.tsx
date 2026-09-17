import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { colors, iconSizes } from '../theme';

export type AppIconName = ComponentProps<typeof Ionicons>['name'];

type AppIconProps = {
  color?: ComponentProps<typeof Ionicons>['color'];
  name: AppIconName;
  size?: number;
};

export function AppIcon({
  color = colors.textSecondary,
  name,
  size = iconSizes.medium,
}: AppIconProps) {
  return <Ionicons color={color} name={name} size={size} />;
}
