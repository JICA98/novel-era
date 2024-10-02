import { Content, Repo } from '@/types';
import { router } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { View, useWindowDimensions, ScrollView, Text } from 'react-native';
import PagerView from 'react-native-pager-view';
import { Button, IconButton, useTheme } from 'react-native-paper';
import RenderHtml from 'react-native-render-html';
import { navigateToNextChapter, RenderChapterProps } from './_layout';

export const RenderPagedContent: React.FC<RenderChapterProps> = (props: RenderChapterProps) => {
    const [pages, setPages] = useState<any[]>([]);
    const { width } = useWindowDimensions();
    const theme = useTheme();
    const scrollViewRef = useRef<ScrollView>(null);

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
        const pageContent = splitContentIntoPages(props.data);
        setPages(pageContent);
    }, [props.data]);

    return (
        <PagerView style={{ flex: 1 }} initialPage={0}>
            {pages.map((eventsHTML, index) => {
                const source = { html: eventsHTML };
                const prevChapBtn = <View style={{ padding: 16, marginBottom: 30, alignItems: 'center' }}>
                    <IconButton
                        icon={'arrow-up'}
                        mode='contained-tonal'
                        size={40}
                        onPress={() => navigateToNextChapter(props, -1)} />
                </View>;
                const nextChapBtn = <View style={{ padding: 16, marginBottom: 30, alignItems: 'center' }}>
                    <IconButton
                        icon={'arrow-down'}
                        mode='contained-tonal'
                        size={40}
                        onPress={() => navigateToNextChapter(props, 1)} />
                </View>;
                return (
                    <View key={index} style={{ flex: 1, marginHorizontal: 10 }}>

                        <ScrollView ref={scrollViewRef}
                            onContentSizeChange={() => props.fromPrevious && scrollViewRef.current?.scrollToEnd({ animated: false })}>
                            <View style={{ margin: props.focusedMode ? 40 : 20 }} ></View>
                            {(props.id !== `1` && props.continueReading) && (
                                prevChapBtn
                            )}
                            <RenderHtml
                                contentWidth={width}
                                source={source}
                                baseStyle={{ fontSize: 18, color: theme.colors.onBackground, fontFamily: 'serif' }}
                                ignoredDomTags={['nf3e90', 'nf5865']}
                            />
                            <View style={{ margin: 20 }} ></View>
                            {(props.id !== props.content.latestChapter?.toString()) && (
                                nextChapBtn
                            )}
                        </ScrollView>
                    </View>
                );
            })}
        </PagerView>
    );
};
