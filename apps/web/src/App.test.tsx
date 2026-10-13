import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  beforeEach(() => {
    // Mock global fetch for health check
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'ok',
            service: 'designkarlo-api',
            uptime: 10,
            environment: 'test',
            database: 'disconnected (standalone mode)',
            timestamp: new Date().toISOString(),
          }),
      })
    );
  });

  it('renders the DesignKarlo header and product title', async () => {
    render(<App />);
    await waitFor(() => {
      const headings = screen.getAllByText(/Design/i);
      expect(headings.length).toBeGreaterThan(0);
      const karloElements = screen.getAllByText(/Karlo/i);
      expect(karloElements.length).toBeGreaterThan(0);
    });
  });

  it('renders the 6-step workflow items', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Choose Problem/i)).toBeInTheDocument();
      expect(screen.getByText(/Design Solution/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Submit' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Receive Feedback' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Revise' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Compare Attempts' })).toBeInTheDocument();
    });
  });
});
