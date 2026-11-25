export type OwnerProjectStatus =
  | "draft"
  | "pending"
  | "approved"
  | "publish_requested"
  | "published"
  | "unpublished"
  | "rejected";

export type SubmissionHistoryItem = {
  status: OwnerProjectStatus;
  note: string;
  date: string;
};

export type OwnerProject = {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  thumbnail: string;
  gallery: string[];
  documents: string[];
  totalInvestmentAmount: number;
  totalShares: number;
  pricePerShare: number;
  minimumInvestment: number;
  expectedAnnualReturn: number;
  startDate: string;
  endDate: string;
  status: OwnerProjectStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  submissionHistory: SubmissionHistoryItem[];
  investorCount?: number;
  investors?: Array<{
    id?: number | string;
    uuid?: string;
    code?: string;
    investorName?: string;
    investorEmail?: string;
    investorPhone?: string;
    quantity?: number;
    totalAmount?: number | string;
    status?: string;
    createdAt?: string;
  }>;
};

export function statusLabel(status: OwnerProjectStatus) {
  if (status === "publish_requested") return "Publish Requested";
  if (status === "unpublished") return "Unpublished";
  return status.charAt(0).toUpperCase() + status.slice(1);
}
