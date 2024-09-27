import UseRepositoryLayout from "@/app/_repos";
import { Repo } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, StyleSheet } from "react-native";
import { Appbar } from "react-native-paper";


export default function ContentLayout() {
    const repoId = useLocalSearchParams().repoId as string;
    const contentId = useLocalSearchParams().contentId as string;

    return (
        <UseRepositoryLayout props={{
            renderRepositories: (repos) => (<RenderContentView repoId={repoId} contentId={contentId} repos={repos} />)
        }} />
    );
}

export function RenderContentView({ repoId, contentId, repos }: { repoId: string, contentId: string, repos: Repo[] }) {
    const repo = repos.filter(repo => repo.id === repoId)[0];
    return (
        <SafeAreaView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title={contentId} />
            </Appbar.Header>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },
    listPadding: {
        padding: 16,
    },
    errorText: {
        textAlign: 'center',
        margin: 16,
    },
    grid: {
        paddingHorizontal: 8,
    },
    card: {
        flex: 1,
        margin: 8,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 80,
    },
});