export type RiskLevel = "low" | "medium" | "medium-high" | "high" | "unacceptable";
export type ApprovalState = "draft" | "pending" | "approved" | "rejected" | "blocked";

export interface UseCase {
  id: string;
  name: string;
  owner: string;
  modelVendor: string;
  dataCategories: string[];
  businessValue: string;
  riskLevel: RiskLevel;
  humanOversight: string;
  evidenceRequired: string[];
  evidenceProvided: string[];
  approvalState: ApprovalState;
}

export interface ComplianceGap {
  useCaseId: string;
  useCaseName: string;
  missing: string[];
  score: number;
  riskLevel: RiskLevel;
}

const REQUIRED_BY_RISK: Record<RiskLevel, string[]> = {
  low: ["vendor data processing record", "basic usage log"],
  medium: ["vendor data processing record", "human escalation rule", "usage log"],
  "medium-high": ["PII masking evidence", "human escalation rule", "hallucination sampling log", "vendor data processing record"],
  high: ["PII masking evidence", "human escalation rule", "hallucination sampling log", "vendor DPA", "bias assessment", "incident response plan"],
  unacceptable: ["prohibited — requires executive review"],
};

export function validateUseCase(uc: UseCase): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!uc.name) errors.push("Name required");
  if (!uc.owner) errors.push("Owner required");
  if (!uc.modelVendor) errors.push("Model/vendor required");
  if (!uc.humanOversight) errors.push("Human oversight required");
  return { valid: errors.length === 0, errors };
}

export function findMissingEvidence(uc: UseCase): string[] {
  const required = [...REQUIRED_BY_RISK[uc.riskLevel], ...uc.evidenceRequired];
  const provided = new Set(uc.evidenceProvided.map((e) => e.toLowerCase()));
  return [...new Set(required)].filter((r) => !provided.has(r.toLowerCase()) && !provided.has(r.split(" ")[0].toLowerCase()));
}

export function scoreCompliance(uc: UseCase): number {
  const missing = findMissingEvidence(uc);
  const total = REQUIRED_BY_RISK[uc.riskLevel].length + uc.evidenceRequired.length;
  if (total === 0) return 100;
  return Math.round(((total - missing.length) / total) * 100);
}

export function generateFindingReport(useCases: UseCase[]): string {
  const lines = ["# AI Evidence Binder — Compliance Report", "", `Generated: ${new Date().toISOString()}`, ""];
  for (const uc of useCases) {
    const missing = findMissingEvidence(uc);
    const score = scoreCompliance(uc);
    lines.push(`## ${uc.name}`, `- Owner: ${uc.owner}`, `- Risk: ${uc.riskLevel}`, `- Compliance: ${score}%`, `- Approval: ${uc.approvalState}`);
    if (missing.length) {
      lines.push("", "**Missing:**", ...missing.map((m) => `- ${m}`));
    } else {
      lines.push("", "All required evidence present.");
    }
    lines.push("");
  }
  return lines.join("\n");
}

export const SAMPLE_USE_CASES: UseCase[] = [
  {
    id: "uc-1", name: "Customer support agent", owner: "CX Team", modelVendor: "OpenAI GPT-4",
    dataCategories: ["PII", "support tickets", "chat history"], businessValue: "Reduce ticket resolution time 40%",
    riskLevel: "medium-high", humanOversight: "Escalate to human on billing disputes",
    evidenceRequired: ["retention policy"], evidenceProvided: ["usage log"],
    approvalState: "pending",
  },
  {
    id: "uc-2", name: "Code review assistant", owner: "Platform Eng", modelVendor: "Claude",
    dataCategories: ["source code"], businessValue: "Faster PR reviews",
    riskLevel: "medium", humanOversight: "All merges require human approval",
    evidenceRequired: [], evidenceProvided: ["vendor data processing record", "human escalation rule", "usage log"],
    approvalState: "approved",
  },
];