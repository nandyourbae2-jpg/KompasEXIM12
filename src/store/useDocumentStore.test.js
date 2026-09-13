import { describe, it, expect, vi, beforeEach } from 'vitest';
import useDocumentStore from './useDocumentStore';
import api from '../lib/api';

vi.mock('../lib/api', () => ({
  default: vi.fn(),
}));

describe('useDocumentStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDocumentStore.setState({
      documents: [],
      customDocumentTypes: [],
      isLoading: false,
      error: null,
    });
  });

  describe('fetchDocuments', () => {
    it('should fetch and normalize documents successfully', async () => {
      const mockData = [{ id: 1, nama_file: 'doc1.pdf', tipe: 'Invoice', versi: 1 }];
      api.mockResolvedValueOnce(mockData);

      await useDocumentStore.getState().fetchDocuments();

      expect(api).toHaveBeenCalledWith('/documents');
      const docs = useDocumentStore.getState().documents;
      expect(docs).toHaveLength(1);
      expect(docs[0].id).toBe(1);
      expect(docs[0].fileName).toBe('doc1.pdf');
      expect(docs[0].version).toBe('v1');
    });

    it('should handle fetch errors', async () => {
      api.mockRejectedValueOnce(new Error('Fetch failed'));

      await useDocumentStore.getState().fetchDocuments();

      expect(useDocumentStore.getState().error).toBe('Fetch failed');
      expect(useDocumentStore.getState().isLoading).toBe(false);
    });
  });

  describe('uploadDocument', () => {
    it('should upload document successfully', async () => {
      const mockDoc = { id: 2, nama_file: 'new.pdf', versi: 1 };
      api.mockResolvedValueOnce({ document: mockDoc });

      const file = new File([''], 'new.pdf', { type: 'application/pdf' });
      const docData = { type: 'Invoice', department: 'Import' };
      const currentUser = { id: 5 };

      const result = await useDocumentStore.getState().uploadDocument(docData, file, currentUser);

      expect(api).toHaveBeenCalledWith('/documents', expect.objectContaining({ method: 'POST' }));
      expect(result.id).toBe(2);
      expect(result.uploadedById).toBe(5);
      
      const docs = useDocumentStore.getState().documents;
      expect(docs).toHaveLength(1);
      expect(docs[0].id).toBe(2);
    });

    it('should throw error on fail', async () => {
      api.mockRejectedValueOnce(new Error('Upload failed'));

      await expect(useDocumentStore.getState().uploadDocument({}, null, {})).rejects.toThrow('Upload failed');
      expect(useDocumentStore.getState().error).toBe('Upload failed');
    });
  });

  describe('deleteDocument', () => {
    it('should delete document successfully', async () => {
      useDocumentStore.setState({ documents: [{ id: 1, dbId: 1, isDeleted: false }, { id: 2, dbId: 2, isDeleted: false }] });
      api.mockResolvedValueOnce({});

      await useDocumentStore.getState().deleteDocument(1);

      expect(api).toHaveBeenCalledWith('/documents/1', { method: 'DELETE' });
      const docs = useDocumentStore.getState().documents;
      expect(docs).toHaveLength(1);
      expect(docs[0].id).toBe(2);
    });

    it('should handle error and rollback optimistic update', async () => {
      useDocumentStore.setState({ documents: [{ id: 1, dbId: 1, isDeleted: false }] });
      api.mockRejectedValueOnce(new Error('Delete failed'));

      await useDocumentStore.getState().deleteDocument(1);

      const docs = useDocumentStore.getState().documents;
      expect(docs).toHaveLength(1);
      expect(docs[0].isDeleted).toBe(false);
      expect(useDocumentStore.getState().error).toBe('Delete failed');
    });
  });

  describe('custom document types', () => {
    it('should fetch types successfully', async () => {
      api.mockResolvedValueOnce({ documentTypes: [{ id: 1, name: 'Type A' }] });
      
      await useDocumentStore.getState().fetchCustomDocumentTypes();

      expect(useDocumentStore.getState().customDocumentTypes).toHaveLength(1);
      expect(useDocumentStore.getState().customDocumentTypes[0].name).toBe('Type A');
    });
    
    it('should add type successfully', async () => {
      const newType = { id: 2, name: 'Type B' };
      api.mockResolvedValueOnce(newType);

      await useDocumentStore.getState().addCustomDocumentType({ name: 'Type B' });

      expect(api).toHaveBeenCalledWith('/document-types', expect.objectContaining({ method: 'POST' }));
      expect(useDocumentStore.getState().customDocumentTypes).toContainEqual(newType);
    });

    it('should update type successfully', async () => {
      useDocumentStore.setState({ customDocumentTypes: [{ id: 1, name: 'Old' }] });
      api.mockResolvedValueOnce({ id: 1, name: 'New' });

      await useDocumentStore.getState().updateDocumentType(1, { name: 'New' });

      expect(useDocumentStore.getState().customDocumentTypes[0].name).toBe('New');
    });

    it('should delete type successfully', async () => {
      useDocumentStore.setState({ customDocumentTypes: [{ id: 1 }, { id: 2 }] });
      api.mockResolvedValueOnce({});

      await useDocumentStore.getState().deleteDocumentType(1);

      expect(useDocumentStore.getState().customDocumentTypes).toHaveLength(1);
      expect(useDocumentStore.getState().customDocumentTypes[0].id).toBe(2);
    });
  });
});
