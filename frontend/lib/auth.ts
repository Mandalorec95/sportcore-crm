export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'coach' | 'parent';
  orgId?: string;
  coachId?: string;
  parentId?: string;
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem('sportpass_user');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sportpass_token');
}

export function setAuth(token: string, user: User): void {
  localStorage.setItem('sportpass_token', token);
  localStorage.setItem('sportpass_user', JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem('sportpass_token');
  localStorage.removeItem('sportpass_user');
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

export function isCoach(user: User | null): boolean {
  return user?.role === 'coach';
}

export function isParent(user: User | null): boolean {
  return user?.role === 'parent';
}
