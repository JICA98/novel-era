// src/types/index.ts

export interface BookImageSelector {
    type: string;
    selector: string;
    attribute: string;
    page: string;
}

export interface Repo {
    name: string;
    id: string;
    repoUrl: string;
    repoType: string;
    repoIcon: string;
    repoBookUrl: string;
    repoAllChaptersUrl: string;
    repoChapterType: {
        type: string;
        path: string;
    };
    bookImageSelector: BookImageSelector;
    listSelector: ListSelector;
    homeSelector: HomeSelector;
    chapterSelector: ChapterSelector;
}

export interface ChapterSelector extends Selector {
    path: string;
    content: Selector;
}

export interface HomeSelector extends Selector {
    path: string;
    latestChapterSelector: Selector;
    summarySelector: Selector;
}

export interface ListSelector extends Selector {
    path: string;
    page: string;
    bookImage: Selector;
    title: Selector;
    bookLink: Selector;
    bookId: Selector;
}

export interface Selector {
    type: SelectorType;
    selector: string;
    attribute: string;
    regex: RegExp;
}

export interface ReposData {
    repos: Repo[];
}

export interface FetchData<T> {
    data?: T;
    error?: any;
    isLoading: boolean;
}

export enum SelectorType {
    text = 'text',
    html = 'html',
    css = 'css',
    attribute = 'attribute',
    image = 'image'
}

export interface Content {
    title: string;
    bookImage: string;
    bookLink: string;
    bookId: string;
}

export function processData(data: any, selector: Selector): string {
    let content = data;
    if (selector.selector) {
        content = data.querySelector(selector.selector);
    }
    if (selector.attribute) {
        content = content.getAttribute(selector.attribute);
    } else {
        console.log(selector.type);
        if (selector.type === SelectorType.html) {
            content = content.innerHTML;
        } else {
            content = content.textContent;
        }
    }
    if (selector.regex) {
        const match = new String(content).match(selector.regex);
        content = match ? match[1] : '';
    }
    return content;

}