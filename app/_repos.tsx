import { Repo, ReposData } from "@/types";
import React, { useEffect } from "react";
import { View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware'
import { StyleSheet } from 'react-native';
import { errorPlaceholder } from "./placeholders";
import AsyncStorage from "@react-native-async-storage/async-storage";
import repositoryData from "@/config/repository.json";

interface FetchData<T> {
    data?: T;
    error?: any;
    isLoading: boolean;
}

export const asyncStorage = () => createJSONStorage(() => AsyncStorage);

const useRepositoryStore = create(persist(
    (set, get) => ({
        repositories: { isLoading: true } as FetchData<ReposData>,
        fetchData: () => {
            const current = (get() as any).repositories;
            // If data is already loaded from persistence, don't reset to loading
            if (current.data && !current.isLoading) {
                return;
            }
            set({ repositories: { isLoading: true } });
            // Use local repository data instead of fetching from GitHub
            setTimeout(() => {
                set({ repositories: { data: repositoryData, isLoading: false } });
            }, 100); // Simulate async loading
        }
    }),
    {
        name: 'repository-storage',
        storage: asyncStorage(),
    },
));

interface UseRepositoryLayoutProps {
    renderRepositories: (repositories: Repo[]) => JSX.Element;
}

export default function UseRepositoryLayout({ props }: { props: UseRepositoryLayoutProps }) {
    const repositories: FetchData<ReposData> = useRepositoryStore((state: any) => state.repositories);
    const fetchData = useRepositoryStore((state: any) => state.fetchData);

    useEffect(() => {
        fetchData();
    }, []);

    if (repositories.isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator animating={true} size="large" />
            </View>
        );
    }

    if (repositories.error) {
        return errorPlaceholder({ onRetry: fetchData });
    }

    return props.renderRepositories(repositories.data?.repos ?? []);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    errorText: {
        color: 'red',
        marginBottom: 16,
    },
});