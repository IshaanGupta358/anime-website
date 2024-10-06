import { checkAnilistTitleMisspelling } from "@/app/lib/checkApiMediaMisspelling";
import {
  AniwatchMediaData,
  EpisodeLinksAniwatch,
  EpisodesFetchedAniwatch,
  MediaInfoFetchedAniwatch,
} from "@/app/ts/interfaces/aniwatchData";
import Axios from "axios";
import axiosRetry from "axios-retry";
import { cache } from "react";

const BASE_URL = `${process.env.NEXT_PUBLIC_ANIWATCH_API_URL}/api/v2/hianime`;

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

export const searchMediaOnAniwatch = cache(
  async ({ query, page }: { query: string; page?: number }) => {
    try {
      const { data } = await Axios({
        url: `${BASE_URL}/search?q=${query}${page ? `&page=${page}` : ""}`,
      });

      return data.data as MediaInfoFetchedAniwatch;
    } catch (error) {
      console.log((error as Error).message);

      return null;
    }
  }
);

// GET EPISODES, NO LINKS INCLUDED
export const getMediaEpisodesFromAniwatch = cache(
  async ({ mediaId }: { mediaId: string }) => {
    try {
      const { data } = await Axios({
        url: `${BASE_URL}/anime/${mediaId}/episodes`,
      });

      return data.data as EpisodesFetchedAniwatch;
    } catch (error) {
      console.log((error as Error).message);

      return null;
    }
  }
);

export const getEpisodeLinkFromAniwatch = cache(
  async ({
    episodeId,
    server,
    category,
  }: {
    episodeId: string;
    server?: string;
    category?: "dub" | "sub";
  }) => {
    try {
      const { data } = await Axios({
        url: `${BASE_URL}/episode/sources?animeEpisodeId=${episodeId}${server ? `&server=${server}` : ""}${category ? `&category=${category}` : ""}`,
      });

      return data.data as EpisodeLinksAniwatch;
    } catch (error) {
      console.log((error as Error).message);

      return null;
    }
  }
);

export const getFromAniwatchOnlyThisData = cache(
  async ({
    mediaTitle,
    typeOfDataWanted,
    mediaFormat,
    mediaTotalEpisodesNumber,
    mediaId,
  }: {
    mediaTitle: string;
    typeOfDataWanted: "episodes" | "search_list";
    mediaFormat?: string;
    mediaTotalEpisodesNumber?: number;
    mediaId?: string | number;
  }) => {
    mediaTitle = checkAnilistTitleMisspelling(mediaTitle).replace(
      /^[a-zA-Z0-9-]*$/,
      ""
    ); // handles any non url friendly char

    const resultsForMediaSearch = (await searchMediaOnAniwatch({
      query: mediaTitle,
    }).then((res) => {
      const searchedMediasListFromAniwatch = res!.animes;

      let mediasList = res!.animes;

      // filter by media name
      mediasList = searchedMediasListFromAniwatch.filter((media) =>
        media.name
          .replace(/^[a-zA-Z0-9-]*$/, "")
          .toLowerCase()
          .includes(mediaTitle)
      );
      // || mediasList[0]

      if (mediasList.length == 0) return searchedMediasListFromAniwatch;

      // filter by media format
      if (mediaFormat) {
        mediasList = mediasList.filter(
          (media) => media.type.toLowerCase() == mediaFormat.toLowerCase()
        );

        if (mediasList.length == 0) return searchedMediasListFromAniwatch;
      }

      // filter by same ammount of episodes
      if (mediaTotalEpisodesNumber) {
        const mediasListFilteredByMatchingEpisodesNumber = mediasList.filter(
          (media) => media.episodes.sub == mediaTotalEpisodesNumber
        );

        if (mediasListFilteredByMatchingEpisodesNumber.length > 0) {
          mediasList = mediasListFilteredByMatchingEpisodesNumber;
        }
      }

      return mediasList;
    })) as AniwatchMediaData[];

    switch (typeOfDataWanted) {
      case "search_list":
        return resultsForMediaSearch;

      case "episodes":
        if (mediaId) {
          const mediaWithSameId = resultsForMediaSearch.find(
            (media) => media.id == `${mediaId}`
          );

          if (mediaWithSameId) {
            const mediaEpisodes = (await getMediaEpisodesFromAniwatch({
              mediaId: mediaWithSameId.id,
            })) as EpisodesFetchedAniwatch;

            if (mediaEpisodes?.episodes?.length == 0) return null;

            const ammountEpisodesDubbed = mediaWithSameId?.episodes?.dub || 0;

            const ammountEpisodesSubbed = mediaWithSameId?.episodes?.sub || 0;

            return {
              episodesDub: ammountEpisodesDubbed,
              episodesSub: ammountEpisodesSubbed,
              episodes: mediaEpisodes.episodes,
            };
          }
        }

        const mediaEpisodes = (await getMediaEpisodesFromAniwatch({
          mediaId: resultsForMediaSearch[0].id,
        })) as EpisodesFetchedAniwatch;

        return {
          episodesDub: resultsForMediaSearch[0]?.episodes?.dub,
          episodesSub: resultsForMediaSearch[0]?.episodes?.sub,
          episodes: mediaEpisodes.episodes,
        };

      default:
        return null;
    }
  }
);
