import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dateTime, setDateTime] = useState({
    time: '10:30 AM',
    date: 'Monday, August 18, 2020'
  });

  useEffect(() => {
    const updateTime = () => {
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Manila'
      };
      const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Manila'
      };
      const now = new Date();
      setDateTime({
        time: now.toLocaleTimeString('en-US', timeOptions),
        date: now.toLocaleDateString('en-US', dateOptions)
      });
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Tracking List', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', active: true },
    { label: 'Customers', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
    { label: 'Schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'Report', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ];

  const settingsItems = [
    { label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { label: 'E-Wallet', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { label: 'Help', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  ];

  return (
    <div className="bg-[#e8e8e8] min-h-screen flex text-gray-900">

      {/* Sidebar */}
      <aside className="w-56 bg-[#1a2332] min-h-screen flex flex-col py-6 px-4 shrink-0 transition-all">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-8 h-8">
            <svg viewBox="0 0 64 64" className="w-full h-full">
              <circle cx="32" cy="32" r="30" fill="#1e3a5f" stroke="#c41e3a" strokeWidth="2" />
              <path d="M20 32 Q32 20 44 32 Q32 44 20 32" fill="#c41e3a" />
              <circle cx="32" cy="32" r="8" fill="white" />
              <path d="M28 28 L36 36 M36 28 L28 36" stroke="#1e3a5f" strokeWidth="2" />
            </svg>
          </div>
          <span className="text-white font-bold text-sm">F.M. Morata</span>
        </div>

        {/* Main Menu */}
        <div className="mb-6">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider px-2 mb-3 font-semibold">Main Menu</p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href="#"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${item.active ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Settings */}
        <div className="mb-6">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider px-2 mb-3 font-semibold">Settings</p>
          <nav className="space-y-1">
            {settingsItems.map((item) => (
              <a
                key={item.label}
                href="#"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 text-sm hover:bg-white/5 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Sign Out at bottom */}
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 text-sm hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Import Transactions</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-white rounded-lg border border-gray-200 text-sm w-48 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {/* Sort By */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by</span>
              <select className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                <option>Date</option>
                <option>Customer Ref</option>
                <option>Importer</option>
                <option>Status</option>
              </select>
            </div>
            {/* Export Button */}
            <button className="flex items-center gap-2 bg-[#1a2332] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2a3342] transition-colors shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export
            </button>
            {/* User Profile */}
            <div className="flex items-center gap-3 ml-0 md:ml-4 pl-0 md:pl-4 border-l-0 md:border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Fely Morata'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || 'Admin'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#1a2332] flex items-center justify-center text-white font-semibold">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'FM'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tracking List Table */}
          <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Ref No.</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bill of Lading</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Color Status</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Importer</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Annual Date</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { ref: 'REF-2024-001', bl: 'BL-78542136', status: 'Cleared', color: 'bg-green-500', textColor: 'text-green-600', importer: 'ABC Trading Co.', date: 'Jan 15, 2024' },
                    { ref: 'REF-2024-002', bl: 'BL-78542137', status: 'Pending', color: 'bg-yellow-500', textColor: 'text-yellow-600', importer: 'XYZ Imports Ltd.', date: 'Feb 20, 2024' },
                    { ref: 'REF-2024-003', bl: 'BL-78542138', status: 'Delayed', color: 'bg-red-500', textColor: 'text-red-600', importer: 'Global Freight Inc.', date: 'Mar 10, 2024' },
                    { ref: 'REF-2024-004', bl: 'BL-78542139', status: 'Cleared', color: 'bg-green-500', textColor: 'text-green-600', importer: 'Metro Supplies', date: 'Apr 05, 2024' },
                    { ref: 'REF-2024-005', bl: 'BL-78542140', status: 'In Transit', color: 'bg-blue-500', textColor: 'text-blue-600', importer: 'Prime Logistics', date: 'May 18, 2024' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 text-sm text-gray-900 font-medium">{row.ref}</td>
                      <td className="py-4 text-sm text-gray-600">{row.bl}</td>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-1.5 ">
                          <span className={`w-2.5 h-2.5 rounded-full ${row.color}`}></span>
                          <span className={`text-sm ${row.textColor}`}>{row.status}</span>
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-600">{row.importer}</td>
                      <td className="py-4 text-sm text-gray-600">{row.date}</td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Side Panel */}
          <div className="w-full lg:w-72 space-y-6 shrink-0">
            {/* Time & Country Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{dateTime.time}</p>
                <p className="text-sm text-gray-500 mt-1">{dateTime.date}</p>
              </div>
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <svg className="w-5 h-5 text-[#c41e3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Philippines</span>
              </div>
            </div>

            {/* Calendar Card (Static Placeholder) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900 text-sm">August, 2024</h3>
                <button className="text-[10px] text-gray-500 flex items-center gap-1 font-medium bg-gray-50 px-2 py-1 rounded">
                  Today
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                {['Sun', 'Mon', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <span key={day} className="text-gray-400 py-1 font-semibold">{day}</span>
                ))}
                {/* Simplified Calendar Days */}
                {[...Array(30)].map((_, i) => (
                  <span
                    key={i}
                    className={`py-1.5 rounded-full ${i + 1 === 10 ? 'bg-[#c41e3a] text-white font-bold' : 'text-gray-700 hover:bg-gray-100 cursor-pointer'}`}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
