import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, AUTH_TOKEN_KEY } from '../lib/api';

const AuthContext = createContext({});

const normalizeProfile = (user) => {
  if (!user) return null;

  const approvalStatus =
    user.role === 'customer' || user.role === 'admin'
      ? 'approved'
      : (user.approval_status ?? user.approvalStatus) === 'approved'
        ? 'approved'
        : (user.approval_status ?? user.approvalStatus) === 'rejected'
          ? 'rejected'
          : 'pending';

  return { ...user, approval_status: approvalStatus };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const applySession = useCallback((session) => {
    if (!session?.token || !session.user) {
      throw new Error('Respons autentikasi dari server tidak lengkap.');
    }

    localStorage.setItem(AUTH_TOKEN_KEY, session.token);
    setUser(session.user);
    setProfile(normalizeProfile(session.user));
    setAuthError(null);
    setLoading(false);
    return normalizeProfile(session.user);
  }, []);

  const register = useCallback(
    async ({ name, email, password, role }) => {
      setLoading(true);
      setAuthError(null);
      try {
        const session = await api.post('/auth/register', { name, email, password, role });
        applySession(session);
        return session;
      } finally {
        setLoading(false);
      }
    },
    [applySession]
  );

  const login = useCallback(
    async ({ email, password }) => {
      setLoading(true);
      setAuthError(null);
      try {
        const session = await api.post('/auth/login', { email, password });
        const normalizedProfile = applySession(session);
        return { ...session, profile: normalizedProfile };
      } finally {
        setLoading(false);
      }
    },
    [applySession]
  );

  const fetchProfile = useCallback(async () => {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return null;
    }

    try {
      const { user: currentUser } = await api.get('/auth/me');
      setUser(currentUser);
      const currentProfile = normalizeProfile(currentUser);
      setProfile(currentProfile);
      setAuthError(null);
      return currentProfile;
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
        setProfile(null);
      }
      setAuthError(error.message || 'Gagal memuat profil pengguna.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    return fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
        setLoading(false);
        return;
      }

      try {
        const { user: currentUser } = await api.get('/auth/me');
        if (active) {
          setUser(currentUser);
          setProfile(normalizeProfile(currentUser));
          setAuthError(null);
        }
      } catch (error) {
        if (error.status === 401) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
        }
        if (active) {
          setUser(null);
          setProfile(null);
          setAuthError(error.message || 'Gagal memulihkan sesi pengguna.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setProfile(null);
    setAuthError(null);
    setLoading(false);
    return { error: null };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        authError,
        register,
        login,
        signUp: register,
        signIn: login,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
