import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AtelierText } from '@/components/AtelierText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { useSearchStore } from './store/searchStore';
import { Repo } from '@/types';
import { userPrefStore } from './userpref';
import UseRepositoryLayout from './_repos';
import { SearchResultsView } from './search';
import { useShallow } from 'zustand/react/shallow';

export default function ExploreAllLayout() {
    return (
        <UseRepositoryLayout props={{ renderRepositories: (repos) => <ExploreAllScreen repos={repos} /> }} />
    );
}

function ExploreAllScreen({ repos }: { repos: Repo[] }) {
    const router = useRouter();
    const systemColorScheme = useColorScheme();
    const colorScheme = (systemColorScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
    const themeColors = Colors[colorScheme];

    const { selectedRepositoryId, setSelectedRepository } = useSearchStore(
        useShallow((state) => ({
            selectedRepositoryId: state.selectedRepositoryId,
            setSelectedRepository: state.setSelectedRepository,
        }))
    );

    const setPreferredRepository = userPrefStore((state: any) => state.setPreferredRepository);

    const selectedRepo = useMemo(() => {
        return repos.find((repo) => repo.id === selectedRepositoryId) ?? repos[0];
    }, [repos, selectedRepositoryId]);

    const [showFilters, setShowFilters] = useState(false);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={28} color={themeColors.primary} />
                </TouchableOpacity>
                <AtelierText variant="title" bold style={styles.headerTitle}>All Novels</AtelierText>
                <View style={{ width: 48 }} /> 
            </View>

            <SearchResultsView
                repo={selectedRepo}
                searchQuery=""
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                repos={repos}
                setSelectedRepository={setSelectedRepository}
                setPreferredRepository={setPreferredRepository}
                renderEmpty={() => (
                    <View style={styles.centered}>
                        <AtelierText>No novels found.</AtelierText>
                    </View>
                )}
                renderError={({ onRetry }) => (
                    <View style={styles.centered}>
                        <AtelierText>Error loading novels.</AtelierText>
                        <TouchableOpacity onPress={onRetry} style={[styles.retryButton, { backgroundColor: themeColors.primary }]}>
                            <AtelierText color={themeColors.onPrimary}>Retry</AtelierText>
                        </TouchableOpacity>
                    </View>
                )}
                hideHeader={true}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
    }
});
