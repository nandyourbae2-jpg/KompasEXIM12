import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Badge from './Badge';

describe('Badge Component', () => {
  it('renders default badge when no matching type/value', () => {
    render(<Badge type="unknown" value="TestValue" />);
    const badge = screen.getByText('TestValue');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle('background-color: var(--color-surface-chip-translucent)');
    expect(badge).toHaveStyle('color: var(--color-ink)');
  });

  describe('priority type', () => {
    it('renders Rendah priority correctly', () => {
      render(<Badge type="priority" value="Rendah" />);
      const badge = screen.getByText('Rendah');
      expect(badge).toHaveStyle('background-color: var(--color-status-neutral-bg)');
    });

    it('renders Sedang priority correctly', () => {
      render(<Badge type="priority" value="Sedang" />);
      const badge = screen.getByText('Sedang');
      expect(badge).toHaveStyle('background-color: var(--color-status-info-bg)');
    });

    it('renders Tinggi priority correctly', () => {
      render(<Badge type="priority" value="Tinggi" />);
      const badge = screen.getByText('Tinggi');
      expect(badge).toHaveStyle('background-color: var(--color-status-warning-bg)');
    });

    it('renders Kritis priority correctly', () => {
      render(<Badge type="priority" value="Kritis" />);
      const badge = screen.getByText('Kritis');
      expect(badge).toHaveStyle('background-color: var(--color-status-danger-bg)');
    });
  });

  describe('department type', () => {
    it('renders Import department correctly', () => {
      render(<Badge type="department" value="Import" />);
      const badge = screen.getByText('Import');
      expect(badge).toHaveStyle('background-color: var(--color-status-info-bg)');
    });

    it('renders Export department correctly', () => {
      render(<Badge type="department" value="Export" />);
      const badge = screen.getByText('Export');
      expect(badge).toHaveStyle('background-color: var(--color-status-success-bg)');
    });

    it('renders AE department correctly', () => {
      render(<Badge type="department" value="Administrasi Export (AE)" />);
      const badge = screen.getByText('Administrasi Export (AE)');
      expect(badge).toHaveStyle('background-color: var(--color-status-warning-bg)');
    });
    
    it('renders Account Officer department correctly', () => {
      render(<Badge type="department" value="Account Officer" />);
      const badge = screen.getByText('Account Officer');
      expect(badge).toHaveStyle('background-color: var(--color-status-neutral-bg)');
    });
  });

  describe('sumber_tugas type', () => {
    it('renders System correctly', () => {
      render(<Badge type="sumber_tugas" value="System" />);
      expect(screen.getByText('System')).toHaveStyle('background-color: var(--color-status-warning-bg)');
    });
    
    it('renders Manual correctly', () => {
      render(<Badge type="sumber_tugas" value="Manual" />);
      expect(screen.getByText('Manual')).toHaveStyle('background-color: var(--color-status-success-bg)');
    });

    it('renders Escalation correctly', () => {
      render(<Badge type="sumber_tugas" value="Escalation" />);
      expect(screen.getByText('Escalation')).toHaveStyle('background-color: var(--color-status-danger-bg)');
    });
  });

  describe('docstatus type', () => {
    it('renders Tervalidasi correctly', () => {
      render(<Badge type="docstatus" value="Tervalidasi" />);
      expect(screen.getByText('Tervalidasi')).toHaveStyle('background-color: var(--color-status-success-bg)');
    });

    it('renders Menunggu Validasi correctly', () => {
      render(<Badge type="docstatus" value="Menunggu Validasi" />);
      expect(screen.getByText('Menunggu Validasi')).toHaveStyle('background-color: var(--color-status-warning-bg)');
    });

    it('renders Kadaluarsa correctly', () => {
      render(<Badge type="docstatus" value="Kadaluarsa" />);
      expect(screen.getByText('Kadaluarsa')).toHaveStyle('background-color: var(--color-status-danger-bg)');
    });
  });

  describe('paymentstatus type', () => {
    it('renders Lunas correctly', () => {
      render(<Badge type="paymentstatus" value="Lunas" />);
      expect(screen.getByText('Lunas')).toHaveStyle('background-color: var(--color-status-success-bg)');
    });

    it('renders Parsial correctly', () => {
      render(<Badge type="paymentstatus" value="Parsial" />);
      expect(screen.getByText('Parsial')).toHaveStyle('background-color: var(--color-status-warning-bg)');
    });

    it('renders Belum Dibayar correctly', () => {
      render(<Badge type="paymentstatus" value="Belum Dibayar" />);
      expect(screen.getByText('Belum Dibayar')).toHaveStyle('background-color: var(--color-status-danger-bg)');
    });
  });

  describe('doctype type', () => {
    it('renders doctype correctly', () => {
      render(<Badge type="doctype" value="PDF" />);
      const badge = screen.getByText('PDF');
      expect(badge).toHaveStyle('background-color: var(--color-canvas-parchment)');
      expect(badge).toHaveStyle('color: var(--color-ink-muted-80)');
    });
  });
});
