import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ConfirmationModal } from '../../../components/ConfirmationModal';

interface LayoutContext {
    user?: { name: string; role: string };
    dateTime: { time: string; date: string };
}

interface FileData {
    id: number;
    name: string;
    date: string;
    uploadDate: string;
    uploader: { name: string; initials: string; role: string; color: string };
    size: string;
    type: 'pdf' | 'docx' | 'jpg';
    iconColor: string;
}

export const Documents = () => {
    const { user, dateTime } = useOutletContext<LayoutContext>();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
    const [isFileDetailsOpen, setIsFileDetailsOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<number[]>([]);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText?: string;
        confirmButtonClass?: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const [files, setFiles] = useState<FileData[]>([
        {
            id: 1,
            name: 'Import_Manifest_Nov2025.pdf',
            date: 'Nov 20, 2025',
            uploadDate: 'Nov 23, 2025',
            uploader: { name: 'John Doe', initials: 'JD', role: 'Admin', color: 'bg-[#1a2332]' },
            size: '2.4 MB',
            type: 'pdf',
            iconColor: 'bg-red-50 text-red-500',
        },
        {
            id: 2,
            name: 'Packing_List_Final.docx',
            date: 'Nov 18, 2025',
            uploadDate: 'Nov 22, 2025',
            uploader: { name: 'Alice Smith', initials: 'AS', role: 'Manager', color: 'bg-[#c41e3a]' },
            size: '1.8 MB',
            type: 'docx',
            iconColor: 'bg-blue-50 text-blue-500',
        },
        {
            id: 3,
            name: 'Container_Photo_01.jpg',
            date: 'Nov 15, 2025',
            uploadDate: 'Nov 21, 2025',
            uploader: { name: 'Robert Johnson', initials: 'RJ', role: 'Staff', color: 'bg-blue-500' },
            size: '3.5 MB',
            type: 'jpg',
            iconColor: 'bg-orange-50 text-orange-500',
        },
    ]);

    const handleDelete = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete File',
            message: 'Are you sure you want to delete this file? This action cannot be undone.',
            onConfirm: () => {
                setFiles(files.filter(f => f.id !== id));
                setIsFileDetailsOpen(false);
                setSelectedFile(null);
            }
        });
    };

    const handleDeleteSelected = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Selected Files',
            message: `Are you sure you want to delete ${selectedFiles.length} selected files? This action cannot be undone.`,
            confirmText: 'Delete All',
            confirmButtonClass: 'bg-red-600 hover:bg-red-700',
            onConfirm: () => {
                setFiles(files.filter(f => !selectedFiles.includes(f.id)));
                setSelectedFiles([]);
            }
        });
    };


    const handleFileClick = (file: FileData) => {
        setSelectedFile(file);
        setIsFileDetailsOpen(true);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedFiles(files.map(f => f.id));
        } else {
            setSelectedFiles([]);
        }
    };

    const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
        e.stopPropagation();
        if (e.target.checked) {
            setSelectedFiles([...selectedFiles, id]);
        } else {
            setSelectedFiles(selectedFiles.filter(fid => fid !== id));
        }
    };

    return (

        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                </div>
                <div className="flex items-center gap-6">
                    {/* Time & Date using existing layout logic from Import/Export list, but keeping them as header widgets if preferred? 
                         Wait, the user said "dont copy the design of the date and time". 
                         The existing React app uses large cards below the header.
                         ImportList uses `dateTime` from context.
                         I will replicate the header widgets from `documents.html` BUT using the React design style if possible?
                         Actually, the instruction was "only use the following dashboard... dont copy the design of the date and time".
                         This implies KEEPING the current date/time design.
                         In ImportList (current React), the date/time are Large Cards. 
                         In `documents.html` legacy, they are small header widgets.
                         If I keep current design, I should probably put them as cards?
                         However, `documents.html` has them in the header.
                         Let's stick to the consistent layout for now: Header -> Content.
                         Wait, if I use the "Time Widget" from `documents.html`, that contradicts "dont copy the design of the date and time".
                         So I should probably NOT put them in the header like `documents.html` if that's considered the "design" to avoid.
                         BUT `ImportList` has them as cards. 
                         I'll add the Date/Time Cards BELOW the header, same as `ImportList`.
                     */}
                </div>
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search documents..."
                            className="pl-10 pr-4 py-2 bg-white rounded-lg border border-gray-200 text-sm w-48 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Sort By - simplified for visual match */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 font-medium">Sort by</span>
                        <div className="relative group">
                            <select className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-all hover:border-gray-300 outline-none">
                                <option>Date Uploaded</option>
                                <option>Name</option>
                                <option>Size</option>
                                <option>Type</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-600 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{user?.name || 'FirstN LastN'}</p>
                            <p className="text-xs text-gray-500">Document in charge</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#1a2332] flex items-center justify-center text-white font-semibold">
                            {user?.name ? user.name.split(' ').map((n) => n[0]).join('') : 'FL'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Time & Date Cards - Same as ImportList */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Time Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-600">Current Time</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{dateTime.time}</p>
                    <p className="text-sm text-gray-600">Manila, Philippines</p>
                </div>

                {/* Date Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-600">Today's Date</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{dateTime.date}</p>
                    <p className="text-sm text-gray-600">Manila, Philippines</p>
                </div>
            </div>

            {/* Content Wrapper */}
            <div className="flex flex-col gap-4">
                {/* Header Actions */}
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center gap-2 bg-[#1a2332] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2a3342] transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Upload
                    </button>
                </div>

                {/* File List Table */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="p-6 overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                                    <th className="py-3 px-2 w-8">
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded bg-white checked:bg-[#1a2332] checked:border-[#1a2332] cursor-pointer transition-colors"
                                                checked={files.length > 0 && selectedFiles.length === files.length}
                                                onChange={handleSelectAll}
                                            />
                                            <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </th>
                                    <th className="py-3 px-2">File Name</th>

                                    <th className="py-3 px-2">File Date</th>
                                    <th className="py-3 px-2">Date Uploaded</th>
                                    <th className="py-3 px-2">Uploaded By</th>
                                    <th className="py-3 px-2">Size</th>
                                    <th className="py-3 px-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-600">
                                {files.map((file) => (
                                    <tr
                                        key={file.id}
                                        onClick={() => handleFileClick(file)}
                                        className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${selectedFiles.includes(file.id) ? 'bg-blue-50' : ''}`}
                                    >
                                        <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded bg-white checked:bg-[#1a2332] checked:border-[#1a2332] cursor-pointer transition-colors"
                                                    checked={selectedFiles.includes(file.id)}
                                                    onChange={(e) => handleSelectOne(e, file.id)}
                                                />
                                                <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">

                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded flex items-center justify-center ${file.iconColor}`}>
                                                    {file.type === 'pdf' ? (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                    ) : file.type === 'docx' ? (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <span className="font-medium text-gray-900">{file.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">{file.date}</td>
                                        <td className="py-3 px-2">{file.uploadDate}</td>
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded-full ${file.uploader.color} flex items-center justify-center text-[10px] font-bold text-white`}>
                                                    {file.uploader.initials}
                                                </div>
                                                <span>{file.uploader.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">{file.size}</td>
                                        <td className="py-3 px-2 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(file.id);
                                                    }}
                                                    className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Delete"
                                                >
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
                    {selectedFiles.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
                            <span className="text-sm text-gray-600 font-medium">{selectedFiles.length} files selected</span>
                            <div className="flex items-center gap-3">
                                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download
                                </button>
                                <button
                                    onClick={handleDeleteSelected}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[150]">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden mx-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#1a2332] flex items-center justify-center text-white shadow-sm">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Upload files</h3>
                                    <p className="text-xs text-gray-500">Select and upload the files of your choice</p>
                                </div>
                            </div>
                            <button onClick={() => setIsUploadModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            {/* Spinning Liquid Dot Border Container */}
                            <div className="relative group rounded-xl overflow-hidden mb-6 cursor-pointer">
                                {/* The Spinning Liquid Gradient Layer */}
                                <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,#ffffff_0deg,#3b82f6_90deg,#ffffff_180deg,#3b82f6_270deg,#ffffff_360deg)] animate-[spin_3s_linear_infinite] opacity-100 transition-opacity" />

                                {/* The Inner Content with Dashed Border Mask */}
                                <div className="relative bg-white rounded-[10px] p-8 flex flex-col items-center justify-center border-[3px] border-dashed border-white bg-clip-padding">
                                    <button className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 mb-4 flex items-center gap-2 transition-all z-10">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        Upload
                                    </button>
                                    <p className="text-sm text-gray-900 font-medium mb-1 z-10 relative">Choose a file or drag & drop it here</p>
                                    <p className="text-xs text-gray-400 z-10 relative">Maximum 500 MB file size</p>
                                </div>
                            </div>

                            {/* Upload Component Example matching the image */}
                            <div className="space-y-3">
                                {/* Completed File */}
                                <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl bg-white shadow-sm group cursor-pointer hover:border-gray-300 transition-colors">
                                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0 group-hover:scale-110 transition-transform duration-200">
                                        <span className="text-[10px] font-bold">PDF</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">File.pdf</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-gray-500">2.4 MB</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-green-600 tracking-wider">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                                Completed
                                            </span>
                                        </div>
                                    </div>
                                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Uploading File */}
                                <div className="p-3 border border-blue-100 rounded-xl bg-blue-50/30 group cursor-default hover:border-blue-200 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-110 transition-transform duration-200">
                                                <span className="text-[10px] font-bold">DOCX</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 truncate">File.docx</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-gray-500">60 KB of 120 KB</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                                                        <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                        Uploading<span className="group-hover:animate-bounce inline-block">...</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="text-gray-400 hover:text-gray-600">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="relative w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="absolute top-0 left-0 h-full bg-[#1a2332] w-3/4 rounded-full transition-all duration-300"></div>
                                    </div>
                                    <div className="flex justify-end mt-1">
                                        <span className="text-[10px] font-bold text-gray-600">75%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* File Details Modal */}
            {isFileDetailsOpen && selectedFile && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden mx-4 animate-in fade-in zoom-in duration-200 border border-gray-100">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-900">1 file selected</span>
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">{selectedFile.size}</span>
                                </div>
                            </div>
                            <button onClick={() => setIsFileDetailsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex items-center border-b border-gray-100">
                            <button className="flex-1 py-4 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 border-r border-gray-100 transition-colors flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                            </button>
                            <button
                                onClick={() => handleDelete(selectedFile.id)}
                                className="flex-1 py-4 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="flex flex-col items-center mb-8">
                                <div className="w-24 h-32 bg-white border border-gray-100 shadow-sm rounded-xl flex items-center justify-center mb-4 ring-8 ring-gray-50 relative group">
                                    <div className={`w-12 h-12 flex items-center justify-center ${selectedFile.iconColor}`}>
                                        {selectedFile.type === 'pdf' ? (
                                            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        ) : selectedFile.type === 'docx' ? (
                                            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 text-center mb-1">{selectedFile.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">{selectedFile.size}</span>
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-100 uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        Public
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-6 px-1">
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight mb-1">File Date</p>
                                    <p className="text-xs text-gray-900 font-semibold">{selectedFile.date}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight mb-1 text-right">Date Uploaded</p>
                                    <p className="text-xs text-gray-900 font-semibold text-right">{selectedFile.uploadDate}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl ${selectedFile.uploader.color} flex items-center justify-center text-white font-bold text-lg shadow-sm ring-4 ring-white`}>
                                        {selectedFile.uploader.initials}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Uploaded By</p>
                                        <p className="text-base font-bold text-gray-900 leading-tight">{selectedFile.uploader.name}</p>
                                        <p className="text-xs text-gray-400 font-medium mt-0.5">{selectedFile.uploader.role}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                confirmButtonClass={confirmModal.confirmButtonClass}
            />
        </div>
    );
};
