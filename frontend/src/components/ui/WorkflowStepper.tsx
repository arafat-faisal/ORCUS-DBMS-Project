"use client";

import React from "react";
import { Check, ArrowRight } from "lucide-react";

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status?: "complete" | "current" | "upcoming";
}

interface WorkflowStepperProps {
  currentStepId?: string;
}

export function WorkflowStepper({ currentStepId }: WorkflowStepperProps) {
  const steps: WorkflowStep[] = [
    {
      id: "complaint",
      title: "1. Complaint Intake",
      description: "Citizen or official incident intake logged with server tracking code",
    },
    {
      id: "assessment",
      title: "2. Duty Assessment",
      description: "Duty Officer reviews jurisdiction, facts, and initial categorization",
    },
    {
      id: "intake_record",
      title: "3. GD or Direct FIR",
      description: "Non-cognizable logged as GD; cognizable submitted for FIR registration review (academic model)",
    },
    {
      id: "case",
      title: "4. Case Investigation",
      description: "Investigating Officer assigned; participants & locations linked",
    },
    {
      id: "evidence",
      title: "5. Evidence & Custody",
      description: "Items secured in vault with immutable chain-of-custody transfer trail",
    },
    {
      id: "closure",
      title: "6. Supervisory Review",
      description: "Supervisor review, judicial reporting, and case resolution",
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
        Academic Information Flow & Lifecycle
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {steps.map((step, idx) => {
          const isCurrent = currentStepId === step.id;
          return (
            <div
              key={step.id}
              className={`p-3 rounded-md border text-xs relative ${
                isCurrent
                  ? "border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600"
                  : "border-slate-200 bg-slate-50/60 text-slate-700"
              }`}
            >
              <div className="font-semibold text-slate-900 mb-1">{step.title}</div>
              <p className="text-[11px] text-slate-500 leading-snug">{step.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
