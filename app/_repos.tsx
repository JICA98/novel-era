import { Repo, ReposData } from "@/types";
import React, { useEffect } from "react";
import { View } from "react-native";
import { ActivityIndicator, Button, Title } from "react-native-paper";
import { create } from "zustand";
import { StyleSheet } from 'react-native';

const repoLink = 'https://raw.githubusercontent.com/JICA98/novel-era/refs/heads/psycho/config/repository.json';

interface FetchData<T> {
    data?: T;
    error?: any;
    isLoading: boolean;
}

const useRepositoryStore = create((set) => ({
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
}));

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
        return (
            <View style={styles.container}>
                <Title style={styles.errorText}>Failed to fetch repositories. Please try again.</Title>
                <Button onPress={fetchData} children={
                    'Retry'
                } />
            </View>
        );
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