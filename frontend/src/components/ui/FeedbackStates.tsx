"use client";

import React from "react";
import { FolderOpen, AlertCircle, RefreshCw } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "No records found",
  description = "No items match your criteria. New records will appear here.",
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="bg-white rounded-lg border border-dashed border-slate-300 p-12 text-center my-6">
      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
        {icon || <FolderOpen className="w-6 h-6" />}
      </div>
      <h3 className="text-sm font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading records..." }: LoadingStateProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-12 text-center my-6">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-xs font-medium text-slate-600">{message}</p>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  requestId?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Unable to load data",
  message = "An error occurred while communicating with the database server.",
  requestId,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-center my-6">
      <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
      <h3 className="text-sm font-bold text-rose-900 mb-1">{title}</h3>
      <p className="text-xs text-rose-700 max-w-md mx-auto mb-3">{message}</p>
      {requestId && (
        <p className="text-[11px] font-mono text-rose-500 mb-3">Request ID: {requestId}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
}
