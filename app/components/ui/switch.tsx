import { Switch as RNSwitch, SwitchProps } from "react-native";
import { useAppTheme } from "@/app/providers/theme-provider";

export function Switch(props: SwitchProps) {
  const { colors } = useAppTheme();
  return (
    <RNSwitch
      trackColor={{ false: colors.borderMuted, true: colors.accentMuted }}
      thumbColor={props.value ? colors.accent : colors.surface}
      ios_backgroundColor={colors.borderMuted}
      {...props}
    />
  );
}
