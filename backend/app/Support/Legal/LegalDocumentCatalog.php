<?php

namespace App\Support\Legal;

use Illuminate\Support\Str;

class LegalDocumentCatalog
{
    /**
     * @return list<array{code: string, label: string}>
     */
    public static function notarialActTypes(): array
    {
        return [
            ['code' => 'jurat', 'label' => 'Jurat'],
            ['code' => 'acknowledgment', 'label' => 'Acknowledgment'],
            ['code' => 'oath_affirmation', 'label' => 'Oath / Affirmation'],
        ];
    }

    /**
     * @return list<array{code: string, label: string}>
     */
    public static function templateFieldTypes(): array
    {
        return [
            ['code' => 'text', 'label' => 'Text'],
            ['code' => 'textarea', 'label' => 'Long Text'],
            ['code' => 'date', 'label' => 'Date'],
            ['code' => 'number', 'label' => 'Number'],
            ['code' => 'email', 'label' => 'Email'],
            ['code' => 'select', 'label' => 'Select'],
        ];
    }

    /**
     * @return list<array{code: string, label: string, description: string}>
     */
    public static function categories(): array
    {
        return self::notarialCategories();
    }

    /**
     * @return list<array{code: string, label: string, description: string}>
     */
    public static function notarialCategories(): array
    {
        return [
            [
                'code' => 'affidavit_oath',
                'label' => 'Affidavits / Oaths',
                'description' => 'Affidavits, sworn statements, and oath-based notarial documents.',
            ],
            [
                'code' => 'power_of_attorney',
                'label' => 'Power of Attorney',
                'description' => 'Representation and authority documents commonly notarized through acknowledgment.',
            ],
            [
                'code' => 'real_estate',
                'label' => 'Real Estate Documents',
                'description' => 'Property and deed-related documents commonly prepared and notarized in legal practice.',
            ],
            [
                'code' => 'business',
                'label' => 'Business Documents',
                'description' => 'Contracts, certificates, and business instruments used for notarized output.',
            ],
            [
                'code' => 'other',
                'label' => 'Other Notarial Records',
                'description' => 'Fallback document templates when the exact notarial title is not yet in the catalog.',
            ],
        ];
    }

    /**
     * @return list<array{code: string, label: string, description: string}>
     */
    public static function legalFileCategories(): array
    {
        return [
            [
                'code' => 'intern_records',
                'label' => 'Intern Records',
                'description' => 'Completion and intern-related files kept for archive purposes only.',
            ],
            [
                'code' => 'case_documents',
                'label' => 'Case Documents',
                'description' => 'Case or correspondence files stored in the legal archive outside the notarial template flow.',
            ],
            [
                'code' => 'other_legal_files',
                'label' => 'Other Legal Files',
                'description' => 'Fallback archive-only records that do not belong in the notarial template workspace.',
            ],
        ];
    }

    /**
     * @return list<string>
     */
    public static function categoryCodes(): array
    {
        return array_column(self::notarialCategories(), 'code');
    }

    /**
     * @return list<array{code: string, label: string, category: string, default_notarial_act_type: string}>
     */
    public static function documentTypes(): array
    {
        return self::notarialDocumentTypes();
    }

    /**
     * @return list<array{code: string, label: string, category: string, default_notarial_act_type: string}>
     */
    public static function notarialDocumentTypes(): array
    {
        return [
            ['code' => 'AFFIDAVIT_GENERAL', 'label' => 'Affidavit / Oath', 'category' => 'affidavit_oath', 'default_notarial_act_type' => 'jurat'],
            ['code' => 'AFFIDAVIT_LOSS', 'label' => 'Affidavit of Loss', 'category' => 'affidavit_oath', 'default_notarial_act_type' => 'jurat'],
            ['code' => 'AFFIDAVIT_NO_INCOME', 'label' => 'Affidavit of No Income', 'category' => 'affidavit_oath', 'default_notarial_act_type' => 'jurat'],
            ['code' => 'AFFIDAVIT_LOW_INCOME', 'label' => 'Affidavit of Low Income', 'category' => 'affidavit_oath', 'default_notarial_act_type' => 'jurat'],
            ['code' => 'AFFIDAVIT_NO_SUPPORT', 'label' => 'Affidavit of No Support', 'category' => 'affidavit_oath', 'default_notarial_act_type' => 'jurat'],
            ['code' => 'AFFIDAVIT_SUPPORT', 'label' => 'Affidavit of Support', 'category' => 'affidavit_oath', 'default_notarial_act_type' => 'jurat'],
            ['code' => 'AFFIDAVIT_TWO_DISINTERESTED_PERSONS', 'label' => 'Affidavit of Two Disinterested Persons', 'category' => 'affidavit_oath', 'default_notarial_act_type' => 'jurat'],
            ['code' => 'AFFIDAVIT_DISCREPANCY', 'label' => 'Affidavit of Discrepancy', 'category' => 'affidavit_oath', 'default_notarial_act_type' => 'jurat'],
            ['code' => 'AFFIDAVIT_UNDERTAKING', 'label' => 'Affidavit of Undertaking', 'category' => 'affidavit_oath', 'default_notarial_act_type' => 'jurat'],
            ['code' => 'AFFIDAVIT_GUARDIANSHIP', 'label' => 'Affidavit of Guardianship', 'category' => 'affidavit_oath', 'default_notarial_act_type' => 'jurat'],
            ['code' => 'AFFIDAVIT_CAR_ACCIDENT', 'label' => 'Affidavit of Car Accident', 'category' => 'affidavit_oath', 'default_notarial_act_type' => 'jurat'],
            ['code' => 'AFFIDAVIT_OWN_ACCIDENT', 'label' => 'Affidavit of Own Accident', 'category' => 'affidavit_oath', 'default_notarial_act_type' => 'jurat'],
            ['code' => 'AFFIDAVIT_CHANGE_OF_INFORMATION', 'label' => 'Affidavit of Change of Information', 'category' => 'affidavit_oath', 'default_notarial_act_type' => 'jurat'],
            ['code' => 'AFFIDAVIT_EXPLANATION', 'label' => 'Affidavit of Explanation', 'category' => 'affidavit_oath', 'default_notarial_act_type' => 'jurat'],
            ['code' => 'AFFIDAVIT_NO_CLIENT', 'label' => 'Affidavit of No Client', 'category' => 'affidavit_oath', 'default_notarial_act_type' => 'jurat'],
            ['code' => 'AFFIDAVIT_NO_REPRESENTATIVE', 'label' => 'Affidavit of No Representative', 'category' => 'affidavit_oath', 'default_notarial_act_type' => 'jurat'],
            ['code' => 'AFFIDAVIT_NO_OPERATION', 'label' => 'Affidavit of No Operation', 'category' => 'affidavit_oath', 'default_notarial_act_type' => 'jurat'],
            ['code' => 'SWORN_STATEMENT', 'label' => 'Sworn Statement', 'category' => 'affidavit_oath', 'default_notarial_act_type' => 'jurat'],
            ['code' => 'SPECIAL_POWER_OF_ATTORNEY', 'label' => 'Special Power of Attorney', 'category' => 'power_of_attorney', 'default_notarial_act_type' => 'acknowledgment'],
            ['code' => 'POWER_OF_ATTORNEY_GENERAL', 'label' => 'Power of Attorney', 'category' => 'power_of_attorney', 'default_notarial_act_type' => 'acknowledgment'],
            ['code' => 'CONTRACT_OF_LEASE', 'label' => 'Contract of Lease', 'category' => 'real_estate', 'default_notarial_act_type' => 'acknowledgment'],
            ['code' => 'DEED_OF_SALE_MOTOR_VEHICLE', 'label' => 'Deed of Sale - Motor Vehicle', 'category' => 'real_estate', 'default_notarial_act_type' => 'acknowledgment'],
            ['code' => 'DEED_OF_SALE_REAL_PROPERTY', 'label' => 'Deed of Sale - Real Property', 'category' => 'real_estate', 'default_notarial_act_type' => 'acknowledgment'],
            ['code' => 'DEED_OF_SALE_FIREARM', 'label' => 'Deed of Sale - Firearm', 'category' => 'real_estate', 'default_notarial_act_type' => 'acknowledgment'],
            ['code' => 'CONTRACT_TO_SELL', 'label' => 'Contract to Sell', 'category' => 'real_estate', 'default_notarial_act_type' => 'acknowledgment'],
            ['code' => 'REAL_ESTATE_GENERAL', 'label' => 'Real Estate Document', 'category' => 'real_estate', 'default_notarial_act_type' => 'acknowledgment'],
            ['code' => 'AGREEMENT', 'label' => 'Agreement', 'category' => 'business', 'default_notarial_act_type' => 'acknowledgment'],
            ['code' => 'CONTRACT_AGREEMENT', 'label' => 'Contract Agreement', 'category' => 'business', 'default_notarial_act_type' => 'acknowledgment'],
            ['code' => 'COMPROMISE_AGREEMENT', 'label' => 'Compromise Agreement', 'category' => 'business', 'default_notarial_act_type' => 'acknowledgment'],
            ['code' => 'WAIVER_OF_RIGHT', 'label' => 'Waiver of Right', 'category' => 'business', 'default_notarial_act_type' => 'acknowledgment'],
            ['code' => 'SECRETARY_CERTIFICATE', 'label' => 'Secretary Certificate', 'category' => 'business', 'default_notarial_act_type' => 'acknowledgment'],
            ['code' => 'BUSINESS_DOCUMENT_GENERAL', 'label' => 'Business Document', 'category' => 'business', 'default_notarial_act_type' => 'acknowledgment'],
            ['code' => 'OTHER_NOTARIAL_DOCUMENT', 'label' => 'Other Notarial Document', 'category' => 'other', 'default_notarial_act_type' => 'acknowledgment'],
        ];
    }

    /**
     * @return list<array{code: string, label: string, category: string}>
     */
    public static function legalFileTypes(): array
    {
        return [
            ['code' => 'CERTIFICATE_OF_COMPLETION_INTERNS', 'label' => 'Certificate of Completion (Interns)', 'category' => 'intern_records'],
            ['code' => 'POSITION_PAPER', 'label' => 'Position Paper', 'category' => 'case_documents'],
            ['code' => 'DEMAND_LETTER', 'label' => 'Demand Letter', 'category' => 'case_documents'],
            ['code' => 'OTHER_LEGAL_FILE', 'label' => 'Other Legal File', 'category' => 'other_legal_files'],
        ];
    }

    /**
     * @return list<string>
     */
    public static function documentCodes(): array
    {
        return array_column(self::notarialDocumentTypes(), 'code');
    }

    /**
     * @return list<string>
     */
    public static function legalFileCodes(): array
    {
        return array_column(self::legalFileTypes(), 'code');
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function findDocumentType(string $code): ?array
    {
        foreach (self::notarialDocumentTypes() as $documentType) {
            if ($documentType['code'] === $code) {
                return $documentType;
            }
        }

        return null;
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function findLegalFileType(string $code): ?array
    {
        foreach (self::legalFileTypes() as $fileType) {
            if ($fileType['code'] === $code) {
                return $fileType;
            }
        }

        return null;
    }

    public static function labelForCode(?string $code): ?string
    {
        if (! is_string($code) || $code === '') {
            return null;
        }

        return self::findDocumentType($code)['label'] ?? null;
    }

    public static function labelForLegalFileCode(?string $code): ?string
    {
        if (! is_string($code) || $code === '') {
            return null;
        }

        return self::findLegalFileType($code)['label'] ?? null;
    }

    public static function labelForCategory(?string $category): ?string
    {
        if (! is_string($category) || $category === '') {
            return null;
        }

        foreach (self::notarialCategories() as $item) {
            if ($item['code'] === $category) {
                return $item['label'];
            }
        }

        return null;
    }

    public static function labelForLegalFileCategory(?string $category): ?string
    {
        if (! is_string($category) || $category === '') {
            return null;
        }

        foreach (self::legalFileCategories() as $item) {
            if ($item['code'] === $category) {
                return $item['label'];
            }
        }

        return null;
    }

    public static function labelForNotarialActType(?string $code): ?string
    {
        if (! is_string($code) || $code === '') {
            return null;
        }

        foreach (self::notarialActTypes() as $item) {
            if ($item['code'] === $code) {
                return $item['label'];
            }
        }

        return null;
    }

    public static function categoryForCode(?string $code): ?string
    {
        if (! is_string($code) || $code === '') {
            return null;
        }

        return self::findDocumentType($code)['category'] ?? null;
    }

    public static function legalFileCategoryForCode(?string $code): ?string
    {
        if (! is_string($code) || $code === '') {
            return null;
        }

        return self::findLegalFileType($code)['category'] ?? null;
    }

    public static function defaultNotarialActTypeForCode(?string $code): ?string
    {
        if (! is_string($code) || $code === '') {
            return null;
        }

        return self::findDocumentType($code)['default_notarial_act_type'] ?? null;
    }

    /**
     * @return list<array{code: string, label: string, description: string, document_types: list<array{code: string, label: string, category: string, default_notarial_act_type: string}>}>
     */
    public static function groupedDocumentTypes(): array
    {
        return self::groupedNotarialDocumentTypes();
    }

    /**
     * @return list<array{code: string, label: string, description: string, document_types: list<array{code: string, label: string, category: string, default_notarial_act_type: string}>}>
     */
    public static function groupedNotarialDocumentTypes(): array
    {
        $documentTypes = self::notarialDocumentTypes();

        return array_map(function (array $category) use ($documentTypes): array {
            $category['document_types'] = array_values(array_filter(
                $documentTypes,
                fn (array $documentType): bool => $documentType['category'] === $category['code'],
            ));

            return $category;
        }, self::notarialCategories());
    }

    /**
     * @return list<array{code: string, label: string, description: string, file_types: list<array{code: string, label: string, category: string}>}>
     */
    public static function groupedLegalFileTypes(): array
    {
        $fileTypes = self::legalFileTypes();

        return array_map(function (array $category) use ($fileTypes): array {
            $category['file_types'] = array_values(array_filter(
                $fileTypes,
                fn (array $fileType): bool => $fileType['category'] === $category['code'],
            ));

            return $category;
        }, self::legalFileCategories());
    }

    public static function inferDocumentCode(?string $category, ?string $title = null): string
    {
        $normalizedTitle = Str::of((string) $title)->lower()->squish()->value();

        $keywordMap = [
            'affidavit of loss' => 'AFFIDAVIT_LOSS',
            'affidavit of no income' => 'AFFIDAVIT_NO_INCOME',
            'affidavit of low income' => 'AFFIDAVIT_LOW_INCOME',
            'affidavit of no support' => 'AFFIDAVIT_NO_SUPPORT',
            'affidavit of support' => 'AFFIDAVIT_SUPPORT',
            'two disinterested persons' => 'AFFIDAVIT_TWO_DISINTERESTED_PERSONS',
            'affidavit of discrepancy' => 'AFFIDAVIT_DISCREPANCY',
            'affidavit of undertaking' => 'AFFIDAVIT_UNDERTAKING',
            'affidavit of guardianship' => 'AFFIDAVIT_GUARDIANSHIP',
            'affidavit of car accident' => 'AFFIDAVIT_CAR_ACCIDENT',
            'affidavit of own accident' => 'AFFIDAVIT_OWN_ACCIDENT',
            'affidavit of change of information' => 'AFFIDAVIT_CHANGE_OF_INFORMATION',
            'affidavit of explanation' => 'AFFIDAVIT_EXPLANATION',
            'affidavit of no client' => 'AFFIDAVIT_NO_CLIENT',
            'affidavit of no representative' => 'AFFIDAVIT_NO_REPRESENTATIVE',
            'affidavit of no operation' => 'AFFIDAVIT_NO_OPERATION',
            'sworn statement' => 'SWORN_STATEMENT',
            'special power of attorney' => 'SPECIAL_POWER_OF_ATTORNEY',
            'power of attorney' => 'POWER_OF_ATTORNEY_GENERAL',
            'contract of lease' => 'CONTRACT_OF_LEASE',
            'deed of sale motor vehicle' => 'DEED_OF_SALE_MOTOR_VEHICLE',
            'deed of sale real property' => 'DEED_OF_SALE_REAL_PROPERTY',
            'deed of sale firearm' => 'DEED_OF_SALE_FIREARM',
            'contract to sell' => 'CONTRACT_TO_SELL',
            'contract agreement' => 'CONTRACT_AGREEMENT',
            'agreement' => 'AGREEMENT',
            'compromise agreement' => 'COMPROMISE_AGREEMENT',
            'waiver of right' => 'WAIVER_OF_RIGHT',
            'secretary certificate' => 'SECRETARY_CERTIFICATE',
        ];

        foreach ($keywordMap as $keyword => $code) {
            if (Str::contains($normalizedTitle, $keyword)) {
                return $code;
            }
        }

        return match ($category) {
            'affidavit_oath', 'affidavit' => 'AFFIDAVIT_GENERAL',
            'power_of_attorney' => 'POWER_OF_ATTORNEY_GENERAL',
            'real_estate' => 'REAL_ESTATE_GENERAL',
            'business', 'business_doc' => 'BUSINESS_DOCUMENT_GENERAL',
            default => 'OTHER_NOTARIAL_DOCUMENT',
        };
    }
}
