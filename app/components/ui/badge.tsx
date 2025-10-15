import { ReactNode } from "react";
import { Text, View, ViewProps } from "react-native";
import { useAppTheme } from "@/app/providers/theme-provider";
import { cn } from "@/app/lib/cn";

type BadgeTone = "default" | "accent" | "success" | "warning" | "danger";

interface BadgeProps extends ViewProps {
  children: ReactNode;
  tone?: BadgeTone;
}

export function Badge({ children, tone = "default", className, style, ...viewProps }: BadgeProps & { className?: string }) {
  const { colors } = useAppTheme();
  const palette: Record<BadgeTone, { background: string; text: string }> = {
    default: { background: colors.borderMuted, text: colors.text },
    accent: { background: colors.accentMuted, text: colors.accent },
    success: { background: "#dcfce7", text: "#166534" },
    warning: { background: "#fef3c7", text: "#92400e" },
    danger: { background: "#fee2e2", text: "#991b1b" },
  } as const;

  const selected = palette[tone];

  return (
    <View
      {...viewProps}
      className={cn("self-start rounded-pill px-3 py-1", className)}
      style={[{ backgroundColor: selected.background }, style]}
    >
      <Text className="text-xs font-semibold" style={{ color: selected.text }}>
        {children}
      </Text>
    </View>
  );
}
