import { describe, expect, it } from "vitest";
import { findMissingEvidence, generateFindingReport, SAMPLE_USE_CASES, scoreCompliance, validateUseCase } from "./binder";

describe("ai-evidence-binder", () => {
  it("validates required fields", () => {
    const r = validateUseCase({ ...SAMPLE_USE_CASES[0], owner: "" });
    expect(r.valid).toBe(false);
  });

  it("finds missing evidence for support agent", () => {
    const missing = findMissingEvidence(SAMPLE_USE_CASES[0]);
    expect(missing.some((m) => m.includes("PII"))).toBe(true);
    expect(missing.some((m) => m.includes("hallucination"))).toBe(true);
  });

  it("scores low compliance for incomplete use case", () => {
    expect(scoreCompliance(SAMPLE_USE_CASES[0])).toBeLessThan(50);
  });

  it("scores high for complete use case", () => {
    expect(scoreCompliance(SAMPLE_USE_CASES[1])).toBeGreaterThan(80);
  });

  it("generates finding report", () => {
    const md = generateFindingReport(SAMPLE_USE_CASES);
    expect(md).toContain("Customer support agent");
    expect(md).toContain("Missing");
  });

  it("detects human escalation missing", () => {
    const uc = { ...SAMPLE_USE_CASES[0], evidenceProvided: ["usage log"] };
    expect(findMissingEvidence(uc).some((m) => m.includes("escalation"))).toBe(true);
  });

  it("approved use case has fewer gaps", () => {
    expect(findMissingEvidence(SAMPLE_USE_CASES[1]).length).toBeLessThan(findMissingEvidence(SAMPLE_USE_CASES[0]).length);
  });

  it("vendor record required for medium risk", () => {
    const missing = findMissingEvidence(SAMPLE_USE_CASES[1]);
    expect(missing).not.toContain("vendor data processing record");
  });
});