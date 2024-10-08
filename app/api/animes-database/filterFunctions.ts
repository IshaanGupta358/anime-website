import { MediaOnOfflineDBFile } from "@/app/ts/interfaces/jsonMediaData";

export function filterByType(
  rawData: MediaOnOfflineDBFile[],
  type: string
): MediaOnOfflineDBFile[] {
  const dataFiltered = rawData.filter((media) => media.type == type);

  return dataFiltered;
}

export function filterByYear(
  rawData: MediaOnOfflineDBFile[],
  year: number
): MediaOnOfflineDBFile[] {
  const dataFiltered = rawData.filter(
    (media) => media.animeSeason.year == year
  );

  return dataFiltered;
}

export function filterByGenre(
  rawData: MediaOnOfflineDBFile[],
  genre: string
): MediaOnOfflineDBFile[] {
  const dataFiltered = rawData.filter((media) =>
    media.tags.some((genreName) => genre.includes(genreName))
  );

  return dataFiltered;
}

export function filterByStatus(
  rawData: MediaOnOfflineDBFile[],
  status: string
): MediaOnOfflineDBFile[] {
  const dataFiltered = rawData.filter((media) => media.status == status);

  return dataFiltered;
}

export function filterByTitle(
  rawData: MediaOnOfflineDBFile[],
  title: string
): MediaOnOfflineDBFile[] {
  const dataFiltered = rawData.filter((media) =>
    media.title.toLowerCase().includes(title)
  );

  return dataFiltered;
}

export function filterBySeason(
  rawData: MediaOnOfflineDBFile[],
  season: string
): MediaOnOfflineDBFile[] {
  const dataFiltered = rawData.filter(
    (media) => media.animeSeason.season.toLocaleLowerCase() == season
  );

  return dataFiltered;
}

// ONLY WAY TO GET THE ANILIST ID FROM THIS OFFLINE DB
export function filterMediasWithAnilistID(rawData: MediaOnOfflineDBFile[]) {
  const filteredData = rawData
    .filter((media) =>
      media.sources.map((source) => {
        if (source.includes("https://anilist.co/anime")) {
          const urlWithAnilistId = source.slice(source.search(/\banime\b/));

          media.anilistId = urlWithAnilistId!.slice(6);
        }
      })
    )
    .filter((item) => item.anilistId);

  return filteredData;
}
