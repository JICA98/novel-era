import { ReactNode } from "react";
import { Modal, Pressable, SafeAreaView, Text, View } from "react-native";
import { useAppTheme } from "@/app/providers/theme-provider";
import { Button } from "./button";
import { cn } from "@/app/lib/cn";

interface DialogProps {
  visible: boolean;
  title?: string;
  description?: string;
  onDismiss?: () => void;
  primaryAction?: { label: string; onPress: () => void };
  secondaryAction?: { label: string; onPress: () => void };
  children?: ReactNode;
}

export function Dialog({
  visible,
  title,
  description,
  onDismiss,
  primaryAction,
  secondaryAction,
  children,
}: DialogProps) {
  const { colors, radius, spacing } = useAppTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/40 px-6"
        onPress={onDismiss}
      >
        <Pressable onPress={() => {}} className="w-full">
          <SafeAreaView
            className="w-full rounded-3xl"
            style={{ backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, padding: spacing.lg }}
          >
          {title && (
            <Text className="text-lg font-semibold" style={{ color: colors.text }}>
              {title}
            </Text>
          )}
          {description && (
            <Text className="mt-2 text-base" style={{ color: colors.textMuted }}>
              {description}
            </Text>
          )}
          {children && <View className="mt-4" children={children} />}
          <View className="mt-6 flex-row justify-end gap-3">
            {secondaryAction && (
              <Button
                variant="ghost"
                onPress={secondaryAction.onPress}
                className={cn("px-3")}
              >
                {secondaryAction.label}
              </Button>
            )}
            {primaryAction && (
              <Button onPress={primaryAction.onPress}>{primaryAction.label}</Button>
            )}
          </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
