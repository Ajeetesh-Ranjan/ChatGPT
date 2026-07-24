import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

const mockFetch = vi.fn();

globalThis.fetch = mockFetch as unknown as typeof fetch;

const columnsResponse = {
  columns: [
    { key: 'name', label: 'Application Name', description: 'Name', required: true },
    { key: 'businessUnit', label: 'Business Unit', description: 'BU', required: true }
  ]
};

beforeEach(() => {
  mockFetch.mockImplementation((url: RequestInfo | URL, options?: RequestInit) => {
    const href = url.toString();
    if (href.includes('/api/access-reviews') && options?.method === 'POST') {
      return Promise.resolve(new Response(JSON.stringify({ review: { id: 1, ...JSON.parse(options.body as string) } })));
    }
    if (href.includes('/api/applications') && options?.method === 'POST') {
      return Promise.resolve(
        new Response(
          JSON.stringify({ application: { id: 1, name: 'Mock App', businessUnit: 'Advisory', criticality: 'High' } })
        )
      );
    }
    if (href.includes('/api/access-reviews')) {
      return Promise.resolve(new Response(JSON.stringify({ reviews: [] })));
    }
    if (href.includes('/api/applications')) {
      return Promise.resolve(new Response(JSON.stringify({ applications: [] })));
    }
    if (href.includes('/api/orr/application-columns')) {
      return Promise.resolve(new Response(JSON.stringify(columnsResponse)));
    }
    return Promise.resolve(new Response('{}'));
  });
});

afterEach(() => {
  mockFetch.mockReset();
});

test('renders application shell with ORR columns', async () => {
  render(<App />);
  expect(await screen.findByText('AegisAccess')).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getAllByText(/Application Name/).length).toBeGreaterThan(0);
  });
});
