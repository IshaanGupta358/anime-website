import { checkAnilistTitleMisspelling } from "@/app/lib/checkApiMediaMisspelling";
import simulateRange from "@/app/lib/simulateRange";
import {
  GogoanimeMediaData,
  GogoanimeMediaEpisodes,
  GogoanimeMediaSearchResult,
} from "@/app/ts/interfaces/gogoanimeData";
import {
  MangadexMangaInfo,
  MangadexMangaSearchResult,
} from "@/app/ts/interfaces/mangadex";
import Axios from "axios";
import axiosRetry from "axios-retry";
import { cache } from "react";

const CONSUMET_API_URL = process.env.NEXT_PUBLIC_CONSUMET_API_URL;

// HANDLES SERVER ERRORS, most of time when server was not running due to be using the Free Tier
axiosRetry(Axios, {
  retries: 3,
  retryDelay: (retryAttempt) => retryAttempt * 1300,
  retryCondition: (error) =>
    error.response?.status == 500 || error.response?.status == 503,
  onRetry: (retryNumber) =>
    console.log(
      `retry: ${retryNumber} ${retryNumber == 3 ? " - Last Attempt" : ""}`
    ),
});

export const searchMediaOnGogoanime = cache(
  async ({ query, page }: { query: string; page?: number }) => {
    try {
      const { data } = await Axios({
        url: `${CONSUMET_API_URL}/anime/gogoanime/${query}${page ? `?page=${page} ` : ""}`,
        method: "GET",
      });

      return data.results as
        | GogoanimeMediaSearchResult[]
        | MangadexMangaSearchResult[];
    } catch (error) {
      console.log(error);

      return null;
    }
  }
);

export const getMediaInfoFromGogoanime = cache(
  async ({ id }: { id: string | number }) => {
    try {
      const { data } = await Axios({
        url: `${CONSUMET_API_URL}/anime/gogoanime/info/${id}`,
        method: "GET",
      });

      return data as GogoanimeMediaData | MangadexMangaInfo;
    } catch (error) {
      console.log(error);

      return null;
    }
  }
);

export const getMediaEpisodesFromGogoanime = cache(
  async ({
    mediaTitle,
    onlyDubEpisodes,
  }: {
    mediaTitle: string;
    onlyDubEpisodes?: boolean;
  }) => {
    mediaTitle = checkAnilistTitleMisspelling(mediaTitle).replace(
      /[^a-zA-Z0-9]/g,
      " "
    ); // handles any non url friendly char

    const resultsForMediaSearch = await searchMediaOnGogoanime({
      query: mediaTitle,
    }).then((res) => {
      let closestResultsByMediaTitle: GogoanimeMediaSearchResult[];

      if (onlyDubEpisodes) {
        closestResultsByMediaTitle = res!.filter(
          (media) => (media as GogoanimeMediaSearchResult).subOrDub == "dub"
        ) as GogoanimeMediaSearchResult[];
      } else {
        closestResultsByMediaTitle =
          (res as GogoanimeMediaSearchResult[])!.filter(
            (media) => media.title.replace(/[^a-zA-Z0-9]/g, " ").toLowerCase()
            // .indexOf(mediaTitle) !== -1
          );
      }

      return closestResultsByMediaTitle;
    });

    const mediaInfo = (await getMediaInfoFromGogoanime({
      id: resultsForMediaSearch![0]?.id,
    })) as GogoanimeMediaData;

    if (!mediaInfo) return null;

    const episodesList: GogoanimeMediaEpisodes[] = [];

    simulateRange(mediaInfo.totalEpisodes).map((item, key) => {
      episodesList.push({
        number: key + 1,
        id: `${mediaInfo!.id.toLowerCase()}-episode-${key + 1}`,
        url: "",
      });
    });

    return mediaInfo.episodes.length == 0 ? episodesList : mediaInfo.episodes;
  }
);

export const getEpisodeStreamingLinkFromGogoanime = cache(
  async ({
    episodeId,
    serverName,
    useAlternateLinkOption,
  }: {
    episodeId: string | number;
    serverName?: string;
    useAlternateLinkOption?: boolean;
  }) => {
    try {
      const { data } = await Axios({
        url: `${CONSUMET_API_URL}${useAlternateLinkOption ? "/meta/anilist" : "/anime/gogoanime"}/watch/${episodeId}${serverName ? `?server=${serverName}` : ""}`,
        method: "GET",
      });

      return data;
    } catch (error) {
      console.log(error);

      return null;
    }
  }
);
