import Epub, { Chapter } from 'epub-gen';

/**
 * @param {string} title
 * @param {string} author
 * @param {string} cover
 * @param {string} content
 * @returns {Epub.Options} 
 * @example
 * epubOption('title', 'author', 'cover', 'content')
 ** */
function epubOption(title: string, author: string, cover: string, content: Chapter[],): Epub.Options {
    return {
        title, // *Required, title of the book.
        author: author, // *Required, name of the author.
        cover: cover, // Url or File path, both ok.
        content,
        appendChapterTitles: true,
    };
}

async function saveAsEpub(title: string, content: any, cover: any, author: any) {
    const name = `./epub/${title}.epub`;
    const option = epubOption(title, author, cover, content);

    const epub = (new Epub(option, name));
    const result = await epub.promise;
}