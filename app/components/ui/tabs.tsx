import { ReactNode, cloneElement, isValidElement } from "react";
import { Pressable, Text, View } from "react-native";
import { MotiView } from "moti";
import { useAppTheme } from "@/app/providers/theme-provider";
import { cn } from "@/app/lib/cn";

export type TabItem = {
  key: string;
  label: string;
  icon?: ReactNode;
};

interface TabsProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeKey, onChange, className }: TabsProps) {
  const { colors } = useAppTheme();
  return (
    <View
      className={cn(
        "flex-row rounded-3xl bg-surface-subtle dark:bg-surface px-2 py-2",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        const icon =
          tab.icon && isValidElement(tab.icon)
            ? cloneElement(tab.icon, {
                color: isActive ? colors.accent : colors.textMuted,
              } as any)
            : tab.icon;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            className="flex-1"
            onPress={() => onChange(tab.key)}
          >
            <View className="relative items-center justify-center overflow-hidden rounded-2xl px-3 py-3">
              {isActive && (
                <MotiView
                  from={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "timing", duration: 180 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 24,
                    backgroundColor: colors.accentMuted,
                  }}
                />
              )}
              {icon}
              <Text
                className="mt-1 text-sm font-medium"
                style={{ color: isActive ? colors.accent : colors.textMuted }}
              >
                {tab.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
