export interface MediaInfoFetchedAniwatch {
  animes: AniwatchMediaData[];
}

export interface AniwatchMediaData {
  id: string;
  name: string;
  poster: string;
  duration: string;
  type: string;
  rating: number | null;
  episodes: {
    episodes: unknown;
    sub: number;
    dub: number;
  };
}

export interface MediaInfoAniwatchSuggestions {
  //curr not used
  id: string;
  name: string;
  jname: string;
  poster: string;
  moreInfo: string[];
}

export interface EpisodeLinksAniwatch {
  tracks: [
    {
      file: string;
      label: string;
      kind: string;
      default: boolean;
    },
  ];
  intro: {
    start: number;
    end: number;
  };
  outro: {
    start: number;
    end: number;
  };
  sources: [
    {
      url: string;
      type: string;
    },
  ];
}

export interface EpisodesFetchedAniwatch {
  episodesDub: number;
  episodesSub: number;
  totalEpisodes: number;
  episodes: EpisodeAniwatch[];
}

export interface EpisodeAniwatch {
  title: string;
  episodeId: string;
  number: number;
  isFiller: boolean;
}
