const { parse } = require('advanced-html-parser');
const repos = require('../config/repository.json').repos;
const novelbin = repos.find(r => r.idName === 'novel-bin');

async function fetchHtml(url) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    return await response.text();
}

async function verifySearch() {
    console.log('Verifying Search...');
    const searchUrl = novelbin.repoUrl + novelbin.repoSearch.path.replace('[text]', 'system'); // keyword: system
    const html = await fetchHtml(searchUrl);
    const doc = parse(html);
    const items = doc.querySelectorAll(novelbin.repoSearch.selector);
    console.log(`Found ${items.length} items in search`);

    if (items.length > 0) {
        const item = items[0];
        const titleEl = item.querySelector(novelbin.repoSearch.title.selector);
        console.log('Title:', titleEl ? titleEl.text().trim() : 'NOT FOUND');

        const linkEl = item.querySelector(novelbin.repoSearch.bookId.selector);
        const link = linkEl ? linkEl.getAttribute(novelbin.repoSearch.bookId.attribute) : '';
        const idRegex = new RegExp(novelbin.repoSearch.bookId.regex);
        const match = link.match(idRegex);
        console.log('Book ID:', match ? match[1] : 'NOT FOUND');

        const imageEl = item.querySelector(novelbin.repoSearch.bookImage.selector);
        const imageSrc = imageEl ? imageEl.getAttribute(novelbin.repoSearch.bookImage.attribute) : 'NOT FOUND';
        console.log('Book Image:', imageSrc);
    }
}

async function verifyList() {
    console.log('\nVerifying Popular List...');
    if (!novelbin.listSelector) {
        console.log('No listSelector defined.');
        return;
    }
    const listUrl = novelbin.repoUrl + novelbin.listSelector.path;
    console.log('Fetching List from:', listUrl);
    const html = await fetchHtml(listUrl);
    const doc = parse(html);
    const items = doc.querySelectorAll(novelbin.listSelector.selector);
    console.log(`Found ${items.length} items in list`);

    if (items.length > 0) {
        const item = items[0];
        const imageEl = item.querySelector(novelbin.listSelector.bookImage.selector);
        const imageSrc = imageEl ? imageEl.getAttribute(novelbin.listSelector.bookImage.attribute) : 'NOT FOUND';
        console.log('List Book Image:', imageSrc);
    }
}

async function verifyDetails() {
    console.log('\nVerifying Details...');
    // Use a known book ID from the popular list
    const bookId = 'super-gene';
    const detailsUrl = novelbin.repoUrl + novelbin.homeSelector.path.replace('[bookId]', bookId);
    console.log('Fetching Details from:', detailsUrl);

    const html = await fetchHtml(detailsUrl);
    // require('fs').writeFileSync('details.html', html);
    const doc = parse(html);

    const authorEl = doc.querySelector(novelbin.homeSelector.authorSelector.selector);
    console.log('Author Selector:', novelbin.homeSelector.authorSelector.selector);
    console.log('Author Text:', authorEl ? authorEl.text().trim() : 'NOT FOUND');

    const latestEl = doc.querySelector(novelbin.homeSelector.latestChapterSelector.selector);
    console.log('Latest Chapter:', latestEl ? latestEl.text().trim() : 'NOT FOUND');

    const imageEl = doc.querySelector(novelbin.homeSelector.bookImage.selector);
    console.log('Details Page Image:', imageEl ? imageEl.getAttribute(novelbin.homeSelector.bookImage.attribute) : 'NOT FOUND');

    const summaryEl = doc.querySelector(novelbin.homeSelector.summarySelector.selector);
    console.log('Summary Found:', !!summaryEl);
    if (!summaryEl) console.log('Summary Selector:', novelbin.homeSelector.summarySelector.selector);
}

async function verifyChaptersList() {
    console.log('\nVerifying Chapter List (Iterative)...');
    const bookId = 'super-gene';
    if (novelbin.repoChapterType.type !== 'iterative') {
        console.log('Repo is not iterative, skipping.');
        return;
    }

    const chaptersPath = novelbin.repoChapterType.path.replace('[bookId]', bookId);
    const chaptersUrl = novelbin.repoUrl + chaptersPath;
    console.log('Fetching Chapters from:', chaptersUrl);

    const html = await fetchHtml(chaptersUrl);
    require('fs').writeFileSync('chapters-list.html', html);
    const doc = parse(html);

    // We need to know what selector the app uses for iterative chapters.
    // Usually iterative implies it fetches a page that *contains* the list.
    // Let's check if the page is a 404 or has content.
    const title = doc.querySelector('title');
    console.log('Page Title:', title ? title.text() : 'No Title');

    const notFound = doc.querySelector('.site-error'); // based on previous debug-list.html
    if (notFound) {
        console.error('ERROR: Chapter list page returned 404/Error page');
    } else {
        console.log('Chapter list page seems valid.');
    }
}

async function verifyChapter() {
    console.log('\nVerifying Chapter Content...');
    const bookId = 'super-gene';
    // We need a valid chapter ID. Let's guess or extract from details if we were doing full chaining.
    // For now, let's try a likely one or skip if we don't have one.
    // 'chapter-1' is usually safe for verify.
    const chapterId = '1';
    const chapterUrl = novelbin.repoUrl + novelbin.chapterSelector.path.replace('[bookId]', bookId).replace('[chapterId]', chapterId);
    console.log('Fetching Chapter from:', chapterUrl);

    const html = await fetchHtml(chapterUrl);
    const doc = parse(html);

    const contentEl = doc.querySelector(novelbin.chapterSelector.content.selector);
    console.log('Content Selector:', novelbin.chapterSelector.content.selector);
    console.log('Content Found:', !!contentEl);
}

(async () => {
    try {
        await verifySearch();
        await verifyList();
        await verifyDetails();
        await verifyChaptersList();
        await verifyChapter();
    } catch (e) {
        console.error(e);
    }
})();
