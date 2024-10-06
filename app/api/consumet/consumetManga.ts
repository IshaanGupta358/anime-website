import {
  MangadexMangaInfo,
  MangadexMangaPages,
  MangadexMangaSearchResult,
} from "@/app/ts/interfaces/mangadex";
import Axios from "axios";
import axiosRetry from "axios-retry";
import { cache } from "react";

const CONSUMET_API_URL = process.env.NEXT_PUBLIC_CONSUMET_API_URL;

// HANDLES SERVER ERRORS, most of time when server was not running due to be using the Free Tier
axiosRetry(Axios, {
  retries: 3,
  retryDelay: (retryAttempt) => retryAttempt * 1500,
  retryCondition: (error) =>
    error.response?.status == 500 || error.response?.status == 503,
  onRetry: (retryNumber) =>
    console.log(
      `retry: ${retryNumber} ${retryNumber == 3 ? " - Last Attempt" : ""}`
    ),
});

export const searchManga = cache(
  async ({
    query,
    page,
    mangaSource,
  }: {
    query: string;
    page?: number;
    mangaSource?: string;
  }) => {
    try {
      const { data } = await Axios({
        url: `${CONSUMET_API_URL}/manga/${mangaSource || "mangadex"}/${query}${page ? `?page=${page} ` : ""}`,
        method: "GET",
      });

      return data.results as MangadexMangaSearchResult[];
    } catch (error) {
      console.log(error);

      return null;
    }
  }
);

export const getClosestMangaResult = cache(
  async ({
    query,
    mangaEnglishTitle,
    mangaVolumes,
    mangaStartYearDate,
    mangaChapters,
  }: {
    query: string;
    mangaEnglishTitle: string;
    mangaStartYearDate: number;
    mangaVolumes: number;
    mangaChapters: number;
  }) => {
    try {
      const mangaId = await searchManga({
        query: query,
      }).then((res) => {
        if (!res) return null;

        const closestMatchs = res
          .filter((item) => item.releaseDate == mangaStartYearDate)
          .sort((a, b) => Number(a.lastChapter) - Number(b.lastChapter))
          .reverse();

        const resultByTitle = closestMatchs.find(
          (item) => item.title.toLowerCase() == mangaEnglishTitle.toLowerCase()
        )?.id;

        if (resultByTitle) return resultByTitle;

        const resultByChapter = closestMatchs.find(
          (item) => Number(item.lastChapter) == Number(mangaChapters)
        )?.id;

        if (resultByChapter) return resultByChapter;

        const resultByVolumes = closestMatchs.find(
          (item) => Number(item.lastVolume) == Number(mangaVolumes)
        )?.id;

        if (resultByVolumes) return resultByVolumes;

        return closestMatchs[0].id;
      });

      return mangaId;
    } catch (error) {
      console.log(error);

      return null;
    }
  }
);

export const getMangaInfo = cache(
  async ({ id, mangaSource }: { id: string; mangaSource?: string }) => {
    try {
      const { data } = await Axios({
        url: `${CONSUMET_API_URL}/manga/${mangaSource || "mangadex"}/info/${id}`,
        method: "GET",
      });

      const chaptersSortedByAscendent = (data as MangadexMangaInfo).chapters.sort(
        (a, b) => Number(a.chapterNumber) - Number(b.chapterNumber)
      );

      data.chapters = chaptersSortedByAscendent;

      return data as MangadexMangaInfo;
    } catch (error) {
      console.log(error);

      return null;
    }
  }
);

export const getMangaChapterPages = cache(
  async ({
    chapterId,
    mangaSource,
  }: {
    chapterId: string;
    mangaSource?: string;
  }) => {
    try {
      const { data } = await Axios({
        url: `${CONSUMET_API_URL}/manga/${mangaSource || "mangadex"}/read/${chapterId}`,
        method: "GET",
      });

      return data as MangadexMangaPages[];
    } catch (error) {
      console.log(error);

      return null;
    }
  }
);
