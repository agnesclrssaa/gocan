import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

const ALLOWED_SIGNUP_ROLES = ['customer', 'canteen', 'runner'];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Gunakan ref untuk melacak user ID aktif guna mencegah race condition
  const activeUserIdRef = useRef(null);

  // Normalisasi data profil:
  // - Customer dan Admin default 'approved'
  // - Canteen dan Runner HANYA 'approved' jika eksplisit berstatus 'approved'
  // - Status tidak dikenal, null, atau selain 'approved' ditafsirkan sebagai 'pending'/'rejected'
  const normalizeProfile = useCallback((data) => {
    if (!data) return null;
    let effectiveStatus;

    if (data.role === 'customer' || data.role === 'admin') {
      effectiveStatus = 'approved';
    } else if (data.role === 'canteen' || data.role === 'runner') {
      if (data.approval_status === 'approved') {
        effectiveStatus = 'approved';
      } else if (data.approval_status === 'rejected') {
        effectiveStatus = 'rejected';
      } else {
        effectiveStatus = 'pending';
      }
    } else {
      effectiveStatus = 'pending';
    }

    return {
      ...data,
      approval_status: effectiveStatus,
    };
  }, []);

  // Ambil profil lengkap dari tabel profiles berdasarkan ID user
  const fetchProfile = useCallback(
    async (userId, retryCount = 1) => {
      if (!userId) {
        setProfile(null);
        setLoading(false);
        return null;
      }

      try {
        activeUserIdRef.current = userId;
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.warn('Gagal query profiles:', error.message);
          throw error;
        }

        // Jika data belum ada (misal trigger Supabase belum selesai insert)
        if (!data && retryCount > 0) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          return await fetchProfile(userId, retryCount - 1);
        }

        if (activeUserIdRef.current === userId) {
          const normalized = normalizeProfile(data);
          setProfile(normalized);
          setAuthError(null);
          return normalized;
        }
        return null;
      } catch (err) {
        console.error('Gagal mengambil data profil:', err.message || err);
        if (activeUserIdRef.current === userId) {
          setAuthError(err.message || 'Gagal memuat profil pengguna.');
          setProfile(null);
        }
        return null;
      } finally {
        if (activeUserIdRef.current === userId) {
          setLoading(false);
        }
      }
    },
    [normalizeProfile]
  );

  // Fungsi reload profile manual
  const refreshProfile = useCallback(async () => {
    if (!user) return null;
    setLoading(true);
    return await fetchProfile(user.id, 0);
  }, [user, fetchProfile]);

  useEffect(() => {
    let isMounted = true;
    let profileChannel = null;

    // Helper untuk memasang Realtime listener pada baris profil user yang sedang aktif
    const subscribeToProfileChanges = (userId) => {
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
        profileChannel = null;
      }

      if (!userId) return;

      profileChannel = supabase
        .channel(`realtime:profile:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            if (payload.new && isMounted && activeUserIdRef.current === userId) {
              const updated = normalizeProfile(payload.new);
              setProfile(updated);
            }
          }
        )
        .subscribe();
    };

    // Inisialisasi session pertama kali
    const initAuth = async () => {
      try {
        setLoading(true);
        const {
          data: { session },
          error: sessionErr,
        } = await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;

        const currentUser = session?.user ?? null;
        if (!isMounted) return;

        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
          subscribeToProfileChanges(currentUser.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Inisialisasi sesi gagal:', err.message || err);
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listener realtime auth state change (login, logout, token refreshed)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (event === 'SIGNED_OUT' || !currentUser) {
        activeUserIdRef.current = null;
        setProfile(null);
        setLoading(false);
        if (profileChannel) {
          supabase.removeChannel(profileChannel);
          profileChannel = null;
        }
      } else if (
        event === 'SIGNED_IN' ||
        event === 'USER_UPDATED' ||
        event === 'TOKEN_REFRESHED'
      ) {
        await fetchProfile(currentUser.id);
        subscribeToProfileChanges(currentUser.id);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
      }
    };
  }, [fetchProfile, normalizeProfile]);

  // Fungsi Register yang aman:
  // - Menolak role 'admin' dari form registrasi publik
  // - Hanya menerima role customer, canteen, atau runner
  // - Mengisi metadata approval_status yang sesuai
  const signUp = async ({ email, password, name, phone, role }) => {
    const sanitizedRole = ALLOWED_SIGNUP_ROLES.includes(role) ? role : 'customer';
    const initialApproval = sanitizedRole === 'customer' ? 'approved' : 'pending';

    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          full_name: name,
          phone,
          phone_number: phone,
          role: sanitizedRole,
          approval_status: initialApproval,
        },
      },
    });
  };

  // Fungsi Login:
  // - Melakukan sign in dengan password
  // - Langsung mengambil profile terverifikasi dari database sebelum return
  // - Mengembalikan { data, error, profile } untuk routing yang instan & aman
  const signIn = async ({ email, password }) => {
    setLoading(true);
    setAuthError(null);

    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) {
      setLoading(false);
      return { ...result, profile: null };
    }

    if (result.data?.user) {
      setUser(result.data.user);
      const userProfile = await fetchProfile(result.data.user.id);
      return { ...result, profile: userProfile };
    }

    setLoading(false);
    return { ...result, profile: null };
  };

  const signOut = async () => {
    activeUserIdRef.current = null;
    setUser(null);
    setProfile(null);
    setAuthError(null);
    return supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        authError,
        signUp,
        signIn,
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
