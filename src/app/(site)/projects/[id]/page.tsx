import type { Metadata } from "next";
import ProjectDetailsClient from "./ProjectDetailsClient";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"
).replace(/\/+$/, "");

async function fetchPublicProjectMeta(id: string) {
  try {
    const res = await fetch(
      `${API_BASE}/realbizpro/api/v1/share-project/public/projects/${encodeURIComponent(id)}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || json || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await fetchPublicProjectMeta(id);
  if (!project) {
    return {
      title: "Project Details | Share Project",
      description: "Explore verified fractional commercial real estate & business share projects.",
    };
  }

  const name = String(project.name || "Share Project");
  const location = String(project.location || "Bangladesh");
  const category = String(project.category?.name || "Investment Project");
  const pricePerShare = Number(project.pricePerShare || 0).toLocaleString();
  const returnRate = Number(project.expectedAnnualReturn || 0);
  const totalShares = Number(project.totalShares || 0);

  const title = `${name} — ${category}`;
  const description = `${location} • Per Share: ৳${pricePerShare} • Total Shares: ${totalShares}${
    returnRate > 0 ? ` • Expected Return: ${returnRate}%` : ""
  }. Invest securely on Share Project.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Share Project",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function ProjectDetailsPage() {
  return <ProjectDetailsClient />;
}
