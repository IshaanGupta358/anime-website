import { NextRequest, NextResponse } from "next/server";
import AnimeOfflineDatabase from "./anime-offline-database.json";
import { MediaOnOfflineDBFile } from "@/app/ts/interfaces/jsonMediaData";
import {
  filterByGenre,
  filterBySeason,
  filterByStatus,
  filterByTitle,
  filterByType,
  filterByYear,
  filterMediasWithAnilistID,
} from "./filterFunctions";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const resultsLimit = 12;

  let requestedData = (AnimeOfflineDatabase as { data: MediaOnOfflineDBFile[] })
    .data;

  if (searchParams.get("type"))
    requestedData = filterByType(
      requestedData,
      searchParams.get("type")!.toUpperCase()
    );

  if (searchParams.get("year"))
    requestedData = filterByYear(
      requestedData,
      Number(searchParams.get("year"))
    );

  if (searchParams.get("genre"))
    requestedData = filterByGenre(requestedData, searchParams.get("genre")!);

  if (searchParams.get("status"))
    requestedData = filterByStatus(
      requestedData,
      searchParams.get("status")!.toUpperCase()
    );

  if (searchParams.get("title")) {
    requestedData = filterByTitle(
      requestedData,
      searchParams.get("title")!.toLowerCase()
    );
  }

  if (searchParams.get("season")) {
    requestedData = filterBySeason(
      requestedData,
      searchParams.get("season")!.toLocaleLowerCase()
    );
  }

  switch (searchParams.get("sort")) {
    case "releases_desc":
      requestedData = requestedData
        .sort((a, b) => a.animeSeason.year - b.animeSeason.year)
        .reverse();

      break;

    case "releases_asc":
      requestedData = requestedData.sort(
        (a, b) => a.animeSeason.year - b.animeSeason.year
      );

      break;

    case "title_desc":
      requestedData = requestedData.sort((a, b) =>
        a.title > b.title ? -1 : 1
      );

      break;

    case "title_asc":
      requestedData = requestedData
        .sort((a, b) => (a.title > b.title ? -1 : 1))
        .reverse();

      break;

    default:
      break;
  }

  if (requestedData.length > 0)
    requestedData = filterMediasWithAnilistID(requestedData);

  const resultsLimitedByPage = requestedData.slice(
    0,
    resultsLimit * Number(searchParams.get("page") || 1)
  );

  return NextResponse.json(
    {
      data: resultsLimitedByPage,
      allResultsLength: requestedData.length,
      lastUpdate: (AnimeOfflineDatabase as { lastUpdate: string }).lastUpdate,
    },
    {
      status: 200,
    }
  );
}
