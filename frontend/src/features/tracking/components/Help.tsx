import { useState } from 'react';

export const Help = () => {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const faqs = [
        {
            q: 'I cannot log in to my account.',
            a: "Ensure you're using the correct email and password. If the issue persists, contact your system administrator to reset your credentials.",
        },
        {
            q: 'A transaction is missing or not showing up.',
            a: 'Refresh the page and try searching again. If the record is still missing, it may not have been encoded yet. Reach out to the encoder assigned to that shipment.',
        },
        {
            q: 'I cannot upload or view a document.',
            a: 'Check your internet connection and try again. If the file still fails to upload, ensure the file size is within limits and the format is supported (PDF, JPG, PNG).',
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

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-10">

            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Help &amp; IT Support</h1>
                <p className="text-sm mt-1 text-text-secondary">
                    Having trouble? Browse common issues below or reach out to the development team.
                </p>
            </div>

            {/* Contact Card */}
            <div className="bg-surface border border-border/60 rounded-lg p-6">
                <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-base font-bold mb-0.5 text-text-primary">Contact IT / Development Team</h2>
                        <p className="text-sm mb-4 text-text-secondary">
                            For system bugs, access issues, or feature requests, reach out directly to the team that built and maintains MorataFMS.
                        </p>
                        <div className="space-y-3 border-t border-border/40 pt-4">
                            {[
                                { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'Email', value: 'seanpaullapasanda@gmail.com' },
                                { icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', label: 'Phone', value: '09635542345' },
                                { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Support Hours', value: 'Monday – Friday, 8:00 AM – 5:00 PM' },
                            ].map(({ icon, label, value }) => (
                                <div key={label} className="flex items-center gap-3">
                                    <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d={icon} />
                                    </svg>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}:</span>
                                        <span className="text-sm font-medium text-text-primary">{value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* System Info Card */}
            <div className="bg-surface border border-border/60 rounded-lg p-6">
                <h2 className="text-base font-bold mb-4 text-text-primary">System Information</h2>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'System Name', value: 'F.M Morata Customs Tracking and File Management' },
                        { label: 'Version', value: '1.0.0' },
                        { label: 'Developer', value: 'TWENTI MILL DEV' },
                        { label: 'Company', value: 'Fely M. Morata Customs Brokerage Services and Law Firm' },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex flex-col gap-0.5 p-3 rounded-lg bg-surface-secondary">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">{label}</span>
                            <span className="text-sm font-semibold text-text-primary">{value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* FAQ Accordion */}
            <div className="bg-surface border border-border/60 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border/40">
                    <h2 className="text-base font-bold text-text-primary">Frequently Asked Questions</h2>
                </div>
                <div className="p-4 space-y-2">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="border border-border/50 rounded-lg overflow-hidden hover:bg-hover/40 transition-colors"
                        >
                            <button
                                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                className="w-full px-5 py-4 flex justify-between items-center text-left gap-4"
                            >
                                <span className="text-sm font-semibold text-text-primary">
                                    {faq.q}
                                </span>
                                <span
                                    className={`text-xl font-light text-text-secondary transition-transform duration-300 ease-out shrink-0 ${openFaq === index ? 'rotate-45' : ''}`}
                                >
                                    +
                                </span>
                            </button>
                            <div
                                className={`px-5 transition-all duration-300 ease-in-out overflow-hidden ${openFaq === index ? 'max-h-48 py-4 border-t border-border/30 opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    {faq.a}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer note */}
            <p className="text-xs text-center text-text-secondary">
                F.M Morata Customs Tracking and File Management System is an internal freight management system maintained by the TWENTI MILL DEV.
            </p>

        </div>
    );
};
