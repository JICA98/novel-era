import React, { useState, useEffect } from 'react';
import { Text, View, useWindowDimensions, ScrollView } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useTheme } from 'react-native-paper';
import RenderHtml from 'react-native-render-html';

export default function RenderPagedContent({ content }: { content: string }) {
    const [pages, setPages] = useState<any[]>([]);
    const { width } = useWindowDimensions();
    const theme = useTheme();
    // Function to split content into pages
    const splitContentIntoPages = (content: string) => {
        const words = content.split(' ');
        const pageSize = 20500;
        const result = [];


        for (let i = 0; i < words.length; i += pageSize) {
            result.push(words.slice(i, i + pageSize).join(' '));
        }

        return result;
    };

    useEffect(() => {
        const pageContent = splitContentIntoPages(content);
        setPages(pageContent);
    }, [content]);



    return (
        <PagerView style={{ flex: 1 }} initialPage={0}>
            {pages.map((eventsHTML, index) => {
                const source = { html: eventsHTML };
                return (
                    <View key={index} style={{ flex: 1, marginHorizontal: 10 }}>
                        <ScrollView>
                            <RenderHtml
                                contentWidth={width}
                                source={source}
                                baseStyle={{ fontSize: 18, color: theme.colors.onBackground }}
                                ignoredDomTags={['nf3e90']}
                            />
                            <View style={{ margin: 20 }} ></View>
                        </ScrollView>
                    </View>
                );
            })}
        </PagerView>
    );
};

