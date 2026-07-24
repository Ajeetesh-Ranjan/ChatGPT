import { FormEvent, useState } from 'react';
import { AccessReview } from '../api';

interface Props {
  onSave: (review: AccessReview) => Promise<void>;
  initial?: AccessReview;
}

const defaultState: AccessReview = {
  application: '',
  reviewer: '',
  status: 'pending',
  dueDate: '',
  ownerRole: 'IT Owner'
};

export function AccessReviewForm({ onSave, initial }: Props) {
  const [form, setForm] = useState<AccessReview>(initial || defaultState);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await onSave(form);
    setForm(defaultState);
    setBusy(false);
  };

  return (
    <form className="card" onSubmit={submit}>
      <h3>Create / Update Access Review</h3>
      <label>
        Application
        <input
          required
          value={form.application}
          onChange={(e) => setForm({ ...form, application: e.target.value })}
          placeholder="Payroll, CRM, etc"
        />
      </label>
      <label>
        Reviewer
        <input
          required
          value={form.reviewer}
          onChange={(e) => setForm({ ...form, reviewer: e.target.value })}
          placeholder="Manager name"
        />
      </label>
      <label>
        Status
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>
      <label>
        Due Date
        <input
          type="date"
          required
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
        />
      </label>
      <label>
        Owner Role
        <input
          required
          value={form.ownerRole}
          onChange={(e) => setForm({ ...form, ownerRole: e.target.value })}
          placeholder="IT Owner"
        />
      </label>
      <button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save Review'}</button>
    </form>
  );
}
