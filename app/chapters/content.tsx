import React, { useState, useEffect } from 'react';
import { Text, View } from 'react-native';
import PagerView from 'react-native-pager-view';

export default function RenderPagedContent({ content }: { content: string }) {
    const [pages, setPages] = useState<any[]>([]);

    // Function to split content into pages
    const splitContentIntoPages = (content: string) => {
        const words = content.split(' ');
        const pageSize = 205;
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
            {pages.map((pageContent, index) => (
                <View key={index} style={{ padding: 20 }}>
                    <Text style={{ fontSize: 18 }}>
                        {pageContent}
                    </Text>
                </View>
            ))}
        </PagerView>
    );
};

