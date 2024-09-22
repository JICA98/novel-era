import Epub from 'epub-gen';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import { setTimeout } from "timers/promises";
import pLimit from "p-limit";
import path from 'path';

const limitFn = pLimit(5);
const ranks = ['SSS', 'SS', 'S', 'A', 'B', 'D', 'E', 'F']
    .flatMap(e => [`${e}-`, e, `${e}+`]).map(e => ({ symbol: `<${e}>`, rank: e }));

/**
 * @param {string} title
 * @param {string} author
 * @param {string} cover
 * @param {string} content
 * @returns {Epub.Options} 
 * @example
 * epubOption('title', 'author', 'cover', 'content')
 ** */
function epubOption(title, author, cover, content) {
    return {
        title, // *Required, title of the book.
        author: author, // *Required, name of the author.
        cover: cover, // Url or File path, both ok.
        content,
        appendChapterTitles: true,
    };
}

function toTitleCase(str) {
    return str.split(' ').map(e => e[0].toUpperCase() + e.slice(1)).join(' ');
}

async function saveAsEpub(title, content, cover, author) {
    title = toTitleCase(title.replaceAll('-', ' '));
    const name = `./epub/${title}.epub`;
    const option = epubOption(title, author, cover, content);

    const epub = (new Epub(option, name));
    const result = await epub.promise;
    console.log(result)
}

function fileName(key, type, prefix = 'cache') {
    return `./${prefix}/${toBase64(key)}${type ? `.${type}` : ''}`.replace(' ', '_');
}

function saveInCache(content, key = '', type) {
    const mode = typeof content === 'string' ? 'w' : 'wb';
    const directory = key.includes('-') ? `cache/${key.split('-')[0]}` : 'cache';
    const filePath = fileName(key, type, directory);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, { encoding: 'utf8', flag: mode });
}

function fromCache(key, type) {
    try {
        const directory = key.includes('-') ? `cache/${key.split('-')[0]}` : 'cache';
        return fs.readFileSync(fileName(key, type, directory), 'utf8');
    } catch (error) {
        return null;
    }
}

function toBase64(data) {
    return Buffer.from(data).toString('base64');
}

async function getCall(url, key) {
    const cached = fromCache(key, 'html');
    if (cached !== null && cached !== '') {
        return { response: cached, fromCache: true };
    }
    console.log(`Hitting url: ${url}`);
    const response = await ((await fetch(url)).text());
    saveInCache(response, key, 'html');
    return { response, fromCache: false };
}

function getKey(title, chapter) {
    return `${title}-chapter-${chapter}`;
}

function titleFromURL(url = '') {
    const split = url.split('/');
    const index = split.findIndex(spl => spl.includes('Chapter'));
    if (index !== -1) {
        const item = split[index];
        const chapterIndex = item.indexOf('Chapter');
        if (chapterIndex !== -1) {
            return item.slice(chapterIndex).replace('-', ' ');
        }
    }
}

async function lightNovelToEpub(title, url, index) {
    const key = getKey(title, index);
    let resp = await getCall(url, key);
    let html = resp.response;
    ranks.forEach(rank => {
        html = html.replaceAll(rank.symbol, rank.rank);
    })
    const $ = getHtml(html);
    const chapterHtml = $.querySelector('div#chapter-container div#content');
    let titleELe = ($.querySelector('.chapter-title')) ?? chapterHtml.querySelector('h4') ?? chapterHtml.querySelector('h3')
        ?? chapterHtml.querySelector('p');
    let chapterTitle = titleELe?.textContent;
    let isChapterTitle = chapterTitle?.startsWith('Chapter');
    if (!isChapterTitle) {
        chapterTitle = titleFromURL(url);
        isChapterTitle = !!chapterTitle;
    }
    removeSubTags(chapterHtml);
    removeAdNodes(chapterHtml);
    removeElementsStartingTagZ(chapterHtml);
    const data = chapterHtml.innerHTML.trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<(\w+)[^>]*>(?:\s|&nbsp;)*<\/\1>/g, '');
    return { data, title: isChapterTitle ? chapterTitle : null, fromCache: resp.fromCache };
}


function deleteAdNode(p) {
    if (p.textContent?.toLowerCase()?.includes('early and in the highest quality')) {
        console.log('Removing:', p.textContent);
        p.parentElement.removeChild(p);
    }
}
function removeAdNodes(html) {
    const textNodes = html.querySelectorAll('*');
    textNodes.forEach(p => {
        if (checkIfElementHasOnlyText(p)) {
            deleteAdNode(p);
        }
    });
    html.querySelectorAll('.box-notification').forEach(p => {
        deleteAdNode(p);
    });
}

function getOnlyText(str) {
    const $ = getHtml(str);
    return $.body.textContent.trim();
}

function checkIfElementHasOnlyText(element) {
    return element.childNodes.length === 1;
}

function removeSubTags(chapterHtml) {
    var subTags = chapterHtml.querySelectorAll('sub');
    subTags.forEach(function (subTag) {
        subTag.parentNode?.removeChild(subTag);
    });
}

function removeElement(element, removeWhat = '') {
    if (!removeWhat) {
        element.remove();
        return;
    }
    while (element) {
        const currEle = element;
        element = element[removeWhat];
        currEle.remove();
    }
}

function removeElementsStartingTagZ(chapterHtml) {
    const allTags = chapterHtml.querySelectorAll('*');
    allTags.forEach(tag => {
        if (tag.tagName.toLowerCase().startsWith('z')) {
            tag.remove();
        }
    });

}

async function allChaptersFromHome(title = '', startIndex = 0, endIndex = 10, imageUrl = '', author = '') {
    await getCall(`https://pandanovel.co/panda-novel/${title}/chapters?page=&sort_by=desc`, title);
    const $ = getHtml(fromCache(title, 'html'));
    const elements = $.querySelectorAll('.chapter-item-title')
    const arr = [];
    for (let index = 0; index < elements.length; index++) {
        const element = elements[index];
        arr.push(element)
    }
    const eR = arr.map(e => e.parentElement.parentElement)
        .map(e => e.attributes.getNamedItem('href').nodeValue)
        .reverse()
        .slice(startIndex, endIndex);
    const that = await Promise.all(eR.map((e, index) => lightNovelToEpub(title, e, startIndex + index)));
    const mappedThat = that.map((e, index) => ({ ...e, title: e.title ?? `Chapter ${startIndex + index}` }));
    saveAsEpub(title, mappedThat, imageUrl, author);
}

function getHtml(html) {
    return new JSDOM(html).window.document;
}

async function allChapters(title = '', startIndex = 0, limit = 10, imageUrl = '', author = '', parallel = false, output = 'epub') {
    const that = [];
    let batch = 0;
    const future = async (index) => limitFn(() => lightNovelToEpub(title, `https://novelfire.net/book/${title}/chapter-${index}`, index))
    if (parallel) {
        (await Promise.all([...Array(limit).keys()].map(e => future(startIndex + e))))
            .forEach(e => that.push(e));
    } else {
        for (let index = startIndex; index < (startIndex + limit); index++) {
            const data = await future(index);
            that.push(data);
            if (!data.fromCache) {
                await setTimeout(500);
                batch--;
            }
            if (batch === 50) {
                batch = 0;
                await setTimeout(10000);
            }
        }
    }
    if (output === 'epub') {
        saveAsEpub(title, that.map((e, index) => ({ ...e, title: e?.title ?? `Chapter ${startIndex + index}` })), imageUrl, author)
    } else if (output === 'json') {
        const json = JSON.stringify(that.map((json) => ({ title: json.title, data: getOnlyText(json.data) })));
        fs.writeFileSync(`./cache/json/${title}.json`, json, { encoding: 'utf8', flag: 'w' });
    } else if (output === 'csv') {
        const csv = that.map(e => `${e.title},${e.data}`).join('\n');
        saveInCache(csv, title, 'csv');
    }
}


// The Author's POV
// allChapters(
//     'the-authors-pov',
//     603,
//     258,
//     './Ren_new.webp',
//     'Entrai JI'
// );

// Shadow Slave
// allChapters(
//     'shadow-slave',
//     1,
//     1544,
//     './shadow-slave.jpg',
//     'Guiltythree',
//     true
// );

//pivot-of-the-sky
// allChapters(
//     'pivot-of-the-sky',
//     1,
//     226,
//     './pivot-of-the-sky.jpg',
//     'Sir Xu Shengzhi',
//     true
// );

//i-reincarnated-for-nothing
// allChapters(
//     'i-reincarnated-for-nothing',
//     1,
//     204,
//     './i-reincarnated-for-nothing.jpg',
//     'Toika, 토이카, Toy Car',
//     true
// );

// there-was-no-secret-organization-to-fight-with-the-worlds-darkness-so-i-made-one-in-exasperation
// allChapters(
//     'there-was-no-secret-organization-to-fight-with-the-worlds-darkness-so-i-made-one-in-exasperation',
//     2,
//     69,
//     './there-was-no-secret-organization-to-fight-with-the-worlds-darkness-so-i-made-one-in-exasperation.jpg',
//     'Kurodome Hagane, クロル, 黒留ハガネ, Kuroru',
//     true
// );

// someday-will-i-be-the-greatest-alchemist
// allChapters(
//     'someday-will-i-be-the-greatest-alchemist',
//     1,
//     533,
//     './someday-will-i-be-the-greatest-alchemist.jpg',
//     'Kogitsune Maru',
//     true
// );

// return-of-the-runebound-professor
// allChapters(
//     'return-of-the-runebound-professor',
//     1,
//     2,
//     './return-of-the-runebound-professor.jpg',
//     'Actus',
//     true,
//     'json'
// );

// supreme-magus
allChapters(
    'supreme-magus',
    3,
    3200,
    './supreme-magus.jpg',
    'Legion20',
    true,
    'epub'
);


export const epubSettings = {
    
};