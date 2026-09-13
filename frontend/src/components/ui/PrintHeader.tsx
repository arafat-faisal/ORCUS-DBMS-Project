"use client";

import React from "react";
import { useLocale } from "@/lib/locale";

interface PrintHeaderProps {
  documentTitle?: string;
  title?: string;
  referenceNumber?: string;
  referenceNo?: string;
}

export function PrintHeader({
  documentTitle,
  title,
  referenceNumber,
  referenceNo,
}: PrintHeaderProps) {
  const { formatDateTime } = useLocale();
  const now = new Date();
  const displayTitle = documentTitle || title || "Document";
  const displayRef = referenceNumber || referenceNo;

  return (
    <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
      <div className="text-center">
        <h1 className="text-xl font-bold uppercase tracking-wider text-black">
          ORCUS &bull; Organized Crime Understanding System
        </h1>
        <p className="text-xs text-slate-700 italic mt-0.5">
          Academic DBMS Demonstration System &bull; Fictional Case & Evidence Records
        </p>
      </div>

      <div className="flex items-center justify-between mt-4 text-xs font-mono text-slate-800 border-t border-slate-300 pt-2">
        <div>
          <span>Document: </span>
          <strong className="font-semibold text-black">{displayTitle}</strong>
          {displayRef && (
            <span className="ml-2 font-bold text-black">({displayRef})</span>
          )}
        </div>
        <div>
          <span>Generated: </span>
          <span>{formatDateTime(now)}</span>
        </div>
      </div>
    </div>
  );
}
