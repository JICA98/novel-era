import { Content, Repo } from "@/types";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useMemo } from "react";
import { Card, Icon, Text, useTheme } from "react-native-paper";

interface BookItemProps {
    repo: Repo;
    item: Content;
    onLinkPress?: (link: string, item: Content) => void;
}

export default function BookItem({ repo, item, onLinkPress }: BookItemProps) {
    const theme = useTheme();
    const size = 44.0;
    const ratingLabel = item.rating ? `${item.rating} ★` : undefined;
    const coverUri = item.bookImage?.length ? item.bookImage : `https://picsum.photos/seed/${item.bookId}/200/300`;
    const subtitle = item.bookLink?.length ? item.bookLink : undefined;

    const resolvedLink = useMemo(() => (subtitle ? resolveLink(repo.repoUrl, subtitle) : undefined), [repo.repoUrl, subtitle]);
    const linkLabel = useMemo(() => (resolvedLink ? formatLinkLabel(resolvedLink) : undefined), [resolvedLink]);

    const handleLinkPress = () => {
        if (!resolvedLink) {
            return;
        }

        if (onLinkPress) {
            onLinkPress(resolvedLink, item);
            return;
        }

        router.push({
            pathname: "/browser",
            params: {
                url: resolvedLink,
                title: item.title,
            },
        } as never);
    };

    return (
        <Card
            style={styles.card}
            onPress={() => {
                router.push({
                    pathname: '/contents',
                    params: { content: JSON.stringify(item), repo: JSON.stringify(repo) }
                } as never);
            }}
        >
            <View style={styles.row}>
                <Card.Cover source={{ uri: coverUri }} style={[styles.cover, { width: size * 2, height: size * 3 }]} />
                <View style={styles.info}>
                    <Text variant="titleMedium" numberOfLines={2} style={styles.title}>
                        {item.title}
                    </Text>
                    {linkLabel && (
                        <Pressable onPress={handleLinkPress} style={styles.linkWrapper} accessibilityRole="link">
                            <View style={styles.linkContent}>
                                <Icon source="open-in-new" size={16} color={theme.colors.primary} />
                                <Text
                                    variant="bodyMedium"
                                    numberOfLines={1}
                                    style={[styles.link, { color: theme.colors.primary }]}
                                >
                                    {linkLabel}
                                </Text>
                            </View>
                        </Pressable>
                    )}
                    {ratingLabel && (
                        <Text variant="labelLarge" style={styles.rating}>
                            {ratingLabel}
                        </Text>
                    )}
                </View>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        marginVertical: 4,
        elevation: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 12,
    },
    cover: {
        marginRight: 12,
        borderRadius: 6,
    },
    info: {
        flex: 1,
    },
    title: {
        marginRight: 12,
    },
    linkWrapper: {
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    link: {
        textDecorationLine: 'none',
        marginLeft: 6,
    },
    linkContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        marginHorizontal: 16,
        marginBottom: 12,
    },
});

function resolveLink(repoUrl: string, link?: string): string | undefined {
    if (!link) {
        return undefined;
    }

    if (/^https?:\/\//i.test(link)) {
        return link;
    }

    if (link.startsWith("//")) {
        return `https:${link}`;
    }

    if (!repoUrl) {
        return undefined;
    }

    const normalizedBase = repoUrl.endsWith("/") ? repoUrl.slice(0, -1) : repoUrl;
    const normalizedLink = link.startsWith("/") ? link : `/${link}`;
    return `${normalizedBase}${normalizedLink}`;
}

function formatLinkLabel(link: string): string {
    try {
        const url = new URL(link);
        const path = url.pathname.replace(/\/+$/, "");
        const displayPath = path.length > 1 ? path : "";
        const simplified = [url.hostname, displayPath].filter(Boolean).join("");
        return truncateLink(simplified || url.hostname || link);
    } catch (error) {
        return truncateLink(link.replace(/^https?:\/\//i, ""));
    }
}

function truncateLink(label: string, maxLength = 36): string {
    if (label.length <= maxLength) {
        return label;
    }
    return `${label.slice(0, maxLength - 3)}...`;
}