import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const LoginForm = ({ onToggleSignup }: { onToggleSignup: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error("Login failed:", err);
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (typeof err === 'object' && err !== null && 'response' in err) {
        const errorResponse = err as { response?: { data?: { message?: string }, status?: number } };
        if (errorResponse.response?.data?.message) {
          errorMessage = errorResponse.response.data.message;
        } else if (errorResponse.response) {
          errorMessage = `Login failed (Status: ${errorResponse.response.status || 'unknown'})`;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form className="space-y-4 mb-6" onSubmit={handleSubmit}>
        {/* Email Input */}
        <div>
          <input
            type="email"
            placeholder="Enter your email"
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs bg-white text-gray-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Password Input */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your Password"
            required
            className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs bg-white text-gray-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-[10px] text-center bg-red-50 py-2 rounded border border-red-100">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#1a2332] text-white py-2.5 rounded-full font-medium hover:bg-[#2a3342] transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Signing in..." : "Login"}
        </button>
      </form>

      {/* Sign Up Link */}
      <div className="text-center">
        <span className="text-gray-500 text-xs">Don't have an account? </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onToggleSignup();
          }}
          className="text-gray-900 font-medium text-xs hover:underline"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};