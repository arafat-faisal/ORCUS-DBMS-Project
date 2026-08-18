# Design Decisions — Participants & Evidence Module

**Module Owner:** Ayshee Islam Liza (241400045)

---

**Decision ID:** D1
**Table:** SUSPECT, VICTIM, WITNESS
**Choice:** Store Age as a plain integer instead of calculating it from DOB.
**Reason:** Exact date of birth isn't always available for suspects/witnesses during an investigation, so a direct Age field is more practical.

---

**Decision ID:** D2
**Table:** SUSPECT
**Choice:** Suspicion_Level restricted to ENUM('Low','Medium','High').
**Reason:** Keeps values consistent for filtering/reporting instead of free text.

---

**Decision ID:** D3
**Table:** VICTIM
**Choice:** Added Is_Deceased as a separate boolean field alongside Victim_Condition.
**Reason:** Allows quick filtering/reporting without parsing free-text condition notes.

---

**Decision ID:** D4
**Table:** EVIDENCE
**Choice:** Status field holds only the current status; full history tracked separately.
**Reason:** Required by the proposal — evidence status changes must be auditable, not overwritten.

---

**Decision ID:** D5
**Table:** EVIDENCE_STATUS_HISTORY
**Choice:** Append-only table, no UPDATE/DELETE allowed on existing rows.
**Reason:** Preserves a true, tamper-proof history trail of status changes.

---

**Decision ID:** D6
**Table:** CASE_SUSPECT, CASE_VICTIM, CASE_WITNESS, VICTIM_LOCATION, VICTIM_EVIDENCE
**Choice:** Used bridge (junction) tables with composite primary keys instead of a single foreign key column.
**Reason:** These are M:N relationships (e.g. one case can have many suspects, one suspect can appear in many cases) — a direct FK can't represent that.

---

**Decision ID:** D7
**Table:** All bridge tables
**Choice:** ON DELETE CASCADE on the participant/location/evidence side, ON DELETE RESTRICT on the Case side.
**Reason:** Deleting a suspect/victim/witness/location/evidence should clean up its links automatically, but a case with dependent records shouldn't be deletable by accident.

---

**Decision ID:** D8
**Table:** SUSPECT, VICTIM, WITNESS
**Choice:** Name not marked UNIQUE.
**Reason:** Two different people can share the same name; uniqueness isn't a valid constraint here.