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
    </div>
  );
}

export default App;
