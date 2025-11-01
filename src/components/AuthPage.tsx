// // AuthPage.tsx
// import React, { useState } from "react";
// import { useAuth } from "./AuthContext";


// export default function AuthPage() {
//   const GOOGLE_CLIENT_ID = "213331984531-7mt2o3qn2pc2m3o2e91b6t4dorkhiicj.apps.googleusercontent.com";
//   const { signupFn, loginFn, logoutFn, user } = useAuth();
//   const [mode, setMode] = useState<"login" | "signup">("login");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [name, setName] = useState("");
//   const [error, setError] = useState("");

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       if (mode === "login") {
//         await loginFn(email, password);
//       } else {
//         await signupFn(email, password, name);
//       }
//     } catch (err: any) {
//       setError(err.message);
//     }
//   };

//   return (
//     <div
//       style={{
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         minHeight: "100vh",
//         backgroundColor: "#f3f4f6",
//         fontFamily: "'Inter', sans-serif",
//         padding: "1rem",
//       }}
//     >
//       <div
//         style={{
//           backgroundColor: "#fff",
//           padding: "2rem",
//           borderRadius: "1rem",
//           boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
//           width: "100%",
//           maxWidth: "400px",
//         }}
//       >
//         {user ? (
//           <div style={{ textAlign: "center" }}>
//             <h2 style={{ marginBottom: "1rem", color: "#111827" }}>
//               Welcome, {user.name}
//             </h2>
//             <button
//               onClick={logoutFn}
//               style={{
//                 padding: "0.75rem 1rem",
//                 borderRadius: "0.5rem",
//                 backgroundColor: "#ef4444",
//                 color: "white",
//                 border: "none",
//                 cursor: "pointer",
//                 fontWeight: 500,
//               }}
//             >
//               Logout
//             </button>
//           </div>
//         ) : (
//           <form
//             onSubmit={handleSubmit}
//             style={{ display: "flex", flexDirection: "column" }}
//           >
//             <h2
//               style={{
//                 textAlign: "center",
//                 marginBottom: "1.5rem",
//                 color: "#111827",
//               }}
//             >
//               {mode === "login" ? "Login" : "Signup"}
//             </h2>

//             {error && (
//               <p
//                 style={{
//                   color: "red",
//                   marginBottom: "1rem",
//                   textAlign: "center",
//                 }}
//               >
//                 {error}
//               </p>
//             )}

//             {mode === "signup" && (
//               <input
//                 placeholder="Name"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 style={{
//                   marginBottom: "1rem",
//                   padding: "0.75rem 1rem",
//                   borderRadius: "0.5rem",
//                   border: "1px solid #d1d5db",
//                   fontSize: "1rem",
//                 }}
//               />
//             )}

//             <input
//               placeholder="Email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               style={{
//                 marginBottom: "1rem",
//                 padding: "0.75rem 1rem",
//                 borderRadius: "0.5rem",
//                 border: "1px solid #d1d5db",
//                 fontSize: "1rem",
//               }}
//             />

//             <input
//               type="password"
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               style={{
//                 marginBottom: "1rem",
//                 padding: "0.75rem 1rem",
//                 borderRadius: "0.5rem",
//                 border: "1px solid #d1d5db",
//                 fontSize: "1rem",
//               }}
//             />

//             <button
//               type="submit"
//               style={{
//                 padding: "0.75rem 1rem",
//                 borderRadius: "0.5rem",
//                 backgroundColor: "#3b82f6",
//                 color: "white",
//                 border: "none",
//                 cursor: "pointer",
//                 fontWeight: 500,
//                 marginBottom: "1rem",
//               }}
//             >
//               {mode === "login" ? "Login" : "Signup"}
//             </button>

//             <p
//               style={{
//                 textAlign: "center",
//                 fontSize: "0.875rem",
//               }}
//             >
//               {mode === "login" ? "No account?" : "Already have one?"}{" "}
//               <button
//                 type="button"
//                 onClick={() => setMode(mode === "login" ? "signup" : "login")}
//                 style={{
//                   textDecoration: "underline",
//                   background: "none",
//                   border: "none",
//                   color: "#3b82f6",
//                   cursor: "pointer",
//                   fontSize: "0.875rem",
//                   padding: 0,
//                   margin: 0,
//                 }}
//               >
//                 Switch to {mode === "login" ? "Signup" : "Login"}
//               </button>
//             </p>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// }


// AuthPage.tsx
import React, { useState } from "react";
import { useAuth } from "./AuthContext";
// Component for Web/Browser Google Sign-In
import { GoogleLogin } from "@react-oauth/google"; 
// Capacitor dependencies for mobile APK detection and sign-in
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'; 
import { Capacitor } from '@capacitor/core';

export default function AuthPage() {
  // Destructure the required functions and state from the context
  const { signupFn, loginFn, logoutFn, user, googleLoginFn } = useAuth();
  
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  // Determine if the app is running on a native (Capacitor) platform
  const isMobile = Capacitor.isNativePlatform();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); 
    try {
      if (mode === "login") {
        await loginFn(email, password);
      } else {
        await signupFn(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during auth.");
    }
  };

  // --- Handlers for Web Google Sign-In (using @react-oauth/google) ---
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError(""); 
    console.log("Web Google Login Success:", credentialResponse);
    try {
      await googleLoginFn(credentialResponse.credential); 
    } catch (err: any) {
      setError(err.message || "Google sign-in failed during token processing.");
    }
  };

  const handleGoogleFailure = () => {
    setError("Google Sign-In failed. Check your network or try again.");
    console.error("Google Login Failed.");
  };

  // --- Handler for Mobile/Capacitor Google Sign-In ---
  const handleMobileGoogleLogin = async () => {
    setError("");
    try {
      // Use the native plugin's sign-in method
      const result = await GoogleAuth.signIn(); 
      
      // The ID token is nested in the result object for this plugin
      const idToken = result.authentication.idToken;

      if (idToken) {
        // Pass the ID token to your existing, browser-safe context function
        await googleLoginFn(idToken);
      } else {
        throw new Error("ID Token not received from native Google Sign-In.");
      }
    } catch (e: any) {
      // User cancelled or a native error occurred
      console.error('Mobile Google Sign-In error:', e);
      setError("Mobile sign-in failed. Did you configure your Android/iOS client ID?");
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
                  padding: "0.5rem",
                  backgroundColor: "#fee2e2",
                  borderRadius: "0.5rem"
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
              type="email" 
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

            {/* Google Sign-In Section - CONDITIONAL RENDER FIX */}
            <div style={{ margin: '1rem 0', textAlign: 'center' }}>
              <p style={{marginBottom: '0.75rem', color: "#6b7280", fontWeight: 300, fontSize: "0.9rem"}}>
                — OR CONTINUE WITH GOOGLE —
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {isMobile ? (
                  // Display a simple button that triggers the native plugin for mobile apps
                  <button 
                    onClick={handleMobileGoogleLogin} 
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.75rem 1rem', 
                      borderRadius: '0.5rem', 
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white', 
                      color: '#111827', 
                      cursor: 'pointer', 
                      fontWeight: 500
                    }}
                  >
                    {/* Simplified styling since the GSI library won't render the icon */}
                    <img 
                        src="https://www.google.com/favicon.ico" 
                        alt="Google logo" 
                        style={{ width: '1.25rem', height: '1.25rem' }} 
                    />
                    Sign in with Google
                  </button>
                ) : (
                  // Use the standard component for web/desktop browsers
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleFailure}
                  />
                )}
              </div>
            </div>
            {/* End Google Sign-In Section */}

            <p
              style={{
                textAlign: "center",
                fontSize: "0.875rem",
                marginTop: '1rem' 
              }}
            >
              {mode === "login" ? "No account?" : "Already have one?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError(""); 
                }}
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