import { useEffect, useMemo, useState } from "react";
import { Pill } from "./Pill";

export interface AccessReviewItem {
  id: string;
  subject: string;
  reviewer: string;
  status: "pending" | "approved" | "revoked";
  lastReviewedAt: string;
  notes?: string;
  tags?: string[];
}

interface Props {
  initialItems: AccessReviewItem[];
}

const defaultNew: AccessReviewItem = {
  id: "",
  subject: "",
  reviewer: "",
  status: "pending",
  lastReviewedAt: new Date().toISOString(),
  notes: "",
};

export function AccessReviewPanel({ initialItems }: Props) {
  const [items, setItems] = useState<AccessReviewItem[]>(initialItems);
  const [draft, setDraft] = useState<AccessReviewItem>(defaultNew);
  const [filter, setFilter] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(initialItems[0]?.id ?? null);
  const [audit, setAudit] = useState<string[]>([]);

  useEffect(() => {
    const match = items.find((i) => i.id === selectedId);
    if (match) {
      setDraft(match);
    }
  }, [items, selectedId]);

  const filteredItems = useMemo(() => {
    const text = filter.toLowerCase();
    return items.filter(
      (i) => i.subject.toLowerCase().includes(text) || i.reviewer.toLowerCase().includes(text) || i.tags?.some((t) => t.toLowerCase().includes(text)),
    );
  }, [filter, items]);

  const selectedItem = items.find((i) => i.id === selectedId) ?? items[0];

  const log = (message: string) => setAudit((prev) => [new Date().toISOString() + " – " + message, ...prev]);

  const upsert = () => {
    if (!draft.subject || !draft.reviewer) return;
    if (draft.id) {
      setItems((prev) => prev.map((p) => (p.id === draft.id ? { ...p, ...draft } : p)));
      log(`Updated review ${draft.id}`);
    } else {
      const newItem = { ...draft, id: `ci-${Math.floor(Math.random() * 10000)}` };
      setItems((prev) => [newItem, ...prev]);
      setSelectedId(newItem.id);
      log(`Created review ${newItem.id}`);
    }
    setDraft(defaultNew);
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    log(`Deleted review ${id}`);
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Access Reviews</p>
          <h3>Sample Access Review workflow</h3>
          <p className="muted">CRUD, quick filtering, and inline audit trail.</p>
        </div>
        <div className="row">
          <input
            placeholder="Filter by subject, reviewer, tag"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
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
              onChange={(e) => setDraft({ ...draft, status: e.target.value as AccessReviewItem["status"] })}
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
