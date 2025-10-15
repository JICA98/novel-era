import { ReactNode } from "react";
import { View, ViewProps } from "react-native";
import { useAppTheme } from "@/app/providers/theme-provider";
import { cn } from "@/app/lib/cn";

interface CardProps extends ViewProps {
  children: ReactNode;
  padded?: boolean;
  elevated?: boolean;
  bleed?: boolean;
}

export function Card({
  children,
  padded = true,
  elevated,
  bleed,
  className,
  style,
  ...viewProps
}: CardProps & { className?: string }) {
  const { colors, shadow, radius, spacing } = useAppTheme();
  return (
    <View
      {...viewProps}
      className={cn(
        "rounded-3xl",
        padded ? "p-4" : "",
        bleed ? "mx-0" : "",
        className
      )}
      style={[
        {
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          padding: padded ? spacing.lg : undefined,
          ...(elevated ? shadow.sm : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
