import { getDummyUsers } from '../store/useAuthStore';

export const getUserName = (id) => {
  if (!id) return 'Unknown';
  const users = getDummyUsers();
  const user = users.find(u => u.id === id);
  return user ? user.name : 'Unknown';
};

export const getUserDetails = (id) => {
  if (!id) return null;
  const users = getDummyUsers();
  return users.find(u => u.id === id) || null;
};
