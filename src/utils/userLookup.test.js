import { describe, it, expect, vi } from 'vitest';
import { getUserName, getUserDetails } from './userLookup';
import useAuthStore from '../store/useAuthStore';

// Mock the store
vi.mock('../store/useAuthStore', () => {
  return {
    default: {
      getState: vi.fn(),
    }
  };
});

describe('userLookup utility', () => {
  const mockUsers = [
    { id: 1, name: 'John Doe', role: 'Admin' },
    { id: 2, nama: 'Jane Doe', role: 'Staff' }
  ];

  it('getUserName should return "Unknown" if id is not provided', () => {
    expect(getUserName(null)).toBe('Unknown');
    expect(getUserName(undefined)).toBe('Unknown');
  });

  it('getUserName should return the name or nama of the user', () => {
    useAuthStore.getState.mockReturnValue({ allUsers: mockUsers });
    
    expect(getUserName(1)).toBe('John Doe');
    expect(getUserName(2)).toBe('Jane Doe');
  });

  it('getUserName should return "Unknown" if user is not found', () => {
    useAuthStore.getState.mockReturnValue({ allUsers: mockUsers });
    
    expect(getUserName(99)).toBe('Unknown');
  });

  it('getUserName should handle missing allUsers gracefully', () => {
    useAuthStore.getState.mockReturnValue({});
    expect(getUserName(1)).toBe('Unknown');
  });

  it('getUserDetails should return null if id is not provided', () => {
    expect(getUserDetails(null)).toBeNull();
  });

  it('getUserDetails should return the user object if found', () => {
    useAuthStore.getState.mockReturnValue({ allUsers: mockUsers });
    expect(getUserDetails(1)).toEqual(mockUsers[0]);
  });

  it('getUserDetails should return null if user is not found', () => {
    useAuthStore.getState.mockReturnValue({ allUsers: mockUsers });
    expect(getUserDetails(99)).toBeNull();
  });
});
