import type { FormTemplate } from '../types/forms.types';

// Column grid: chevron | Book Name | Uploaded By | Files | Date | Actions
export const COLS = '24px 1fr 160px 80px 120px 140px';

export const ATTORNEYS = ['Atty. Reyes', 'Atty. Santos', 'Atty. Cruz'];

export const TEMPLATES: FormTemplate[] = [
    {
        id: 'affidavit',
        title: 'Affidavit Form',
        description: 'Standard sworn statement',
        color: 'from-blue-600 to-indigo-600',
        iconPath: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
        fields: [
            { id: 'republic', label: 'Republic', type: 'text', value: 'Republic of the Philippines', placeholder: '' },
            { id: 'city', label: 'City / Municipality', type: 'text', value: '', placeholder: 'e.g. City of Manila' },
            { id: 'affiant', label: 'Name of Affiant', type: 'text', value: '', placeholder: 'Full legal name' },
            { id: 'age', label: 'Age', type: 'text', value: '', placeholder: 'Age' },
            { id: 'address', label: 'Address', type: 'text', value: '', placeholder: 'Complete address' },
            { id: 'body', label: 'Affidavit Body', type: 'textarea', value: '', placeholder: 'That I am hereby swearing under oath that…', rows: 7 },
            { id: 'date', label: 'Date Executed', type: 'date', value: new Date().toISOString().slice(0, 10) },
            { id: 'signature', label: 'Signature of Affiant', type: 'signature', value: '' },
            { id: 'notary', label: 'Notary Public', type: 'text', value: '', placeholder: 'Name of notary public' },
        ],
    },
    {
        id: 'intern-cert',
        title: 'Intern Certificate',
        description: 'Internship completion certificate',
        color: 'from-blue-600 to-indigo-600',
        iconPath: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
        fields: [
            { id: 'company', label: 'Company Name', type: 'text', value: 'F.M. Morata', placeholder: '' },
            { id: 'intern', label: 'Intern Full Name', type: 'text', value: '', placeholder: 'Full legal name of intern' },
            { id: 'school', label: 'School / University', type: 'text', value: '', placeholder: 'e.g. University of Santo Tomas' },
            { id: 'course', label: 'Course / Program', type: 'text', value: '', placeholder: 'e.g. BS Customs Administration' },
            { id: 'duration', label: 'Internship Duration', type: 'text', value: '', placeholder: 'e.g. January 7 – March 31, 2025' },
            { id: 'hours', label: 'Total Hours Rendered', type: 'text', value: '', placeholder: 'e.g. 360 hours' },
            { id: 'dept', label: 'Department Assigned', type: 'text', value: '', placeholder: 'e.g. Operations Department' },
            { id: 'remarks', label: 'Remarks / Performance', type: 'textarea', value: '', placeholder: 'The intern has satisfactorily completed…', rows: 4 },
            { id: 'issued', label: 'Date Issued', type: 'date', value: new Date().toISOString().slice(0, 10) },
            { id: 'signatory', label: 'Authorized Signatory', type: 'text', value: '', placeholder: 'Name and position' },
        ],
    },
];
