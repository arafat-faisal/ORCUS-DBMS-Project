"use client";

import React from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  itemType: string;
  warningDetails?: string;
  isDeleting: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  title,
  itemName,
  itemType,
  warningDetails,
  isDeleting,
  error,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-red-50/50">
          <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
            <div className="p-1.5 bg-red-100 rounded-full text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 p-1 rounded transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete this {itemType.toLowerCase()}?
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Target Record
            </div>
            <div className="text-xs font-bold text-slate-900 mt-0.5 break-words">
              {itemName}
            </div>
          </div>

          {warningDetails && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-[11px] text-red-700 leading-relaxed">
              <span className="font-semibold">Notice: </span>
              {warningDetails}
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md text-xs font-semibold transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
