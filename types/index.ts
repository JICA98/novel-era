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
    repoTagSearch?: RepoTagSearch;
    listSelector: ListSelector;
    homeSelector: HomeSelector;
    chapterSelector: ChapterSelector;
}

export interface RepoTag {
    label: string;
    value: string;
}

export interface RepoSearch extends Selector {
    bookImage: Selector;
    title: Selector;
    bookLink: Selector;
    bookId: Selector;
    rating: Selector;
}

export interface RepoTagSearch extends ListSelector {
    tags: RepoTag[];
}

export interface ChapterSelector extends Selector {
    content: Selector;
}

export interface HomeSelector extends Selector {
    latestChapterSelector: Selector;
    summarySelector: Selector;
    authorSelector: Selector;
    tagsSelector?: Selector;
    ratingSelector?: Selector;
    viewsSelector?: Selector;
    bookmarkedSelector?: Selector;
    statusSelector?: Selector;
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
    rating?: Selector;
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
    views?: string;
    bookmarked?: string;
    status?: string;
    latestChapter?: number;
    summary?: string;
    author?: string;
    tags?: string[];
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

export function processDataList(data: any, selector?: Selector): string[] {
    if (!selector || !selector.selector || !data || typeof data.querySelectorAll !== 'function') {
        return [];
    }

    const nodes = data.querySelectorAll(selector.selector) ?? [];
    const values = Array.from(nodes)
        .map((node: any) => {
            let result: any = '';

            if (selector.attribute) {
                if (typeof node.getAttribute !== 'function') {
                    return '';
                }
                result = node.getAttribute(selector.attribute) ?? '';
            } else {
                result = node.textContent ?? '';
            }

            if (selector.regex) {
                const match = String(result ?? '').match(selector.regex);
                result = match ? match[1] ?? '' : '';
            }

            return String(result ?? '').trim();
        })
        .filter(Boolean);

    return Array.from(new Set(values));
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

function normalizeSearchValue(value?: string): string {
    return (value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ');
}

export function resolveRepoTag(repo: Repo, query?: string): RepoTag | undefined {
    const normalizedQuery = normalizeSearchValue(query);
    if (!normalizedQuery || !repo.repoTagSearch?.tags?.length) {
        return undefined;
    }

    return repo.repoTagSearch.tags.find((tag) => {
        return [
            normalizeSearchValue(tag.label),
            normalizeSearchValue(tag.value),
        ].includes(normalizedQuery);
    });
}
