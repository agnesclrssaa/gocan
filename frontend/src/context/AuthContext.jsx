import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, API_AUTH_ERROR_EVENT, AUTH_TOKEN_KEY } from '../lib/api';

const AuthContext = createContext({});

const normalizeProfile = (user) => {
  if (!user) return null;

  const rawApprovalStatus = String(user.approval_status ?? user.approvalStatus ?? '').toLowerCase();
  const approvalStatus =
    user.role === 'customer' || user.role === 'admin'
      ? 'approved'
      : ['approved', 'rejected'].includes(rawApprovalStatus)
        ? rawApprovalStatus
        : 'pending';

  return { ...user, approval_status: approvalStatus };
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [apiNotice, setApiNotice] = useState(null);
  const unauthorizedHandledRef = useRef(false);
  const forbiddenNoticeTimeoutRef = useRef(null);
  const apiNoticeTimeoutRef = useRef(null);

  const showApiNotice = useCallback((message) => {
    window.clearTimeout(apiNoticeTimeoutRef.current);
    setApiNotice({ id: Date.now(), message });
    apiNoticeTimeoutRef.current = window.setTimeout(() => {
      setApiNotice(null);
      apiNoticeTimeoutRef.current = null;
    }, 6000);
  }, []);

  const applySession = useCallback((session) => {
    if (!session?.token || !session.user) {
      throw new Error('Respons autentikasi dari server tidak lengkap.');
    }

    localStorage.setItem(AUTH_TOKEN_KEY, session.token);
    unauthorizedHandledRef.current = false;
    window.clearTimeout(apiNoticeTimeoutRef.current);
    setApiNotice(null);
    setUser(session.user);
    setProfile(normalizeProfile(session.user));
    setAuthError(null);
    setLoading(false);
    return normalizeProfile(session.user);
  }, []);

  const register = useCallback(
    async ({ name, email, password, role, ...runnerProfile }) => {
      setLoading(true);
      setAuthError(null);
      try {
        const session = await api.post('/auth/register', {
          name,
          email,
          password,
          role,
          ...(role === 'runner' ? runnerProfile : {}),
        });
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
        setUser(null);
        setProfile(null);
      } else {
        setAuthError(error.message || 'Gagal memuat profil pengguna.');
      }
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
    const handleApiAuthError = (event) => {
      if (event.detail?.status === 401) {
        if (unauthorizedHandledRef.current) return;
        unauthorizedHandledRef.current = true;

        localStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
        setProfile(null);
        setAuthError(null);
        showApiNotice('Sesi login kamu telah berakhir. Silakan login kembali.');

        if (location.pathname !== '/login' && location.pathname !== '/register') {
          const from = `${location.pathname}${location.search}${location.hash}`;
          navigate('/login', {
            replace: true,
            state: { from },
          });
        }
        return;
      }

      if (event.detail?.status === 403) {
        if (forbiddenNoticeTimeoutRef.current) return;

        showApiNotice('Maaf, kamu tidak memiliki akses untuk menggunakan fitur ini.');
        forbiddenNoticeTimeoutRef.current = window.setTimeout(() => {
          forbiddenNoticeTimeoutRef.current = null;
        }, 6000);
      }
    };

    window.addEventListener(API_AUTH_ERROR_EVENT, handleApiAuthError);
    return () => window.removeEventListener(API_AUTH_ERROR_EVENT, handleApiAuthError);
  }, [location, navigate, showApiNotice]);

  useEffect(
    () => () => {
      window.clearTimeout(apiNoticeTimeoutRef.current);
      window.clearTimeout(forbiddenNoticeTimeoutRef.current);
    },
    []
  );

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
        if (active) {
          setUser(null);
          setProfile(null);
          if (error.status !== 401) {
            setAuthError(error.message || 'Gagal memulihkan sesi pengguna.');
          }
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
    unauthorizedHandledRef.current = false;
    window.clearTimeout(apiNoticeTimeoutRef.current);
    setApiNotice(null);
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
        apiNotice,
        dismissApiNotice: () => setApiNotice(null),
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
