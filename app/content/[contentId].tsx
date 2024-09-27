import UseRepositoryLayout from "@/app/_repos";
import { Content, Repo } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import { Animated, SafeAreaView, ScrollView, StyleSheet, View, Text, ImageBackground } from "react-native";
import { Appbar, Card, Title } from "react-native-paper";

const HEADER_MAX_HEIGHT = 240;
const HEADER_MIN_HEIGHT = 90;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

function fetchContentChapters(repo: Repo, content: Content): Promise<Content[]> {
   repo.repoChapterType.path;
    const url = repo.repoUrl + repo.repoChapterType.path.replace('[bookId]', content.bookId);
}

export default function ContentLayout() {
    const repoId = useLocalSearchParams().repoId as string;
    const content = JSON.parse(useLocalSearchParams().content as string) as Content;

    return (
        <UseRepositoryLayout props={{
            renderRepositories: (repos) => (<RenderContentView repoId={repoId} content={content} repos={repos} />)
        }} />
    );
}

function RenderContentView({ repoId, content, repos }: { repoId: string, content: Content, repos: Repo[] }) {
    const repo = repos.filter(repo => repo.id === repoId)[0];
    const scrollY = useRef(new Animated.Value(0)).current;


    const headerHeight = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE],
        outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
        extrapolate: 'clamp',
    });

    const titleOpacity = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
        outputRange: [1, 0.5, 0],
        extrapolate: 'clamp',
    });

    const titleTranslateY = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE],
        outputRange: [0, -HEADER_SCROLL_DISTANCE / 2],
        extrapolate: 'clamp',
    });

    const appBarTitleOpacity = scrollY.interpolate({
        inputRange: [HEADER_SCROLL_DISTANCE - 10, HEADER_SCROLL_DISTANCE],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View style={[styles.header, { height: headerHeight }]}>
                <Appbar.Header style={styles.appbar}>
                    <Appbar.BackAction onPress={() => router.back()} />
                    <Animated.View style={{ opacity: appBarTitleOpacity }}>
                        <Appbar.Content title={content.title} />
                    </Animated.View>
                </Appbar.Header>
                <ImageBackground
                    source={{ uri: content.bookImage }} // Replace with your image URL
                    style={[styles.imageBackground]}
                >
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.gradient}
                    />
                    <Animated.View style={[styles.innerView, {
                        opacity: titleOpacity,
                        transform: [{ translateY: titleTranslateY }]
                    }]}>
                        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                            {content.title}
                        </Text>
                    </Animated.View>
                </ImageBackground>
            </Animated.View>

            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                <View style={styles.contentContainer}>
                    <Card style={styles.card}>
                        <Card.Title title="Card 1" />
                        <Card.Content>
                            <Title>Content for card 1</Title>
                        </Card.Content>
                    </Card>
                    <Card style={styles.card}>
                        <Card.Title title="Card 2" />
                        <Card.Content>
                            <Title>Content for card 2</Title>
                        </Card.Content>
                    </Card>
                    <Card style={styles.card}>
                        <Card.Title title="Card 3" />
                        <Card.Content>
                            <Title>Content for card 3</Title>
                        </Card.Content>
                    </Card>
                    <Card style={styles.card}>
                        <Card.Title title="Card 3" />
                        <Card.Content>
                            <Title>Content for card 3</Title>
                        </Card.Content>
                    </Card>
                    <Card style={styles.card}>
                        <Card.Title title="Card 3" />
                        <Card.Content>
                            <Title>Content for card 3</Title>
                        </Card.Content>
                    </Card>
                    <Card style={styles.card}>
                        <Card.Title title="Card 3" />
                        <Card.Content>
                            <Title>Content for card 3</Title>
                        </Card.Content>
                    </Card>
                    <Card style={styles.card}>
                        <Card.Title title="Card 3" />
                        <Card.Content>
                            <Title>Content for card 3</Title>
                        </Card.Content>
                    </Card>
                    {/* Add more cards as needed */}
                </View>
            </ScrollView>
        </SafeAreaView>

    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        zIndex: 1,
        elevation: 3,
    },
    appbar: {
        backgroundColor: 'transparent',
        justifyContent: 'center',
    },
    imageBackground: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 100,
    },
    innerView: {
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    scrollViewContent: {
        paddingTop: HEADER_MAX_HEIGHT,
    },
    contentContainer: {
        paddingHorizontal: 16,
    },
    card: {
        marginBottom: 16,
    },
});