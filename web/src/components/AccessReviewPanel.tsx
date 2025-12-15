import { useEffect, useMemo, useState } from "react";
import {
  AccessReview,
  createAccessReview,
  deleteAccessReview,
  fetchAuditTrail,
  listAccessReviews,
  updateAccessReview,
} from "../api";
import { Pill } from "./Pill";

interface Props {
  initialItems: AccessReview[];
  useApi?: boolean;
  apiBase?: string;
}

const defaultNew: AccessReview = {
  id: "",
  subject: "",
  reviewer: "",
  status: "pending",
  lastReviewedAt: new Date().toISOString(),
  notes: "",
};

export function AccessReviewPanel({ initialItems, useApi = false, apiBase }: Props) {
  const [items, setItems] = useState<AccessReview[]>(initialItems);
  const [draft, setDraft] = useState<AccessReview>(defaultNew);
  const [filter, setFilter] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(initialItems[0]?.id ?? null);
  const [audit, setAudit] = useState<string[]>([]);
  const [apiStatus, setApiStatus] = useState<"online" | "offline">("offline");

  const formatAudit = (prefix: string, message: string) => `${prefix} – ${message}`;

  const hydrateAudit = async (id?: string) => {
    if (!useApi || !id) {
      setAudit([]);
      return;
    }
    try {
      const entries = await fetchAuditTrail(id, apiBase);
      setAudit(
        entries
          .map((a) =>
            formatAudit(new Date(a.timestamp).toLocaleString(), `${a.actor} ${a.action} ${a.accessReviewId}`),
          )
          .reverse(),
      );
    } catch (err) {
      console.warn("Audit fetch failed, showing local audit only", err);
      setAudit([]);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      if (!useApi) {
        setItems(initialItems);
        setApiStatus("offline");
        return;
      }
      try {
        const data = await listAccessReviews(apiBase);
        if (isCancelled) return;
        setItems(data);
        setApiStatus("online");
        setSelectedId(data[0]?.id ?? null);
        await hydrateAudit(data[0]?.id);
      } catch (err) {
        console.warn("API unavailable, falling back to seeded items", err);
        if (isCancelled) return;
        setApiStatus("offline");
        setItems(initialItems);
        setAudit([]);
      }
    };
    load();
    return () => {
      isCancelled = true;
    };
  }, [apiBase, initialItems, useApi]);

  useEffect(() => {
    const match = items.find((i) => i.id === selectedId);
    if (match) {
      setDraft(match);
      hydrateAudit(match.id);
    }
  }, [items, selectedId]);

  const filteredItems = useMemo(() => {
    const text = filter.toLowerCase();
    return items.filter(
      (i) =>
        i.subject.toLowerCase().includes(text) ||
        i.reviewer.toLowerCase().includes(text) ||
        i.tags?.some((t) => t.toLowerCase().includes(text)),
    );
  }, [filter, items]);

  const selectedItem = items.find((i) => i.id === selectedId) ?? items[0];

  const logLocalAudit = (message: string) =>
    setAudit((prev) => [formatAudit(new Date().toISOString(), message), ...prev]);

  const upsert = async () => {
    if (!draft.subject || !draft.reviewer) return;

    const payload = { ...draft, lastReviewedAt: new Date().toISOString() };

    if (useApi) {
      try {
        if (draft.id) {
          const updated = await updateAccessReview(draft.id, payload, apiBase);
          setItems((prev) => prev.map((p) => (p.id === draft.id ? updated : p)));
          await hydrateAudit(updated.id);
        } else {
          const created = await createAccessReview(payload, apiBase);
          setItems((prev) => [created, ...prev]);
          setSelectedId(created.id);
          await hydrateAudit(created.id);
        }
        setDraft(defaultNew);
        return;
      } catch (err) {
        console.warn("API save failed, falling back to local state", err);
      }
    }

    if (draft.id) {
      setItems((prev) => prev.map((p) => (p.id === draft.id ? { ...p, ...payload } : p)));
      logLocalAudit(`Updated review ${draft.id}`);
    } else {
      const newItem = { ...payload, id: `ci-${Math.floor(Math.random() * 10000)}` };
      setItems((prev) => [newItem, ...prev]);
      setSelectedId(newItem.id);
      logLocalAudit(`Created review ${newItem.id}`);
    }
    setDraft(defaultNew);
  };

  const remove = async (id: string) => {
    if (useApi) {
      try {
        await deleteAccessReview(id, apiBase);
        setItems((prev) => prev.filter((p) => p.id !== id));
        await hydrateAudit(id);
        if (selectedId === id) setSelectedId(null);
        return;
      } catch (err) {
        console.warn("API delete failed, falling back to local state", err);
      }
    }

    setItems((prev) => prev.filter((p) => p.id !== id));
    logLocalAudit(`Deleted review ${id}`);
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Access Reviews</p>
          <h3>Sample Access Review workflow</h3>
          <p className="muted">
            CRUD, quick filtering, inline audit trail, and an optional live API connection for demo purposes.
          </p>
        </div>
        <div className="row">
          <input
            placeholder="Filter by subject, reviewer, tag"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <Pill tone={apiStatus === "online" ? "success" : "warn"}>
            API {apiStatus}
          </Pill>
          <button className="ghost" onClick={() => setAudit([])}>
            Clear audit log
          </button>
        </div>
      </div>

      <div className="panel-grid">
        <div className="card list">
          <div className="list-head">{filteredItems.length} records</div>
          <div className="list-body">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                className={`list-row ${item.id === selectedItem?.id ? "active" : ""}`}
                onClick={() => setSelectedId(item.id)}
              >
                <div>
                  <div className="list-title">{item.subject}</div>
                  <div className="muted small">{item.reviewer}</div>
                  <div className="muted small">Reviewed {new Date(item.lastReviewedAt).toLocaleDateString()}</div>
                  <div className="tags">
                    {item.tags?.map((t) => (
                      <Pill key={t} tone="info">
                        {t}
                      </Pill>
                    ))}
                  </div>
                </div>
                <Pill tone={item.status === "approved" ? "success" : item.status === "revoked" ? "danger" : "warn"}>
                  {item.status}
                </Pill>
              </button>
            ))}
          </div>
        </div>

        <div className="card form">
          <div className="list-head">{selectedItem ? "Edit selection" : "Add"}</div>
          <label>
            Subject
            <input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
          </label>
          <label>
            Reviewer
            <input value={draft.reviewer} onChange={(e) => setDraft({ ...draft, reviewer: e.target.value })} />
          </label>
          <label>
            Status
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as AccessReview["status"] })}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="revoked">Revoked</option>
            </select>
          </label>
          <label>
            Notes
            <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </label>
          <div className="row end">
            <button className="secondary" onClick={() => setDraft(defaultNew)}>
              Reset
            </button>
            <button className="primary" onClick={upsert}>
              {draft.id ? "Update" : "Create"}
            </button>
          </div>
          {selectedItem && (
            <button className="danger" onClick={() => remove(selectedItem.id)}>
              Delete selected
            </button>
          )}
        </div>

        <div className="card audit">
          <div className="list-head">Audit trail</div>
          {audit.length === 0 && <p className="muted">Actions will appear here.</p>}
          <ul className="audit-list">
            {audit.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
