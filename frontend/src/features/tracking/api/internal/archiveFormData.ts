export function buildArchiveFormData(data: Record<string, unknown>): FormData {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) {
            return;
        }

        if (key === 'documents' && Array.isArray(value)) {
            value.forEach((document, index) => {
                if (!document || typeof document !== 'object') {
                    return;
                }

                const file = 'file' in document ? document.file : null;
                const stage = 'stage' in document ? document.stage : null;

                if (file instanceof File) {
                    formData.append(`documents[${index}][file]`, file);
                }

                if (typeof stage === 'string' && stage !== '') {
                    formData.append(`documents[${index}][stage]`, stage);
                }
            });

            return;
        }

        if (key === 'not_applicable_stages' && Array.isArray(value)) {
            value.forEach((stage, index) => {
                if (typeof stage === 'string' && stage !== '') {
                    formData.append(`not_applicable_stages[${index}]`, stage);
                }
            });

            return;
        }

        formData.append(key, String(value));
    });

    return formData;
}
