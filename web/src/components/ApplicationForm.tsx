import { FormEvent, useEffect, useState } from 'react';
import { ApplicationProfile, ORRColumn, createApplication, fetchORRColumns } from '../api';

interface Props {
  onCreated: (app: ApplicationProfile) => void;
}

const defaultApp: ApplicationProfile = {
  name: '',
  businessUnit: '',
  dataClassification: '',
  criticality: '',
  hostingModel: '',
  owner: '',
  itOwner: '',
  complianceScope: '',
  recoveryObjective: '',
  serviceLine: ''
};

export function ApplicationForm({ onCreated }: Props) {
  const [columns, setColumns] = useState<ORRColumn[]>([]);
  const [form, setForm] = useState<ApplicationProfile>(defaultApp);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchORRColumns().then(setColumns);
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const saved = await createApplication(form);
    onCreated(saved);
    setForm(defaultApp);
    setBusy(false);
  };

  return (
    <div className="card">
      <h3>Register Application (IT Owner view)</h3>
      <p className="note">This form pulls PwC AU ORR fields so IT owners capture the correct metadata.</p>
      <div className="stack">
        {columns.map((col) => (
          <span key={col.key} className="badge pending" title={col.description}>
            {col.label}{col.required ? '*' : ''}
          </span>
        ))}
      </div>
      <form onSubmit={submit} style={{ marginTop: '1rem' }}>
        <label>
          Application Name
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Business Unit
          <input
            required
            value={form.businessUnit}
            onChange={(e) => setForm({ ...form, businessUnit: e.target.value })}
          />
        </label>
        <label>
          Service Line
          <input
            value={form.serviceLine}
            onChange={(e) => setForm({ ...form, serviceLine: e.target.value })}
          />
        </label>
        <label>
          Data Classification
          <input
            required
            value={form.dataClassification}
            onChange={(e) => setForm({ ...form, dataClassification: e.target.value })}
          />
        </label>
        <label>
          Criticality
          <input
            required
            value={form.criticality}
            onChange={(e) => setForm({ ...form, criticality: e.target.value })}
          />
        </label>
        <label>
          Hosting Model
          <input
            required
            value={form.hostingModel}
            onChange={(e) => setForm({ ...form, hostingModel: e.target.value })}
          />
        </label>
        <label>
          Business Owner
          <input
            value={form.owner}
            onChange={(e) => setForm({ ...form, owner: e.target.value })}
          />
        </label>
        <label>
          IT Owner
          <input
            required
            value={form.itOwner}
            onChange={(e) => setForm({ ...form, itOwner: e.target.value })}
          />
        </label>
        <label>
          Compliance Scope
          <input
            value={form.complianceScope}
            onChange={(e) => setForm({ ...form, complianceScope: e.target.value })}
          />
        </label>
        <label>
          Recovery Objective
          <input
            value={form.recoveryObjective}
            onChange={(e) => setForm({ ...form, recoveryObjective: e.target.value })}
          />
        </label>
        <button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save Application'}</button>
      </form>
    </div>
  );
}
