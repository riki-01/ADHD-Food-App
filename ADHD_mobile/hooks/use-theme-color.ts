/**
 * Returns theme colors - always uses light theme for consistency
 */

import { Colors } from '@/constants/theme';

export function useThemeColor(
  props: { light?: string },
  colorName: keyof typeof Colors
) {
  const colorFromProps = props.light;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[colorName];
  }
}
