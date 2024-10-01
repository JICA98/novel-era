import { Repo, Content, SnackBarData } from "@/types";
import { ChapterData, chapterKey, fetchChapter } from "../chapters/_layout";
import { readFile, moveToAlbum, createStore } from "../downloads/utils";
import { saveAsEpub } from "./epubUtil";
import { pLimitLit } from "../_layout";

export function exportChapters(range: any[], format: string, repo: Repo, content: Content,
    downloads: any, setDownloads: any, setSnackBarData: React.Dispatch<React.SetStateAction<SnackBarData>>) {
    console.log(range, format);
    const endRange = range[1];
    const startRange = range[0];
    const limit = pLimitLit(1);
    const promises: Promise<ChapterData>[] = Array.from({ length: endRange - startRange + 1 }).map((_, index) => {
        const id = (range[0] + index).toString();
        return limit(async () => {
            const key = chapterKey(repo, content, id);
            if (downloads.has(key)) {
                const stateData = await readFile(key);
                if (stateData?.chapterContent) {
                    return stateData;
                }
            }
            console.log('Downloading ', key);
            const chapterData = await fetchChapter(repo, content, id);
            if (chapterData.chapterContent) {
                const store = createStore(chapterData);
                downloads.set(key, store);
                setDownloads(downloads);
            }
            return chapterData;
        });
    });

    Promise.all(promises).then(async (data) => {
        if (format === 'epub') {
            const uri = await saveAsEpub({
                author: content!.author!,
                title: content.title,
                content: data,
                // cover: content.bookImage,
            });

            await moveToAlbum(uri, 'application/epub+zip');

            setSnackBarData({
                visible: true,
                message: `Exported as EPUB under ${uri}`,
                severity: 'success',
                action: {
                    label: 'Ok',
                    onPress: () => {
                        setSnackBarData({ visible: false });
                    }
                }
            });
        }
    }).catch((error) => {
        console.error(error);
    });
}