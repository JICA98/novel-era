import { ReposData } from "@/types";
import { useEffect, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { ActivityIndicator, Button, List, TextInput, Title } from "react-native-paper";
import { create } from "zustand";

const repoLink = 'https://raw.githubusercontent.com/JICA98/novel-era/refs/heads/psycho/config/repository.json';

interface FetchData<T> {
    data?: T;
    error?: any;
    isLoading: boolean;
}

const useRepositoryStore = create((set, get: any) => ({
    repositories: {} as FetchData<ReposData>,
    setRepositories: (repositories: FetchData<ReposData>) => set({ repositories: repositories }),
    fetch: async () => {
        set({ repositories: { isLoading: true } });
        try {
            const response = await fetch(repoLink);
            const data = await response.json();
            set({ repositories: { data, isLoading: false } });
        } catch (error) {
            set({ repositories: { error, isLoading: false } });
        }
    }
}));

export default function SearchLayout() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredRepos, setFilteredRepos] = useState<ReposData['repos']>([]);
    const repositories: FetchData<ReposData> = useRepositoryStore((state: any) => state.repositories);
    const setRepositories = useRepositoryStore((state: any) => state.setRepositories);
    const fetchData = () => {
        setRepositories({ isLoading: true });
        fetch(repoLink)
            .then(response => response.json())
            .then(data => {
                setRepositories({ data, isLoading: false });
                setFilteredRepos(data.repos);
            })
            .catch(error => {
                setRepositories({ error, isLoading: false });
            });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (repositories.data) {
            const filtered = repositories.data.repos.filter(repo =>
                repo.name.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredRepos(filtered);
        }
    };

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

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.searchBar}
                placeholder="Search Repositories"
                value={searchQuery}
                onChangeText={handleSearch}
            />
            {filteredRepos.length === 0 ? (
                <Title style={styles.nothingFound}>Nothing found</Title>
            ) : (
                <List.Section>
                    {filteredRepos.map((item) => (
                        <List.Item
                            key={item.id}
                            title={() => highlightText(item.name, searchQuery)}
                            description={item.repoUrl}
                            left={props => <List.Icon {...props} icon="folder" />}
                            onPress={() => console.log('Pressed')}
                        />
                    ))}
                </List.Section>
            )}
        </View>
    );
}

const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
        return <Text>{text}</Text>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
        <Text>
            {parts.map((part, index) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <Text key={index} style={styles.highlight}>
                        {part}
                    </Text>
                ) : (
                    part
                )
            )}
        </Text>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    searchBar: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        paddingLeft: 8,
        marginBottom: 16,
    },
    repoItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    repoName: {
        fontSize: 16,
    },
    errorText: {
        color: 'red',
        marginBottom: 16,
    },
    nothingFound: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 18,
        color: 'gray',
    },
    highlight: {
        backgroundColor: 'yellow',
    },
});