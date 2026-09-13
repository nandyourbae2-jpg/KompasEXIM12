import useAuthStore from '../store/useAuthStore';

export const getUserName = (id) => {
  if (!id) return 'Unknown';
  const users = useAuthStore.getState().allUsers || [];
  const user = users.find(u => u.id === id);
  return user ? user.name || user.nama : 'Unknown';
};

export const getUserDetails = (id) => {
  if (!id) return null;
  const users = useAuthStore.getState().allUsers || [];
  return users.find(u => u.id === id) || null;
};
