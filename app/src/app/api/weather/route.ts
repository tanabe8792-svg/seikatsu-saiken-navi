import { NextResponse } from "next/server";
import { fetchAreaWeatherSnapshot } from "@/lib/weather/area-weather";

export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const municipality = searchParams.get("municipality")?.trim();

  if (!municipality) {
    return NextResponse.json(
      { error: "municipality を指定してください" },
      { status: 400 }
    );
  }

  try {
    const snapshot = await fetchAreaWeatherSnapshot(municipality);
    if (!snapshot) {
      return NextResponse.json(
        { error: "この地域の気象情報はまだ対応していません" },
        { status: 404 }
      );
    }
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json(
      { error: "気象情報の取得に失敗しました" },
      { status: 502 }
    );
  }
}
