import React, { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';

interface EncodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'import' | 'export';
    onSave: (data: any) => void;
}

export const EncodeModal: React.FC<EncodeModalProps> = ({ isOpen, onClose, type, onSave }) => {
    const { theme } = useTheme();
    const [formData, setFormData] = useState<any>({});

    if (!isOpen) return null;

    const isImport = type === 'import';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const statusOptions = isImport
        ? ['Cleared', 'Pending', 'Delayed', 'In Transit']
        : ['Shipped', 'Processing', 'Delayed', 'In Transit'];

    const blscOptions = ['Green', 'Yellow', 'Orange', 'Red', 'Blue'];

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
            <div className={`rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b transition-colors ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
                    }`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-black shadow-lg ring-4 transition-colors ${theme === 'dark' ? 'bg-white ring-gray-700' : 'bg-white ring-gray-50'
                            }`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v12m6-6H6" />
                            </svg>
                        </div>
                        <div>
                            <h3 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>Encode {isImport ? 'Import' : 'Export'}</h3>
                            <p className={`text-xs font-medium transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                }`}>Please fill in the details of the new transaction</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-xl transition-all ${theme === 'dark'
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Import Specific Fields */}
                        {isImport && (
                            <>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        BLSC (Selective Color)
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            name="blsc"
                                            className={`w-full px-4 py-3 border rounded-xl text-sm font-bold outline-none transition-all appearance-none cursor-pointer focus:ring-2 focus:border-transparent ${theme === 'dark'
                                                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                                                : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-black'
                                                }`}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Select Color</option>
                                            {blscOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                        <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        Customs Ref No.
                                    </label>
                                    <input
                                        required
                                        name="ref"
                                        type="text"
                                        placeholder="e.g. REF-2024-001"
                                        className={`w-full px-4 py-3 border rounded-xl text-sm font-bold outline-none transition-all focus:ring-2 focus:border-transparent ${theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-300 focus:ring-black'
                                            }`}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        Bill of Lading
                                    </label>
                                    <input
                                        required
                                        name="bl"
                                        type="text"
                                        placeholder="e.g. BL-78542136"
                                        className={`w-full px-4 py-3 border rounded-xl text-sm font-bold outline-none transition-all focus:ring-2 focus:border-transparent ${theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-300 focus:ring-black'
                                            }`}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        Status
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            name="status"
                                            className={`w-full px-4 py-3 border rounded-xl text-sm font-bold outline-none transition-all appearance-none cursor-pointer focus:ring-2 focus:border-transparent ${theme === 'dark'
                                                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                                                : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-black'
                                                }`}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Select Status</option>
                                            {statusOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                        <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        Importer
                                    </label>
                                    <input
                                        required
                                        name="party"
                                        type="text"
                                        placeholder="Enter Importer Name"
                                        className={`w-full px-4 py-3 border rounded-xl text-sm font-bold outline-none transition-all focus:ring-2 focus:border-transparent ${theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-300 focus:ring-black'
                                            }`}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        Arrival Date
                                    </label>
                                    <input
                                        required
                                        name="arrivalDate"
                                        type="date"
                                        className={`w-full px-4 py-3 border rounded-xl text-sm font-bold outline-none transition-all focus:ring-2 focus:border-transparent ${theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-300 focus:ring-black'
                                            }`}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        Port of Discharge
                                    </label>
                                    <input
                                        required
                                        name="portOfDischarge"
                                        type="text"
                                        placeholder="Enter Port of Discharge"
                                        className={`w-full px-4 py-3 border rounded-xl text-sm font-bold outline-none transition-all focus:ring-2 focus:border-transparent ${theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-300 focus:ring-black'
                                            }`}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </>
                        )}

                        {/* Export Specific Fields (Reordered) */}
                        {!isImport && (
                            <>
                                {/* 1. Shipper */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        Shipper
                                    </label>
                                    <input
                                        required
                                        name="party"
                                        type="text"
                                        placeholder="Enter Shipper Name"
                                        className={`w-full px-4 py-3 border rounded-xl text-sm font-bold outline-none transition-all focus:ring-2 focus:border-transparent ${theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-300 focus:ring-black'
                                            }`}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                {/* 2. Bill of Lading */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        Bill of Lading
                                    </label>
                                    <input
                                        required
                                        name="bl"
                                        type="text"
                                        placeholder="e.g. BL-78542136"
                                        className={`w-full px-4 py-3 border rounded-xl text-sm font-bold outline-none transition-all focus:ring-2 focus:border-transparent ${theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-300 focus:ring-black'
                                            }`}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                {/* 3. Vessel */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        Vessel
                                    </label>
                                    <input
                                        required
                                        name="extra"
                                        type="text"
                                        placeholder="Enter Vessel Name"
                                        className={`w-full px-4 py-3 border rounded-xl text-sm font-bold outline-none transition-all focus:ring-2 focus:border-transparent ${theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-300 focus:ring-black'
                                            }`}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                {/* 4. Departure Date */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        Departure Date
                                    </label>
                                    <input
                                        required
                                        name="departureDate"
                                        type="date"
                                        className={`w-full px-4 py-3 border rounded-xl text-sm font-bold outline-none transition-all focus:ring-2 focus:border-transparent ${theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-300 focus:ring-black'
                                            }`}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                {/* 5. Port of Destination */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        Port of Destination
                                    </label>
                                    <input
                                        required
                                        name="portOfDestination"
                                        type="text"
                                        placeholder="Enter Port of Destination"
                                        className={`w-full px-4 py-3 border rounded-xl text-sm font-bold outline-none transition-all focus:ring-2 focus:border-transparent ${theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-300 focus:ring-black'
                                            }`}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className={`flex items-center gap-3 pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={`flex-1 px-6 py-4 border rounded-2xl text-sm font-bold transition-all active:scale-95 ${theme === 'dark'
                                ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 px-6 py-4 text-black rounded-2xl text-sm font-bold transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${theme === 'dark'
                                ? 'bg-white hover:bg-gray-100'
                                : 'bg-white border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                            Encode
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
