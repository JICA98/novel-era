import { Content, Repo, SelectorType, processData } from "@/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
    ActivityIndicator,
    Avatar,
    Chip,
    HelperText,
    List,
    TextInput,
} from "react-native-paper";
import { router } from "expo-router";
import UseRepositoryLayout from "./_repos";
import { emptyPlaceholder } from "./placeholders";
import IDOMParser from "advanced-html-parser";
import jsonpath from "jsonpath";
import { cacheValue, getCachedValue } from "./storage";
import { SearchCacheEntry, SearchResultItem, useSearchStore } from "./store/searchStore";
import { userPrefStore } from "./userpref";
import { useShallow } from "zustand/react/shallow";

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 350;
const SEARCH_CACHE_PREFIX = "search-cache";
const HOME_CACHE_PREFIX = "home-cache";

export default function SearchLayout() {
    return (
        <UseRepositoryLayout props={{ renderRepositories: (repos) => <SearchBarLayout repos={repos} /> }} />
    );
}

function SearchBarLayout({ repos }: { repos: Repo[] }) {
    const [queryInput, setQueryInput] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const abortControllerRef = useRef<AbortController | null>(null);
    const homeAbortControllerRef = useRef<AbortController | null>(null);
    const [homeResults, setHomeResults] = useState<SearchResultItem[]>([]);
    const {
        selectedRepositoryId,
        setSelectedRepository,
        results,
        setResults,
        isLoading,
        error,
        resetResults,
        setLoading,
        setError,
        updateCache,
    } = useSearchStore(
        useShallow((state) => ({
            selectedRepositoryId: state.selectedRepositoryId,
            setSelectedRepository: state.setSelectedRepository,
            results: state.results,
            setResults: state.setResults,
            isLoading: state.isLoading,
            error: state.error,
            resetResults: state.resetResults,
            setLoading: state.setLoading,
            setError: state.setError,
            updateCache: state.updateCache,
        }))
    );

    const userPref = userPrefStore((state: any) => state.userPref);
    const setPreferredRepository = userPrefStore((state: any) => state.setPreferredRepository);

    useEffect(() => {
        const preferredRepoId = userPref?.preferredRepositoryId;
        if (!repos.length) {
            return;
        }
        const fallbackRepoId = repos[0].id;
        const resolvedRepoId = repos.some((repo) => repo.id === preferredRepoId)
            ? preferredRepoId
            : fallbackRepoId;
        if (!selectedRepositoryId && resolvedRepoId) {
            setSelectedRepository(resolvedRepoId);
        }
    }, [repos, userPref?.preferredRepositoryId, selectedRepositoryId, setSelectedRepository]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(queryInput.trim());
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(handler);
    }, [queryInput]);

    const selectedRepo = useMemo(() => {
        return repos.find((repo) => repo.id === selectedRepositoryId) ?? repos[0];
    }, [repos, selectedRepositoryId]);

    const isHomeMode = debouncedQuery.length === 0;
    const canSearch = debouncedQuery.length >= MIN_QUERY_LENGTH;
    const needsMoreCharacters = debouncedQuery.length > 0 && !canSearch;

    useEffect(() => {
        if (!selectedRepo) {
            return;
        }

        if (!canSearch) {
            abortControllerRef.current?.abort();
            abortControllerRef.current = null;
            if (debouncedQuery.length === 0) {
                resetResults();
                setError(undefined);
                setLoading(false);
            }
            return;
        }

        const controller = new AbortController();
        abortControllerRef.current?.abort();
        abortControllerRef.current = controller;

        const cacheKey = buildSearchCacheKey({
            query: debouncedQuery,
            repositoryId: selectedRepo.id,
        });

        let isActive = true;

        async function runSearch() {
            const memoryEntry = useSearchStore.getState().cache[cacheKey];
            if (memoryEntry && !controller.signal.aborted) {
                setResults(memoryEntry.results);
                setLoading(false);
                setError(undefined);
                return;
            }

            setLoading(true);
            setError(undefined);

            const cachedEntry = await getCachedValue<SearchCacheEntry>(cacheKey);
            if (cachedEntry && isActive && !controller.signal.aborted) {
                setResults(cachedEntry.results);
                updateCache(cacheKey, cachedEntry);
                setLoading(false);
                return;
            }

            try {
                const fetchedResults = await runSingleSearch({
                    repo: selectedRepo,
                    query: debouncedQuery,
                    signal: controller.signal,
                });
                if (!isActive || controller.signal.aborted) {
                    return;
                }
                setResults(fetchedResults);
                const cacheEntry: SearchCacheEntry = {
                    results: fetchedResults,
                    timestamp: Date.now(),
                };
                updateCache(cacheKey, cacheEntry);
                cacheValue(cacheKey, cacheEntry).catch(() => {});
            } catch (err: any) {
                if (!isActive || controller.signal.aborted) {
                    return;
                }
                console.error(err);
                setError(err?.message ?? "Unable to complete search.");
            } finally {
                if (isActive && !controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        runSearch();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [canSearch, debouncedQuery, resetResults, selectedRepo, setError, setLoading, setResults, updateCache]);

    useEffect(() => {
        if (!selectedRepo) {
            return;
        }

        if (!isHomeMode) {
            homeAbortControllerRef.current?.abort();
            homeAbortControllerRef.current = null;
            return;
        }

        const controller = new AbortController();
        homeAbortControllerRef.current?.abort();
        homeAbortControllerRef.current = controller;

        const cacheKey = buildHomeCacheKey(selectedRepo.id);
        let isActive = true;

        async function loadHome() {
            const memoryEntry = useSearchStore.getState().cache[cacheKey];
            if (memoryEntry && !controller.signal.aborted) {
                resetResults();
                setHomeResults(memoryEntry.results);
                setError(undefined);
                setLoading(false);
                return;
            }

            resetResults();
            setHomeResults([]);
            setLoading(true);
            setError(undefined);

            const cachedEntry = await getCachedValue<SearchCacheEntry>(cacheKey);
            if (cachedEntry && isActive && !controller.signal.aborted) {
                setHomeResults(cachedEntry.results);
                updateCache(cacheKey, cachedEntry);
                setLoading(false);
                return;
            }

            try {
                const fetchedResults = await fetchRepositoryHome({
                    repo: selectedRepo,
                    signal: controller.signal,
                });
                if (!isActive || controller.signal.aborted) {
                    return;
                }
                setHomeResults(fetchedResults);
                const cacheEntry: SearchCacheEntry = {
                    results: fetchedResults,
                    timestamp: Date.now(),
                };
                updateCache(cacheKey, cacheEntry);
                cacheValue(cacheKey, cacheEntry).catch(() => {});
            } catch (err: any) {
                if (!isActive || controller.signal.aborted) {
                    return;
                }
                console.error(err);
                setError(err?.message ?? "Unable to load titles.");
            } finally {
                if (isActive && !controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadHome();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [isHomeMode, resetResults, selectedRepo, setError, setLoading, updateCache]);

    const showEmptyState = canSearch && !isLoading && results.length === 0 && !error;

    return (
        <View style={styles.container}>
            <View style={styles.searchControls}>
                <TextInput
                    mode="outlined"
                    placeholder="Search novels"
                    value={queryInput}
                    onChangeText={setQueryInput}
                    style={styles.searchInput}
                />

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.repoChips}
                >
                    {repos.map((repo) => {
                        const isSelected = selectedRepo?.id === repo.id;
                        return (
                            <Chip
                                key={repo.id}
                                selected={isSelected}
                                onPress={() => {
                                    setSelectedRepository(repo.id);
                                    setPreferredRepository(repo.id);
                                }}
                                style={styles.repoChip}
                            >
                                {repo.name}
                            </Chip>
                        );
                    })}
                </ScrollView>
            </View>

            <View style={styles.resultsContainer}>
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.resultsContent}
                >
                    {needsMoreCharacters && (
                        <HelperText type="info" visible style={styles.helperText}>
                            Type at least {MIN_QUERY_LENGTH} characters to search.
                        </HelperText>
                    )}

                    {error && (
                        <HelperText type="error" visible style={styles.helperText}>
                            {error}
                        </HelperText>
                    )}

                    {isLoading && (
                        <View style={styles.loadingWrapper}>
                            <ActivityIndicator animating size="large" />
                        </View>
                    )}

                    {showEmptyState && emptyPlaceholder("No results found")}

                    {canSearch && !isLoading && !showEmptyState && results.length > 0 && (
                        <List.Section>
                            {results.map((item) => {
                                const subtitle = resolveResultSubtitle(item);
                                return (
                                    <List.Item
                                        key={item.id}
                                        title={item.title}
                                        description={subtitle}
                                        left={() => (
                                            <Avatar.Image
                                                size={48}
                                                source={{ uri: item.coverUrl || `https://picsum.photos/seed/${item.id}/200/200` }}
                                            />
                                        )}
                                        onPress={() =>
                                            handleOpenContent(
                                                repos.find((repo) => repo.id === item.sourceId) ?? selectedRepo,
                                                item
                                            )
                                        }
                                    />
                                );
                            })}
                        </List.Section>
                    )}

                    {isHomeMode && !isLoading && !error && (
                        homeResults.length > 0 ? (
                            <List.Section>
                                {homeResults.map((item) => {
                                    const subtitle = resolveResultSubtitle(item);
                                    return (
                                        <List.Item
                                            key={item.id}
                                            title={item.title}
                                            description={subtitle}
                                            left={() => (
                                                <Avatar.Image
                                                    size={48}
                                                    source={{
                                                        uri: item.coverUrl || `https://picsum.photos/seed/${item.id}/200/200`,
                                                    }}
                                                />
                                            )}
                                            onPress={() => handleOpenContent(selectedRepo, item)}
                                        />
                                    );
                                })}
                            </List.Section>
                        ) : (
                            emptyPlaceholder("Browse your library")
                        )
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

function buildSearchCacheKey({
    query,
    repositoryId,
}: {
    query: string;
    repositoryId: string;
}) {
    return `${SEARCH_CACHE_PREFIX}:${repositoryId}:${query.toLowerCase()}`;
}

function buildHomeCacheKey(repositoryId: string) {
    return `${HOME_CACHE_PREFIX}:${repositoryId}`;
}

async function runSingleSearch({
    repo,
    query,
    signal,
}: {
    repo: Repo;
    query: string;
    signal: AbortSignal;
}): Promise<SearchResultItem[]> {
    return fetchRepositoryResults(repo, query, signal);
}

async function fetchRepositoryResults(repo: Repo, query: string, signal: AbortSignal): Promise<SearchResultItem[]> {
    const selector = repo.repoSearch;
    if (!selector) {
        return [];
    }

    const path = selector.path?.replace('[text]', encodeURIComponent(query)) ?? '';
    const url = `${repo.repoUrl}${path}`;
    const requestInit: RequestInit = {
        method: selector.method ?? 'GET',
        signal,
        headers: selector.method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : undefined,
    };

    if ((selector.method ?? 'GET') === 'POST') {
        requestInit.body = `search=${encodeURIComponent(query)}`;
    }

    const response = await fetch(url, requestInit);
    if (!response.ok) {
        throw new Error(`Search failed for ${repo.name}`);
    }

    let content: string;
    if (selector.type === SelectorType.http) {
        const payload = await response.json();
        const extracted = jsonpath.query(payload, selector.jsonPath);
        content = Array.isArray(extracted) ? extracted.join("\n") : String(extracted ?? "");
    } else {
        content = await response.text();
    }

    if (!content) {
        return [];
    }

    const dom = IDOMParser.parse(content).documentElement;
    const nodes = dom?.querySelectorAll(selector.selector) ?? [];
    const items = Array.from(nodes).map((node) => {
        const title = processData(node, selector.title);
        const bookId = selector.bookId ? processData(node, selector.bookId) : undefined;
        const coverUrl = selector.bookImage ? processData(node, selector.bookImage) : undefined;
        const link = selector.bookLink ? processData(node, selector.bookLink) : undefined;
        const rating = selector.rating ? processData(node, selector.rating) : undefined;
        const id = `${repo.id}:${(bookId || title || Math.random().toString(36)).toString()}`;

        return {
            id,
            title: title?.trim() || "Untitled",
            bookId: bookId?.trim(),
            coverUrl: coverUrl?.trim(),
            link: link?.trim(),
            rating: rating?.trim(),
            sourceId: repo.id,
            sourceName: repo.name,
        } as SearchResultItem;
    });

    return items.filter((item) => !!item.title);
}

async function fetchRepositoryHome({
    repo,
    signal,
}: {
    repo: Repo;
    signal: AbortSignal;
}): Promise<SearchResultItem[]> {
    const selector = repo.listSelector;
    if (!selector) {
        return [];
    }

    const normalizedPath = (selector.path ?? "")
        .replace("[text]", "")
        .replace("[page]", selector.page ?? "1");
    const url = `${repo.repoUrl}${normalizedPath}`;
    const requestInit: RequestInit = {
        method: selector.method ?? "GET",
        signal,
        headers: selector.method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : undefined,
    };

    if ((selector.method ?? "GET") === "POST") {
        requestInit.body = `page=${encodeURIComponent(selector.page ?? "1")}`;
    }

    const response = await fetch(url, requestInit);
    if (!response.ok) {
        throw new Error(`Unable to load titles for ${repo.name}`);
    }

    let content: string;
    if (selector.type === SelectorType.http) {
        const payload = await response.json();
        const extracted = jsonpath.query(payload, selector.jsonPath);
        content = Array.isArray(extracted) ? extracted.join("\n") : String(extracted ?? "");
    } else {
        content = await response.text();
    }

    if (!content) {
        return [];
    }

    const dom = IDOMParser.parse(content).documentElement;
    const nodes = dom?.querySelectorAll(selector.selector) ?? [];
    const items = Array.from(nodes).map((node) => {
        const title = processData(node, selector.title);
        const bookId = selector.bookId ? processData(node, selector.bookId) : undefined;
        const coverUrl = selector.bookImage ? processData(node, selector.bookImage) : undefined;
        const link = selector.bookLink ? processData(node, selector.bookLink) : undefined;
        const id = `${repo.id}:${(bookId || title || Math.random().toString(36)).toString()}`;

        return {
            id,
            title: title?.trim() || "Untitled",
            bookId: bookId?.trim(),
            coverUrl: coverUrl?.trim(),
            link: link?.trim(),
            sourceId: repo.id,
            sourceName: repo.name,
        } as SearchResultItem;
    });

    return items.filter((item) => !!item.title);
}

function handleOpenContent(repo: Repo | undefined, item: SearchResultItem) {
    if (!repo) {
        return;
    }

    const content: Content = {
        title: item.title,
        bookImage: item.coverUrl ?? "",
        bookLink: item.link ?? "",
        bookId: item.bookId ?? item.id,
        rating: item.rating,
    };

    router.push({
        pathname: "/contents",
        params: {
            content: JSON.stringify(content),
            repo: JSON.stringify(repo),
        },
    } as never);
}

function resolveResultSubtitle(item: SearchResultItem) {
    const subtitle = item.summary?.trim() || item.rating?.trim() || item.link?.trim() || item.bookId?.trim();
    return subtitle?.length ? subtitle : undefined;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    searchControls: {
        gap: 12,
    },
    searchInput: {
        marginBottom: 4,
    },
    repoChips: {
        paddingVertical: 4,
        paddingRight: 16,
        alignItems: "center",
    },
    repoChip: {
        marginRight: 8,
    },
    resultsContainer: {
        flex: 1,
        marginTop: 8,
    },
    resultsContent: {
        paddingBottom: 120,
    },
    helperText: {
        marginTop: 8,
    },
    loadingWrapper: {
        marginTop: 32,
        alignItems: "center",
    },
});