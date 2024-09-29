// src/types/index.ts

export interface BookImageSelector {
    type: string;
    selector: string;
    attribute: string;
    page: string;
}

export interface Repo {
    name: string;
    idName: string;
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
    repoSearch: RepoSearch;
    bookImageSelector: BookImageSelector;
    listSelector: ListSelector;
    homeSelector: HomeSelector;
    chapterSelector: ChapterSelector;
}

export interface RepoSearch extends Selector {
    bookImage: Selector;
    title: Selector;
    bookLink: Selector;
    bookId: Selector;
    rating: Selector;
}

export interface ChapterSelector extends Selector {
    content: Selector;
}

export interface HomeSelector extends Selector {
    latestChapterSelector: Selector;
    summarySelector: Selector;
    authorSelector: Selector;
}

export interface SnackBarData {
    visible: boolean;
    message?: string;
    severity?: 'success' | 'error';
    action?: { label: string; onPress: () => void; },
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
    filters: Selector[];
    method: 'GET' | 'POST';
    path: string;
    jsonPath: string;
}

export interface ReposData {
    repos: Repo[];
}

export interface FetchData<T> {
    data?: T;
    error?: any;
    isLoading: boolean;
    noStarted?: boolean;
}

export enum SelectorType {
    text = 'text',
    html = 'html',
    css = 'css',
    attribute = 'attribute',
    image = 'image',
    'http' = 'http',
}

export interface Content {
    title: string;
    bookImage: string;
    bookLink: string;
    bookId: string;
    rating?: string;
}

export function processData(data: any, selector: Selector): string {
    let content = data;
    if (selector.selector) {
        content = data.querySelector(selector.selector);
    }
    if (selector.attribute) {
        content = content.getAttribute(selector.attribute);
    } else {
        if (selector.filters) {
            for (const filter of selector.filters) {
                if (filter.selector) {
                    content.querySelectorAll(filter.selector)
                        .forEach((element: any) => {
                            element.remove();
                        });
                }
            }
        }
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