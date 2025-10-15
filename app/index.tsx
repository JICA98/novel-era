import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { MotiView } from "moti";
import { BottomNav, TabConfig, indexes, useBottomIndexStore } from "./bottom";
import FavoriteScreen from "./favorites/_layout";
import Recents from "./recents";
import Settings from "./settings/_layout";
import SearchLayout from "./search";
import { useAppTheme } from "@/app/providers/theme-provider";
import { Avatar, Button, Card } from "@/app/components/ui";

const ICON_SIZE = 20;
const tabsConfig: TabConfig[] = [
    { key: "feed", label: "Feed", icon: <Feather name="book-open" size={ICON_SIZE} /> },
    { key: "favorites", label: "Favorites", icon: <Feather name="heart" size={ICON_SIZE} /> },
    { key: "recents", label: "Recents", icon: <Feather name="clock" size={ICON_SIZE} /> },
    { key: "settings", label: "Settings", icon: <Feather name="settings" size={ICON_SIZE} /> },
] as const;

export default function Index() {
    const { colors } = useAppTheme();
    const index = useBottomIndexStore((state) => state.index);
    const isFeed = index === indexes.feed;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            {isFeed ? (
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="px-6 pt-10">
                        <View className="flex-row items-center justify-between">
                            <View>
                                <Text style={{ color: colors.textMuted }} className="text-sm uppercase tracking-wide">
                                    Welcome back
                                </Text>
                                <Text style={{ color: colors.text }} className="mt-1 text-3xl font-semibold">
                                    Novel Era
                                </Text>
                            </View>
                            <Avatar size={48} source={require("../assets/images/icon.png")} />
                        </View>

                        <MotiView
                            from={{ translateY: 16, opacity: 0 }}
                            animate={{ translateY: 0, opacity: 1 }}
                            transition={{ type: "timing", duration: 240 }}
                        >
                            <Card elevated className="mt-8">
                                <Text style={{ color: colors.text }} className="text-2xl font-semibold">
                                    Continue your story
                                </Text>
                                <Text style={{ color: colors.textMuted }} className="mt-2 leading-6">
                                    Jump back into your saved novels or explore curated repositories inspired by shadcn's clean aesthetic.
                                </Text>
                                                <Button className="mt-6 self-start" onPress={() => useBottomIndexStore.getState().setIndex(indexes.recents)}>
                                    Resume Reading
                                </Button>
                            </Card>
                        </MotiView>

                        <MotiView
                            from={{ translateY: 24, opacity: 0 }}
                            animate={{ translateY: 0, opacity: 1 }}
                            transition={{ type: "timing", duration: 260, delay: 80 }}
                        >
                            <FeedDiscover />
                        </MotiView>
                    </View>
                </ScrollView>
            ) : (
                <View style={{ flex: 1 }}>
                    <ActiveTabContent index={index} />
                </View>
            )}

            <BottomNav tabs={tabsConfig} />
        </SafeAreaView>
    );
}

function FeedDiscover() {
    return (
        <SearchLayout variant="preview" />
    );
}

function ActiveTabContent({ index }: { index: number }) {
    switch (index) {
        case indexes.favorites:
            return <FavoriteScreen />;
        case indexes.recents:
            return <Recents />;
        case indexes.settings:
            return <Settings />;
        default:
            return null;
    }
}