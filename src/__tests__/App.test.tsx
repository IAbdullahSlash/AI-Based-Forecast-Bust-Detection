import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Dashboard Component', () => {
  it('renders the header title and demo status without crashing', () => {
    render(<App />);

    expect(screen.getByText('AI Forecast Bust Detection')).toBeInTheDocument();
    expect(screen.getByText(/Demo Mode/i)).toBeInTheDocument();
    expect(screen.getByText(/Forecast Confidence & Uncertainty Intelligence/i)).toBeInTheDocument();
  });

  it('renders variable selection buttons for Rainfall, Temperature, Wind, and Pressure', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /Rainfall/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Temperature/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Wind/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pressure/i })).toBeInTheDocument();
  });

  it('renders nationwide summary metrics with all 32 analyzed regions', () => {
    render(<App />);

    expect(screen.getByText('Regions Analyzed')).toBeInTheDocument();
    expect(screen.getByText('32')).toBeInTheDocument();
    expect(screen.getByText('High Confidence')).toBeInTheDocument();
    expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
    expect(screen.getByText('Low Confidence')).toBeInTheDocument();
  });

  it('renders the Export CSV button for intelligence downloads', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
  });
});
