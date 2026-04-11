/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/Colors';
import { useAppTheme } from '@/hooks/useAppTheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useAppTheme();
  const colorMode = theme.dark ? 'dark' : 'light';
  const colorFromProps = props[colorMode];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[colorMode][colorName];
  }
}
