import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';

const mockProblems = [
  {
    id: 'prob_parking_lot',
    slug: 'parking-lot',
    title: 'Parking Lot System',
    difficulty: 'Medium',
    summary: 'Design an object-oriented multi-floor parking lot management system.',
    rubricDimensions: [
      { id: 'domain_entities', title: 'Core Entity Decomposition', weight: 25 },
      { id: 'solid_modularity', title: 'Cohesion & SOLID Modularity', weight: 25 },
      { id: 'extensibility_patterns', title: 'Extensibility & Pattern Application', weight: 25 },
      { id: 'edge_cases_concurrency', title: 'Edge Cases & Allocation Robustness', weight: 25 },
    ],
  },
];

const mockProblemDetail = {
  id: 'prob_parking_lot',
  slug: 'parking-lot',
  title: 'Parking Lot System',
  difficulty: 'Medium',
  summary: 'Design an object-oriented multi-floor parking lot management system.',
  description: 'Detailed description of parking lot problem...',
  functionalRequirements: ['Support multiple vehicle types', 'Issue ticket on entry'],
  nonFunctionalConstraints: ['Adhere to SOLID principles', 'Decouple pricing'],
  rubric: {
    id: 'rubric_parking_lot',
    totalWeight: 100,
    criteria: [
      {
        id: 'domain_entities',
        title: 'Core Entity Decomposition',
        weight: 25,
        description: 'Evaluates core concepts',
        targetConcepts: ['Vehicle', 'Spot'],
      },
    ],
  },
  starterTemplate: {
    problemSlug: 'parking-lot',
    assumptions: ['Multi-floor lot'],
    entities: [
      {
        name: 'ParkingLot',
        type: 'class',
        responsibilities: ['Coordinates parking'],
        attributes: [],
        methods: [],
      },
      {
        name: 'ParkingSpot',
        type: 'class',
        responsibilities: ['Maintains spot state'],
        attributes: [],
        methods: [],
      },
    ],
    relationships: [{ source: 'ParkingLot', target: 'ParkingSpot', type: 'has_many' }],
    designPatterns: [],
    edgeCasesConsidered: ['Full lot condition'],
  },
  sampleSolution: {
    problemSlug: 'parking-lot',
    assumptions: ['Multi-floor lot'],
    entities: [
      {
        name: 'ParkingLot',
        type: 'class',
        responsibilities: ['Coordinates parking'],
        attributes: [],
        methods: [],
      },
      {
        name: 'ParkingSpot',
        type: 'class',
        responsibilities: ['Maintains spot state'],
        attributes: [],
        methods: [],
      },
    ],
    relationships: [{ source: 'ParkingLot', target: 'ParkingSpot', type: 'has_many' }],
    designPatterns: [],
    edgeCasesConsidered: ['Full lot condition'],
  },
};

describe('DesignKarlo Frontend App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/problems/parking-lot')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'x-persistence-mode': 'in-memory' }),
            json: () => Promise.resolve({ success: true, data: mockProblemDetail }),
          });
        }
        if (url.includes('/api/problems')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'x-persistence-mode': 'in-memory' }),
            json: () => Promise.resolve({ success: true, data: mockProblems }),
          });
        }
        if (url.includes('/api/attempts') && !url.includes('/submissions')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'x-persistence-mode': 'in-memory' }),
            json: () =>
              Promise.resolve({
                success: true,
                data: {
                  id: 'att_test_1',
                  problemSlug: 'parking-lot',
                  anonymousUserId: 'anon_test',
                  status: 'in_progress',
                  currentRevisionNumber: 0,
                  submissions: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                meta: { isNew: true, persistenceMode: 'in-memory' },
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'x-persistence-mode': 'in-memory' }),
          json: () => Promise.resolve({ success: true, data: {} }),
        });
      })
    );
  });

  it('renders the DesignKarlo header, branding, and ephemeral storage warning', async () => {
    render(<App />);

    await waitFor(() => {
      const brandings = screen.getAllByText(/Design/i);
      expect(brandings.length).toBeGreaterThan(0);
      const kElements = screen.getAllByText(/Karlo/i);
      expect(kElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/Ephemeral In-Memory Mode/i)).toBeInTheDocument();
    });
  });

  it('renders problem catalog and parking lot problem card', async () => {
    render(<App />);

    await waitFor(() => {
      const titles = screen.getAllByText('Parking Lot System');
      expect(titles.length).toBeGreaterThanOrEqual(1);
      const summaries = screen.getAllByText(/Design an object-oriented multi-floor/i);
      expect(summaries.length).toBeGreaterThanOrEqual(1);
      const startBtns = screen.getAllByText(/Start Practice Session|Start Attempt/i);
      expect(startBtns.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('transitions to structured design studio when Start Practice Session is clicked', async () => {
    render(<App />);

    let startBtns: HTMLElement[] = [];
    await waitFor(() => {
      startBtns = screen.getAllByText(/Start Practice Session/i);
      expect(startBtns.length).toBeGreaterThan(0);
    });

    fireEvent.click(startBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Structure Your Solution/i)).toBeInTheDocument();
      expect(screen.getByText(/Interactive Design Studio/i)).toBeInTheDocument();
      expect(screen.getByText(/Load Sample Architecture/i)).toBeInTheDocument();
      expect(screen.getByText(/Submit Revision #1 for Evaluation/i)).toBeInTheDocument();
    });
  });

  it('detects MongoDB connected state from /api/health and renders Persistent Mode Active banner', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/health')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'x-persistence-mode': 'mongodb' }),
            json: () =>
              Promise.resolve({
                status: 'ok',
                service: 'designkarlo-api',
                environment: 'production',
                database: 'connected',
                persistenceMode: 'mongodb',
              }),
          });
        }
        if (url.includes('/api/problems/parking-lot')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'x-persistence-mode': 'mongodb' }),
            json: () => Promise.resolve({ success: true, data: mockProblemDetail, meta: { persistenceMode: 'mongodb' } }),
          });
        }
        if (url.includes('/api/problems')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'x-persistence-mode': 'mongodb' }),
            json: () => Promise.resolve({ success: true, data: mockProblems, meta: { persistenceMode: 'mongodb' } }),
          });
        }
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'x-persistence-mode': 'mongodb' }),
          json: () => Promise.resolve({ success: true, data: {} }),
        });
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Persistent Mode Active/i)).toBeInTheDocument();
      const mongoBadges = screen.getAllByText(/MongoDB/i);
      expect(mongoBadges.length).toBeGreaterThan(0);
    });
  });

  it('renders helpful error notice and retry option when API request fails, without going blank', async () => {
    let callCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/problems/parking-lot')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'x-persistence-mode': 'in-memory' }),
            json: () => Promise.resolve({ success: true, data: mockProblemDetail }),
          });
        }
        if (url.includes('/api/problems')) {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({
              ok: false,
              status: 503,
              headers: new Headers(),
              json: () => Promise.resolve({ error: { message: 'Service Unavailable (Server Waking Up)' } }),
            });
          }
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'x-persistence-mode': 'in-memory' }),
            json: () => Promise.resolve({ success: true, data: mockProblems }),
          });
        }
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'x-persistence-mode': 'in-memory' }),
          json: () => Promise.resolve({ status: 'ok', database: 'disconnected (standalone mode)' }),
        });
      })
    );

    render(<App />);

    // Initially shows error and retry option
    await waitFor(() => {
      expect(screen.getAllByText(/Service Unavailable/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Unable to Load Curriculum/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Retry/i).length).toBeGreaterThan(0);
    });

    // Clicking retry attempts to fetch again and succeeds
    const retryButtons = screen.getAllByText(/Retry/i);
    fireEvent.click(retryButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText('Parking Lot System').length).toBeGreaterThanOrEqual(1);
    });
  });
});
