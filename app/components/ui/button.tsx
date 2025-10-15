import { ReactNode } from "react";
import { ActivityIndicator, Pressable, PressableProps, Text } from "react-native";
import { useAppTheme } from "@/app/providers/theme-provider";
import { cn } from "@/app/lib/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<PressableProps, "children"> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  isLoading?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "px-4",
  secondary: "px-4",
  outline: "border px-4",
  ghost: "px-4",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "h-9 px-3",
  md: "h-11 px-4",
  lg: "h-12 px-5",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  isLoading,
  className,
  style,
  ...pressableProps
}: ButtonProps & { className?: string }) {
  const { colors, radius } = useAppTheme();
  const isDisabled = pressableProps.disabled || isLoading;
  const baseStyle = {
    borderRadius: radius.lg,
    backgroundColor:
      variant === "primary"
        ? colors.accent
        : variant === "secondary"
        ? colors.surfaceElevated
        : "transparent",
    borderColor: variant === "outline" ? colors.border : undefined,
  } as const;

  return (
    <Pressable
      accessibilityRole="button"
      {...pressableProps}
      className={cn(
        "flex-row items-center justify-center rounded-2xl",
        VARIANT_CLASSES[variant],
        SIZE_STYLES[size],
        isDisabled ? "opacity-60" : "",
        className
      )}
      style={(state) => {
        const resolved = typeof style === "function" ? style(state) : style;
        return [
          baseStyle,
          resolved,
          state.pressed && !isDisabled ? { opacity: 0.92 } : null,
        ];
      }}
      disabled={isDisabled}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.accentOn} />
      ) : (
        <>
          {icon && (
            <Text
              style={{ color: variant === "primary" ? colors.accentOn : colors.text }}
              className="mr-2"
            >
              {icon}
            </Text>
          )}
          <Text
            className="text-base font-medium"
            style={{ color: variant === "primary" ? colors.accentOn : colors.text }}
          >
            {children}
          </Text>
        </>
      )}
    </Pressable>
  );
}
