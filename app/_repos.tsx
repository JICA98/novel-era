import { Repo, ReposData } from "@/types";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';
import { StyleSheet } from 'react-native';
import { ErrorPlaceholder } from "./placeholders";
import AsyncStorage from "@react-native-async-storage/async-storage";

const repoLink = 'https://raw.githubusercontent.com/JICA98/novel-era/refs/heads/psycho/config/repository.json';

interface FetchData<T> {
    data?: T;
    error?: any;
    isLoading: boolean;
}

export const asyncStorage = () => createJSONStorage(() => AsyncStorage);

const useRepositoryStore = create(persist(
    (set) => ({
        repositories: { isLoading: true } as FetchData<ReposData>,
        fetchData: () => {
            set({ repositories: { isLoading: true } });
            fetch(repoLink)
                .then(response => response.json())
                .then(data => {
                    set({ repositories: { data, isLoading: false } });
                })
                .catch(error => {
                    set({ repositories: { error, isLoading: false } });
                });
        }
    }),
    {
        name: 'repository-storage',
        storage: asyncStorage(),
    },
));

interface UseRepositoryLayoutProps {
    renderRepositories: (repositories: Repo[]) => React.ReactNode;
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
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (repositories.error) {
        return <ErrorPlaceholder onRetry={fetchData} />;
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