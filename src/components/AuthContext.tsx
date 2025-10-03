// AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signup,
  login,
  changePassword,
  refreshToken,
} from "../auth/auth-direct";

type User = { id: string; email: string; name: string, phone: number } | null;

interface AuthContextType {
  user: User;
  accessToken: string | null;
  refreshToken: string | null;
  signupFn: (email: string, password: string, name: string) => Promise<void>;
  loginFn: (email: string, password: string) => Promise<void>;
  logoutFn: () => void;

}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTk, setRefreshTk] = useState<string | null>(null);

  // Load from storage on init
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedAccess = localStorage.getItem("accessToken");
    const savedRefresh = localStorage.getItem("refreshToken");

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedAccess) setAccessToken(savedAccess);
    if (savedRefresh) setRefreshTk(savedRefresh);
  }, []);

  type SignupResponse = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string };
};

const signupFn = async (email: string, password: string, name: string) => {
  if (!email || !password || !name) {
    throw new Error("All fields are required");
  }
  const res = await signup(email, password, name);
  if (!res.user || !res.accessToken) {
    throw new Error("Signup failed");
  }

  const user = {
    id: res.user.id,
    email: res.user.email,
    name: res.user.name,
  };

  setUser(user);
  setAccessToken(res.accessToken);
  setRefreshTk(res.refreshToken);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("accessToken", res.accessToken);
  localStorage.setItem("refreshToken", res.refreshToken);
};

const loginFn = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const res = await login(email, password);
  if (!res.user || !res.accessToken) {
    throw new Error("Invalid email or password");
  }

  setUser(res.user);
  setAccessToken(res.accessToken);
  setRefreshTk(res.refreshToken);
  localStorage.setItem("user", JSON.stringify(res.user));
  localStorage.setItem("accessToken", res.accessToken);
  localStorage.setItem("refreshToken", res.refreshToken);
};

const logoutFn = () => {
  // Clear state
  setUser(null);
  setAccessToken(null);
  setRefreshTk(null);

  // Clear localStorage
  localStorage.removeItem("user");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");

  console.log("User logged out successfully");
};


  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken: refreshTk,
        signupFn,
        loginFn,
        logoutFn

    }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
