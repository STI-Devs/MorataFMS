import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: "url('/space-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        backgroundColor: '#000',
      }}
    >
      {/* Floating cargo container — left side */}
      <div
        className="absolute left-[12%] top-1/2 -translate-y-1/2"
        style={{
          animation: 'float 6s ease-in-out infinite',
          width: '220px',
        }}
      >
        <img
          src="/cargo-container.png"
          alt="Lost cargo container floating in space"
          style={{ width: '100%', filter: 'drop-shadow(0 0 24px rgba(0,120,255,0.25))' }}
        />
      </div>

      {/* Right side content */}
      <div className="relative z-10 flex flex-col items-center text-center ml-[30%]">
        <p className="text-white text-4xl font-semibold mb-2 tracking-wide">Oops!</p>
        <h1
          className="font-black text-white leading-none select-none"
          style={{ fontSize: 'clamp(6rem, 14vw, 12rem)', textShadow: '0 0 60px rgba(255,255,255,0.08)' }}
        >
          404
        </h1>
        <p className="text-white/80 text-base mt-4 max-w-xs leading-relaxed">
          Your cargo seems to have drifted off course.
          <br />
          You will be guided back to the homepage
          <br />
          after <span className="text-white font-semibold">{countdown}</span> seconds.
        </p>

        <button
          onClick={() => navigate('/')}
          className="mt-8 px-8 py-3 rounded-full border-2 border-white text-white text-sm font-medium
                     bg-transparent hover:bg-white hover:text-black transition-all duration-300 cursor-pointer"
        >
          Back to home
        </button>
      </div>

      {/* Float keyframes */}
      <style>{`
        @keyframes float {
          0%   { transform: translateY(-50%) rotate(-6deg); }
          50%  { transform: translateY(calc(-50% - 18px)) rotate(2deg); }
          100% { transform: translateY(-50%) rotate(-6deg); }
        }
      `}</style>
    </div>
  );
}
