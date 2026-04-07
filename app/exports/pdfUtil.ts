import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import { ChapterData } from "../chapters/common";
import { saveFile } from "../downloads/utils";

interface SaveAsPdfOptions {
    title: string;
    author: string;
    content: ChapterData[];
}

export async function saveAsPdf({ title, author, content }: SaveAsPdfOptions): Promise<string> {
    const sanitizedFileTitle = sanitizeFileName(title);
    const html = buildHtmlDocument({ title, author, content });
    const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });

    let pdfBase64 = base64;
    if (!pdfBase64 && uri) {
        pdfBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    }

    if (!pdfBase64) {
        throw new Error("Failed to generate PDF export.");
    }

    const fileName = `${sanitizedFileTitle || "Novel Export"}.pdf`;
    await saveFile(fileName, pdfBase64);
    return fileName;
}

function buildHtmlDocument({
    title,
    author,
    content,
}: SaveAsPdfOptions): string {
    const chapterSections = content
        .map((chapter, index) => {
            const safeName = chapter.name || `Chapter ${index + 1}`;
            const sanitized = sanitizeChapterContent(chapter.chapterContent || "");
            return `
                <section class="chapter">
                    <h2>${safeName}</h2>
                    <div class="chapter-body">${sanitized}</div>
                </section>
            `;
        })
        .join("\n");

    const authorLine = author ? `<p class="subtitle">by ${author}</p>` : "";
    return `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="utf-8" />
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                        margin: 32px 40px;
                        color: #1c1c1e;
                        line-height: 1.6;
                    }
                    h1 {
                        font-size: 32px;
                        margin-bottom: 4px;
                    }
                    .subtitle {
                        font-size: 18px;
                        margin-bottom: 32px;
                        color: #636366;
                    }
                    h2 {
                        font-size: 22px;
                        margin-top: 0;
                    }
                    .chapter {
                        page-break-after: always;
                    }
                    .chapter:last-of-type {
                        page-break-after: auto;
                    }
                    .chapter-body img {
                        max-width: 100%;
                        height: auto;
                    }
                    .chapter-body {
                        margin-top: 16px;
                        word-break: break-word;
                    }
                    p {
                        margin: 0 0 12px;
                    }
                </style>
            </head>
            <body>
                <header>
                    <h1>${title}</h1>
                    ${authorLine}
                </header>
                ${chapterSections}
            </body>
        </html>
    `;
}

function sanitizeChapterContent(content: string): string {
    return content
        .replace(/&nbsp;/g, "\u00A0")
        .replace(/<br\s*>/gi, "<br/>")
        .replace(/<img([^>]+)>/gi, "<img$1/>")
        .replace(/<span([^>]*)>(.*?)<\/?span>/gi, "<span$1>$2</span>")
        .replace(/<div([^>]*)>(.*?)<\/?div>/gi, "<div$1>$2</div>");
}

function sanitizeFileName(value: string): string {
    return value.replace(/[\\/:*?"<>|]/g, "").trim();
}

export default function() { return null; }
