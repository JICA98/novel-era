import { Content, processData, Repo } from "@/types";
import { router } from "expo-router";
import IDOMParser from "advanced-html-parser";
import { saveFile } from "../downloads/utils";

export interface ChapterData {
    id: string;
    chapterContent: string;
    name: string;
    repo: Repo;
    content: Content;
}

export interface RenderChapterProps {
    focusedMode: boolean;
    id: string;
    content: Content;
    data: string;
    repo: Repo,
    continueReading?: boolean;
    fromPrevious?: boolean;
    enableNextPrev: boolean;
}

export function chapterKey(repo: Repo, content: Content, id: string) {
    return repo.repoUrl + repo.chapterSelector.path.replace('[bookId]', content.bookId).replace('[chapterId]', id);
}

export async function fetchChapter(repo: Repo, content: Content, id: string): Promise<ChapterData> {
    try {
        const key = chapterKey(repo, content, id);
        console.log(key);
        const response = await fetch(key);
        const html = await response.text();
        const dom = IDOMParser.parse(html).documentElement;
        const contentData = processData(dom, repo.chapterSelector.content);
        const name = `Chapter ${id}`;
        const chapterContent = { id, chapterContent: contentData, repo, content, name } as ChapterData;
        saveFile(key, chapterContent).then(() => console.log('Saved'));
        return chapterContent;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch chapter');
    }
}

export function navigateToNextChapter(props: RenderChapterProps, add = 1) {
    router.replace({
        pathname: '/chapters',
        params: {
            props: JSON.stringify({
                ...props,
                id: (parseInt(props.id) + add).toString(),
                continueReading: true,
                fromPrevious: add === -1,
            }),
        }
    });
}

export const timeAgo = (timeInMillis: number): string => {
    if (!timeInMillis) return '';
    const lastRead = new Date(timeInMillis);
    const now = Date.now();
    const diff = now - lastRead.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
        return 'Today';
    }
    if (days === 1) {
        return 'Yesterday';
    }
    if (days < 7) {
        return `${days} days ago`;
    }
    if (days < 30) {
        return `${Math.floor(days / 7)} weeks ago`;
    }
    if (days < 365) {
        return `${Math.floor(days / 30)} months ago`;
    }
    return `${Math.floor(days / 365)} years ago`;
};