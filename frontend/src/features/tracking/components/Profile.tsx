import { useState } from 'react';
import { useAuth } from '../../auth';

export const Profile = () => {
    const { user } = useAuth();
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: ''
    });

    const handleEditClick = () => {
        setIsEditMode(true);
        setFormData({
            name: user?.name || '',
            email: user?.email || '',
            password: ''
        });
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setFormData({
            name: user?.name || '',
            email: user?.email || '',
            password: ''
        });
    };

    const handleSave = async () => {
        // TODO: Implement API call to save profile changes
        console.log('Saving profile:', formData);
        setIsEditMode(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="h-full flex items-center justify-center bg-surface">
            <div className="w-full max-w-4xl bg-surface rounded-3xl shadow-lg p-8">
                {/* Profile Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 w-5 bg-text-primary rounded-full"></div>
                        <h1 className="text-2xl font-bold text-text-primary">
                            Profile
                        </h1>
                    </div>
                    <div className="flex gap-4">
                        {isEditMode ? (
                            <>
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2.5 text-base bg-[#1a2332] text-white rounded-lg font-medium hover:opacity-90 transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save Changes
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-6 py-2.5 text-base bg-surface-secondary text-text-secondary rounded-lg font-medium hover:bg-hover transition-colors shadow-sm"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleEditClick}
                                className="px-6 py-2.5 text-base bg-[#1a2332] text-white rounded-lg font-medium hover:opacity-90 transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                EDIT PROFILE
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-12 items-center">
                    {/* Left Side - Profile Picture */}
                    <div className="flex-shrink-0">
                        <div className="relative w-80 h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center group">
                            {/* Profile Avatar */}
                            <div className="relative">
                                <div className="w-56 h-56 bg-gradient-to-br from-gray-800 to-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                                    <svg className="w-36 h-36 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                </div>

                                {/* Camera Icon */}
                                <button className="absolute -top-2 -right-2 w-12 h-12 bg-surface rounded-full shadow-lg flex items-center justify-center hover:bg-hover transition-colors">
                                    <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Profile Information */}
                    <div className="flex-1">
                        <div className="space-y-7">
                            {/* Name Field */}
                            <div className="flex items-center">
                                <label className="text-base font-semibold text-text-secondary w-36">Name:</label>
                                {isEditMode ? (
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="flex-1 px-4 py-3 text-base border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667BC6] bg-input-bg text-text-primary"
                                    />
                                ) : (
                                    <p className="text-base text-text-secondary">{user?.name || 'N/A'}</p>
                                )}
                            </div>

                            {/* Role Field */}
                            <div className="flex items-center">
                                <label className="text-base font-semibold text-text-secondary w-36">Role:</label>
                                {isEditMode ? (
                                    <input
                                        type="text"
                                        value={user?.role || 'N/A'}
                                        disabled
                                        className="flex-1 px-4 py-3 text-base border border-border-strong rounded-lg bg-surface-secondary text-text-muted cursor-not-allowed"
                                        title="Role cannot be edited"
                                    />
                                ) : (
                                    <p className="text-base text-text-secondary">{user?.role || 'N/A'}</p>
                                )}
                            </div>

                            {/* Email Field */}
                            <div className="flex items-center">
                                <label className="text-base font-semibold text-text-secondary w-36">Email:</label>
                                {isEditMode ? (
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="flex-1 px-4 py-3 text-base border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667BC6] bg-input-bg text-text-primary"
                                    />
                                ) : (
                                    <p className="text-base text-text-secondary">{user?.email || 'N/A'}</p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="flex items-center">
                                <label className="text-base font-semibold text-text-secondary w-36">Password:</label>
                                {isEditMode ? (
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Enter new password"
                                        className="flex-1 px-4 py-3 text-base border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667BC6] bg-input-bg text-text-primary"
                                    />
                                ) : (
                                    <p className="text-base text-text-secondary">**********</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>

    );
};
