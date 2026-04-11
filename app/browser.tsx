import { useCallback, useMemo, useRef, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Appbar, ActivityIndicator, Text } from "react-native-paper";
import { useAppTheme } from "@/hooks/useAppTheme";
import { router, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import type { WebViewErrorEvent, WebViewNavigation } from "react-native-webview/lib/WebViewTypes";

type BrowserParams = {
    url?: string | string[];
    title?: string | string[];
};

export default function BrowserScreen(): React.JSX.Element {
    const theme = useAppTheme();
    const params = useLocalSearchParams<BrowserParams>();
    const webviewRef = useRef<WebView>(null);

    const urlParam = Array.isArray(params.url) ? params.url[0] : params.url;
    const titleParam = Array.isArray(params.title) ? params.title[0] : params.title;

    const url = useMemo(() => (typeof urlParam === "string" && urlParam.length ? urlParam : undefined), [urlParam]);
    const headerTitle = useMemo(() => (titleParam?.length ? truncate(titleParam, 42) : undefined), [titleParam]);
    const subtitle = useMemo(() => (url ? prettyHostname(url) : undefined), [url]);

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const [canGoBack, setCanGoBack] = useState(false);

    const handleNavigateBack = useCallback(() => {
        if (canGoBack && webviewRef.current) {
            webviewRef.current.goBack();
        } else {
            router.back();
        }
    }, [canGoBack]);

    const handleRefresh = useCallback(() => {
        setErrorMessage(undefined);
        webviewRef.current?.reload();
    }, []);

    const handleOpenExternal = useCallback(async () => {
        if (!url) {
            return;
        }
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            }
        } catch (error) {
            console.error("Failed to open external link", error);
        }
    }, [url]);

    if (!url) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => router.back()} />
                    <Appbar.Content title="Browser" />
                </Appbar.Header>
                <View style={styles.errorContainer}>
                    <Text variant="bodyLarge">No link provided.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Appbar.Header>
                <Appbar.BackAction onPress={handleNavigateBack} />
                <Appbar.Content title={headerTitle ?? subtitle ?? "Browser"} subtitle={headerTitle ? subtitle : undefined} />
                <Appbar.Action icon="reload" onPress={handleRefresh} disabled={isLoading && !errorMessage} />
                <Appbar.Action icon="open-in-new" onPress={handleOpenExternal} disabled={!url} />
            </Appbar.Header>
            <View style={styles.webviewContainer}>
                {isLoading && !errorMessage && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator animating size="large" />
                    </View>
                )}
                {errorMessage ? (
                    <View style={styles.errorContainer}>
                        <Text variant="bodyLarge" style={styles.errorText}>{errorMessage}</Text>
                        <Text variant="bodyMedium" onPress={handleRefresh} style={[styles.retry, { color: theme.colors.primary }]}>Tap to retry</Text>
                    </View>
                ) : (
                    <WebView
                        ref={webviewRef}
                        source={{ uri: url }}
                        startInLoadingState
                        onLoadStart={() => {
                            setIsLoading(true);
                            setErrorMessage(undefined);
                        }}
                        onLoadEnd={() => setIsLoading(false)}
                        onError={(event: WebViewErrorEvent) => {
                            setIsLoading(false);
                            setErrorMessage(event.nativeEvent?.description ?? "Failed to load page.");
                        }}
                        onNavigationStateChange={(navState: WebViewNavigation) => {
                            setCanGoBack(navState.canGoBack);
                        }}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

function truncate(text: string, length: number): string {
    if (text.length <= length) {
        return text;
    }
    return `${text.slice(0, length - 3)}...`;
}

function prettyHostname(link: string): string {
    try {
        const { hostname } = new URL(link);
        return hostname;
    } catch (error) {
        return link;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    webviewContainer: {
        flex: 1,
    },
    loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
    },
    errorContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 8,
    },
    errorText: {
        textAlign: "center",
    },
    retry: {
        marginTop: 12,
    },
});
