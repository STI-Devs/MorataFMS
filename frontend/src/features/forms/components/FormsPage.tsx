import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '../../tracking/types';
import { TEMPLATES } from '../constants/templates';
import type { Field, FormTemplate } from '../types/forms.types';
import { DocumentPreview } from './DocumentPreview';
import { TemplateCard } from './TemplateCard';

export const FormsPage = () => {
    const { dateTime } = useOutletContext<LayoutContext>();
    const [activeId, setActiveId] = useState<string>('affidavit');
    const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({});

    const activeTemplate: FormTemplate = TEMPLATES.find(t => t.id === activeId) ?? TEMPLATES[0];

    const getFields = (t: FormTemplate): Field[] =>
        t.fields.map(f => ({ ...f, value: fieldValues[t.id]?.[f.id] ?? f.value }));

    const handleChange = (id: string, val: string) =>
        setFieldValues(prev => ({
            ...prev,
            [activeId]: { ...(prev[activeId] ?? {}), [id]: val },
        }));

    return (
        <div className="w-full p-8 pb-12 space-y-7">

            {/* Page header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-text-primary">Forms</h1>
                    <p className="text-base text-text-muted mt-1">F.M. Morata — Document Templates</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-muted">{dateTime.date}</p>
                </div>
            </div>

            {/* Template picker */}
            <div className="space-y-3">
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Select a Template</p>
                <div className="flex flex-wrap gap-3">
                    {TEMPLATES.map(t => (
                        <TemplateCard key={t.id} t={t} active={activeId === t.id} onClick={() => setActiveId(t.id)} />
                    ))}
                </div>
            </div>

            {/* Document preview */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{activeTemplate.title}</p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-bold text-text-secondary bg-surface-secondary hover:bg-hover hover:text-text-primary transition-all border border-border shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Save
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg">
                    <DocumentPreview
                        template={activeTemplate}
                        fields={getFields(activeTemplate)}
                        onFieldChange={handleChange} />
                </div>
            </div>
        </div>
    );
};
