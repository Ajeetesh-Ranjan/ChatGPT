<<<<<<< HEAD
import { useEffect, useMemo, useState } from "react";
import { accessReviewExamples, TFD, type ContentBlock, type Section } from "./data";
import { AccessReviewPanel } from "./components/AccessReviewPanel";
import { Pill } from "./components/Pill";

const highlightText = (text: string, query: string) => {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
};

function Block({ block, query }: { block: ContentBlock; query: string }) {
  if (block.type === "callout") {
    return (
      <div className={`card callout ${block.tone ?? "info"}`}>
        <h3 dangerouslySetInnerHTML={{ __html: highlightText(block.title, query) }} />
        <p dangerouslySetInnerHTML={{ __html: highlightText(block.body, query) }} />
      </div>
    );
  }

  if (block.type === "kv") {
    return (
      <div className="card">
        <h3>{block.title}</h3>
        <dl className="kv">
          {block.rows.map(([k, v]) => (
            <div className="kv-row" key={k}>
              <dt>{k}</dt>
              <dd dangerouslySetInnerHTML={{ __html: highlightText(v, query) }} />
            </div>
          ))}
        </dl>
      </div>
    );
  }

  if (block.type === "bullets") {
    return (
      <div className="card">
        <h3>{block.title}</h3>
        <ul>
          {block.items.map((item) => (
            <li key={item} dangerouslySetInnerHTML={{ __html: highlightText(item, query) }} />
          ))}
        </ul>
      </div>
    );
  }

  if (block.type === "details") {
    return (
      <details className="card" open={block.open}>
        <summary>{block.title}</summary>
        <div className="muted">
          {block.body.map((line) => (
            <div key={line} dangerouslySetInnerHTML={{ __html: highlightText(line, query) }} />
          ))}
        </div>
      </details>
    );
  }

  if (block.type === "table") {
    return (
      <div className="card">
        <h3>{block.title}</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {block.columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, idx) => (
                <tr key={idx}>
                  {row.map((cell, ci) => (
                    <td key={ci} dangerouslySetInnerHTML={{ __html: highlightText(cell, query) }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (block.type === "raw") {
    return (
      <div className="card">
        <h3>{block.title}</h3>
        <pre>{block.body}</pre>
      </div>
    );
  }

  return null;
}

function App() {
  const [activeId, setActiveId] = useState<string>(TFD.sections[0].id);
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && TFD.sections.some((s) => s.id === hash)) {
      setActiveId(hash);
    }
  }, []);

  useEffect(() => {
    window.history.replaceState(null, "", `#${activeId}`);
  }, [activeId]);

  const activeSection = useMemo<Section>(() => {
    return TFD.sections.find((s) => s.id === activeId) ?? TFD.sections[0];
  }, [activeId]);

  const filteredNav = useMemo(() => {
    if (!query) return TFD.sections;
    return TFD.sections.filter((s) => {
      const haystack = JSON.stringify(s).toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [query]);

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Aurora Conflicts Suite</p>
          <h1>Conflicts Identifier – Interactive TFD Dashboard</h1>
          <p className="muted">
            Interactive view for Executive Stakeholders, Business Owner, IT Owner, Technical Leads, Developers.
          </p>
          <div className="chips">
            <span className="chip">Territory: {TFD.app.territory}</span>
            <span className="chip">Users: ~{TFD.app.usersApprox}</span>
            <span className="chip">CI: {TFD.app.governance.CI}</span>
            <span className="chip">
              ARR: {TFD.app.governance.ARR} ({TFD.app.governance.ARR_RiskTier})
            </span>
            <span className="chip">Release: {TFD.app.governance.ReleaseRecord}</span>
          </div>
        </div>
        <div className="controls">
          <input
            type="search"
            placeholder="Search (e.g., Salesforce, Tier 4, ARR0056449)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="secondary" onClick={() => setQuery("")}>Clear</button>
          <button className="primary" onClick={() => setActiveId(TFD.sections[0].id)}>
            Reset view
          </button>
        </div>
      </header>

      <main className="layout">
        <aside>
          <div className="section-heading">Sections</div>
          <div className="nav">
            {filteredNav.map((s) => (
              <button
                key={s.id}
                className={`nav-item ${s.id === activeSection.id ? "active" : ""}`}
                onClick={() => setActiveId(s.id)}
              >
                <span className="nav-key">{s.key}</span>
                <span>
                  <div className="nav-title" dangerouslySetInnerHTML={{ __html: highlightText(s.title, query) }} />
                  <div className="nav-sub">{s.subtitle}</div>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="content">
          <div className="content-head">
            <div>
              <p className="eyebrow">Section {activeSection.key}</p>
              <h2>{activeSection.title}</h2>
              <p className="muted">{activeSection.subtitle}</p>
              <div className="tags">
                {activeSection.tags?.map((t) => (
                  <Pill key={t} tone="info">
                    {t}
                  </Pill>
                ))}
              </div>
            </div>
            <div className="row">
              <button className="ghost" onClick={() => setQuery("audit")}>Highlight audit</button>
              <button className="ghost" onClick={() => setQuery("access")}>Focus access</button>
            </div>
          </div>

          <div className="grid">
            {activeSection.content.map((block) => (
              <Block key={block.title} block={block} query={query} />
            ))}
          </div>

          <AccessReviewPanel
            initialItems={accessReviewExamples}
            useApi={Boolean(import.meta.env.VITE_API_BASE)}
            apiBase={import.meta.env.VITE_API_BASE}
          />
        </section>
      </main>
=======
import { useEffect, useState } from 'react';
import {
  AccessReview,
  ApplicationProfile,
  createAccessReview,
  fetchAccessReviews,
  fetchApplications,
  updateAccessReview
} from './api';
import { AccessReviewForm } from './components/AccessReviewForm';
import { AccessReviewTable } from './components/AccessReviewTable';
import { ApplicationForm } from './components/ApplicationForm';

function App() {
  const [reviews, setReviews] = useState<AccessReview[]>([]);
  const [applications, setApplications] = useState<ApplicationProfile[]>([]);

  const refreshReviews = async () => {
    const data = await fetchAccessReviews();
    setReviews(data);
  };

  const refreshApplications = async () => {
    const data = await fetchApplications();
    setApplications(data);
  };

  useEffect(() => {
    refreshReviews();
    refreshApplications();
  }, []);

  const saveReview = async (review: AccessReview) => {
    if (review.id) {
      await updateAccessReview(review.id, review);
    } else {
      await createAccessReview(review);
    }
    await refreshReviews();
  };

  const handleAppCreated = async () => {
    await refreshApplications();
  };

  return (
    <div className="container">
      <header className="card" style={{ marginBottom: '1rem' }}>
        <h1>AegisAccess</h1>
        <p className="note">Organizational access review and ORR-ready application registry.</p>
      </header>

      <section className="card">
        <AccessReviewForm onSave={saveReview} />
      </section>

      <section>
        <AccessReviewTable reviews={reviews} onRefresh={refreshReviews} />
      </section>

      <section>
        <ApplicationForm onCreated={handleAppCreated} />
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>Registered Applications</h3>
          {applications.length === 0 ? (
            <p className="note">No applications yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Business Unit</th>
                  <th>Criticality</th>
                  <th>Hosting</th>
                  <th>IT Owner</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>{app.name}</td>
                    <td>{app.businessUnit}</td>
                    <td>{app.criticality}</td>
                    <td>{app.hostingModel}</td>
                    <td>{app.itOwner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
>>>>>>> origin/main
    </div>
  );
}

export default App;
