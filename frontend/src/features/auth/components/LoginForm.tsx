import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLoginError } from '../../../lib/apiErrors';
import { useAuth } from "../hooks/useAuth";
import { getHomePath } from "../utils/access";
import { TurnstileWidget } from "./TurnstileWidget";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetCounter, setTurnstileResetCounter] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const turnstileSiteKey = useMemo(
    () => import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? "",
    [],
  );
  const isTurnstileEnabled = turnstileSiteKey.length > 0;
  const handleTurnstileTokenChange = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isTurnstileEnabled && !turnstileToken) {
      setError("Complete the security check and try again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await login({
        email,
        password,
        turnstile_token: turnstileToken ?? undefined,
      });
      navigate(getHomePath(user));
    } catch (err: unknown) {
      console.error("Login failed:", err);
      if (isTurnstileEnabled) {
        setTurnstileToken(null);
        setTurnstileResetCounter((count) => count + 1);
      }
      setError(getLoginError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Email Input */}
        <div>
          <input
            type="email"
            placeholder="ENTER YOUR EMAIL"
            required
            className="w-full px-0 py-2.5 border-0 border-b border-white/20 bg-transparent focus:outline-none focus:border-white/60 text-[11px] text-white/60 placeholder-white/40 tracking-[0.15em] transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Password Input */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="ENTER YOUR PASSWORD"
            required
            className="w-full px-0 py-2.5 pr-8 border-0 border-b border-white/20 bg-transparent focus:outline-none focus:border-white/60 text-[11px] text-white/60 placeholder-white/40 tracking-[0.15em] transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {isTurnstileEnabled && (
          <div className="pt-2">
            <TurnstileWidget
              onTokenChange={handleTurnstileTokenChange}
              resetCounter={turnstileResetCounter}
              siteKey={turnstileSiteKey}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-red-400 text-[10px] text-center py-1 tracking-widest uppercase">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || (isTurnstileEnabled && !turnstileToken)}
          className="w-full border border-white/30 text-white py-3 font-black hover:bg-white hover:text-black transition-all text-xs tracking-[0.3em] uppercase disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? "SIGNING IN..." : "LOGIN"}
        </button>
      </form>
    </div>
  );
};
