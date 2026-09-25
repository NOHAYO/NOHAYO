import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setToken } from "./api/client.js";

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadChildren = useCallback(async () => {
    const list = await api.listChildren();
    setChild(list[0] || null);
    return list;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("nohayo_token");
    const storedUser = localStorage.getItem("nohayo_user");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      loadChildren().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [loadChildren]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setToken(data.token);
    localStorage.setItem("nohayo_user", JSON.stringify(data.user));
    setUser(data.user);
    await loadChildren();
  };

  const signup = async (email, password, name) => {
    const data = await api.signup(email, password, name);
    setToken(data.token);
    localStorage.setItem("nohayo_user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("nohayo_user");
    setUser(null);
    setChild(null);
  };

  return (
    <AppCtx.Provider value={{ user, child, setChild, loading, login, signup, logout, reloadChildren: loadChildren }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  return useContext(AppCtx);
}
