import { ReactNode } from "react";
import { View, ViewProps } from "react-native";
import { MotiView } from "moti";
import { useAppTheme } from "@/app/providers/theme-provider";
import { cn } from "@/app/lib/cn";

interface SkeletonProps extends ViewProps {
  children?: ReactNode;
  shimmer?: boolean;
}

export function Skeleton({ children, shimmer = true, className, style, ...viewProps }: SkeletonProps & { className?: string }) {
  const { colors, radius } = useAppTheme();
  return (
    <View
      {...viewProps}
      className={cn("overflow-hidden rounded-2xl", className)}
      style={[{ backgroundColor: colors.borderMuted, borderRadius: radius.md }, style]}
    >
      {shimmer ? (
        <MotiView
          from={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ loop: true, type: "timing", duration: 900 }}
          style={{ flex: 1 }}
        >
          {children}
        </MotiView>
      ) : (
        children
      )}
    </View>
  );
}
