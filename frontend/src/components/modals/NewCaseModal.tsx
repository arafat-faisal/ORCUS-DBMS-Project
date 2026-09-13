"use client";

import React, { useState } from "react";
import { X, FolderPlus, Shield } from "lucide-react";
import { FIR, Officer } from "@/lib/types";

interface NewCaseModalProps {
  firs: FIR[];
  officers: Officer[];
  onClose: () => void;
  onSubmit: (data: {
    case_title: string;
    opened_date: string;
    assigned_date?: string;
    fir_id?: number;
    lead_officer_id?: number;
  }) => Promise<void>;
}

export const NewCaseModal: React.FC<NewCaseModalProps> = ({
  firs,
  officers,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [openedDate, setOpenedDate] = useState(new Date().toISOString().split("T")[0]);
  const [firId, setFirId] = useState<number | undefined>(undefined);
  const [officerId, setOfficerId] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setSubmitting(true);
    try {
      await onSubmit({
        case_title: title,
        opened_date: openedDate,
        assigned_date: openedDate,
        fir_id: firId,
        lead_officer_id: officerId,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#11131a] border border-neutral-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <FolderPlus className="w-5 h-5 text-cyan-400" />
            <h3 className="font-tactical text-base font-bold text-white tracking-wide">
              OPEN FORMAL INVESTIGATION CASE
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
              Case Title / Primary Incident
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Armed Robbery at Banani Gold Exchange"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
                Opened Date
              </label>
              <input
                type="date"
                required
                value={openedDate}
                onChange={(e) => setOpenedDate(e.target.value)}
                className="w-full bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
                Source FIR (Optional)
              </label>
              <select
                value={firId || ""}
                onChange={(e) => setFirId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="">Direct Incident (No FIR)</option>
                {firs.map((f) => (
                  <option key={f.fir_id} value={f.fir_id}>
                    {f.fir_number} - {f.crime_category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
              Assign Lead Detective
            </label>
            <select
              value={officerId || ""}
              onChange={(e) => setOfficerId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="">Select Sworn Officer...</option>
              {officers.map((o) => (
                <option key={o.officer_id} value={o.officer_id}>
                  {o.first_name} {o.last_name} ({o.badge_no} &bull; {o.rank})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-cyan-500 text-black text-xs font-tactical font-bold tracking-wider hover:bg-cyan-400 transition"
            >
              {submitting ? "OPENING..." : "INITIALIZE INVESTIGATION"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
