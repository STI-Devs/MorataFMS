<?php

namespace App\Queries\Notarial;

use App\Models\NotarialTemplate;

class NotarialTemplateShowQuery
{
    public function handle(NotarialTemplate $template): NotarialTemplate
    {
        return $template->load('createdBy');
    }
}
