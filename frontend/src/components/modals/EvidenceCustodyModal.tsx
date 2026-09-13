"use client";

import React, { useState } from "react";
import { X, PackageCheck, History, ShieldAlert } from "lucide-react";
import { Evidence } from "@/lib/types";

interface EvidenceCustodyModalProps {
  evidence: Evidence | null;
  onClose: () => void;
  onSubmit: (id: number, status: string, location: string, remarks: string) => Promise<void>;
}

export const EvidenceCustodyModal: React.FC<EvidenceCustodyModalProps> = ({
  evidence,
  onClose,
  onSubmit,
}) => {
  const [status, setStatus] = useState<string>(evidence?.status || "In Lab Analysis");
  const [location, setLocation] = useState<string>(evidence?.storage_location || "Vault Unit A-4");
  const [remarks, setRemarks] = useState<string>("");
  const [loading, setLoading] = useState(false);

  if (!evidence) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) return;
    setLoading(true);
    try {
      await onSubmit(evidence.evidence_id, status, location, remarks);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#11131a] border border-neutral-800 rounded-3xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <PackageCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-tactical text-base font-bold text-white tracking-wide">
                CHAIN OF CUSTODY TRANSITION
              </h3>
              <p className="font-mono-code text-xs text-neutral-400">
                Item: {evidence.title} (#{evidence.evidence_no})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
              New Custody Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="Collected">Collected</option>
              <option value="In Lab Analysis">In Lab Analysis</option>
              <option value="Stored in Vault">Stored in Vault</option>
              <option value="Presented in Court">Presented in Court</option>
              <option value="Archived">Archived</option>
              <option value="Disposed">Disposed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
              Transfer / Storage Location
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ballistics Laboratory Bench 2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
              Chain of Custody Justification &amp; Remarks (Mandatory Audit Log)
            </label>
            <textarea
              required
              rows={3}
              placeholder="Detail reasons for physical transfer, recipient unit, and findings..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-cyan-500 text-black text-xs font-bold tracking-wider hover:bg-cyan-400 transition"
            >
              {loading ? "LOGGING..." : "COMMIT CUSTODY TRANSFER"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
