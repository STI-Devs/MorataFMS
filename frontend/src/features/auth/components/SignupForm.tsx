import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const SignupForm = ({ onToggleLogin }: { onToggleLogin: () => void }) => {
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        password_confirmation: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (formData.password !== formData.password_confirmation) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            await register(formData);
            navigate('/dashboard');
        } catch (err: unknown) {
            console.error("Registration failed:", err);
            let errorMessage = "Registration failed. Please try again.";

            if (typeof err === 'object' && err !== null && 'response' in err) {
                const errorResponse = err as { response?: { data?: { message?: string, errors?: Record<string, string[]> } } };
                if (errorResponse.response?.data?.errors) {
                    // Flatten Laravel validation errors
                    errorMessage = Object.values(errorResponse.response.data.errors).flat()[0];
                } else if (errorResponse.response?.data?.message) {
                    errorMessage = errorResponse.response.data.message;
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
            <form className="space-y-3 mb-4" onSubmit={handleSubmit}>
                {/* First & Last Name */}
                <div className="flex gap-3">
                    <input
                        type="text"
                        name="first_name"
                        placeholder="First Name"
                        required
                        className="w-1/2 px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs bg-white text-gray-900"
                        value={formData.first_name}
                        onChange={handleChange}
                        disabled={isLoading}
                    />
                    <input
                        type="text"
                        name="last_name"
                        placeholder="Last Name"
                        required
                        className="w-1/2 px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs bg-white text-gray-900"
                        value={formData.last_name}
                        onChange={handleChange}
                        disabled={isLoading}
                    />
                </div>

                {/* Email */}
                <div>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs bg-white text-gray-900"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isLoading}
                    />
                </div>

                {/* Password */}
                <div>
                    <input
                        type="password"
                        name="password"
                        placeholder="Enter Password"
                        required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs bg-white text-gray-900"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                    />
                </div>

                {/* Confirm Password */}
                <div>
                    <input
                        type="password"
                        name="password_confirmation"
                        placeholder="Confirm your Password"
                        required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs bg-white text-gray-900"
                        value={formData.password_confirmation}
                        onChange={handleChange}
                        disabled={isLoading}
                    />
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
                    {isLoading ? "Creating account..." : "Sign up"}
                </button>
            </form>

            {/* Log In Link */}
            <div className="text-center">
                <span className="text-gray-500 text-xs">Already have an account? </span>
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        onToggleLogin();
                    }}
                    className="text-gray-900 font-medium text-xs hover:underline"
                >
                    Log in
                </button>
            </div>
        </div>
    );
};
