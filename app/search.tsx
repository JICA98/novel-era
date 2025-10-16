import { Repo } from "@/types";
import { useEffect, useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Chip } from "react-native-paper";
import UseRepositoryLayout from "./_repos";
import { RepoContentLayout } from "./repos/_layout";
import { useSearchStore } from "./store/searchStore";
import { userPrefStore } from "./userpref";
import { useShallow } from "zustand/react/shallow";

export default function SearchLayout() {
    return (
        <UseRepositoryLayout props={{ renderRepositories: (repos) => <SearchBarLayout repos={repos} /> }} />
    );
}

function SearchBarLayout({ repos }: { repos: Repo[] }) {
    const {
        selectedRepositoryId,
        setSelectedRepository,
    } = useSearchStore(
        useShallow((state) => ({
            selectedRepositoryId: state.selectedRepositoryId,
            setSelectedRepository: state.setSelectedRepository,
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

    const selectedRepo = useMemo(() => {
        return repos.find((repo) => repo.id === selectedRepositoryId) ?? repos[0];
    }, [repos, selectedRepositoryId]);

    return (
        <View style={styles.container}>
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

            {selectedRepo && (
                <View style={styles.repoLayoutContainer}>
                    <RepoContentLayout
                        key={selectedRepo.id}
                        repo={selectedRepo}
                        showHeader={false}
                        enableSearchToggle={false}
                        initialSearchBarVisible
                    />
                </View>
            )}
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    repoChips: {
        paddingVertical: 4,
        paddingRight: 16,
        alignItems: "center",
    },
    repoChip: {
        marginRight: 8,
    },
    repoLayoutContainer: {
        flex: 1,
        marginTop: 8,
    },
});