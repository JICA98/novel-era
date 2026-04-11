import { ActivityIndicator, Appbar, useTheme } from "react-native-paper";
import { FlatList, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Content, FetchData, normalizeUrl, processData, Repo, resolveRepoTag, SelectorType } from "@/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import IDOMParser from "advanced-html-parser";
import { Searchbar } from 'react-native-paper';
import jsonpath from 'jsonpath';
import { MenuFunction } from "../components/menu";
import BookItem from "./bookItem";
import { emptyPlaceholder, errorPlaceholder } from "../placeholders";
import { httpGet } from "../storage";

const inFlightContentRequests = new Map<string, Promise<Content[]>>();

export async function fetchContentList({ repo, searchQuery, cached }: { repo: Repo; searchQuery?: string; cached?: boolean }): Promise<Content[]> {
    try {
        const matchedTag = resolveRepoTag(repo, searchQuery);
        const selector = searchQuery
            ? (matchedTag ? repo.repoTagSearch : repo.repoSearch)
            : repo.listSelector;
        if (!selector) {
            return [];
        }

        const safePath = selector.path
            ?.replace('[text]', encodeURIComponent(searchQuery ?? ''))
            .replace('[tag]', encodeURIComponent(matchedTag?.value ?? '')) ?? '';
        const url = `${repo.repoUrl}${safePath}`;
        const requestKey = `${repo.id}:${url}`;
        const existingRequest = inFlightContentRequests.get(requestKey);
        if (existingRequest) {
            return await existingRequest;
        }

        const requestPromise = httpGet<Content[]>(url, {
            cached,
            cachedKey: `content-storage-${repo.id}-${url}`,
            onCache: (data) => !!data.length,
            onResponse: async (response) => {
                let html = '';
                if (selector.type === SelectorType.http) {
                    const json = await response.json();
                    const extracted = jsonpath.query(json, selector.jsonPath);
                    html = Array.isArray(extracted) ? extracted.join('\n') : String(extracted?.[0] ?? '');
                } else {
                    html = await response.text();
                }
                const dom = IDOMParser.parse(html).documentElement;
                const list = dom.querySelectorAll(selector.selector);

                return Array.from(list).map((item) => {
                    const title = processData(item, selector.title);
                    let bookImage = processData(item, selector.bookImage);
                    if (!bookImage && selector.bookImage.attribute !== 'src') {
                        bookImage = processData(item, { ...selector.bookImage, attribute: 'src' });
                    }
                    const bookLink = processData(item, selector.bookLink);
                    const bookId = processData(item, selector.bookId);
                    let rating = undefined;
                    if ('rating' in selector && selector.rating) {
                        rating = processData(item, selector.rating);
                    }
                    bookImage = normalizeUrl(bookImage, repo.repoUrl);
                    return { title, bookImage, bookLink, bookId, rating };
                });
            }
        }).finally(() => {
            inFlightContentRequests.delete(requestKey);
        });

        inFlightContentRequests.set(requestKey, requestPromise);
        return (await requestPromise) ?? [];
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch content');
    }
}

interface RepoContentLayoutProps {
    repo: Repo;
    showHeader?: boolean;
    onBackPress?: () => void;
    enableSearchToggle?: boolean;
    initialSearchBarVisible?: boolean;
    topAccessory?: ReactNode;
    initialSearchQuery?: string;
    emptyComponent?: React.ReactElement;
    errorComponent?: (props: { onRetry: () => void }) => React.ReactElement;
    hideSearchBar?: boolean;
}

export function RepoContentLayout({
    repo,
    showHeader = true,
    onBackPress,
    enableSearchToggle = true,
    initialSearchBarVisible = false,
    topAccessory,
    initialSearchQuery,
    emptyComponent,
    errorComponent,
    hideSearchBar = false,
}: RepoContentLayoutProps) {
    const theme = useTheme();
    const [content, setContent] = useState<FetchData<Content[]>>({ isLoading: true });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchBarVisible, setSearchBarVisible] = useState(initialSearchBarVisible);
    const previousQueryRef = useRef('');

    const fetchContent = useCallback(
        async ({ cached, searchQuery: query }: { cached: boolean; searchQuery?: string }) => {
            setContent({ isLoading: true });
            try {
                const data = await fetchContentList({ repo, searchQuery: query, cached });
                setContent({ data, isLoading: false });
            } catch (error) {
                setContent({ error, isLoading: false });
            }
        },
        [repo]
    );

    useEffect(() => {
        if (initialSearchQuery) {
            setSearchQuery(initialSearchQuery);
            fetchContent({ cached: false, searchQuery: initialSearchQuery });
        } else {
            fetchContent({ cached: true });
        }
    }, [fetchContent, initialSearchQuery]);

    const hasDataLoaded = !!content.data && !content.isLoading;

    const child = useMemo(() => {
        if (content.isLoading) {
            return (
                <View style={styles.listPadding}>
                    <ActivityIndicator animating size="large" />
                </View>
            );
        }

        if (content.error) {
            if (errorComponent) {
                return errorComponent({ onRetry: () => fetchContent({ cached: false }) });
            }
            return errorPlaceholder({ onRetry: () => fetchContent({ cached: false }) });
        }

        return (
            <FlatList
                data={content.data}
                renderItem={({ item }) => <BookItem repo={repo} item={item} />}
                keyExtractor={(_, index) => index.toString()}
                contentContainerStyle={styles.grid}
                style={{ flex: 1 }}
                ListEmptyComponent={emptyComponent || emptyPlaceholder('No content found')}
                ListFooterComponent={<View style={{ height: 120 }} />}
                ListHeaderComponent={<View style={{ height: 20 }} />}
                refreshControl={
                    <RefreshControl refreshing={content.isLoading} onRefresh={() => fetchContent({ cached: false })} />
                }
            />
        );
    }, [content, fetchContent, repo]);

    const handleBack = useCallback(() => {
        if (onBackPress) {
            onBackPress();
        } else {
            router.back();
        }
    }, [onBackPress]);

    const ContainerComponent = showHeader ? SafeAreaView : View;

    return (
        <ContainerComponent style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {showHeader && (
                <Appbar.Header>
                    <Appbar.BackAction onPress={handleBack} />
                    <Appbar.Content title={repo.name} />
                    {enableSearchToggle && !content.isLoading && (
                        <Appbar.Action
                            icon={searchBarVisible ? 'close' : 'magnify'}
                            onPress={() => setSearchBarVisible((value) => !value)}
                        />
                    )}
                    {hasDataLoaded && (
                        <MenuFunction
                            items={[{
                                title: 'Refresh',
                                leadingIcon: 'refresh',
                                onPress: () => fetchContent({ cached: false }),
                            }]}
                        />
                    )}
                </Appbar.Header>
            )}

            {topAccessory && (
                <View style={styles.accessoryContainer}>{topAccessory}</View>
            )}

            {!hideSearchBar && (searchBarVisible || (!enableSearchToggle && !content.isLoading)) && (
                <View style={styles.searchBar}>
                    <Searchbar
                        placeholder="Search"
                        onChangeText={(text) => {
                            setSearchQuery(text);
                            const trimmed = text.trim();
                            const previousTrimmed = previousQueryRef.current.trim();

                            if (trimmed.length === 0 && previousTrimmed.length > 0) {
                                fetchContent({ cached: true });
                            }

                            previousQueryRef.current = text;
                        }}
                        value={searchQuery}
                        onSubmitEditing={() => {
                            const trimmed = searchQuery.trim();
                            if (trimmed.length) {
                                fetchContent({ cached: false, searchQuery: trimmed });
                            }
                        }}
                        returnKeyType="search"
                        traileringIcon={searchQuery.length ? 'close' : undefined}
                        onTraileringIconPress={() => {
                            setSearchQuery('');
                            previousQueryRef.current = '';
                            fetchContent({ cached: true });
                        }}
                    />
                </View>
            )}

            {child}
        </ContainerComponent>
    );
}

export default function RepositorLayout() {
    const params = useLocalSearchParams();
    const repoParam = params.repo;

    const repo: Repo | undefined = useMemo(() => {
        if (!repoParam) {
            return undefined;
        }
        try {
            if (Array.isArray(repoParam)) {
                return JSON.parse(repoParam[0]) as Repo;
            }
            return JSON.parse(repoParam) as Repo;
        } catch (error) {
            console.error('Failed to parse repo param', error);
            return undefined;
        }
    }, [repoParam]);

    if (!repo) {
        return errorPlaceholder({ onRetry: () => router.back() });
    }

    return <RepoContentLayout repo={repo} />;
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    accessoryContainer: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 4,
    },
    searchBar: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
    },
    listPadding: {
        padding: 16,
    },
    errorText: {
        textAlign: 'center',
        margin: 16,
    },
    grid: {
        paddingHorizontal: 2,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 80,
    },
});
