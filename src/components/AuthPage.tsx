// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { getOrCreateLocalUser } from './services/user_helper';
// const API_BASE = "http://192.168.1.5:5000"; // your backend URL
// // const API_BASE = "http://localhost:5000"; // your backend URL
// // declare google on window
// declare global {
//   interface Window {
//     google?: any;
//   }
// }

// // ---------------------- authService ----------------------
// export const authService = {
//   async signup({ email, password, name }: { email: string; password: string; name: string }) {
//     const res = await fetch(`${API_BASE}/api/auth/signup`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       credentials: 'include',
//       body: JSON.stringify({ email, password, name }),
//     });
//     const data = await res.json();
//     if (!res.ok) throw data;
//     return data;
//   },

//   async login({ email, password }: { email: string; password: string }) {
//     const res = await fetch(`${API_BASE}/api/auth/login`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       credentials: 'include',
//       body: JSON.stringify({ email, password }),
//       cache: 'no-store'
//     });
//     const data = await res.json();
//     if (!res.ok) throw data;
//     return data;
//   },

//   async googleLogin({ id_token }: { id_token: string }) {
//     const res = await fetch(`${API_BASE}/api/auth/google`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       credentials: 'include',
//       body: JSON.stringify({ id_token }),
//     });
//     const data = await res.json();
//     if (!res.ok) throw data;
//     return data;
//   },

//   async logout() {
//     await fetch(`${API_BASE}/api/auth/logout`, {
//       method: 'POST',
//       credentials: 'include'
//     }).catch(()=>{ /* ignore */ });
//   }
// };

// // ---------------------- Auth context/provider ----------------------
// type AuthContextValue = {
//   user: any | null;
//   setAuth: (payload: { accessToken?: string; user?: any }) => void;
//   clearAuth: () => void;
// };

// const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<any | null>(() => {
//     try {
//       const rawUser = localStorage.getItem('me');
//       const token = localStorage.getItem('accessToken');
//       if (rawUser && token) return JSON.parse(rawUser);
//       return null;
//     } catch {
//       return null;
//     }
//   });

//   const setAuth = ({ accessToken, refreshToken, user }: { accessToken?: string; refreshToken?: string; user?: any }) => {
//   if (accessToken) localStorage.setItem('accessToken', accessToken);
//   if (refreshToken) localStorage.setItem('refreshToken', refreshToken); 
//   if (user) localStorage.setItem('me', JSON.stringify(user));
//   if (user !== undefined) setUser(user);
//   };

//   const clearAuth = () => {
//     localStorage.removeItem('accessToken');
//     localStorage.removeItem('me');
//     setUser(null);
//     authService.logout();
//   };

//   return (
//     <AuthContext.Provider value={{ user, setAuth, clearAuth }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) return { user: null, setAuth: () => {}, clearAuth: () => {} } as AuthContextValue;
//   return ctx;
// }

// // ---------------------- AuthPage Component ----------------------
// export default function AuthPage() {
//   const [mode, setMode] = useState<'login'|'signup'>('login');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const { setAuth } = useAuth();

//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [name, setName] = useState('');

//   // ---------------------- Load Google SDK dynamically ----------------------
// useEffect(() => {
//   const script = document.createElement('script');
//   script.src = "https://accounts.google.com/gsi/client";
//   script.async = true;
//   script.defer = true;

//   document.body.appendChild(script);

//   script.onload = () => {
//     const initGoogle = () => {
//       if (!window.google || !window.google.accounts?.id) return;
//       const gbtn = document.getElementById("gbtn");
//       if (!gbtn) return;

//       window.google.accounts.id.initialize({
//         client_id: "213331984531-7mt2o3qn2pc2m3o2e91b6t4dorkhiicj.apps.googleusercontent.com",
//         callback: (response: any) => {
//           window.dispatchEvent(new CustomEvent('google_credential', { detail: response }));
//         },
//       });

//       window.google.accounts.id.renderButton(gbtn, { theme: "outline", size: "large" });
//       window.google.accounts.id.prompt(); // optional: One Tap prompt
//     };

//     // small delay ensures Google SDK fully loads
//     setTimeout(initGoogle, 50);
//   };

//   return () => {
//     document.body.removeChild(script);
//   };
// }, []);




//   // ---------------------- Listen for Google login credential ----------------------
//   useEffect(() => {
//     const handler = (e: Event) => {
//       const detail = (e as CustomEvent).detail;
//       if (detail) handleGoogleCredential(detail);
//     };
//     window.addEventListener('google_credential', handler as EventListener);
//     return () => window.removeEventListener('google_credential', handler as EventListener);
//   }, []);

//   // ---------------------- Form submit ----------------------
//   async function submit(e: React.FormEvent) {
//     e.preventDefault();
//     setError(null);
//     setLoading(true);

//     localStorage.removeItem('accessToken');
//     localStorage.removeItem('me');

//     try {
//       let data;
//       if (mode === 'login') {
//         data = await authService.login({ email, password });
//       } else {
//         data = await authService.signup({ email, password, name });
//       }

//       if (!data.accessToken) throw new Error("No accessToken received");

//       setAuth(data);
//       console.log(data);
//       await getOrCreateLocalUser(data.user);
//     } catch (err: any) {
//       console.error(err);
//       setError(err?.error || err?.message || 'Something went wrong');
//     } finally {
//       setLoading(false);
//     }
//   }

//   // ---------------------- Google login handler ----------------------
//   async function handleGoogleCredential(response: any) {
//     setLoading(true);
//     setError(null);
//     try {
//       const id_token = response?.credential;
//       if (!id_token) throw new Error('No token from Google');
//       const data = await authService.googleLogin({ id_token });
//       setAuth(data);
//     } catch (err: any) {
//       setError(err?.error || err?.message || 'Google login failed');
//     } finally {
//       setLoading(false);
//     }
//   }



//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
//       <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow">
//         <h2 className="text-2xl font-semibold mb-4 text-center">
//           {mode === 'login' ? 'Login' : 'Sign up'}
//         </h2>

//         {error && <div className="bg-red-50 text-red-800 p-2 rounded mb-3">{error}</div>}

//         <form onSubmit={submit} className="space-y-4">
//           {mode === 'signup' && (
//             <div>
//               <label className="block text-sm font-medium mb-1">Name</label>
//               <input required value={name} onChange={e=>setName(e.target.value)} className="w-full border rounded px-3 py-2" />
//             </div>
//           )}

//           <div>
//             <label className="block text-sm font-medium mb-1">Email</label>
//             <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border rounded px-3 py-2" />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-1">Password</label>
//             <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border rounded px-3 py-2" />
//           </div>

//           <div className="flex justify-center mt-4">
//           <button
//             type="submit"
//             style={{ backgroundColor: 'grey', color: 'white', padding: '10px 20px', borderRadius: '8px' }}
//           >
//           {mode === 'login' ? 'Login' : 'Create account'}
//   </button>
// </div>

//         </form>

//         <div className="my-3 text-sm text-center">
//           <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="underline">
//             {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
//           </button>
//         </div>

//         <div className="mt-4">
//           <div id="gbtn" />
          

//           <div className="text-xs mt-3 text-gray-500">
//             Tip: run on an origin added to Google OAuth console, e.g., <code>http://localhost:3000</code>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// AuthPage.tsx
import React, { useState } from "react";
import { useAuth } from "./AuthContext";

export default function AuthPage() {
  const { signupFn, loginFn, logoutFn, user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await loginFn(email, password);
      } else {
        await signupFn(email, password, name);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        fontFamily: "'Inter', sans-serif",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "2rem",
          borderRadius: "1rem",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        {user ? (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ marginBottom: "1rem", color: "#111827" }}>
              Welcome, {user.name}
            </h2>
            <button
              onClick={logoutFn}
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column" }}
          >
            <h2
              style={{
                textAlign: "center",
                marginBottom: "1.5rem",
                color: "#111827",
              }}
            >
              {mode === "login" ? "Login" : "Signup"}
            </h2>

            {error && (
              <p
                style={{
                  color: "red",
                  marginBottom: "1rem",
                  textAlign: "center",
                }}
              >
                {error}
              </p>
            )}

            {mode === "signup" && (
              <input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  marginBottom: "1rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #d1d5db",
                  fontSize: "1rem",
                }}
              />
            )}

            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                marginBottom: "1rem",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
                fontSize: "1rem",
              }}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                marginBottom: "1rem",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
                fontSize: "1rem",
              }}
            />

            <button
              type="submit"
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontWeight: 500,
                marginBottom: "1rem",
              }}
            >
              {mode === "login" ? "Login" : "Signup"}
            </button>

            <p
              style={{
                textAlign: "center",
                fontSize: "0.875rem",
              }}
            >
              {mode === "login" ? "No account?" : "Already have one?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                style={{
                  textDecoration: "underline",
                  background: "none",
                  border: "none",
                  color: "#3b82f6",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  padding: 0,
                  margin: 0,
                }}
              >
                Switch to {mode === "login" ? "Signup" : "Login"}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
