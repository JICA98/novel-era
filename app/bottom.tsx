import { ReactNode, cloneElement, isValidElement } from "react";
import { Pressable, Text, View } from "react-native";
import { MotiView } from "moti";
import { create } from "zustand";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/app/providers/theme-provider";

export const indexes = {
    feed: 0,
    favorites: 1,
    recents: 2,
    settings: 3,
} as const;

type BottomKey = keyof typeof indexes;

export type TabConfig = {
    key: BottomKey;
    label: string;
    icon: ReactNode;
};

type BottomStore = {
    index: number;
    setIndex: (index: number) => void;
};

export const useBottomIndexStore = create<BottomStore>((set) => ({
    index: indexes.feed,
    setIndex: (index: number) => set({ index }),
}));

interface BottomNavProps {
    tabs: TabConfig[];
}

export function BottomNav({ tabs }: BottomNavProps) {
    const { colors } = useAppTheme();
        const index = useBottomIndexStore((state) => state.index);
        const setIndex = useBottomIndexStore((state) => state.setIndex);
    const insets = useSafeAreaInsets();

    return (
        <View style={{ paddingBottom: insets.bottom + 12 }} className="px-5">
            <View
                className="flex-row items-center justify-between rounded-3xl bg-surface-subtle dark:bg-surface px-2 py-2"
                style={{ borderColor: colors.border, borderWidth: 1 }}
            >
                {tabs.map((tab, tabIndex) => {
                    const isActive = tabIndex === index;
                    const icon =
                        isValidElement(tab.icon)
                            ? cloneElement(tab.icon, {
                                    color: isActive ? colors.accent : colors.textMuted,
                                } as any)
                            : tab.icon;
                    return (
                        <Pressable
                            key={tab.key}
                            accessibilityRole="tab"
                            className="flex-1"
                            onPress={() => setIndex(tabIndex)}
                        >
                            <View className="relative items-center justify-center overflow-hidden rounded-2xl px-3 py-2">
                                {isActive && (
                                    <MotiView
                                        from={{ opacity: 0, scale: 0.92 }}
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
                                    className="mt-1 text-xs font-medium"
                                    style={{ color: isActive ? colors.accent : colors.textMuted }}
                                >
                                    {tab.label}
                                </Text>
                            </View>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}