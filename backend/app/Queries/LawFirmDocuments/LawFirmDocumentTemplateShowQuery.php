<?php

namespace App\Queries\LawFirmDocuments;

use App\Models\NotarialTemplate;

class LawFirmDocumentTemplateShowQuery
{
    public function handle(NotarialTemplate $template): NotarialTemplate
    {
        return $template->load('createdBy');
    }
}
