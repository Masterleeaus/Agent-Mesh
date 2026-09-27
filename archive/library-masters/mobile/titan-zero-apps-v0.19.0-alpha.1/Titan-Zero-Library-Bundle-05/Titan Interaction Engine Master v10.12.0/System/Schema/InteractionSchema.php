<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Schema;

class InteractionSchema
{
    public static function getSchema(): array
    {
        return [
            'type' => 'object',
            'required' => ['id', 'version', 'name', 'capability', 'sections'],
            'properties' => [
                'id' => ['type' => 'string', 'pattern' => '^[a-z0-9\.\-_]+$'],
                'version' => ['type' => 'string', 'pattern' => '^\d+\.\d+\.\d+$'],
                'name' => ['type' => 'string', 'minLength' => 1],
                'description' => ['type' => 'string'],
                'category' => ['type' => 'string'],
                'type' => ['type' => 'string', 'enum' => ['wizard', 'voice', 'checklist', 'conversation', 'form', 'sop']],
                'permissions' => ['type' => 'array', 'items' => ['type' => 'string']],
                'capability' => ['type' => 'string', 'pattern' => '^[a-z][a-z0-9._-]*$'],
                'sections' => [
                    'type' => 'array',
                    'minItems' => 1,
                    'items' => [
                        'type' => 'object',
                        'required' => ['id', 'title', 'questions'],
                        'properties' => [
                            'id' => ['type' => 'string'],
                            'title' => ['type' => 'string'],
                            'questions' => [
                                'type' => 'array',
                                'items' => [
                                    'type' => 'object',
                                    'required' => ['key', 'question', 'response_type'],
                                    'properties' => [
                                        'key' => ['type' => 'string'],
                                        'question' => ['type' => 'string'],
                                        'response_type' => ['type' => 'string', 'enum' => ['text','email','phone','address','select','multi_select','boolean','long_text','date','datetime','money','number','integer','file','array','repeatable_collection']],
                                        'options' => ['type' => 'array'],
                                        'options_source' => ['type' => 'string'],
                                        'validation' => ['type' => 'object'],
                                        'default' => ['anyOf' => [['type' => 'string'], ['type' => 'number'], ['type' => 'boolean']]],
                                        'optional' => ['type' => 'boolean'],
                                        'handling' => ['type' => 'string', 'enum' => ['ask','lookup','infer','predict','compute','api','cache','policy','local_intelligence','device']],
                                        'priority' => ['type' => 'string'],
                                        'condition' => ['type' => 'string'],
                                        'metadata' => ['type' => 'object'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                'metadata' => ['type' => 'object'],
            ],
        ];
    }
}
