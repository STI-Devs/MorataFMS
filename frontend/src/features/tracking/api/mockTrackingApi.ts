import { MOCK_EXPORTS, MOCK_IMPORTS } from '../../../data/mockData';
import type { ExportTransaction, ImportTransaction } from '../types';

// Simulated delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockTrackingApi = {
    getImport: async (id: string): Promise<ImportTransaction | undefined> => {
        await delay(500);
        return MOCK_IMPORTS.find(t => t.ref === id);
    },

    getExport: async (id: string): Promise<ExportTransaction | undefined> => {
        await delay(500);
        return MOCK_EXPORTS.find(t => t.ref === id);
    },

    getTransaction: async (id: string): Promise<ImportTransaction | ExportTransaction | undefined> => {
        await delay(500);
        const imp = MOCK_IMPORTS.find(t => t.ref === id);
        if (imp) return imp;
        return MOCK_EXPORTS.find(t => t.ref === id);
    },

    getAllTransactions: async (): Promise<(ImportTransaction | ExportTransaction)[]> => {
        await delay(500);
        return [...MOCK_IMPORTS, ...MOCK_EXPORTS];
    },

    getAllImports: async (): Promise<ImportTransaction[]> => {
        await delay(500);
        return [...MOCK_IMPORTS];
    },

    getAllExports: async (): Promise<ExportTransaction[]> => {
        await delay(500);
        return [...MOCK_EXPORTS];
    }
};
