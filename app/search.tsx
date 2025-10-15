import { Repo } from "@/types";
import { useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { MotiView } from "moti";
import UseRepositoryLayout from "./_repos";
import { Avatar, Badge, Card, Input, Button } from "@/app/components/ui";
import { useAppTheme } from "@/app/providers/theme-provider";
import { EmptyPlaceholder } from "./placeholders";

type SearchVariant = "full" | "preview";

interface SearchLayoutProps {
    variant?: SearchVariant;
}

export default function SearchLayout({ variant = "full" }: SearchLayoutProps) {
    return (
        <UseRepositoryLayout
            props={{
                renderRepositories: (repos) => <SearchContent repos={repos} variant={variant} />,
            }}
        />
    );
}

function SearchContent({ repos, variant }: { repos: Repo[]; variant: SearchVariant }) {
    const { colors } = useAppTheme();
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        if (!query) {
            return repos;
        }
        const normalized = query.trim().toLowerCase();
        return repos.filter((repo) => repo.name.toLowerCase().includes(normalized));
    }, [query, repos]);

        const handleNavigate = (repo: Repo) => {
            router.push({ pathname: "/repos", params: { repo: JSON.stringify(repo) } } as never);
    };

    if (variant === "preview") {
        const previewItems = repos.slice(0, 3);
        return (
        <View className="mt-8">
                <View className="flex-row items-center justify-between px-6">
                    <Text style={{ color: colors.text }} className="text-xl font-semibold">
                        Discover repositories
                    </Text>
                    <Button
                        variant="ghost"
                        onPress={() => router.push("/search")}
                        className="px-1"
                    >
                        View all
                    </Button>
                </View>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={previewItems}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20, gap: 16 }}
                    renderItem={({ item, index }) => (
                        <MotiView
                            from={{ opacity: 0, translateY: 18 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: "timing", duration: 220, delay: index * 40 }}
                        >
                            <Card style={{ width: 220 }}>
                                <Avatar
                                    uri={`https://picsum.photos/seed/${item.idName}/120/120`}
                                    size={60}
                                    className="mb-3 self-start"
                                />
                                <Text style={{ color: colors.text }} className="text-lg font-semibold">
                                    {item.name}
                                </Text>
                                                <Text style={{ color: colors.textMuted }} className="mt-2 text-sm leading-5">
                                                    {item.repoType} repository
                                </Text>
                                                <Button
                                                    variant="ghost"
                                                    className="mt-6 self-start"
                                                    onPress={() => handleNavigate(item)}
                                                    icon={<Feather name="arrow-right" size={16} />}
                                                >
                                    Open repo
                                </Button>
                            </Card>
                        </MotiView>
                    )}
                />
            </View>
        );
    }

    return (
        <View className="flex-1 px-6 py-10">
            <Text style={{ color: colors.text }} className="text-3xl font-semibold">
                Search catalog
            </Text>
            <Text style={{ color: colors.textMuted }} className="mt-2 leading-6">
                Browse curated repositories. Use the floating search to find new translations and sources quickly.
            </Text>

                    <Input
                className="mt-6"
                placeholder="Search repositories"
                value={query}
                        leadingIcon={<Feather name="search" size={18} color={colors.textMuted} />}
                onChangeText={setQuery}
            />

                    {filtered.length === 0 ? (
                        <EmptyPlaceholder message="No repositories match your search." />
                    ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ gap: 16, paddingVertical: 24 }}
                    renderItem={({ item, index }) => (
                        <MotiView
                            from={{ opacity: 0, translateY: 12 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: "timing", duration: 220, delay: index * 25 }}
                        >
                            <Card>
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-1 pr-4">
                                        <Text style={{ color: colors.text }} className="text-lg font-semibold">
                                            {highlightText(item.name, query, colors.accent)}
                                        </Text>
                                        <Text style={{ color: colors.textMuted }} className="mt-2 text-sm">
                                            {item.repoUrl}
                                        </Text>
                                                            <Badge tone="accent" className="mt-3 self-start">
                                                                {item.repoType}
                                        </Badge>
                                    </View>
                                    <Avatar
                                        uri={`https://picsum.photos/seed/${item.idName}/120/120`}
                                        size={64}
                                        className="ml-4"
                                    />
                                </View>
                                                <Button
                                                    variant="ghost"
                                                    className="mt-6 self-start"
                                                    onPress={() => handleNavigate(item)}
                                                    icon={<Feather name="book-open" size={16} />}
                                                >
                                    View repository
                                </Button>
                            </Card>
                        </MotiView>
                    )}
                    ListFooterComponent={<View style={{ height: 24 }} />}
                />
            )}
        </View>
    );
}

function highlightText(text: string, query: string, accentColor: string) {
    if (!query.trim()) {
        return text;
    }
    const regex = new RegExp(`(${query})`, "ig");
    const parts = text.split(regex);
    return (
        <Text>
            {parts.map((part, index) => (
                <Text
                    key={`${part}-${index}`}
                    style={{ color: part.toLowerCase() === query.toLowerCase() ? accentColor : undefined, fontWeight: part.toLowerCase() === query.toLowerCase() ? "700" : "600" }}
                >
                    {part}
                </Text>
            ))}
        </Text>
    );
}