import { useEffect, useState } from 'react';
import { AccessReview, AuditLog, deleteAccessReview, fetchAuditLogs } from '../api';

interface Props {
  reviews: AccessReview[];
  onRefresh: () => Promise<void>;
}

export function AccessReviewTable({ reviews, onRefresh }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (selectedId) {
      fetchAuditLogs(selectedId).then(setLogs);
    } else {
      setLogs([]);
    }
  }, [selectedId]);

  const remove = async (id: number) => {
    await deleteAccessReview(id);
    setSelectedId(null);
    await onRefresh();
  };

  return (
    <div className="card">
      <h3>Access Reviews</h3>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Application</th>
            <th>Reviewer</th>
            <th>Status</th>
            <th>Due</th>
            <th>Owner Role</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review.id}>
              <td>{review.id}</td>
              <td>{review.application}</td>
              <td>{review.reviewer}</td>
              <td>
                <span className={`badge ${review.status}`}>{review.status}</span>
              </td>
              <td>{review.dueDate}</td>
              <td>{review.ownerRole}</td>
              <td className="stack">
                <button onClick={() => setSelectedId(review.id!)}>Audit</button>
                <button onClick={() => remove(review.id!)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedId && (
        <div>
          <h4>Audit Log for Review #{selectedId}</h4>
          {logs.length === 0 ? (
            <p className="note">No audit entries yet.</p>
          ) : (
            <ul>
              {logs.map((log) => (
                <li key={log.id}>
                  <strong>{log.action}</strong> by {log.actor} at {new Date(log.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
