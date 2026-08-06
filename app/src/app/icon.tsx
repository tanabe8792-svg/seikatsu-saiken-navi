import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0071e3",
          borderRadius: 96,
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 180,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          再
        </div>
      </div>
    ),
    { ...size }
  );
}
