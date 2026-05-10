import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getMe()
        .then(({ data }) => { setUser(data.user); setSubscription(data.subscription); })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    if (data.subscription) setSubscription(data.subscription);
    return data.user;
  };

  const loginWithGoogle = async (credential) => {
    const { data } = await authAPI.googleAuth(credential);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    if (data.subscription) setSubscription(data.subscription);
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setSubscription(null);
  };

  const isPremium = subscription?.plan === 'premium';

  return (
    <AuthContext.Provider value={{ user, subscription, loading, login, loginWithGoogle, register, logout, isPremium, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
