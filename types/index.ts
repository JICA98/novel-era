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
}

export interface ReposData {
    repos: Repo[];
}

export interface FetchData<T> {
    data?: T;
    error?: any;
    isLoading: boolean;
}