import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useNotification } from "../hooks/useNotification";
import { getErrorMessage } from "../utils/errors";

function Login() {
  const notification = useNotification();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const login = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      localStorage.setItem("token", response.data.token);
      notification.success("Login successful.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = getErrorMessage(error, "Login failed. Check your credentials.");
      setError(message);
      notification.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <div className="hidden flex-1 flex-col justify-between bg-slate-950 p-10 text-white lg:flex">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-300">
            Furniture Factory ERP
          </p>
          <h1 className="mt-6 max-w-xl text-5xl font-bold leading-tight">
            Production, payments, stock, and shipments in one clean system.
          </h1>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-slate-300">Operations</p>
            <p className="mt-2 font-semibold">Daily work entries</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-slate-300">Inventory</p>
            <p className="mt-2 font-semibold">Ready stock control</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-slate-300">Finance</p>
            <p className="mt-2 font-semibold">Worker ledgers</p>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-4 py-10 lg:w-[520px]">
        <form onSubmit={login} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/70">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Welcome Back
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950">Sign in</h2>
            <p className="mt-2 text-sm text-slate-500">
              Use your ERP credentials to continue.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6">
            <label className="field-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="field-input"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mt-4">
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="field-input"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="primary-button mt-6 w-full"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
