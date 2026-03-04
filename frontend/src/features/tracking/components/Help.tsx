import { useState } from 'react';

const FAQS = [
    {
        q: 'I cannot log in to my account.',
        a: "Ensure you're using the correct email and password. If the issue persists, contact your system administrator to reset your credentials.",
    },
    {
        q: 'A transaction is missing or not showing up.',
        a: 'Refresh the page and try searching again. If the record is still missing, it may not have been encoded yet. Reach out to the encoder assigned to that shipment.',
    },
    {
        q: 'How do I upload a document?',
        a: 'Navigate to the Documents page, select the relevant transaction, then click "Upload Document". Supported formats are PDF, JPG, and PNG.',
    },
    {
        q: 'A file failed to upload.',
        a: 'Check your internet connection and try again. Ensure the file size is within limits and the format is supported (PDF, JPG, PNG).',
    },
    {
        q: 'The system is slow or not responding.',
        a: 'Clear your browser cache (Ctrl+Shift+R) and reload. If the issue continues, please contact IT support immediately.',
    },
    {
        q: 'I need to change my role or permissions.',
        a: "Role changes must be approved by a supervisor or admin. Please contact your manager and they will coordinate with the system administrator.",
    },
];

const CONTACT = [
    { label: 'Email',           value: 'support@morata.com', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { label: 'Phone',           value: '09635542345',        icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
    { label: 'Support Hours',   value: 'Mon–Fri, 8:00 AM–5:00 PM', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
];

export const Help = () => {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-10 p-4">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Help &amp; IT Support</h1>
                <p className="text-sm mt-1 text-text-secondary">
                    Frequently asked questions and contact information.
                </p>
            </div>

            {/* FAQ */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                    <h2 className="text-sm font-bold text-text-primary">Frequently Asked Questions</h2>
                </div>
                {FAQS.map((faq, index) => (
                    <div key={index} className="border-b border-border last:border-0">
                        <button
                            onClick={() => setOpenFaq(openFaq === index ? null : index)}
                            className="w-full flex justify-between items-center px-5 py-4 text-left hover:bg-hover transition-colors"
                        >
                            <span className="text-sm font-semibold text-text-primary">{faq.q}</span>
                            <svg
                                className={`w-4 h-4 text-text-muted shrink-0 ml-4 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-48 py-4 px-5 border-t border-border/30' : 'max-h-0'}`}>
                            <p className="text-sm text-text-secondary leading-relaxed">{faq.a}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Contact */}
            <div className="bg-surface border border-border rounded-xl p-6">
                <h2 className="text-sm font-bold mb-4 text-text-primary">Contact Support</h2>
                <div className="space-y-3">
                    {CONTACT.map(({ label, value, icon }) => (
                        <div key={label} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-surface-tint border border-border-tint flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                                </svg>
                            </div>
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}:</span>
                                <span className="text-sm font-medium text-text-primary ml-2">{value}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* System Info */}
            <div className="bg-surface border border-border rounded-xl p-6">
                <h2 className="text-sm font-bold mb-4 text-text-primary">System Information</h2>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'System Name', value: 'F.M Morata Customs Tracking and File Management' },
                        { label: 'Version',     value: '1.0.0' },
                        { label: 'Maintained by', value: 'TWENTI MILL DEV' },
                        { label: 'Est.',         value: '2026' },
                    ].map(({ label, value }) => (
                        <div key={label}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
                            <p className="text-sm text-text-primary mt-0.5">{value}</p>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-xs text-center text-text-muted">
                F.M Morata Customs Tracking and File Management System is an internal freight management system maintained by TWENTI MILL DEV.
            </p>
        </div>
    );
};
