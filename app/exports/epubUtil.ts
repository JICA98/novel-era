import epub from 'epub-gen-memory/bundle';
import type { Options, Content, Chapter, Font } from 'epub-gen-memory';

function epubOption(title: string, author: string, cover: string): Options {
    return {
        title, // *Required, title of the book.
        author: author, // *Required, name of the author.
        cover: cover, // Url or File path, both ok.
    };
}

export async function saveAsEpub(
    { title, author, content, cover }: {
        title: string, content: string[], cover: string, author: string
    }): Promise<Blob> {
    const option = epubOption(title, author, cover);

    return epub(option, content.map((content, index) => {
        const chapter: Chapter = {
            title: `Chapter ${index + 1}`,
            content,
        };
        return chapter;
    }));
}