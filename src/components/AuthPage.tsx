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
