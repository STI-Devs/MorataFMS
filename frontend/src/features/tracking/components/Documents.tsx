import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { MOCK_FILES } from '../../../data/mockData';
import { useConfirmationModal } from '../../../hooks/useConfirmationModal';

import { Icon } from '../../../components/Icon';
import type { FileData, LayoutContext } from '../types';
import { DateTimeCard } from './shared/DateTimeCard';
import { PageHeader } from './shared/PageHeader';


export const Documents = () => {
    const { user, dateTime } = useOutletContext<LayoutContext>();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
    const [isFileDetailsOpen, setIsFileDetailsOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<number[]>([]);

    // Confirmation Modal State
    const { openModal, modalProps } = useConfirmationModal();

    const [files, setFiles] = useState<FileData[]>(MOCK_FILES);

    const handleDelete = (id: number) => {
        openModal({
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
        openModal({
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
            <PageHeader
                title="Documents"
                breadcrumb="Dashboard / Documents"
                user={user || null}
            />

            {/* Time & Date Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DateTimeCard type="time" value={dateTime.time} />
                <DateTimeCard type="date" value={dateTime.date} />
            </div>

            {/* Controls Bar Above the List Card */}
            <div className="flex justify-end items-center mb-6 px-2">
                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search documents"
                            className="pl-10 pr-4 py-2 bg-white rounded-2xl border border-gray-200 text-sm w-80 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 font-medium shadow-sm transition-all hover:shadow-md"
                        />
                        <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>

                    {/* Sort By */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 font-bold">Sort by</span>
                        <div className="relative group">
                            <select className="appearance-none bg-white border border-gray-200 rounded-2xl pl-3 pr-10 py-2 text-sm text-slate-500 font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-all hover:border-gray-300 outline-none min-w-[140px]">
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

                    {/* Upload Button */}
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-bold text-gray-700 shadow-sm text-sm">
                            <Icon name="filter" className="w-4 h-4" />
                            Filter
                        </button>
                        <button
                            onClick={() => setIsUploadModalOpen(true)} // Assuming this should open the upload modal
                            className="flex items-center gap-2 px-4 py-2 bg-[#1a2332] text-white rounded-xl hover:bg-[#2c3b52] transition-all font-bold shadow-lg shadow-blue-900/10 text-sm transform hover:scale-[1.02]"
                        >
                            <Icon name="plus" className="w-4 h-4" />
                            Upload File
                        </button>
                    </div>
                </div>
            </div>

            {/* File List Card */}
            <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm transition-colors overflow-hidden">
                <div className="p-6 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-gray-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="py-3 px-2 w-8">
                                    <div className="relative flex items-center justify-center group">
                                        <input
                                            type="checkbox"
                                            className="peer w-5 h-5 rounded border-2 border-gray-900 text-transparent focus:ring-0 cursor-pointer appearance-none bg-white checked:bg-[#1a2332] checked:border-[#1a2332] transition-all shadow-md group-hover:border-blue-500"
                                            checked={files.length > 0 && selectedFiles.length === files.length}
                                            onChange={handleSelectAll}
                                        />
                                        <svg className="w-3.5 h-3.5 absolute pointer-events-none text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
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
                        <tbody className="text-sm text-gray-900 font-medium">
                            {files.map((file) => (
                                <tr
                                    key={file.id}
                                    onClick={() => handleFileClick(file)}
                                    className={`border-b border-gray-50 cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:shadow-sm ${selectedFiles.includes(file.id) ? 'bg-blue-50' : ''}`}
                                >
                                    <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                                        <div className="relative flex items-center justify-center group">
                                            <input
                                                type="checkbox"
                                                className="peer w-5 h-5 rounded border-2 border-gray-900 text-transparent focus:ring-0 cursor-pointer appearance-none bg-white checked:bg-[#1a2332] checked:border-[#1a2332] transition-all shadow-md group-hover:border-blue-500"
                                                checked={selectedFiles.includes(file.id)}
                                                onChange={(e) => handleSelectOne(e, file.id)}
                                            />
                                            <svg className="w-3.5 h-3.5 absolute pointer-events-none text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded flex items-center justify-center ${file.iconColor}`}>
                                                <Icon
                                                    name={file.type === 'pdf' ? 'file-text' : file.type === 'docx' ? 'file-text' : 'file-text'}
                                                    className={`w-5 h-5`}
                                                />
                                            </div>
                                            <span className="font-medium text-gray-900">{file.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2 text-slate-500 font-bold">{file.date}</td>
                                    <td className="py-3 px-2 text-slate-500 font-bold">{file.uploadDate}</td>
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded-full ${file.uploader.color} flex items-center justify-center text-[10px] font-bold text-white`}>
                                                {file.uploader.initials}
                                            </div>
                                            <span className="text-slate-500 font-bold">{file.uploader.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2 text-slate-500 font-bold">{file.size}</td>
                                    <td className="py-3 px-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Download"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Handle download
                                                }}
                                            >
                                                <Icon name="download" className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(file.id);
                                                }}
                                            >
                                                <Icon name="trash" className="w-4 h-4" />
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
                        <span className="text-sm text-gray-900 font-bold">{selectedFiles.length} files selected</span>
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

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[150]">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden mx-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                    <Icon name="plus" className="w-6 h-6 text-blue-500" />
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
                            <div className="relative group rounded-xl overflow-hidden mb-6 cursor-pointer">
                                <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,#ffffff_0deg,#3b82f6_90deg,#ffffff_180deg,#3b82f6_270deg,#ffffff_360deg)] animate-[spin_3s_linear_infinite] opacity-100" />
                                <div className="relative bg-white rounded-[10px] p-8 flex flex-col items-center justify-center border-[3px] border-dashed border-white bg-clip-padding">
                                    <button className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 mb-4 flex items-center gap-2 transition-all z-10">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        Upload
                                    </button>
                                    <p className="text-sm text-gray-900 font-medium mb-1 z-10">Choose a file or drag & drop it here</p>
                                    <p className="text-xs text-gray-400 z-10">Maximum 500 MB file size</p>
                                </div>
                            </div>

                            <div className="space-y-3">
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
                                                <Icon name="check-circle" className="w-3 h-3" />
                                                Completed
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Menu logic
                                        }}
                                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                    >
                                        <Icon name="menu" className="w-4 h-4" />
                                    </button>
                                </div>

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
                                                        <Icon
                                                            name="check-circle"
                                                            className="w-5 h-5 text-blue-500"
                                                        />
                                                        Uploading...
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
                            <button className="flex-1 py-2.5 bg-[#1a2332] text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/10 hover:bg-[#2c3b52] transition-all flex items-center justify-center gap-2">
                                <Icon name="download" className="w-4 h-4" />
                                Download
                            </button>
                            <button
                                onClick={() => handleDelete(selectedFile.id)}
                                className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                            >
                                <Icon name="trash" className="w-4 h-4" />
                                Delete File
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="flex flex-col items-center mb-8">
                                <div className="w-24 h-32 bg-white border border-gray-100 shadow-sm rounded-xl flex items-center justify-center mb-4 ring-8 ring-gray-50 relative group">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${selectedFile.iconColor}`}>
                                        <Icon name={selectedFile.type === 'pdf' ? 'file-text' : 'file-text'} className="w-6 h-6" />
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
                            <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl ${selectedFile.uploader.color} flex items-center justify-center text-white font-bold text-lg shadow-sm ring-4 ring-white`}>
                                        {selectedFile.uploader.initials}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Uploaded By</p>
                                        <p className="text-base font-bold text-gray-900">{selectedFile.uploader.name}</p>
                                        <p className="text-xs text-gray-400 font-medium">{selectedFile.uploader.role}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                {...modalProps}
            />
        </div>
    );
};
