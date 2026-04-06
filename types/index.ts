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
    repoChapterType: {
        type: string;
        path: string;
    };
    repoSearch: RepoSearch;
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
    latestChapter?: number;
    summary?: string;
    author?: string;
}

export function processData(data: any, selector: Selector): string {
    if (!selector) {
        return '';
    }

    let content = data;

    if (selector.selector) {
        if (!content || typeof content.querySelector !== 'function') {
            return '';
        }
        content = content.querySelector(selector.selector);
    }

    if (!content) {
        return '';
    }

    let result: any = content;

    if (selector.attribute) {
        if (typeof content.getAttribute !== 'function') {
            return '';
        }
        const attributeValue = content.getAttribute(selector.attribute);
        if (attributeValue == null) {
            return '';
        }
        result = attributeValue;
    } else {
        if (selector.filters && typeof content.querySelectorAll === 'function') {
            for (const filter of selector.filters) {
                if (!filter.selector) {
                    continue;
                }
                const removable = content.querySelectorAll(filter.selector) ?? [];
                removable.forEach((element: any) => {
                    if (typeof element.remove === 'function') {
                        element.remove();
                    }
                });
            }
        }

        if (selector.type === SelectorType.html) {
            result = content.innerHTML ?? '';
        } else {
            result = content.textContent ?? '';
        }
    }

    if (selector.regex) {
        const match = String(result ?? '').match(selector.regex);
        result = match ? match[1] ?? '' : '';
    }

    return typeof result === 'string' ? result : String(result ?? '');
}

/**
 * Normalizes a URL by ensuring it has a protocol and is absolute if a base URL is provided.
 * Supports:
 * - //example.com -> https://example.com
 * - /path/to/img -> https://base.com/path/to/img
 */
export function normalizeUrl(url?: string, baseUrl?: string): string {
    if (!url || url.trim().length === 0) return '';
    let res = url.trim();
    if (res.startsWith('//')) {
        res = 'https:' + res;
    } else if (res.startsWith('/')) {
        if (baseUrl) {
            const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            res = base + (res.startsWith('/') ? '' : '/') + res;
        }
    }
    return res;
}
