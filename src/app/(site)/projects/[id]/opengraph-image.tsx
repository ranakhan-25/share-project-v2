import { ImageResponse } from "next/og";
import {
  BASE_GLOBAL_DEFAULT_IMAGE,
  CATEGORY_DEFAULT_IMAGES,
} from "@/lib/project-defaults";

export const runtime = "nodejs";
export const alt = "Share Project Card Preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"
).replace(/\/+$/, "");

function resolveDefaultImage(categoryName?: string): string {
  const cat = String(categoryName || "").toLowerCase().trim();
  for (const [key, url] of Object.entries(CATEGORY_DEFAULT_IMAGES)) {
    if (cat.includes(key)) return url;
  }
  return BASE_GLOBAL_DEFAULT_IMAGE;
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let project: any = null;
  try {
    const res = await fetch(
      `${API_BASE}/realbizpro/api/v1/share-project/public/projects/${encodeURIComponent(id)}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const json = await res.json();
      project = json?.data || json || null;
    }
  } catch {
    project = null;
  }

  const name = String(project?.name || "Share Project Investment");
  const location = String(project?.location || "Bangladesh");
  const category = String(project?.category?.name || "Commercial Project");
  const pricePerShare = Number(project?.pricePerShare || 0).toLocaleString();
  const totalShares = Number(project?.totalShares || 0).toLocaleString();
  const returnRate = Number(project?.expectedAnnualReturn || 0);

  let imageUrl = String(
    project?.thumbnailUrl ||
      project?.images?.[0]?.url ||
      resolveDefaultImage(category),
  );
  if (imageUrl.startsWith("/")) {
    imageUrl = `${API_BASE}${imageUrl}`;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ecfdf5 0%, #f8fafc 50%, #e0f2fe 100%)",
          padding: "40px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "row",
            backgroundColor: "#ffffff",
            borderRadius: "36px",
            border: "2px solid #e2e8f0",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
            overflow: "hidden",
          }}
        >
          {/* Left Project Card Image */}
          <div
            style={{
              width: "540px",
              height: "100%",
              position: "relative",
              display: "flex",
              backgroundColor: "#f1f5f9",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "24px",
                left: "24px",
                display: "flex",
                backgroundColor: "rgba(255,255,255,0.95)",
                color: "#047857",
                padding: "10px 20px",
                borderRadius: "999px",
                fontSize: "20px",
                fontWeight: 700,
              }}
            >
              {category}
            </div>
            {returnRate > 0 && (
              <div
                style={{
                  position: "absolute",
                  bottom: "24px",
                  right: "24px",
                  display: "flex",
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  padding: "10px 20px",
                  borderRadius: "999px",
                  fontSize: "20px",
                  fontWeight: 800,
                }}
              >
                {returnRate}% Return
              </div>
            )}
          </div>

          {/* Right Card Info */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "44px 48px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "22px",
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #10b981, #0ea5e9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "20px",
                    fontWeight: 800,
                  }}
                >
                  S
                </div>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  Share Project
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  fontSize: "40px",
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.2,
                  marginBottom: "14px",
                }}
              >
                {name}
              </div>

              <div
                style={{
                  display: "flex",
                  fontSize: "22px",
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                📍 {location}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  backgroundColor: "#f8fafc",
                  borderRadius: "22px",
                  padding: "22px 26px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: "18px",
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Per share
                  </span>
                  <span
                    style={{
                      fontSize: "38px",
                      fontWeight: 800,
                      color: "#0f172a",
                      marginTop: "4px",
                    }}
                  >
                    ৳{pricePerShare}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                  }}
                >
                  <span
                    style={{
                      fontSize: "18px",
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Total shares
                  </span>
                  <span
                    style={{
                      fontSize: "28px",
                      fontWeight: 800,
                      color: "#059669",
                      marginTop: "4px",
                    }}
                  >
                    {totalShares} shares
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  borderRadius: "18px",
                  padding: "16px",
                  fontSize: "22px",
                  fontWeight: 700,
                }}
              >
                View Project Details &amp; Invest Now →
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
