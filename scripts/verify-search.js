const { parse } = require('advanced-html-parser');
const repos = require('../config/repository.json').repos;

async function fetchHtml(url) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    // For Novel Fire manual test, assume text if we switch endpoint
    // For Novel Bin, it returns text.
    return await response.text();
}

async function verifyRepoSearch(repoName, query) {
    const repo = repos.find(r => r.name === repoName);
    if (!repo) {
        console.log(`Repo ${repoName} not found`);
        return;
    }

    console.log(`\nVerifying Search for ${repoName}...`);
    let searchUrl = repo.repoUrl + repo.repoSearch.path.replace('[text]', query);
    let selector = repo.repoSearch.selector;

    console.log('Search URL:', searchUrl);

    try {
        const html = await fetchHtml(searchUrl);
        // Clean up potential malformed attributes that break xmldom/advanced-html-parser if strictly validating
        // advanced-html-parser is usually lenient, but let's see.
        const doc = parse(html);
        const items = doc.querySelectorAll(repo.repoSearch.selector);

        console.log(`Found ${items.length} items`);

        let validCount = 0;
        let invalidCount = 0;

        items.forEach((item, index) => {
            const titleSelector = repo.repoSearch.title.selector || '.novel-title';
            const titleEl = item.querySelector(titleSelector);
            const title = titleEl ? titleEl.text().trim() : '';

            if (title) {
                validCount++;
                if (index === 0) {
                    console.log('First Item Title:', title);

                    // Debug Image extraction
                    const imgSelector = repo.repoSearch.bookImage.selector;
                    const imgAttr = repo.repoSearch.bookImage.attribute;
                    const imgEl = item.querySelector(imgSelector);
                    const imgSrc = imgEl ? imgEl.getAttribute(imgAttr) : 'NOT FOUND';
                    console.log('First Item Image:', imgSrc);
                    if (imgEl) {
                        console.log('Image Element Attributes:', JSON.stringify(imgEl.attributes));
                    }
                }
            } else {
                invalidCount++;
                console.log(`Item ${index} invalid/empty title. HTML snippet:`, item.toString().substring(0, 100));
            }
        });

        console.log(`Valid: ${validCount}, Invalid: ${invalidCount}`);

    } catch (error) {
        console.error(`Error verifying ${repoName}:`, error.message);
    }
}

(async () => {
    await verifyRepoSearch("Novel Fire", "One");
    await verifyRepoSearch("Novel Bin", "One");
})();
