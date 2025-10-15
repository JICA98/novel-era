import { View, ViewProps } from "react-native";
import { useAppTheme } from "@/app/providers/theme-provider";
import { cn } from "@/app/lib/cn";

interface ProgressProps extends ViewProps {
  value: number;
}

export function Progress({ value, className, style, ...viewProps }: ProgressProps & { className?: string }) {
  const { colors, radius } = useAppTheme();
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <View
      {...viewProps}
      className={cn("h-2 overflow-hidden", className)}
      style={[{ backgroundColor: colors.borderMuted, borderRadius: radius.pill }, style]}
    >
      <View
        style={{
          width: `${clamped}%`,
          height: "100%",
          backgroundColor: colors.accent,
          borderRadius: radius.pill,
        }}
      />
    </View>
  );
}
