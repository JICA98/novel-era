import { FetchData, Repo, ReposData } from "@/types";
import { useEffect, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { ActivityIndicator, Button, List, TextInput, Title } from "react-native-paper";
import { create } from "zustand";
import { router } from 'expo-router';
import UseRepositoryLayout from "./_repos";


export default function SearchLayout() {

    return (
        <UseRepositoryLayout props={{ renderRepositories: (repos) => (<SearchBarLayout repos={repos} />) }} />
    );
}

function SearchBarLayout({ repos }: { repos: Repo[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredRepos, setFilteredRepos] = useState<Repo[]>(repos);
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (repos) {
            const filtered = repos.filter(repo =>
                repo.name.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredRepos(filtered);
        }
    };
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
                            onPress={() => router.push({ pathname: '/repos/[id]', params: { id: item.id } })}
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