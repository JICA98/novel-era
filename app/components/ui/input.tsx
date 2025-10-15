import { forwardRef } from "react";
import { StyleProp, TextInput, TextInputProps, TextStyle, View, ViewStyle } from "react-native";
import { useAppTheme } from "@/app/providers/theme-provider";
import { cn } from "@/app/lib/cn";

export interface InputProps extends TextInputProps {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  hasError?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      className,
      style: inputStyle,
      containerStyle,
      leadingIcon,
      trailingIcon,
      hasError,
      ...textInputProps
    },
    ref
  ) => {
    const { colors, radius, spacing } = useAppTheme();

    return (
      <View
        className={cn(
          "flex-row items-center gap-3 rounded-pill",
          className
        )}
        style={[
          {
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: hasError ? colors.danger : colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
          },
          containerStyle,
        ]}
      >
        {leadingIcon}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          {...textInputProps}
          style={[{ flex: 1, color: colors.text, fontSize: 16 } as TextStyle, inputStyle]}
        />
        {trailingIcon}
      </View>
    );
  }
);

Input.displayName = "Input";
