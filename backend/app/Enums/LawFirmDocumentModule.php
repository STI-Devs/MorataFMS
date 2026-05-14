<?php

namespace App\Enums;

enum LawFirmDocumentModule: string
{
    case Notarial = 'notarial';
    case Legal = 'legal';

    public function storagePrefix(): string
    {
        return match ($this) {
            self::Notarial => 'notarial',
            self::Legal => 'legal',
        };
    }

    public static function fromNullable(?string $value): self
    {
        return self::tryFrom((string) $value) ?? self::Notarial;
    }
}
