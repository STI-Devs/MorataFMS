import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UploadModal } from './UploadModal';
import { FilePreviewModal } from './FilePreviewModal';

interface Section {
    title: string;
    status: string;
    statusColor: string;
    icon: string;
    fileName?: string;
    fileObject?: File;
}

export const TrackingDetails = () => {
    const navigate = useNavigate();
    const { referenceId: id } = useParams();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | null>(null);
    const [previewFile, setPreviewFile] = useState<{ file: File | string | null; name: string } | null>(null);

    const isExport = id?.includes('EXP');

    const importSections: Section[] = [
        {
            title: 'BOC Document Processing',
            status: 'Pending',
            statusColor: 'text-gray-500',
            icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
        },
        {
            title: 'Payment for PPA Charges',
            status: 'Completed',
            statusColor: 'text-green-600',
            icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
            fileName: 'ppa_receipt.pdf'
        },
        {
            title: 'Delivery Order Request',
            status: 'Pending',
            statusColor: 'text-gray-500',
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
        },
        {
            title: 'Payment for Port Charges',
            status: 'Pending',
            statusColor: 'text-gray-500',
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        },
        {
            title: 'Releasing of Documents',
            status: 'Pending',
            statusColor: 'text-gray-500',
            icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'
        },
        {
            title: 'Liquidation and Billing',
            status: 'Pending',
            statusColor: 'text-gray-500',
            icon: 'M9 7h6m0 36v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'
        }
    ];

    const exportSections: Section[] = [
        {
            title: 'BOC Document Processing',
            status: 'Pending',
            statusColor: 'text-gray-500',
            icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
        },
        {
            title: 'Bill of Lading Generation',
            status: 'Pending',
            statusColor: 'text-gray-500',
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
        },
        {
            title: 'CO Application and Releasing',
            status: 'Pending',
            statusColor: 'text-gray-500',
            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
        },
        {
            title: 'DCCCI Printing',
            status: 'Pending',
            statusColor: 'text-gray-500',
            icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z'
        },
        {
            title: 'Billing of Liquidation',
            status: 'Pending',
            statusColor: 'text-gray-500',
            icon: 'M9 7h6m0 36v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'
        }
    ];

    // Initialize state strictly based on isExport from the initial render ID
    // We use a function in useState to lazily evaluate this only on first render
    const [sections, setSections] = useState<Section[]>(() => {
        const initialId = window.location.pathname.split('/').pop() || '';
        return initialId.includes('EXP') ? exportSections : importSections;
    });

    // Update sections when ID changes (e.g. navigation between different transaction types)
    useEffect(() => {
        setSections(isExport ? exportSections : importSections);
    }, [id, isExport]);

    const handleSectionClick = (index: number) => {
        setSelectedSectionIndex(index);
        setIsUploadModalOpen(true);
    };

    const handleUpload = (file: File) => {
        if (selectedSectionIndex !== null) {
            setSections(prev => prev.map((section, idx) => {
                if (idx === selectedSectionIndex) {
                    return {
                        ...section,
                        status: 'Completed',
                        statusColor: 'text-green-600',
                        fileName: file.name,
                        fileObject: file
                    };
                }
                return section;
            }));
            setIsUploadModalOpen(false);
            console.log('Uploaded file for section', selectedSectionIndex, ':', file.name);
        }
    };

    return (
        <div className="flex flex-col">
            {/* Header with Back Button */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-900 dark:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Ref No: {id}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-400">Tracking Dashboard /</span>
                            <span className="text-sm text-gray-900 dark:text-white font-bold">{id}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Overview Card */}
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-700 mb-8 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{id}</h2>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-bold">Bill of Lading: <span className="text-gray-900 dark:text-white font-bold">BL-78542136</span></p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Cleared
                    </span>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section, i) => (
                    <div
                        key={i}
                        className="relative bg-white dark:bg-gray-800 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-700 shadow-md transition-colors"
                    >
                        {/* Plus Button for Upload */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSectionClick(i);
                            }}
                            className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-all shadow-sm active:scale-95 z-10"
                            title="Upload File"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>

                        <div className="flex items-center gap-3 mb-4 pr-10">
                            <div className={`p-2 rounded-xl transition-colors ${section.status === 'Completed'
                                ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                : 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                }`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={section.icon} />
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight pr-4">{section.title}</h3>
                        </div>

                        {/* Filename Display */}
                        {section.status === 'Completed' && section.fileName && (
                            <div className="mb-3 px-1">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                    File Uploaded
                                </p>
                                <div
                                    onClick={() => setPreviewFile({
                                        file: section.fileObject || section.fileName || null,
                                        name: section.fileName || ''
                                    })}
                                    className="group cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-600 transition-colors"
                                >
                                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 truncate group-hover:underline">
                                        {section.fileName}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2 mt-auto pt-2">
                            <span className={`w-2 h-2 rounded-full ${section.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                            <p className={`text-sm font-bold ${section.status === 'Completed' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                {section.status}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleUpload}
                title={selectedSectionIndex !== null ? sections[selectedSectionIndex].title : ''}
            />

            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile?.file || null}
                fileName={previewFile?.name || ''}
            />
        </div>
    );
};
