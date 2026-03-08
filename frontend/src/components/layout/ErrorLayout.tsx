import { useNavigate } from "react-router-dom";

interface ErrorLayoutProps {
  code: string;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ErrorLayout({ code, title, message, action }: ErrorLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A1929] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Error Code with Glow */}
        <div className="relative mb-8">
          <h1 className="text-9xl font-black text-white/5 tracking-wider select-none">
            {code}
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {title}
          </h2>
          <p className="text-white/60 text-lg leading-relaxed max-w-sm mx-auto">
            {message}
          </p>

          {/* Action Button */}
          <div className="pt-4">
            <button
              onClick={action ? action.onClick : () => navigate(-1)}
              className="inline-flex items-center px-6 py-3 rounded-xl font-semibold text-white
                         bg-gradient-to-r from-red-600 to-red-500
                         shadow-lg shadow-red-500/30
                         transition-all duration-300
                         hover:shadow-red-500/50 hover:scale-[1.02]
                         focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              {action ? action.label : "Go Back"}
              <svg 
                className="w-5 h-5 ml-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Brand Brand Mark */}
        <div className="mt-12">
          <p className="text-white/20 text-xs tracking-widest uppercase">
            F.M. Morata Customs Brokerage
          </p>
        </div>
      </div>
    </div>
  );
}
