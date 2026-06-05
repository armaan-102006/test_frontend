import { useState } from "react";
import SessionManager from "./components/SessionManager";

const API_URL = import.meta.env.VITE_API_URL ?? "https://8603-152-59-81-162.ngrok-free.app";

const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600&family=JetBrains+Mono:wght@400&display=swap');

  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; background: #f6f7f9; color: #0b0d10; font-family: 'Space Grotesk', sans-serif; }
  input, button { font-family: inherit; }
`;

async function postAuthForm(path, email, password) {
  const body = new URLSearchParams({ username: email, password }).toString();
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const message = payload.detail || "Authentication failed";
    throw new Error(message);
  }

  return payload;
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    background: "#ffffff",
    border: "1px solid #e3e7ee",
    borderRadius: 10,
    padding: 24,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  title: { margin: 0, fontSize: 20, fontWeight: 600 },
  subtitle: { marginTop: 6, marginBottom: 20, color: "#5a6470", fontSize: 13 },
  label: { fontSize: 12, color: "#5a6470", marginBottom: 6 },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d9dde3",
    borderRadius: 6,
    fontSize: 14,
    marginBottom: 14,
  },
  button: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 6,
    border: "none",
    background: "#0f766e",
    color: "#ffffff",
    fontSize: 14,
    cursor: "pointer",
  },
  link: {
    marginTop: 12,
    background: "transparent",
    border: "none",
    color: "#0f766e",
    cursor: "pointer",
    fontSize: 13,
    textDecoration: "underline",
  },
  error: {
    marginTop: 12,
    fontSize: 12,
    color: "#b42318",
    background: "#fef3f2",
    border: "1px solid #fecdca",
    borderRadius: 6,
    padding: "8px 10px",
  },
  appShell: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    background: "#ffffff",
    borderBottom: "1px solid #e3e7ee",
  },
  brand: { fontWeight: 600 },
  meta: { color: "#5a6470", fontSize: 12 },
  signOut: {
    border: "1px solid #d9dde3",
    background: "#ffffff",
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 12,
    cursor: "pointer",
  },
  main: { flex: 1 },
};

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [userEmail, setUserEmail] = useState(
    () => localStorage.getItem("userEmail") || ""
  );
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isAuthed = Boolean(token);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirm("");
    setError("");
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    resetForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (mode === "signup" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/create";
      const data = await postAuthForm(path, email, password);
      if (!data.access_token) {
        throw new Error("Missing access token in response");
      }

      localStorage.setItem("token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("refreshToken", data.refresh_token);
      }
      localStorage.setItem("userEmail", email);
      setToken(data.access_token);
      setUserEmail(email);
      resetForm();
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userEmail");
    setToken(null);
    setUserEmail("");
  };

  if (!isAuthed) {
    return (
      <>
        <style>{GLOBAL_STYLE}</style>
        <div style={styles.page}>
          <form style={styles.card} onSubmit={handleSubmit}>
            <h1 style={styles.title}>College Compute</h1>
            <p style={styles.subtitle}>
              {mode === "login"
                ? "Sign in to start your session."
                : "Create an account to get access."}
            </p>

            <label style={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@college.edu"
            />

            <label style={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Enter your password"
            />

            {mode === "signup" && (
              <>
                <label style={styles.label} htmlFor="confirm">Confirm password</label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  style={styles.input}
                  placeholder="Re-enter your password"
                />
              </>
            )}

            <button type="submit" style={styles.button} disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Sign in"
                : "Create account"}
            </button>

            {error && <div style={styles.error}>{error}</div>}

            <button
              type="button"
              style={styles.link}
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "Need an account? Sign up" : "Have an account? Sign in"}
            </button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <div style={styles.appShell}>
        <header style={styles.header}>
          <div>
            <div style={styles.brand}>College Compute</div>
            <div style={styles.meta}>{userEmail ? `Signed in as ${userEmail}` : "Signed in"}</div>
          </div>
          <button style={styles.signOut} onClick={handleLogout}>Sign out</button>
        </header>
        <main style={styles.main}>
          <SessionManager />
        </main>
      </div>
    </>
  );
}
