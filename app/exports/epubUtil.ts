import JSZip from "jszip";
import { ChapterData } from "../chapters/_layout";
import * as FS from "expo-file-system";
import { saveFile } from "../downloads/utils";

export async function saveAsEpub({ title, author, content: pages }: {
    title: string, content: ChapterData[], author: string
}) {
    const zip = new JSZip();

    const mimetype = "application/epub+zip";
    zip.file("mimetype", mimetype);
    zip.file("META-INF/container.xml", CONTAINER_XML);

    const metadata =
        '<?xml version="1.0"?>' +
        '<package version="3.0" xml:lang="en" xmlns="http://www.idpf.org/2007/opf" unique-identifier="book-id">' +
        '  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">' +
        '    <dc:identifier id="book-id">urn:uuid:B9B412F2-CAAD-4A44-B91F-A375068478A0</dc:identifier>' +
        '    <meta refines="#book-id" property="identifier-type" scheme="xsd:string">uuid</meta>' +
        '    <meta property="dcterms:modified">2000-03-24T00:00:00Z</meta>' +
        "    <dc:language>en</dc:language>" +
        `    <dc:title>${title}</dc:title>` +
        `    <dc:creator>${author}</dc:creator>` +
        "  </metadata>" +
        "  <manifest>" +
        pages
            .map(
                (_, index) =>
                    `<item id="page${index}" href="page${index}.xhtml" media-type="application/xhtml+xml"/>`
            )
            .join("") +
        '    <item id="toc" href="toc.ncx" media-type="application/x-dtbncx+xml"/>' +
        "  </manifest>" +
        '  <spine toc="toc">' +
        pages.map((_, index) => `<itemref idref="page${index}"/>`).join("") +
        "  </spine>" +
        "</package>";
    zip.file("OEBPS/content.opf", metadata);

    const toc =
        '<?xml version="1.0"?>' +
        '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">' +
        "  <head>" +
        '    <meta name="dtb:uid" content="urn:uuid:B9B412F2-CAAD-4A44-B91F-A375068478A0"/>' +
        '    <meta name="dtb:depth" content="1"/>' +
        '    <meta name="dtb:totalPageCount" content="0"/>' +
        '    <meta name="dtb:maxPageNumber" content="0"/>' +
        "  </head>" +
        "  <docTitle>" +
        `    <text>${title}</text>` +
        "  </docTitle>" +
        "  <navMap>" +
        pages
            .map(
                (_, index) =>
                    `<navPoint id="navpoint-${index + 1}" playOrder="${index + 1}">` +
                    `  <navLabel>` +
                    `    <text>Page ${index + 1}</text>` +
                    `  </navLabel>` +
                    `  <content src="page${index}.xhtml"/>` +
                    `</navPoint>`
            )
            .join("") +
        "  </navMap>" +
        "</ncx>";
    zip.file("OEBPS/toc.ncx", toc);

    pages.forEach((page, index) => {
        const sanitizedContent = page.chapterContent
            .replace(/&nbsp;/g, "\u00A0")
            .replace(/<br>/g, "<br/>")
            .replace(/<img([^>]+)>/gi, "<img$1/>")
            // Correct span tags that might be incorrectly closed
            .replace(/<span([^>]*)>(.*?)<\/?span>/gi, "<span$1>$2</span>")
            // Handle div tags for proper nesting
            .replace(/<div([^>]*)>(.*?)<\/?div>/gi, "<div$1>$2</div>");
        const text =
            '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
            "<!DOCTYPE html>" +
            '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">' +
            "  <head>" +
            `    <title>${page.name || ""}</title>` +
            `${STYLES}` +
            "  </head>" +
            "  <body>" +
            `    <section>
          <h1>${page.name || ""}</h1>` +
            // `      <p>${page.content}</p>` +
            `      <p>${sanitizedContent}</p>` +
            "    </section>" +
            "  </body>" +
            "</html>";
        zip.file(`OEBPS/page${index}.xhtml`, text);
    });

    const base64String = await zip.generateAsync({ type: "base64" });
    const fileName = `${title}.epub`;
    await saveFile(fileName, base64String);
    return fileName;
}

const STYLES = `
<style>
       body, p, h1, h2, h3, h4, h5, h6, span, div {
      user-select: text !important;
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
    }
    </style>`;

const CONTAINER_XML =
    '<?xml version="1.0"?>' +
    '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">' +
    "  <rootfiles>" +
    '    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" />' +
    "  </rootfiles>" +
    "</container>";
