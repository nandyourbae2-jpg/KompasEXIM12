import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import useAuthStore from '../store/useAuthStore';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      error: null,
      isLoading: false
    });
  });

  const setup = () => {
    return render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
  };

  it('renders 3 pilihan tipe akses', () => {
    setup();
    const tipeAksesSelect = screen.getByLabelText(/Tipe Akses/i);
    expect(tipeAksesSelect).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Staff Departemen' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Supervisor' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Manager' })).toBeInTheDocument();
  });

  it('shows departemen dropdown when Staff Departemen is selected', () => {
    setup();
    const tipeAksesSelect = screen.getByLabelText(/Tipe Akses/i);
    fireEvent.change(tipeAksesSelect, { target: { value: 'Staff Departemen' } });
    expect(screen.getByLabelText(/Departemen/i)).toBeInTheDocument();
  });

  it('hides departemen dropdown when Manager is selected', () => {
    setup();
    const tipeAksesSelect = screen.getByLabelText(/Tipe Akses/i);
    fireEvent.change(tipeAksesSelect, { target: { value: 'Manager' } });
    expect(screen.queryByLabelText(/Departemen/i)).not.toBeInTheDocument();
  });

  it('shows validation error if Staff submits without department', async () => {
    setup();
    const tipeAksesSelect = screen.getByLabelText(/Tipe Akses/i);
    fireEvent.change(tipeAksesSelect, { target: { value: 'Staff Departemen' } });
    
    // Leaving department empty
    const employeeIdInput = screen.getByLabelText(/Employee ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    
    fireEvent.change(employeeIdInput, { target: { value: 'EXIM-IMP-01' } });
    fireEvent.change(passwordInput, { target: { value: '123456' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Masuk Sekarang/i }));
    
    expect(await screen.findByText('Departemen wajib dipilih.')).toBeInTheDocument();
  });

  it('redirects to /workspace/tasks for Staff Dept on successful login', async () => {
    setup();
    
    const loginMock = vi.fn().mockResolvedValue({ level_otoritas: 'Staff Dept' });
    useAuthStore.setState({ login: loginMock });

    fireEvent.change(screen.getByLabelText(/Tipe Akses/i), { target: { value: 'Staff Departemen' } });
    fireEvent.change(screen.getByLabelText(/Departemen/i), { target: { value: 'Import' } });
    fireEvent.change(screen.getByLabelText(/Employee ID/i), { target: { value: 'EMP' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'pass' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Masuk Sekarang/i }));
    
    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('EMP', 'pass', { tipeAkses: 'Staff Departemen', departemen: 'Import' });
    });
    expect(mockNavigate).toHaveBeenCalledWith('/workspace/tasks');
  });

  it('redirects to /workspace/spv-import/dashboard for SPV on successful login', async () => {
    setup();
    
    const loginMock = vi.fn().mockResolvedValue({ level_otoritas: 'Supervisor' });
    useAuthStore.setState({ login: loginMock });

    fireEvent.change(screen.getByLabelText(/Tipe Akses/i), { target: { value: 'Supervisor' } });
    fireEvent.change(screen.getByLabelText(/Departemen/i), { target: { value: 'Import' } });
    fireEvent.change(screen.getByLabelText(/Employee ID/i), { target: { value: 'SPV-01' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Masuk Sekarang/i }));
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/workspace/spv-import/dashboard');
    });
  });

  it('redirects to /workspace/manager for Manager on successful login', async () => {
    setup();
    
    const loginMock = vi.fn().mockResolvedValue({ level_otoritas: 'Manager' });
    useAuthStore.setState({ login: loginMock });

    fireEvent.change(screen.getByLabelText(/Tipe Akses/i), { target: { value: 'Manager' } });
    // No departemen for Manager
    fireEvent.change(screen.getByLabelText(/Employee ID/i), { target: { value: 'MGR' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'pass' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Masuk Sekarang/i }));
    
    await waitFor(() => {
      expect(loginMock).toHaveBeenCalled();
    });
    expect(mockNavigate).toHaveBeenCalledWith('/workspace/manager');
  });

  it('shows error and does not redirect on login failure', async () => {
    setup();
    
    const loginMock = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    useAuthStore.setState({ login: loginMock });

    fireEvent.change(screen.getByLabelText(/Tipe Akses/i), { target: { value: 'Manager' } });
    fireEvent.change(screen.getByLabelText(/Employee ID/i), { target: { value: 'MGR' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrong' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Masuk Sekarang/i }));
    
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
