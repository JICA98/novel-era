import { FetchData, Repo, ReposData } from "@/types";
import { useEffect, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { ActivityIndicator, Avatar, Button, List, TextInput, Title, useTheme } from "react-native-paper";
import { create } from "zustand";
import { router } from 'expo-router';
import UseRepositoryLayout from "./_repos";
import { MD3Colors } from "react-native-paper/lib/typescript/types";
import { emptyPlaceholder as emptyStatePlaceholder } from "./placeholders";


export default function SearchLayout() {

    return (
        <UseRepositoryLayout props={{ renderRepositories: (repos) => (<SearchBarLayout repos={repos} />) }} />
    );
}

function SearchBarLayout({ repos }: { repos: Repo[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredRepos, setFilteredRepos] = useState<Repo[]>(repos);
    const colors = useTheme().colors;
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
            {<TextInput
                style={styles.searchBar}
                placeholder="Search Repositories"
                value={searchQuery}
                onChangeText={handleSearch}
            />}
            {filteredRepos.length === 0 ? (
                emptyStatePlaceholder('No repositories found')
            ) : (
                <List.Section>
                    {filteredRepos.map((item) => (
                        <List.Item
                            key={item.id}
                            title={() => highlightText(item.name, searchQuery, colors)}
                            description={item.repoUrl}
                            style={styles.repoItem}
                            left={_ => <Avatar.Image size={48}
                                source={{ uri: `https://picsum.photos/seed/${item.idName}/100/100` }} />}
                            onPress={() => router.push({ pathname: '/repos', params: { repo: JSON.stringify(item) } })}
                        />
                    ))}
                </List.Section>
            )}
        </View>
    );
}

const highlightText = (text: string, highlight: string, colors: MD3Colors) => {
    if (!highlight.trim()) {
        return <Title>{text}</Title>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
        <Title>
            {parts.map((part, index) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <Text key={index} style={[styles.highlight]}>
                        {part}
                    </Text>
                ) : (
                    part
                )
            )}
        </Title>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    searchBar: {
        height: 40,
        borderWidth: 1,
        borderRadius: 5,
        paddingLeft: 8,
        marginBottom: 16,
    },
    repoItem: {
        padding: 16,
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