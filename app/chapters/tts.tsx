import { create } from "zustand";
import * as Speech from 'expo-speech';
import uuid from 'react-native-uuid';
import IDOMParser from "advanced-html-parser";

export interface Sentence {
    id: string;
    text?: string;
    html?: string;
    tagName?: string;
    children?: Sentence[];
}

export type SpeechAction = 'unknown' | 'speak' | 'stop' | 'pause' | 'resume';

export interface TTS {
    state: SpeechAction;
    queue: Sentence[];
    currentSentence?: string;
}

export const ttsStore = create((set) => ({
    tts: {
        state: 'unknown',
        queue: [],
    } as TTS,
    setTTS: (tts: TTS) => set({ tts }),
}));

let sentenceTracker = { index: 0 };

export function setTTS({ tts, setTTS }:
    { tts: TTS, setTTS: (tts: TTS) => void }) {
    console.log('Setting TTS', tts.state);
    switch (tts.state) {
        case 'unknown':
            sentenceTracker = { index: 0 };
            tts.currentSentence = undefined;
            break;
        case 'speak':
            if (tts.queue.length) {
                processNextSentence();
            }
            break;
        case 'stop':
            sentenceTracker = { index: 0 };
            tts.currentSentence = undefined;
            Speech.stop().then(() => { });
            break;
        case 'pause':
            if (sentenceTracker.index !== 0) {
                sentenceTracker.index--;
            }
            Speech.stop().then(() => { });
            break;
        case 'resume':
            processNextSentence();
            break;
    }

    setTTS({ ...tts });

    function processNextSentence() {
        if (sentenceTracker.index < tts.queue.length) {
            const currentSentence = tts.queue[sentenceTracker.index];
            performSpeech(currentSentence);
            tts.currentSentence = currentSentence.id;
            sentenceTracker.index++;
        } else {
            tts.state = 'unknown';
        }
        setTTS({ ...tts });
    }

    function performSpeech(child?: Sentence) {
        if (child?.text) {
            Speech.speak(child.text, {
                onDone: processNextSentence,
            });
        }
    }
}

function splitTextIntoSentences(text: string): Sentence[] {
    let sentences = text.split(/(?<=[.!?])\s+/);
    let result: Sentence[] = [];
    const length = Speech.maxSpeechInputLength;
    for (let i = 0; i < sentences.length; i++) {
        if (sentences[i].length < length) {
            let selectedSentence = sentences[i].trim();
            if (i !== 0) {
                selectedSentence = ' ' + selectedSentence;
            }
            const sentence = createSentenceFromNode(selectedSentence);
            result.push(sentence);
        } else {
            let part = sentences[i];
            do {
                const sentence = createSentenceFromNode(part.substring(0, length));
                result.push(sentence);
                part = part.substring(length);
            } while (part.length > length);
        }
    }
    return result;
}


export function htmlToIdSentences(html: string) {
    const dom = IDOMParser.parse(`<html>
    <body>
        ${html}
    </body>
    </html>`).documentElement;
    const sentences: Sentence[] = [];

    function traverse(node: any) {
        if (node?.nodeType === 3) { // Text node
            const text = node.textContent.trim();
            if (text) {
                const children = splitTextIntoSentences(text);
                if (children.length) {
                    const parent: Sentence = { id: uuid.v4() as string, tagName: node.parentNode?.tagName ?? 'span' };
                    parent.children = children;
                    sentences.push(parent);
                }
            }
        } else if (node?.childNodes) {
            for (let i = 0; i < node.childNodes.length; i++) {
                traverse(node.childNodes[i]);
            }
        }
    }

    traverse(dom);
    const joinedHtml = joinSentencesIntoHtml(sentences);
    console.log(joinedHtml);
    return { sentences, html: joinedHtml };
}

function joinSentencesIntoHtml(sentences: Sentence[]): string {
    let html = '';
    sentences.forEach((sentence) => {
        if (sentence.children) {
            let childrenHtml = joinSentencesIntoHtml(sentence.children);
            html += `<${sentence.tagName}>${childrenHtml}</${sentence.tagName}>`;
        } else {
            html += sentence.html;
        }
    });
    return html;
}


function createSentenceFromNode(text: string, parentTag = 'span'): Sentence {
    const id = uuid.v4() as string;
    const html = `<${parentTag} id="${id}" >${text}</${parentTag}>`;
    return { id, text, html };
}

export function toQueue(sentences: Sentence[]): Sentence[] {
    let queue: Sentence[] = [];
    sentences.forEach((sentence) => {
        if (sentence.children?.length) {
            queue = queue.concat(toQueue(sentence.children));
        } else {
            if (sentence.text?.trim()) {
                queue.push(sentence);
            }
        }
    });
    return queue;
}