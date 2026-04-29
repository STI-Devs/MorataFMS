import { useState } from 'react';
import { Icon, type IconName } from '../../../components/Icon';

interface FaqItem {
    q: string;
    a: string;
}

const FAQS: FaqItem[] = [
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
        a: 'Role changes must be approved by an admin. Please coordinate with the system administrator for account access updates.',
    },
];

const SUPPORT_EMAIL = 'catherinerabuyarevil@gmail.com';
const SUPPORT_PHONE_DISPLAY = '09602601754';
const SUPPORT_PHONE_TEL = '+639602601754';
const SUPPORT_HOURS = 'Monday – Friday, 8:00 AM – 5:00 PM';

const SYSTEM_INFO: Array<{ label: string; value: string }> = [
    { label: 'System Name', value: 'F.M Morata Customs Tracking and File Management' },
    { label: 'Version', value: '1.0.0' },
    { label: 'Developer', value: 'TWENTI MILL DEV' },
    { label: 'Company', value: 'Fely M. Morata Customs Brokerage Services and Law Firm' },
];

export const Help = () => {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div className="min-h-full px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-3xl space-y-6">

                {/* Page header */}
                <header>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary">Help &amp; Support</h1>
                    <p className="mt-1 text-sm text-text-secondary">
                        Browse common issues, find system details, and reach the team that maintains MorataFMS.
                    </p>
                </header>

                {/* Contact Support */}
                <section
                    aria-labelledby="contact-heading"
                    className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
                >
                    <header className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-2">
                            <Icon name="mail" className="h-4 w-4 text-text-muted" />
                            <h2 id="contact-heading" className="text-sm font-bold text-text-primary">Contact Support</h2>
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                            For system bugs, access issues, or feature requests, reach out directly to the team that builds and maintains MorataFMS.
                        </p>
                    </header>
                    <dl className="divide-y divide-border">
                        <ContactRow
                            icon="mail"
                            label="E-mail"
                            value={SUPPORT_EMAIL}
                            href={`mailto:${SUPPORT_EMAIL}`}
                        />
                        <ContactRow
                            icon="phone"
                            label="Phone"
                            value={SUPPORT_PHONE_DISPLAY}
                            href={`tel:${SUPPORT_PHONE_TEL}`}
                        />
                        <ContactRow
                            icon="clock"
                            label="Support Hours"
                            value={SUPPORT_HOURS}
                        />
                    </dl>
                </section>

                {/* System Information */}
                <section
                    aria-labelledby="system-info-heading"
                    className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
                >
                    <header className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-2">
                            <Icon name="settings" className="h-4 w-4 text-text-muted" />
                            <h2 id="system-info-heading" className="text-sm font-bold text-text-primary">System Information</h2>
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                            Reference these values when reporting an issue.
                        </p>
                    </header>
                    <dl className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                        {SYSTEM_INFO.map(({ label, value }, index) => (
                            <div
                                key={label}
                                className={`min-w-0 px-5 py-4 ${
                                    index >= 2 ? 'sm:border-t sm:border-border' : ''
                                }`}
                            >
                                <dt className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</dt>
                                <dd className="mt-0.5 text-sm font-medium text-text-primary">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                {/* FAQ */}
                <section
                    aria-labelledby="faq-heading"
                    className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
                >
                    <header className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-2">
                            <Icon name="alert-circle" className="h-4 w-4 text-text-muted" />
                            <h2 id="faq-heading" className="text-sm font-bold text-text-primary">Frequently Asked Questions</h2>
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                            Quick answers to the most common issues.
                        </p>
                    </header>
                    <ul className="divide-y divide-border">
                        {FAQS.map((faq, index) => {
                            const isOpen = openFaq === index;
                            const panelId = `faq-panel-${index}`;
                            const buttonId = `faq-trigger-${index}`;
                            return (
                                <li key={faq.q}>
                                    <h3 className="m-0">
                                        <button
                                            id={buttonId}
                                            type="button"
                                            aria-expanded={isOpen}
                                            aria-controls={panelId}
                                            onClick={() => setOpenFaq(isOpen ? null : index)}
                                            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-hover/40 focus:outline-none focus-visible:bg-hover/60"
                                        >
                                            <span className="text-sm font-semibold text-text-primary">{faq.q}</span>
                                            <Icon
                                                name="chevron-down"
                                                className={`h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 ${
                                                    isOpen ? 'rotate-180 text-text-primary' : ''
                                                }`}
                                            />
                                        </button>
                                    </h3>
                                    {isOpen && (
                                        <div
                                            id={panelId}
                                            role="region"
                                            aria-labelledby={buttonId}
                                            className="border-t border-border/40 bg-surface-secondary/20 px-5 py-4"
                                        >
                                            <p className="text-sm leading-relaxed text-text-secondary">{faq.a}</p>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </section>

                {/* Footer note */}
                <p className="text-center text-xs text-text-muted">
                    F.M Morata Customs Tracking and File Management is an internal system maintained by TWENTI MILL DEV.
                </p>

            </div>
        </div>
    );
};

interface ContactRowProps {
    icon: IconName;
    label: string;
    value: string;
    href?: string;
}

function ContactRow({ icon, label, value, href }: ContactRowProps) {
    return (
        <div className="flex items-center gap-4 px-5 py-4">
            <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500"
                aria-hidden="true"
            >
                <Icon name={icon} className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</dt>
                <dd className="mt-0.5 truncate">
                    {href ? (
                        <a
                            href={href}
                            className="text-sm font-medium text-blue-500 transition-colors hover:text-blue-600 hover:underline"
                        >
                            {value}
                        </a>
                    ) : (
                        <span className="text-sm font-medium text-text-primary">{value}</span>
                    )}
                </dd>
            </div>
        </div>
    );
}

