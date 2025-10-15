import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { MotiView } from "moti";
import { ThemeOptions, UserPreferences } from "../userpref";
import { AccentColor, DEFAULT_ACCENT } from "@/app/theme";
import { Button, Card } from "@/app/components/ui";
import { useAppTheme } from "@/app/providers/theme-provider";

const themeModes: Array<{ value: ThemeOptions; title: string; description: string }> = [
    {
        value: ThemeOptions.System,
        title: "System",
        description: "Match your device appearance.",
    },
    {
        value: ThemeOptions.Light,
        title: "Light",
        description: "Bright surfaces for daytime reading.",
    },
    {
        value: ThemeOptions.Dark,
        title: "Dark",
        description: "Dimmed palette for night sessions.",
    },
];

const accentPalette: AccentColor[] = ["violet", "blue", "amber", "teal"];
const accentColors: Record<AccentColor, string> = {
    violet: "#7c3aed",
    blue: "#3b82f6",
    amber: "#f59e0b",
    teal: "#14b8a6",
};

export function ThemeSelectionAccordion({
    userPref,
    setUserPref,
    setSnackbarText,
}: {
    userPref: UserPreferences;
    setUserPref: (pref: UserPreferences) => void;
    setSnackbarText: (text: string) => void;
}) {
    const { colors } = useAppTheme();
    const [pendingTheme, setPendingTheme] = useState<ThemeOptions>(userPref.theme);
    const [pendingAccent, setPendingAccent] = useState<AccentColor>(userPref.accent ?? DEFAULT_ACCENT);

    const handleApply = () => {
        setUserPref({ ...userPref, theme: pendingTheme, accent: pendingAccent });
        setSnackbarText("Theme updated");
    };

    return (
        <Card elevated className="m-4">
            <Text style={{ color: colors.text }} className="text-lg font-semibold">
                Appearance
            </Text>
            <Text style={{ color: colors.textMuted }} className="mt-2 text-sm leading-6">
                Choose how Novel Era adapts to your system and pick an accent color for highlights.
            </Text>

            <View className="mt-6 gap-3">
                {themeModes.map((mode) => {
                    const selected = pendingTheme === mode.value;
                    return (
                        <Pressable
                            key={mode.value}
                            onPress={() => setPendingTheme(mode.value)}
                            className="rounded-3xl"
                            style={{
                                borderWidth: 1,
                                borderColor: selected ? colors.accent : colors.border,
                                backgroundColor: selected ? colors.accentMuted : colors.surface,
                                paddingHorizontal: 16,
                                paddingVertical: 14,
                            }}
                        >
                            <Text
                                style={{ color: colors.text, fontWeight: "600" }}
                                className="text-base"
                            >
                                {mode.title}
                            </Text>
                            <Text style={{ color: colors.textMuted }} className="mt-1 text-sm">
                                {mode.description}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <Text style={{ color: colors.text, fontWeight: "600" }} className="mt-6">
                Accent color
            </Text>
            <View className="mt-3 flex-row flex-wrap gap-3">
                        {accentPalette.map((accent) => {
                            const selected = pendingAccent === accent;
                            const swatch = accentColors[accent];
                    return (
                        <Pressable
                            key={accent}
                            onPress={() => setPendingAccent(accent)}
                            className="h-10 w-10 items-center justify-center rounded-full"
                            style={{
                                        backgroundColor: swatch,
                                opacity: selected ? 1 : 0.4,
                                        borderWidth: selected ? 2 : 0,
                                        borderColor: selected ? colors.accentOn : "transparent",
                            }}
                        >
                            {selected && (
                                <MotiView
                                    from={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "timing", duration: 180 }}
                                            style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: colors.accentOn }}
                                />
                            )}
                        </Pressable>
                    );
                })}
            </View>

            <Button className="mt-8" onPress={handleApply}>
                Apply changes
            </Button>
        </Card>
    );
}