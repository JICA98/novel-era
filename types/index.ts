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
    bookImageSelector: BookImageSelector;
    listSelector: ListSelector;
}

export interface ListSelector {
    type: string;
    path: string;
    value: string;
    page: string;
    bookImage: Selector;
    title: Selector;
    bookLink: Selector;
}

export interface Selector {
    type: SelectorType;
    selector: string;
    attribute: string;
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
    css = 'css',
    attribute = 'attribute',
    image = 'image'
}

export interface Content {
    title: string;
    bookImage: string;
    bookLink: string;
}

export function processData(data: any, selector: Selector): string {
    let content = data;
    if (selector.selector) {
        content = data.querySelector(selector.selector);
    }
    if (selector.attribute) {
        return content.getAttribute(selector.attribute);
    }
    return content.textContent;

}