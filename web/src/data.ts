import type { AccessReview } from "./api";

export type ContentBlock =
  | { type: "callout"; tone?: "info" | "warn" | "danger"; title: string; body: string }
  | { type: "kv"; title: string; rows: [string, string][] }
  | { type: "bullets"; title: string; items: string[] }
  | { type: "details"; title: string; body: string[]; open?: boolean }
  | { type: "table"; title: string; columns: string[]; rows: string[][] }
  | { type: "raw"; title: string; body: string };

export interface Section {
  id: string;
  key: string;
  title: string;
  subtitle: string;
  tags?: string[];
  content: ContentBlock[];
}

export const TFD = {
  app: {
    name: "Aurora Conflicts Suite",
    territory: "PwC Australia",
    businessOwner: "Anton Linschoten",
    itOwner: "Rob Kopel",
    usersApprox: 16,
    audience: ["Executive stakeholders", "Business owner", "IT owner", "Technical leads", "Developers"],
    governance: {
      CI: "CI144118322",
      ReleaseRecord: "RLSE0053844",
      BIG: "BR-2188",
      ARR: "ARR0056449",
      ARR_RiskTier: "Tier 4",
      Strategy: "Contain",
      InfraEnv: "AU Azure",
      ApptioCode: "australia8778",
    },
    description:
      "Workflow on the AI Assistant platform using shared GenAI services to assist relationship checks for client engagements. Accessible only by risk analysts in the internal conflicts team. Output is a report to identify potential conflicts of interest (COIs) or sensitive situations (SenS) from searches in Salesforce.",
  },
  sections: [] as Section[],
};

TFD.sections = [
  {
    id: "exec",
    key: "0",
    title: "Executive Summary",
    subtitle: "Purpose, scope, outcomes",
    tags: ["AI Assistant", "Salesforce", "GenAI", "Risk & Ethics"],
    content: [
      { type: "callout", tone: "info", title: "Service Description", body: TFD.app.description },
      {
        type: "bullets",
        title: "What the app delivers",
        items: [
          "Automates relationship checks for client engagements using Salesforce searches and GenAI analysis.",
          "Generates a report highlighting potential COIs and SenS for Risk Analysts.",
          "Restricted to internal Conflicts AU Team; no client access.",
        ],
      },
      {
        type: "kv",
        title: "Key governance identifiers",
        rows: [
          ["CI", TFD.app.governance.CI],
          ["Release Record", TFD.app.governance.ReleaseRecord],
          ["BIG Reference", TFD.app.governance.BIG],
          ["ARR ID", TFD.app.governance.ARR],
          ["ARR Risk Tier", TFD.app.governance.ARR_RiskTier],
          ["Application Strategy", TFD.app.governance.Strategy],
          ["Infrastructure Environment", TFD.app.governance.InfraEnv],
          ["Apptio Code", TFD.app.governance.ApptioCode],
        ],
      },
    ],
  },
  {
    id: "access",
    key: "1",
    title: "Access Controls & Reviews",
    subtitle: "Who has access, how granted, review cadence",
    tags: ["RBAC", "UAR", "Approvals"],
    content: [
      {
        type: "bullets",
        title: "Access principles",
        items: [
          "Only internal risk analysts for Conflicts AU Team; no client access.",
          "Access provisioned via request ticket; AI COE provides, then transitions to L2 support.",
          "User Access Review process referenced in SDD; periodic review expected.",
        ],
      },
      {
        type: "details",
        title: "Access review cadence (baseline)",
        open: true,
        body: ["Quarterly access reviews commonly used in similar matrices; adjust per RBAC matrix."],
      },
      {
        type: "callout",
        tone: "warn",
        title: "Action needed",
        body: "Provide the Conflict Identifier-specific RBAC matrix to list exact roles/CRUD.",
      },
    ],
  },
];

export const accessReviewExamples: AccessReview[] = [
  {
    id: "ci-001",
    subject: "Client CI144118322",
    reviewer: "Anton Linschoten",
    status: "approved",
    lastReviewedAt: new Date().toISOString(),
    notes: "Baseline access confirmed.",
    tags: ["tier-4", "salesforce"],
  },
  {
    id: "ci-002",
    subject: "ARR0056449",
    reviewer: "Rob Kopel",
    status: "pending",
    lastReviewedAt: new Date().toISOString(),
    notes: "Awaiting DR sign-off.",
    tags: ["wap", "genai"],
  },
];
