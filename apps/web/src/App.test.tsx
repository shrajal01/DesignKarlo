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
  description: 'Detailed description of parking lot problem and domain boundaries...',
  functionalRequirements: [
    'Support multiple vehicle types',
    'Issue ticket on entry',
    'Calculate fee on exit',
  ],
  nonFunctionalConstraints: [
    'Adhere to SOLID principles',
    'Decouple pricing strategy from lot manager',
  ],
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
      {
        id: 'solid_modularity',
        title: 'Cohesion & Modularity',
        weight: 25,
        description: 'Evaluates separation of concerns',
        targetConcepts: ['Single Responsibility', 'Strategy Interfaces'],
      },
    ],
  },
  starterTemplate: {
    problemSlug: 'parking-lot',
    assumptions: ['Multi-floor lot facility with entry/exit gates.'],
    entities: [
      {
        name: 'ParkingLot',
        type: 'class',
        responsibilities: ['Coordinates parking facility'],
        attributes: ['id: string'],
        methods: ['parkVehicle(): Ticket'],
      },
      {
        name: 'ParkingSpot',
        type: 'class',
        responsibilities: ['Maintains individual spot state'],
        attributes: ['spotId: string'],
        methods: ['vacate(): void'],
      },
    ],
    relationships: [{ source: 'ParkingLot', target: 'ParkingSpot', type: 'has_many' }],
    designPatterns: [],
    edgeCasesConsidered: ['Full lot capacity condition'],
  },
  sampleSolution: {
    problemSlug: 'parking-lot',
    assumptions: [
      'Multi-floor lot facility with entry/exit gates.',
      'Hourly rate tiers by vehicle classification.',
    ],
    entities: [
      {
        name: 'ParkingLot',
        type: 'class',
        responsibilities: ['Facade coordinating floors and assignment algorithms'],
        attributes: ['id: string', 'assignmentStrategy: SpotAssignmentStrategy'],
        methods: ['processEntry(): Ticket'],
      },
      {
        name: 'ParkingSpot',
        type: 'class',
        responsibilities: ['Maintains individual spot state and occupancy'],
        attributes: ['spotId: string', 'isOccupied: boolean'],
        methods: ['vacate(): void'],
      },
      {
        name: 'SpotAssignmentStrategy',
        type: 'interface',
        responsibilities: ['Contract for pluggable spot search algorithm'],
        attributes: [],
        methods: ['findSpot(): ParkingSpot'],
      },
      {
        name: 'FeeCalculationStrategy',
        type: 'interface',
        responsibilities: ['Contract for duration-based fee calculation'],
        attributes: [],
        methods: ['calculateFee(): number'],
      },
    ],
    relationships: [
      { source: 'ParkingLot', target: 'ParkingSpot', type: 'has_many' },
      { source: 'ParkingLot', target: 'SpotAssignmentStrategy', type: 'uses' },
      { source: 'ParkingLot', target: 'FeeCalculationStrategy', type: 'uses' },
    ],
    designPatterns: [
      {
        patternName: 'Strategy Pattern',
        targetEntity: 'SpotAssignmentStrategy',
        justification: 'Decouples search algorithm',
      },
    ],
    edgeCasesConsidered: ['Full lot capacity condition', 'Concurrent gate entry collision'],
  },
};

describe('DesignKarlo Frontend App', () => {
  let attemptState = {
    id: 'att_test_1',
    problemSlug: 'parking-lot',
    anonymousUserId: 'anon_test',
    status: 'in_progress',
    currentRevisionNumber: 0,
    submissions: [] as any[],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let submissionCount = 0;

  beforeEach(() => {
    window.scrollTo = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    submissionCount = 0;
    attemptState = {
      id: 'att_test_1',
      problemSlug: 'parking-lot',
      anonymousUserId: 'anon_test',
      status: 'in_progress',
      currentRevisionNumber: 0,
      submissions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, init?: RequestInit) => {
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
        if (url.includes('/api/attempts') && url.includes('/submissions') && init?.method === 'POST') {
          submissionCount++;
          const newSubmission = {
            id: `sub_test_${submissionCount}`,
            attemptId: 'att_test_1',
            revisionNumber: submissionCount,
            design: mockProblemDetail.starterTemplate,
            evaluation: {
              id: 'eval_1',
              submissionId: `sub_test_${submissionCount}`,
              overallScore: 84,
              criterionScores: [
                {
                  criterionId: 'domain_entities',
                  score: 21,
                  maxScore: 25,
                  rating: 'Good',
                  summary: 'Core entities clearly defined',
                },
              ],
              feedbackItems: [
                {
                  id: 'fb_1',
                  criterionId: 'domain_entities',
                  type: 'strength',
                  priority: 'medium',
                  title: 'Clean class boundaries',
                  evidence: 'ParkingLot delegates appropriately',
                  impact: 'High cohesion',
                  suggestion: 'Add strategy interfaces',
                },
              ],
              rubricSummary: 'Strong foundation',
            },
            submittedAt: new Date().toISOString(),
          };
          attemptState.submissions.push(newSubmission);
          attemptState.currentRevisionNumber = submissionCount;

          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'x-persistence-mode': 'in-memory' }),
            json: () =>
              Promise.resolve({
                success: true,
                data: newSubmission,
                meta: { persistenceMode: 'in-memory' },
              }),
          });
        }
        if (url.includes('/api/attempts')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'x-persistence-mode': 'in-memory' }),
            json: () =>
              Promise.resolve({
                success: true,
                data: attemptState,
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
      const practiceBtns = screen.getAllByText(/Start Practice Session/i);
      expect(practiceBtns.length).toBeGreaterThanOrEqual(1);
      const attemptBtns = screen.getAllByText(/Start Attempt/i);
      expect(attemptBtns.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('1. "Start Practice Session" opens the problem briefing screen without opening the editor', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<App />);

    let practiceBtns: HTMLElement[] = [];
    await waitFor(() => {
      practiceBtns = screen.getAllByText(/Start Practice Session/i);
      expect(practiceBtns.length).toBeGreaterThan(0);
    });

    fireEvent.click(practiceBtns[0]);

    await waitFor(() => {
      // Briefing screen is displayed
      expect(screen.getByTestId('problem-briefing-screen')).toBeInTheDocument();
      expect(screen.getByText(/Problem Briefing/i)).toBeInTheDocument();
      expect(screen.getByText(/Functional Requirements/i)).toBeInTheDocument();
      expect(screen.getByText(/Architectural & SOLID Constraints/i)).toBeInTheDocument();
      expect(screen.getByText(/Operational Assumptions/i)).toBeInTheDocument();
      expect(screen.getByText(/Edge Cases & Concurrency/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Start Designing/i })).toBeInTheDocument();
      // Editor is NOT opened
      expect(screen.queryByText(/Structure Your Solution/i)).not.toBeInTheDocument();
    });

    // Navigating to the briefing screen must NOT have created an attempt
    const attemptCalls = fetchSpy.mock.calls.filter(([url]) =>
      String(url).includes('/api/attempts') && !String(url).includes('/submissions')
    );
    expect(attemptCalls.length).toBe(0);
  });

  it('2. "Start Designing" on the briefing screen opens the editor for the selected problem', async () => {
    render(<App />);

    let practiceBtns: HTMLElement[] = [];
    await waitFor(() => {
      practiceBtns = screen.getAllByText(/Start Practice Session/i);
      expect(practiceBtns.length).toBeGreaterThan(0);
    });

    fireEvent.click(practiceBtns[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Start Designing/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Start Designing/i }));

    await waitFor(() => {
      expect(screen.getByText(/Structure Your Solution/i)).toBeInTheDocument();
      expect(screen.getByText(/Interactive Design Studio/i)).toBeInTheDocument();
      expect(screen.getByText(/Parking Lot System — Practice Session/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Submit Revision #1 for Evaluation/i })).toBeInTheDocument();
    });
  });

  it('3. "Start Attempt" opens the editor directly without showing the briefing screen', async () => {
    render(<App />);

    let attemptBtns: HTMLElement[] = [];
    await waitFor(() => {
      attemptBtns = screen.getAllByText(/Start Attempt/i);
      expect(attemptBtns.length).toBeGreaterThan(0);
    });

    fireEvent.click(attemptBtns[0]);

    await waitFor(() => {
      // Goes straight to editor
      expect(screen.getByText(/Structure Your Solution/i)).toBeInTheDocument();
      expect(screen.queryByTestId('problem-briefing-screen')).not.toBeInTheDocument();
      expect(screen.getByText(/Parking Lot System — Practice Session/i)).toBeInTheDocument();
    });
  });

  it('4. Both routes preserve the correct problem', async () => {
    // Flow A: Practice Session -> Briefing -> Editor
    const { unmount } = render(<App />);
    let practiceBtns: HTMLElement[] = [];
    await waitFor(() => {
      practiceBtns = screen.getAllByText(/Start Practice Session/i);
      expect(practiceBtns.length).toBeGreaterThan(0);
    });
    fireEvent.click(practiceBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Parking Lot System')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Start Designing/i }));
    await waitFor(() => {
      expect(screen.getByText(/Parking Lot System — Practice Session/i)).toBeInTheDocument();
    });
    unmount();

    // Flow B: Direct Start Attempt -> Editor
    render(<App />);
    let attemptBtns: HTMLElement[] = [];
    await waitFor(() => {
      attemptBtns = screen.getAllByText(/Start Attempt/i);
      expect(attemptBtns.length).toBeGreaterThan(0);
    });
    fireEvent.click(attemptBtns[0]);
    await waitFor(() => {
      expect(screen.getByText(/Parking Lot System — Practice Session/i)).toBeInTheDocument();
    });
  });

  it('5. Load Starter and Load Sample Architecture produce different expected structures', async () => {
    const { container } = render(<App />);

    let attemptBtns: HTMLElement[] = [];
    await waitFor(() => {
      attemptBtns = screen.getAllByText(/Start Attempt/i);
      expect(attemptBtns.length).toBeGreaterThan(0);
    });
    fireEvent.click(attemptBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Structure Your Solution/i)).toBeInTheDocument();
    });

    // Fresh attempt starts with starter template (2 entities: ParkingLot, ParkingSpot)
    expect(container.querySelector('#field-entities-0-name')).toHaveValue('ParkingLot');
    expect(container.querySelector('#field-entities-1-name')).toHaveValue('ParkingSpot');
    expect(screen.queryByDisplayValue('SpotAssignmentStrategy')).not.toBeInTheDocument();

    // Click "Load Sample Architecture"
    const sampleBtn = screen.getByRole('button', { name: /Load Sample Architecture/i });
    fireEvent.click(sampleBtn);

    // Initial draft is unchanged starter, so sample loads directly without unnecessary prompt
    // Now has entities from sample architecture
    await waitFor(() => {
      expect(container.querySelector('#field-entities-2-name')).toHaveValue('SpotAssignmentStrategy');
      expect(container.querySelector('#field-entities-3-name')).toHaveValue('FeeCalculationStrategy');
    });

    // Now click "Load Starter" to switch back to starter structure
    const starterBtn = screen.getByRole('button', { name: /Load Starter/i });
    fireEvent.click(starterBtn);

    // Draft currently contains sample architecture (differs from starter), so confirmation modal appears
    await waitFor(() => {
      expect(screen.getByText(/Load Starter Structure\?/i)).toBeInTheDocument();
      expect(
        screen.getByText(/replace your draft with a basic starting structure/i)
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Confirm & Load Starter/i }));

    // Reset back to minimal 2 entities
    await waitFor(() => {
      expect(screen.queryByDisplayValue('SpotAssignmentStrategy')).not.toBeInTheDocument();
      expect(container.querySelector('#field-entities-0-name')).toHaveValue('ParkingLot');
      expect(container.querySelector('#field-entities-1-name')).toHaveValue('ParkingSpot');
    });
  });

  it('6. Canceling a replacement preserves the existing draft', async () => {
    const { container } = render(<App />);

    let attemptBtns: HTMLElement[] = [];
    await waitFor(() => {
      attemptBtns = screen.getAllByText(/Start Attempt/i);
      expect(attemptBtns.length).toBeGreaterThan(0);
    });
    fireEvent.click(attemptBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Structure Your Solution/i)).toBeInTheDocument();
    });

    // Modify entity name to create distinct user draft
    const entityInput = container.querySelector('#field-entities-0-name') as HTMLInputElement;
    fireEvent.change(entityInput, { target: { value: 'MyCustomParkingFacility' } });

    expect(entityInput).toHaveValue('MyCustomParkingFacility');

    // Trigger Load Sample Architecture
    fireEvent.click(screen.getByRole('button', { name: /Load Sample Architecture/i }));

    // Confirmation modal should appear with specific explanation
    await waitFor(() => {
      expect(screen.getByText(/Load Sample Architecture\?/i)).toBeInTheDocument();
      expect(
        screen.getByText(/replace your draft with a complete example architecture/i)
      ).toBeInTheDocument();
    });

    // Click Cancel
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    // Modal closes and user draft is completely preserved
    await waitFor(() => {
      expect(screen.queryByText(/Load Sample Architecture\?/i)).not.toBeInTheDocument();
      expect(container.querySelector('#field-entities-0-name')).toHaveValue('MyCustomParkingFacility');
    });
  });

  it('7. Confirming a replacement loads the intended structure', async () => {
    const { container } = render(<App />);

    let attemptBtns: HTMLElement[] = [];
    await waitFor(() => {
      attemptBtns = screen.getAllByText(/Start Attempt/i);
      expect(attemptBtns.length).toBeGreaterThan(0);
    });
    fireEvent.click(attemptBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Structure Your Solution/i)).toBeInTheDocument();
    });

    // Modify entity name to dirty the draft
    const entityInput = container.querySelector('#field-entities-0-name') as HTMLInputElement;
    fireEvent.change(entityInput, { target: { value: 'UserCustomEntity' } });

    // Click Load Sample Architecture
    fireEvent.click(screen.getByRole('button', { name: /Load Sample Architecture/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Confirm & Load Sample/i })).toBeInTheDocument();
    });

    // Confirm replacement
    fireEvent.click(screen.getByRole('button', { name: /Confirm & Load Sample/i }));

    // User custom entity is replaced by sample architecture
    await waitFor(() => {
      expect(container.querySelector('#field-entities-0-name')).not.toHaveValue('UserCustomEntity');
      expect(container.querySelector('#field-entities-2-name')).toHaveValue('SpotAssignmentStrategy');
      expect(container.querySelector('#field-entities-3-name')).toHaveValue('FeeCalculationStrategy');
    });
  });

  it('8. Loading either structure does not create a submission or revision', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<App />);

    let attemptBtns: HTMLElement[] = [];
    await waitFor(() => {
      attemptBtns = screen.getAllByText(/Start Attempt/i);
      expect(attemptBtns.length).toBeGreaterThan(0);
    });
    fireEvent.click(attemptBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Structure Your Solution/i)).toBeInTheDocument();
    });

    // Load sample architecture
    fireEvent.click(screen.getByRole('button', { name: /Load Sample Architecture/i }));
    const confirmBtn = screen.queryByRole('button', { name: /Confirm & Load Sample/i });
    if (confirmBtn) {
      fireEvent.click(confirmBtn);
    }

    // Load starter template
    fireEvent.click(screen.getByRole('button', { name: /Load Starter/i }));
    const confirmStarterBtn = screen.queryByRole('button', { name: /Confirm & Load Starter/i });
    if (confirmStarterBtn) {
      fireEvent.click(confirmStarterBtn);
    }

    // Neither loading should have made a POST request to submissions
    const submissionCalls = fetchSpy.mock.calls.filter(
      ([url, init]) => String(url).includes('/submissions') && init?.method === 'POST'
    );
    expect(submissionCalls.length).toBe(0);

    // Must still be in editor on Revision #1
    expect(screen.getAllByText(/Revision #1/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Structure Your Solution/i)).toBeInTheDocument();
  });

  it('9. Existing editor submission, evaluation, and revision functionality remains intact', async () => {
    render(<App />);

    let attemptBtns: HTMLElement[] = [];
    await waitFor(() => {
      attemptBtns = screen.getAllByText(/Start Attempt/i);
      expect(attemptBtns.length).toBeGreaterThan(0);
    });
    fireEvent.click(attemptBtns[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit Revision #1 for Evaluation/i })).toBeInTheDocument();
    });

    // Submit revision #1
    fireEvent.click(screen.getByRole('button', { name: /Submit Revision #1 for Evaluation/i }));

    // Evaluates and transitions to EvaluationView
    await waitFor(() => {
      expect(screen.getByText(/Architectural Scorecard/i)).toBeInTheDocument();
      expect(screen.getByText('84')).toBeInTheDocument();
      expect(screen.getByText(/Clean class boundaries/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Revise Solution \(Attempt Revision #2\)/i })
      ).toBeInTheDocument();
    });

    // Click revise
    fireEvent.click(screen.getByRole('button', { name: /Revise Solution \(Attempt Revision #2\)/i }));

    // Back in editor on Revision #2
    await waitFor(() => {
      expect(screen.getAllByText(/Revision #2/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Structure Your Solution/i)).toBeInTheDocument();
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
