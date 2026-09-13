"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface FilterBarProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  onReset?: () => void;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search records...",
  children,
  onReset,
}: FilterBarProps) {
  return (
    <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
      {onSearchChange !== undefined && (
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {children && (
        <div className="flex flex-wrap items-center gap-2.5">
          {children}
          {onReset && (
            <button
              onClick={onReset}
              className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded hover:bg-slate-100 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
