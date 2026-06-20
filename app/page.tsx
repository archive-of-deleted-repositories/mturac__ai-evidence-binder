"use client";

import { useState } from "react";
import { findMissingEvidence, generateFindingReport, SAMPLE_USE_CASES, scoreCompliance, type UseCase } from "@/lib/binder";

const riskBadge: Record<string, string> = {
  low: "bg-emerald-500/20 text-emerald-400",
  medium: "bg-blue-500/20 text-blue-400",
  "medium-high": "bg-amber-500/20 text-amber-400",
  high: "bg-red-500/20 text-red-400",
  unacceptable: "bg-purple-500/20 text-purple-400",
};

export default function Home() {
  const [cases, setCases] = useState<UseCase[]>(SAMPLE_USE_CASES);
  const [selected, setSelected] = useState<string>(cases[0]?.id ?? "");

  const active = cases.find((c) => c.id === selected) ?? cases[0];
  const missing = active ? findMissingEvidence(active) : [];
  const score = active ? scoreCompliance(active) : 0;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-slate-200">
      <header className="border-b border-indigo-900/40 bg-indigo-950/20">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <h1 className="text-2xl font-bold text-indigo-100">ai-evidence-binder</h1>
          <p className="text-indigo-400/70 text-sm">EU AI Act aligned use-case governance & evidence tracking</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-indigo-600">Use Cases</h2>
          {cases.map((uc) => (
            <button
              key={uc.id}
              onClick={() => setSelected(uc.id)}
              className={`w-full text-left p-4 rounded-xl border transition ${selected === uc.id ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 hover:border-indigo-800"}`}
            >
              <div className="font-medium">{uc.name}</div>
              <div className="flex gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded ${riskBadge[uc.riskLevel]}`}>{uc.riskLevel}</span>
                <span className="text-xs text-slate-500">{uc.approvalState}</span>
              </div>
            </button>
          ))}
          <button
            onClick={() => download(generateFindingReport(cases), "compliance-report.md")}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm"
          >
            Export Compliance Report
          </button>
        </div>

        {active && (
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{active.name}</h2>
                  <p className="text-slate-500 text-sm mt-1">{active.owner} · {active.modelVendor}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-indigo-400">{score}%</div>
                  <div className="text-xs text-slate-500">compliance</div>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-400">{active.businessValue}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {active.dataCategories.map((d) => (
                  <span key={d} className="px-2 py-1 rounded bg-slate-800 text-xs">{d}</span>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <EvidenceList title="Provided" items={active.evidenceProvided} color="green" />
              <EvidenceList title="Missing" items={missing} color="red" />
            </div>

            <div className="p-4 rounded-xl border border-amber-800/30 bg-amber-950/20">
              <p className="text-sm text-amber-300/80"><strong>Human oversight:</strong> {active.humanOversight}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function EvidenceList({ title, items, color }: { title: string; items: string[]; color: string }) {
  const c = color === "green" ? "text-green-400" : "text-red-400";
  return (
    <div className="p-4 rounded-xl border border-slate-800">
      <h3 className={`text-sm font-medium mb-3 ${c}`}>{title} ({items.length})</h3>
      {items.length === 0 ? <p className="text-xs text-slate-600">None</p> : items.map((i) => <div key={i} className="text-sm py-1 border-b border-slate-800/50 last:border-0">{i}</div>)}
    </div>
  );
}

function download(content: string, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content]));
  a.download = name;
  a.click();
}