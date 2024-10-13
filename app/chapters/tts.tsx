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

export type SpeechAction = 'unknown' | 'speak' | 'stop' | 'pause';

export function isSpeechOrPause(state: SpeechAction) {
    return state === 'speak' || state === 'pause';
}

export interface TTS {
    state: SpeechAction;
    sentences: Sentence[];
    ttsQueue?: Sentence[];
    currentSentence?: string;
}

export const ttsStore = create((set, get: any) => ({
    tts: {
        state: 'unknown',
        sentences: [],
    } as TTS,
    setCurrentSentence: (currentSentence: string) => {
        const currentTTS: TTS = get().tts;
        const tts: TTS = { ...currentTTS, currentSentence };
        if (isSpeechOrPause(tts.state)) {
            tts.state = 'pause';
            tts.currentSentence = currentSentence;
            updateSentenceTracker(tts);
            setTTS({ tts: { ...tts }, setTTS: get().setTTS, decreaseIndex: false });
        }
    },
    setTTS: (tts: TTS) => {
        if (!isSpeechOrPause(tts.state)) {
            updateSentenceTracker(tts);
        }
        set({ tts });
    },
}));

let sentenceTracker = { index: 0 };

function updateSentenceTracker(tts: TTS) {
    sentenceTracker.index = tts.ttsQueue ? indexOfSentence(tts.ttsQueue, tts.currentSentence) : 0;
}

export function setTTS({ tts, setTTS, decreaseIndex = true }:
    { decreaseIndex?: boolean, tts: TTS, setTTS: (tts: TTS) => void }): Promise<void> {
    let promise = Promise.resolve();
    switch (tts.state) {
        case 'unknown':
            sentenceTracker = { index: 0 };
            tts.currentSentence = undefined;
            break;
        case 'speak':
            processNextSentence();
            break;
        case 'stop':
            sentenceTracker = { index: 0 };
            tts.currentSentence = undefined;
            promise = Speech.stop().then(() => { });
            break;
        case 'pause':
            if (sentenceTracker.index !== 0 && tts.ttsQueue) {
                if (decreaseIndex) {
                    sentenceTracker.index--;
                }
                tts.currentSentence = tts.ttsQueue[sentenceTracker.index].id;
            }
            promise = Speech.stop().then(() => { });
            break;
    }

    setTTS({ ...tts });

    function processNextSentence() {
        if (!tts.ttsQueue?.length) return;
        if (sentenceTracker.index < tts.ttsQueue.length) {
            const currentSentence = tts.ttsQueue[sentenceTracker.index];
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

    return promise;
}

export function indexOfSentence(sentences: Sentence[], id?: string) {
    return sentences.findIndex((sentence) => sentence.id === id
        || sentence.children?.find((child) => child.id === id));
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
                    const tagName = node.parentNode?.tagName ?? 'span';
                    const parent: Sentence = {
                        id: uuid.v4() as string,
                        tagName,
                        text,
                        children
                    };
                    const html = buildHtmlFromSentence(parent);
                    sentences.push({ ...parent, html });
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
    return { sentences, html: joinedHtml };
}

function joinSentencesIntoHtml(sentences: Sentence[]): string {
    let html = '';
    sentences.forEach((sentence) => {
        html += buildHtmlFromSentence(sentence);
    });
    return html;
}


export function buildHtmlFromSentence(sentence: Sentence) {
    let html = '';
    if (sentence.children) {
        let childrenHtml = joinSentencesIntoHtml(sentence.children);
        html += `<${sentence.tagName}>${childrenHtml}</${sentence.tagName}>`;
    } else {
        html += sentence.html;
    }
    return html;
}

function createSentenceFromNode(text: string, parentTag = 'a'): Sentence {
    const id = uuid.v4() as string;
    const html = `<${parentTag} id="${id}" href="${id}" >${text}</${parentTag}>`;
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