/**
 * 地域の気象・警報（気象庁 / Open-Meteo）
 * 市町村が分かっているときホームに表示する。
 */

export type WeatherSeverity = "none" | "advisory" | "warning" | "emergency";

export interface AreaWeatherSnapshot {
  municipalityName: string;
  temperatureC: number | null;
  weatherLabel: string | null;
  humidity: number | null;
  warnings: string[];
  typhoonNote: string | null;
  severity: WeatherSeverity;
  sourceLabel: string;
  fetchedAt: string;
  officialWarningUrl: string;
}

/** 市町村名 → 緯度経度・気象庁 class20 コード */
export const AREA_WEATHER_META: Record<
  string,
  {
    lat: number;
    lon: number;
    jmaClass20: string;
    jmaClass20Prefix?: string;
  }
> = {
  熊本市: {
    lat: 32.8031,
    lon: 130.7079,
    jmaClass20: "4310100",
    jmaClass20Prefix: "4310",
  },
  宇城市: { lat: 32.5055, lon: 130.7025, jmaClass20: "4344200" },
  氷川町: { lat: 32.5825, lon: 130.6736, jmaClass20: "4344100" },
  八代市: { lat: 32.5075, lon: 130.6019, jmaClass20: "4320200" },
  甲佐町: { lat: 32.6511, lon: 130.8114, jmaClass20: "4344500" },
  宇土市: { lat: 32.6875, lon: 130.6586, jmaClass20: "4320600" },
  美里町: { lat: 32.61, lon: 130.79, jmaClass20: "4344400" },
  益城町: { lat: 32.7914, lon: 130.8161, jmaClass20: "4340300" },
  嘉島町: { lat: 32.7417, lon: 130.7569, jmaClass20: "4340400" },
  南島原市: { lat: 32.66, lon: 130.3, jmaClass20: "4221300" },
  薩摩川内市: { lat: 31.8133, lon: 130.3042, jmaClass20: "4621500" },
  出水市: { lat: 32.0906, lon: 130.3528, jmaClass20: "4620800" },
};

/** 気象庁警報コード → 日本語 */
const JMA_WARNING_LABELS: Record<string, string> = {
  "00": "解除",
  "02": "暴風雪警報",
  "03": "大雨警報",
  "04": "洪水警報",
  "05": "暴風警報",
  "06": "大雪警報",
  "07": "波浪警報",
  "08": "高潮警報",
  "10": "大雨注意報",
  "12": "大雪注意報",
  "13": "風雪注意報",
  "14": "雷注意報",
  "15": "強風注意報",
  "16": "波浪注意報",
  "17": "融雪注意報",
  "18": "洪水注意報",
  "19": "高潮注意報",
  "20": "濃霧注意報",
  "21": "乾燥注意報",
  "22": "なだれ注意報",
  "23": "低温注意報",
  "24": "霜注意報",
  "25": "着氷注意報",
  "26": "着雪注意報",
  "27": "その他の注意報",
  "32": "暴風雪特別警報",
  "33": "大雨特別警報",
  "35": "暴風特別警報",
  "36": "大雪特別警報",
  "37": "波浪特別警報",
  "38": "高潮特別警報",
};

const HEAT_KEYWORDS = /高温|熱中症|猛暑/;

export function resolveAreaWeatherMeta(municipalityName?: string) {
  if (!municipalityName) return null;
  return AREA_WEATHER_META[municipalityName] ?? null;
}

function severityFromWarnings(labels: string[]): WeatherSeverity {
  if (labels.some((l) => l.includes("特別警報"))) return "emergency";
  if (labels.some((l) => l.includes("警報") && !l.includes("注意報")))
    return "warning";
  if (labels.length > 0) return "advisory";
  return "none";
}

function weatherCodeLabel(code: number): string {
  if (code === 0) return "晴れ";
  if (code <= 3) return "くもり";
  if (code <= 48) return "霧";
  if (code <= 67) return "雨";
  if (code <= 77) return "雪";
  if (code <= 82) return "にわか雨";
  if (code <= 86) return "にわか雪";
  if (code <= 99) return "雷雨";
  return "天気情報あり";
}

type JmaWarningDoc = {
  warning?: {
    class20Items?: Array<{
      areaCode?: string;
      kinds?: Array<{ code?: string; status?: string }>;
    }>;
  };
};

export async function fetchAreaWeatherSnapshot(
  municipalityName: string
): Promise<AreaWeatherSnapshot | null> {
  const meta = resolveAreaWeatherMeta(municipalityName);
  if (!meta) return null;

  const fetchedAt = new Date().toISOString();
  const officialWarningUrl = `https://www.jma.go.jp/bosai/warning/#area_type=class20s&area_code=${meta.jmaClass20}`;

  let temperatureC: number | null = null;
  let weatherLabel: string | null = null;
  let humidity: number | null = null;
  const warnings: string[] = [];
  let typhoonNote: string | null = null;

  try {
    const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
    weatherUrl.searchParams.set("latitude", String(meta.lat));
    weatherUrl.searchParams.set("longitude", String(meta.lon));
    weatherUrl.searchParams.set(
      "current",
      "temperature_2m,relative_humidity_2m,weather_code"
    );
    weatherUrl.searchParams.set("timezone", "Asia/Tokyo");

    const weatherRes = await fetch(weatherUrl.toString(), {
      next: { revalidate: 600 },
    });
    if (weatherRes.ok) {
      const data = (await weatherRes.json()) as {
        current?: {
          temperature_2m?: number;
          relative_humidity_2m?: number;
          weather_code?: number;
        };
      };
      temperatureC =
        typeof data.current?.temperature_2m === "number"
          ? Math.round(data.current.temperature_2m)
          : null;
      humidity =
        typeof data.current?.relative_humidity_2m === "number"
          ? data.current.relative_humidity_2m
          : null;
      if (typeof data.current?.weather_code === "number") {
        weatherLabel = weatherCodeLabel(data.current.weather_code);
      }
    }
  } catch {
    // 天気取得失敗は警報だけでも返す
  }

  try {
    const warnRes = await fetch(
      "https://www.jma.go.jp/bosai/warning/data/r8/430000.json",
      { next: { revalidate: 300 } }
    );
    if (warnRes.ok) {
      const docs = (await warnRes.json()) as JmaWarningDoc[];
      const list = Array.isArray(docs) ? docs : [];
      for (const doc of list) {
        const items = doc.warning?.class20Items ?? [];
        for (const item of items) {
          const code = item.areaCode ?? "";
          const matches =
            code === meta.jmaClass20 ||
            (meta.jmaClass20Prefix
              ? code.startsWith(meta.jmaClass20Prefix)
              : false);
          if (!matches) continue;
          for (const kind of item.kinds ?? []) {
            if (
              !kind.code ||
              kind.status === "解除" ||
              kind.status === "発表警報・注意報はなし"
            ) {
              continue;
            }
            const label = JMA_WARNING_LABELS[kind.code] ?? `気象情報(${kind.code})`;
            if (!warnings.includes(label)) warnings.push(label);
          }
        }
      }
    }
  } catch {
    // 警報取得失敗は気温だけでも返す
  }

  try {
    const typhoonRes = await fetch(
      "https://www.jma.go.jp/bosai/typhoon/data/typhoon_info.json",
      { next: { revalidate: 600 } }
    );
    if (typhoonRes.ok) {
      const info = (await typhoonRes.json()) as {
        typhoon?: Array<{ name?: string; namekana?: string }>;
      };
      const active = info.typhoon ?? [];
      if (active.length > 0) {
        const names = active
          .map((t) => t.name || t.namekana)
          .filter(Boolean)
          .slice(0, 3);
        typhoonNote =
          names.length > 0
            ? `台風情報あり（${names.join("・")}）。お住まいの地域の最新は気象庁でご確認ください。`
            : "台風情報があります。気象庁の最新情報をご確認ください。";
      }
    }
  } catch {
    // 台風情報が取れなくても続行
  }

  if (
    temperatureC !== null &&
    temperatureC >= 35 &&
    !warnings.some((w) => HEAT_KEYWORDS.test(w))
  ) {
    warnings.push("高温注意（熱中症にご注意ください）");
  }

  return {
    municipalityName,
    temperatureC,
    weatherLabel,
    humidity,
    warnings,
    typhoonNote,
    severity: severityFromWarnings(warnings),
    sourceLabel: "気象庁・Open-Meteo",
    fetchedAt,
    officialWarningUrl,
  };
}
