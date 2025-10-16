import { Repo, Content, SnackBarData } from "@/types";
import { ChapterData, chapterKey, fetchChapter } from "../chapters/common";
import { readFile, moveToAlbum, createStore } from "../downloads/utils";
import { saveAsEpub } from "./epubUtil";
import { saveAsPdf } from "./pdfUtil";
import { pLimitLit } from "../_layout";

type ExportFormat = "epub" | "pdf";

interface ExportOptions {
    onProgress?: (completed: number, total: number) => void;
}

export async function exportChapters(
    range: [number, number],
    format: ExportFormat,
    repo: Repo,
    content: Content,
    downloads: any,
    setDownloads: any,
    setSnackBarData: React.Dispatch<React.SetStateAction<SnackBarData>>,
    options: ExportOptions = {}
): Promise<void> {
    const [startRange, endRange] = range;
    const total = endRange - startRange + 1;
    const limit = pLimitLit(1);
    const collectedChapters: ChapterData[] = [];

    for (let offset = 0; offset < total; offset += 1) {
        const id = (startRange + offset).toString();
        const chapterData = await limit(async () => {
            const key = chapterKey(repo, content, id);
            if (downloads.has(key)) {
                const stateData = await readFile(key);
                if (stateData?.chapterContent) {
                    return stateData;
                }
            }

            const fetchedChapter = await fetchChapter(repo, content, id);
            if (fetchedChapter.chapterContent) {
                const store = createStore(fetchedChapter);
                downloads.set(key, store);
                setDownloads(downloads);
            }

            return fetchedChapter;
        });

        collectedChapters.push(chapterData);
        options.onProgress?.(offset + 1, total);
    }

    if (format === "pdf") {
        const fileName = await saveAsPdf({
            author: content.author ?? "Unknown",
            title: content.title,
            content: collectedChapters,
        });

        const savedUri = await moveToAlbum(fileName, "application/pdf");

        setSnackBarData({
            visible: true,
            message: `Exported as PDF to ${savedUri}`,
            severity: "success",
            action: {
                label: "OK",
                onPress: () => setSnackBarData({ visible: false }),
            },
        });
        return;
    }

    if (format === "epub") {
        const fileName = await saveAsEpub({
            author: content.author ?? "Unknown",
            title: content.title,
            content: collectedChapters,
        });

        const savedUri = await moveToAlbum(fileName, "application/epub+zip");

        setSnackBarData({
            visible: true,
            message: `Exported as EPUB to ${savedUri}`,
            severity: "success",
            action: {
                label: "OK",
                onPress: () => setSnackBarData({ visible: false }),
            },
        });
    }
}