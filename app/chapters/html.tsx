import React, { memo } from 'react';
import { Text, View, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { isSpeechOrPause, Sentence, SpeechAction, ttsStore } from './tts';
import { UserPreferences, userPrefStore, ReaderThemes } from '../userpref';
import { useTheme } from 'react-native-paper';

// HTMLRenderer component
const SentenceRenderer = memo(({ sentence, state, currentSentence }:
    { sentence: Sentence, state: SpeechAction, currentSentence: string | undefined }) => {
    const editorPref = (userPrefStore((state: any) => state.userPref) as UserPreferences).editorPreferences;
    const setCurrentSentence: (s: string) => void = ttsStore((state: any) => state.setCurrentSentence);
    const theme = useTheme();
    
    const readerThemeKey = editorPref.theme && ReaderThemes[editorPref.theme as keyof typeof ReaderThemes] ? editorPref.theme : 'light';
    const readerTextColor = ReaderThemes[readerThemeKey as keyof typeof ReaderThemes].text;
    const lhRatio = editorPref.lineHeight || 1.5;

    let sentenceStyle: StyleProp<TextStyle> = {
        fontSize: editorPref.fontSize,
        color: readerTextColor,
        fontFamily: editorPref.fontFamily,
        letterSpacing: editorPref.letterSpacing,
        lineHeight: editorPref.fontSize * lhRatio,
    };

    if (isSpeechOrPause(state) && currentSentence === sentence.id) {
        sentenceStyle = {
            ...sentenceStyle,
            color: theme.colors.surface,
            borderBlockColor: theme.colors.primary,
            borderStyle: 'solid',
            borderColor: theme.colors.primary,
            borderCurve: 'circular',
            borderRadius: 6.0,
            backgroundColor: theme.colors.primary,
            borderWidth: 1
        };
    }

    const renderSentences = (elements: Sentence[]) => {
        return <>
            <Text>
                {elements.map((element, index) => (
                    <React.Fragment key={index}>{
                        <SentenceRenderer
                            sentence={element} state={state} currentSentence={currentSentence} />
                    }</React.Fragment>
                ))}
            </Text>
        </>;
    };
    if (!sentence.children?.length) {
        const { tagName, text } = sentence;
        const tagStyle = styles[tagName || ''];
        return <Text onPress={() => setCurrentSentence(sentence.id)} style={[sentenceStyle, tagStyle]}>{text}</Text>;
    } else {
        return <View style={{
            marginHorizontal: 2.0,
            marginVertical: 8.0,
        }}>{renderSentences(sentence.children ?? [])}</View>;
    }
}, (prevProps, nextProps) => {
    return prevProps.sentence.html === nextProps.sentence.html
        && prevProps.currentSentence === nextProps.currentSentence && prevProps.state === nextProps.state;
});

// Define styles for each HTML tag
const styles: { [key: string]: TextStyle } = StyleSheet.create({
    p: {
        marginVertical: 16,
    },
    h1: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 16,
    },
    h2: {
        fontSize: 22,
        fontWeight: 'bold',
        marginVertical: 16,
    },
    h3: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 16,
    },
    h4: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 16,
    },
    h5: {
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 16,
    },
    h6: {
        fontSize: 14,
        fontWeight: 'bold',
        marginVertical: 16,
    },
    span: {
    },
    a: {
        color: 'blue',
        textDecorationLine: 'underline',
    },
    li: {
        marginVertical: 8,
    },
    div: {
        marginVertical: 16,
    },
    blockquote: {
        fontStyle: 'italic',
        marginVertical: 16,
        paddingLeft: 10,
        borderLeftWidth: 2,
        borderLeftColor: 'gray',
    },
    strong: {
        fontWeight: 'bold',
    },
    em: {
        fontStyle: 'italic',
    },
    b: {
        fontWeight: 'bold',
    },
    i: {
        fontStyle: 'italic',
    },
    u: {
        textDecorationLine: 'underline',
    },
    small: {
        fontSize: 12,
    },
    mark: {
        backgroundColor: 'yellow',
    },
    del: {
        textDecorationLine: 'line-through',
    },
    ins: {
        textDecorationLine: 'underline',
    },
    sub: {
        fontSize: 12,
        verticalAlign: 'bottom',
    },
    sup: {
        fontSize: 12,
        verticalAlign: 'top',
    },
    code: {
        fontFamily: 'monospace',
        backgroundColor: '#f5f5f5',
        padding: 4,
        borderRadius: 4,
    },
    pre: {
        fontFamily: 'monospace',
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 4,
        overflow: 'scroll',
    },
    abbr: {
        textDecorationLine: 'underline',
        borderBottomWidth: 1,
    },
    cite: {
        fontStyle: 'italic',
    },
    q: {
        fontStyle: 'italic',
    },
    time: {
        fontStyle: 'italic',
    },
    var: {
        fontFamily: 'monospace',
    },
    samp: {
        fontFamily: 'monospace',
    },
    kbd: {
        fontFamily: 'monospace',
        backgroundColor: '#f5f5f5',
        padding: 4,
        borderRadius: 4,
    },
    dfn: {
        fontStyle: 'italic',
    },
    bdo: {
        direction: 'rtl',
    },
    ruby: {
        fontSize: 16,
    },
    rt: {
        fontSize: 12,
        color: 'gray',
    },
    rp: {
        fontSize: 16,
    },
});

export default SentenceRenderer;
