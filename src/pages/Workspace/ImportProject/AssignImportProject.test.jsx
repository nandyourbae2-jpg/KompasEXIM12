import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AssignImportProject from './AssignImportProject';
import useImportProjectStore from '../../../store/useImportProjectStore';
import useDocumentStore from '../../../store/useDocumentStore';

// Mock stores
vi.mock('../../../store/useImportProjectStore');
vi.mock('../../../store/useDocumentStore');

describe('AssignImportProject Integration', () => {
  const mockAddImportProject = vi.fn().mockResolvedValue({ id: 'IMP-0001' });
  const mockUpdateImportProject = vi.fn().mockResolvedValue({ id: 'IMP-0001' });

  beforeEach(() => {
    vi.clearAllMocks();

    useImportProjectStore.mockReturnValue({
      importProjects: [],
      addImportProject: mockAddImportProject,
      updateImportProject: mockUpdateImportProject,
      fetchImportProjects: vi.fn(),
    });

    useDocumentStore.mockReturnValue({
      documents: [
        { id: 'DOC-01', nama_dokumen: 'Invoice' },
        { id: 'DOC-02', nama_dokumen: 'Packing List' }
      ],
      fetchDocuments: vi.fn(),
    });
  });

  const setup = () => render(<AssignImportProject />);

  it('renders with required fields', () => {
    setup();
    expect(screen.getByLabelText(/Supplier/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Import Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ETA/i)).toBeInTheDocument();
  });

  it('shows error if submitted without Supplier', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Simpan & Terbitkan/i }));
    
    expect(await screen.findByText('Supplier wajib diisi')).toBeInTheDocument();
  });

  it('shows error if submitted without ETA', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Simpan & Terbitkan/i }));
    
    expect(await screen.findByText('ETA wajib diisi')).toBeInTheDocument();
  });
  
  it('shows error if submitted without Document Requirements', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Simpan & Terbitkan/i }));
    
    expect(await screen.findByText('Pilih minimal 1 Document Requirements')).toBeInTheDocument();
  });

  it('submits successfully when complete and displays in table', async () => {
    setup();

    fireEvent.change(screen.getByLabelText(/Supplier/i), { target: { value: 'Global Tech' } });
    fireEvent.change(screen.getByLabelText(/Trade/i), { target: { value: 'International' } });
    fireEvent.change(screen.getByLabelText(/Shipment Term/i), { target: { value: 'FOB' } });
    fireEvent.change(screen.getByLabelText(/Invoice No/i), { target: { value: 'INV-123' } });
    fireEvent.change(screen.getByLabelText(/Bill of Lading No/i), { target: { value: 'BOL-123' } });
    fireEvent.change(screen.getByLabelText(/ETD/i), { target: { value: '2023-10-01' } });
    fireEvent.change(screen.getByLabelText(/ETA/i), { target: { value: '2023-10-15' } });
    fireEvent.change(screen.getByLabelText(/HS Code/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText(/Free Time Destination/i), { target: { value: '14 Days' } });
    
    // Select one document requirement
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByRole('button', { name: /Simpan & Terbitkan/i }));

    await waitFor(() => {
      expect(mockAddImportProject).toHaveBeenCalledWith(expect.objectContaining({
        supplier: 'Global Tech',
        eta: '2023-10-15'
      }));
    });
    
    // Check if success banner appears (savedId = IMP-0001)
    expect(await screen.findByText(/Berhasil Disimpan!/i)).toBeInTheDocument();
  });

  it('maintains original ID when editing an existing project', async () => {
    useImportProjectStore.mockReturnValue({
      importProjects: [
        { 
          id: 'IMP-9999', 
          supplier: 'Old Supplier',
          trade: 'Old Trade',
          importType: 'Raw Material',
          shipmentTerm: 'FOB',
          invoiceNo: '123',
          billOfLadingNo: '123',
          etd: '2023-01-01',
          eta: '2023-01-02',
          hsCode: '000',
          freeTimeDestination: '7',
          documentRequirements: ['DOC-01'],
          status: 'Pending'
        }
      ],
      addImportProject: mockAddImportProject,
      updateImportProject: mockUpdateImportProject,
      fetchImportProjects: vi.fn(),
    });

    setup();
    
    // Click edit button in table
    const editButtons = screen.getAllByRole('button');
    const editBtn = editButtons.find(b => b.innerHTML.includes('Edit3') || b.querySelector('svg'));
    // Since lucide-react Edit3 is mocked/rendered, we find by parent container or we just fireEvent click on the specific button.
    // Let's use getByTestId if we add one, or click the edit button (first button in the row).
    // The Edit3 button is rendered inside a td.
    // It's the only button in the row except for delete if there is one. We can just use the second button (first is Simpan).
    fireEvent.click(editButtons[1]); // The edit button in table

    // Check if form is populated
    expect(screen.getByLabelText(/Supplier/i).value).toBe('Old Supplier');

    fireEvent.change(screen.getByLabelText(/Supplier/i), { target: { value: 'New Supplier' } });
    
    // Select document requirement if not selected
    fireEvent.click(screen.getByRole('button', { name: /Simpan Perubahan/i }));

    await waitFor(() => {
      expect(mockUpdateImportProject).toHaveBeenCalledWith('IMP-9999', expect.objectContaining({
        supplier: 'New Supplier'
      }));
    });
  });
});
