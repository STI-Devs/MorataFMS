import type { Field, FormTemplate } from '../types/forms.types';
import { Underline } from './Underline';

interface Props {
    template: FormTemplate;
    fields: Field[];
    onFieldChange: (id: string, val: string) => void;
}

export const DocumentPreview = ({ template, fields, onFieldChange }: Props) => {
    const val = (id: string) => fields.find(f => f.id === id)?.value ?? '';
    const set = (id: string) => (v: string) => onFieldChange(id, v);
    const isLandscape = template.id === 'intern-cert';

    return (
        <div className={`bg-white text-gray-900 shadow-xl mx-auto font-serif print:shadow-none print:m-0 print:p-0 ${isLandscape ? 'overflow-hidden' : 'rounded-sm'}`}
            style={{
                width: isLandscape ? '1056px' : '816px',
                minHeight: isLandscape ? '816px' : '1056px',
                padding: isLandscape ? '0' : '72px 80px'
            }}>

            <style type="text/css">
                {`
                    @media print {
                        @page { size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'}; margin: 0; }
                        body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        body * { visibility: hidden; }
                        #print-area, #print-area * { visibility: visible; }
                        #print-area { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
                        input.border-b { border-bottom-color: transparent !important; }
                        textarea { border-color: transparent !important; resize: none !important; }
                    }
                `}
            </style>

            <div id="print-area" className="w-full h-full relative">

                {/* ── AFFIDAVIT ── */}
                {template.id === 'affidavit' && (
                    <div className="space-y-5 text-[13px] leading-relaxed">
                        <h1 className="text-center text-base font-bold uppercase tracking-widest mb-6">Affidavit</h1>

                        <div className="flex items-baseline gap-2">
                            <span className="font-semibold shrink-0">Republic:</span>
                            <Underline value={val('republic')} onChange={set('republic')} wide />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="font-semibold shrink-0">City / Municipality:</span>
                            <Underline value={val('city')} onChange={set('city')} placeholder="City of Manila" wide />
                        </div>

                        <div className="border-t border-gray-300 pt-4 space-y-3">
                            <p>
                                I, <Underline value={val('affiant')} onChange={set('affiant')} placeholder="Full legal name" />,{' '}
                                of legal age, <Underline value={val('age')} onChange={set('age')} placeholder="age" />, residing at{' '}
                                <Underline value={val('address')} onChange={set('address')} placeholder="Complete address" wide />,
                                after having been duly sworn in accordance with law, hereby depose and state that:
                            </p>
                            <textarea
                                value={val('body')}
                                onChange={e => onFieldChange('body', e.target.value)}
                                rows={8}
                                placeholder="That I am hereby swearing under oath that…"
                                className="w-full bg-transparent border border-dashed border-gray-300 rounded p-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 resize-y" />
                        </div>

                        <div className="pt-2 flex items-baseline gap-2">
                            <span className="font-semibold shrink-0">Date Executed:</span>
                            <input type="date" value={val('date')} onChange={e => onFieldChange('date', e.target.value)}
                                className="border-b border-gray-800 bg-transparent text-[13px] text-gray-900 focus:outline-none focus:border-blue-600 pb-0.5" />
                        </div>

                        <div className="pt-6 grid grid-cols-2 gap-12">
                            <div>
                                <div className="border-b border-gray-800 h-10" />
                                <p className="text-xs text-center mt-1 text-gray-500">Signature of Affiant</p>
                            </div>
                            <div>
                                <Underline value={val('notary')} onChange={set('notary')} placeholder="Notary Public name" wide />
                                <p className="text-xs text-center mt-1 text-gray-500">Notary Public</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── INTERN CERTIFICATE ── */}
                {template.id === 'intern-cert' && (
                    <div className="w-full h-full relative flex flex-col items-center justify-center text-gray-900 font-serif"
                        style={{ background: '#f9f7f2', padding: '48px 64px', minHeight: '816px' }}>

                        <div className="absolute inset-5 border border-gray-400 rounded pointer-events-none" />
                        <div className="absolute inset-7 border-2 border-gray-700 rounded pointer-events-none" />

                        {['top-6 left-6', 'top-6 right-6', 'bottom-6 left-6', 'bottom-6 right-6'].map((pos, i) => (
                            <div key={i} className={`absolute ${pos} w-10 h-10 pointer-events-none`}>
                                <svg viewBox="0 0 40 40" className="w-full h-full text-gray-500" fill="currentColor">
                                    <path d="M0 0 L12 0 L0 12 Z M40 0 L28 0 L40 12 Z M0 40 L0 28 L12 40 Z M40 40 L28 40 L40 28 Z" opacity="0.4" />
                                </svg>
                            </div>
                        ))}

                        <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-1">
                            <input type="text" value={val('company')} onChange={e => onFieldChange('company', e.target.value)}
                                className="text-center text-xs uppercase tracking-[0.3em] bg-transparent text-gray-500 border-none focus:outline-none focus:text-gray-700 w-64" />
                        </p>

                        <h1 className="text-4xl font-bold tracking-wide text-gray-800 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                            Internship Completion Certificate
                        </h1>

                        <p className="text-sm text-gray-500 italic mb-5">Proudly presented to</p>

                        <div className="border-b-2 border-gray-700 mb-5 w-96 text-center">
                            <input type="text" value={val('intern')} onChange={e => onFieldChange('intern', e.target.value)}
                                placeholder="Intern Full Name"
                                className="text-3xl font-semibold text-center bg-transparent text-gray-900 placeholder:text-gray-300 border-none focus:outline-none w-full pb-1"
                                style={{ fontFamily: 'Georgia, serif' }} />
                        </div>

                        <div className="text-center text-sm leading-relaxed text-gray-700 max-w-xl mb-5">
                            <p>
                                For successfully completing internship as a <strong>
                                    <input type="text" value={val('dept')} onChange={e => onFieldChange('dept', e.target.value)}
                                        placeholder="Department / Role"
                                        className="bg-transparent font-bold border-b border-gray-600 focus:outline-none text-center w-40" />
                                </strong> at <strong>{val('company') || 'F.M. Morata'}</strong>. During the internship period, the intern demonstrated dedication and professionalism that added value to the company.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-8">
                            <span>Internship Period:</span>
                            <strong>
                                <input type="text" value={val('duration')} onChange={e => onFieldChange('duration', e.target.value)}
                                    placeholder="e.g. 1st June 2025 to 31st August 2025"
                                    className="bg-transparent font-bold border-b border-gray-600 focus:outline-none text-center w-72" />
                            </strong>
                        </div>

                        <div className="w-full flex items-end justify-between px-10">
                            <div className="text-center space-y-1">
                                <div className="h-10 flex items-end justify-center italic text-gray-500 text-lg border-b border-gray-500 w-48">
                                    <span className="pb-1 text-gray-400 text-xs">Signature</span>
                                </div>
                                <input type="text" value={val('signatory')} onChange={e => onFieldChange('signatory', e.target.value)}
                                    placeholder="Mr. / Ms. Full Name"
                                    className="text-center text-sm font-semibold bg-transparent text-gray-800 border-none focus:outline-none w-full" />
                                <p className="text-xs text-gray-500">Internship Program Mentor</p>
                            </div>

                            <div className="text-center space-y-1">
                                <p className="text-xs text-gray-500 mb-1">Date of Certification</p>
                                <input type="date" value={val('issued')} onChange={e => onFieldChange('issued', e.target.value)}
                                    className="text-sm font-semibold bg-transparent text-gray-800 border-b border-gray-600 focus:outline-none text-center" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
