<?php

namespace App\Extensions\Chatbot\System\Services\Builder;

use App\Extensions\Chatbot\System\Models\ChatbotBuilder;
use App\Extensions\Chatbot\System\Models\ChatbotBuilderTemplate;
use App\Extensions\Chatbot\System\Models\ChatbotBuilderChannel;
use Illuminate\Support\Facades\DB;

class ChatbotBuilderService
{
    protected const STEPS = ['configure', 'customize', 'train', 'embed', 'channel'];

    public function createBuilder(string $tenantId, array $data = []): ChatbotBuilder
    {
        return ChatbotBuilder::create([
            'tenant_id' => $tenantId,
            'chatbot_id' => $data['chatbot_id'] ?? null,
            'step_current' => 'configure',
            'publish_status' => 'draft',
            'config' => [
                'title' => $data['title'] ?? 'My Assistant',
                'bubble_message' => $data['bubble_message'] ?? 'Hey there, how can we help you?',
                'welcome_message' => $data['welcome_message'] ?? 'Hi, how can I assist you today?',
                'instructions' => $data['instructions'] ?? '',
            ],
            'theme_settings' => [
                'colors' => [
                    'primary' => '#667eea',
                    'secondary' => '#764ba2',
                    'accent' => '#4CAF50',
                ],
                'header_background' => [
                    'type' => 'gradient',
                    'value' => 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                ],
            ],
        ]);
    }

    public function getBuilder(string $tenantId, int $builderId): ?ChatbotBuilder
    {
        return ChatbotBuilder::where('tenant_id', $tenantId)
            ->where('id', $builderId)
            ->with(['chatbot'])
            ->first();
    }

    public function updateStep(int $builderId, string $step, array $data): ChatbotBuilder
    {
        $builder = ChatbotBuilder::findOrFail($builderId);

        if (!in_array($step, self::STEPS)) {
            throw new \InvalidArgumentException("Invalid step: $step");
        }

        // Update specific step configuration
        match ($step) {
            'configure' => $this->updateConfigureStep($builder, $data),
            'customize' => $this->updateCustomizeStep($builder, $data),
            'train' => $this->updateTrainStep($builder, $data),
            'embed' => $this->updateEmbedStep($builder, $data),
            'channel' => $this->updateChannelStep($builder, $data),
        };

        $builder->step_current = $step;
        $builder->save();

        // Log the activity
        $this->logActivity($builder->tenant_id, auth()->id() ?? 'system', $builderId, 'update', $step, $data);

        return $builder;
    }

    protected function updateConfigureStep(ChatbotBuilder $builder, array $data): void
    {
        $config = $builder->config ?? [];

        if (isset($data['title'])) $config['title'] = $data['title'];
        if (isset($data['bubble_message'])) $config['bubble_message'] = $data['bubble_message'];
        if (isset($data['welcome_message'])) $config['welcome_message'] = $data['welcome_message'];
        if (isset($data['instructions'])) $config['instructions'] = $data['instructions'];
        if (isset($data['training_sources'])) $config['training_sources'] = $data['training_sources'];

        $builder->config = $config;
        $builder->save();
    }

    protected function updateCustomizeStep(ChatbotBuilder $builder, array $data): void
    {
        $customization = $builder->customization ?? [];

        // Store feature toggles and customization options
        if (isset($data['email_collect'])) $customization['email_collect'] = (bool)$data['email_collect'];
        if (isset($data['contact_us'])) $customization['contact_us'] = (bool)$data['contact_us'];
        if (isset($data['enable_emoji'])) $customization['enable_emoji'] = (bool)$data['enable_emoji'];
        if (isset($data['links_in_welcome'])) $customization['links_in_welcome'] = (bool)$data['links_in_welcome'];

        $builder->customization = $customization;

        // Update theme settings
        if (isset($data['theme'])) {
            $this->updateThemeSettings($builder, $data['theme']);
        }

        $builder->save();
    }

    protected function updateThemeSettings(ChatbotBuilder $builder, array $theme): void
    {
        $settings = $builder->theme_settings ?? [];

        if (isset($theme['accent_color'])) {
            $settings['colors']['primary'] = $theme['accent_color'];
            $settings['colors']['accent'] = $theme['accent_color'];
        }

        if (isset($theme['header_background'])) {
            $settings['header_background'] = $theme['header_background'];
        }

        $builder->theme_settings = $settings;
    }

    protected function updateTrainStep(ChatbotBuilder $builder, array $data): void
    {
        $config = $builder->config ?? [];

        if (isset($data['training_data'])) {
            $config['training_data'] = $data['training_data'];
        }
        if (isset($data['knowledge_sources'])) {
            $config['knowledge_sources'] = $data['knowledge_sources'];
        }

        $builder->config = $config;
        $builder->save();
    }

    protected function updateEmbedStep(ChatbotBuilder $builder, array $data): void
    {
        $config = $builder->config ?? [];

        if (isset($data['embed_code'])) {
            $config['embed_code'] = $data['embed_code'];
        }
        if (isset($data['embed_position'])) {
            $config['embed_position'] = $data['embed_position'];
        }

        $builder->config = $config;
        $builder->save();
    }

    protected function updateChannelStep(ChatbotBuilder $builder, array $data): void
    {
        if (isset($data['channels'])) {
            foreach ($data['channels'] as $channelType => $config) {
                ChatbotBuilderChannel::updateOrCreate(
                    [
                        'tenant_id' => $builder->tenant_id,
                        'builder_config_id' => $builder->id,
                        'channel_type' => $channelType,
                    ],
                    [
                        'channel_config' => $config,
                        'enabled' => $config['enabled'] ?? false,
                        'enabled_at' => ($config['enabled'] ?? false) ? now() : null,
                    ]
                );
            }
        }
    }

    public function publishBuilder(int $builderId): ChatbotBuilder
    {
        $builder = ChatbotBuilder::findOrFail($builderId);

        // Verify all required steps are completed
        if (!$this->isBuilderComplete($builder)) {
            throw new \Exception('Builder must complete all steps before publishing');
        }

        $builder->publish_status = 'published';
        $builder->save();

        $this->logActivity($builder->tenant_id, auth()->id() ?? 'system', $builderId, 'publish', null, []);

        return $builder;
    }

    public function generatePreview(int $builderId, string $deviceType = 'mobile'): array
    {
        $builder = ChatbotBuilder::findOrFail($builderId);

        return [
            'device_type' => $deviceType,
            'header_html' => $this->generateHeaderPreview($builder),
            'chat_bubble_html' => $this->generateChatBubblePreview($builder),
            'theme_css' => $this->generateThemeCSS($builder),
            'responsive' => $this->getResponsiveClasses($deviceType),
        ];
    }

    protected function generateHeaderPreview(ChatbotBuilder $builder): string
    {
        $background = $builder->getHeaderBackground();
        $title = $builder->getConfigValue('title', 'Assistant');

        $backgroundCSS = $background['type'] === 'gradient'
            ? "background: {$background['value']};"
            : "background: url('{$background['value']}') center/cover;";

        return <<<HTML
<div class="chatbot-header" style="$backgroundCSS">
    <h3 class="text-white">$title</h3>
    <p class="text-light">Online • Always here to help</p>
</div>
HTML;
    }

    protected function generateChatBubblePreview(ChatbotBuilder $builder): string
    {
        $bubbleMessage = $builder->getConfigValue('bubble_message', 'How can we help?');
        $accentColor = $builder->getThemeColor('primary', '#667eea');

        return <<<HTML
<div class="chat-bubble" style="background-color: $accentColor;">
    <div class="bubble-avatar"></div>
    <div class="bubble-content">
        <p class="bubble-message">$bubbleMessage</p>
        <span class="bubble-time">1h ago</span>
    </div>
    <button class="bubble-action">Start Chat →</button>
</div>
HTML;
    }

    protected function generateThemeCSS(ChatbotBuilder $builder): string
    {
        $primary = $builder->getThemeColor('primary', '#667eea');
        $secondary = $builder->getThemeColor('secondary', '#764ba2');
        $accent = $builder->getThemeColor('accent', '#4CAF50');

        return <<<CSS
:root {
    --chatbot-primary: $primary;
    --chatbot-secondary: $secondary;
    --chatbot-accent: $accent;
}

.chatbot-container {
    background-color: var(--chatbot-primary);
}

.chat-message { color: var(--chatbot-secondary); }
.btn-primary { background-color: var(--chatbot-accent); }
CSS;
    }

    protected function getResponsiveClasses(string $deviceType): array
    {
        return match ($deviceType) {
            'tablet' => ['width' => '768px', 'height' => '1024px'],
            'desktop' => ['width' => '100%', 'height' => '100vh'],
            default => ['width' => '375px', 'height' => '667px'], // mobile
        };
    }

    public function duplicateBuilder(int $builderId, string $newName): ChatbotBuilder
    {
        $original = ChatbotBuilder::findOrFail($builderId);

        return ChatbotBuilder::create([
            'tenant_id' => $original->tenant_id,
            'chatbot_id' => null,
            'step_current' => $original->step_current,
            'config' => $original->config,
            'customization' => $original->customization,
            'theme_settings' => $original->theme_settings,
            'publish_status' => 'draft',
        ]);
    }

    public function createFromTitanTemplate(string $tenantId, string $templateSlug): ChatbotBuilder
    {
        // Use actual Titan app templates from TitanRegistry
        $titanTemplate = \App\Extensions\Chatbot\System\Titan\TitanRegistry::get($templateSlug);

        if (!$titanTemplate) {
            throw new \InvalidArgumentException("Titan template not found: $templateSlug");
        }

        $chatbotConfig = $titanTemplate['chatbot'] ?? [];

        return ChatbotBuilder::create([
            'tenant_id' => $tenantId,
            'step_current' => 'configure',
            'config' => [
                'title' => $chatbotConfig['name'] ?? 'Assistant',
                'bubble_message' => 'Hey there, how can we help you?',
                'welcome_message' => $chatbotConfig['system_prompt'] ?? 'Hi, how can I assist you today?',
                'instructions' => $chatbotConfig['system_prompt'] ?? '',
                'titan_template' => $templateSlug,
                'template_features' => $titanTemplate['features'] ?? [],
            ],
            'theme_settings' => [
                'colors' => [
                    'primary' => $titanTemplate['color'] ?? '#667eea',
                    'secondary' => '#764ba2',
                    'accent' => '#4CAF50',
                ],
                'header_background' => [
                    'type' => 'gradient',
                    'value' => "linear-gradient(135deg, {$titanTemplate['color']} 0%, #764ba2 100%)",
                ],
            ],
            'publish_status' => 'draft',
        ]);
    }

    public function isBuilderComplete(ChatbotBuilder $builder): bool
    {
        // Check if all required fields in configure step are filled
        $config = $builder->config ?? [];

        return !empty($config['title'])
            && !empty($config['bubble_message'])
            && !empty($config['welcome_message']);
    }

    protected function logActivity(string $tenantId, string $userId, int $builderId, string $action, ?string $step, array $changes): void
    {
        try {
            if (!DB::getSchemaBuilder()->hasTable('ext_chatbot_builder_activity')) {
                return;
            }

            DB::table('ext_chatbot_builder_activity')->insert([
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'builder_config_id' => $builderId,
                'action' => $action,
                'target_step' => $step,
                'changes' => json_encode($changes),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Silently fail if table doesn't exist
        }
    }

    public function getMobilekitComponent(string $componentType): array
    {
        // Map Mobilekit components to our builder system
        return match ($componentType) {
            'button' => [
                'html' => '<button class="btn btn-primary">Button</button>',
                'classes' => ['btn', 'btn-primary'],
                'props' => ['text' => 'Button', 'variant' => 'primary'],
            ],
            'header' => [
                'html' => '<div class="appHeader bg-primary"><div class="pageTitle">Header</div></div>',
                'classes' => ['appHeader', 'bg-primary'],
                'props' => ['title' => 'Header', 'background' => 'gradient'],
            ],
            'card' => [
                'html' => '<div class="card"><div class="card-body">Card Content</div></div>',
                'classes' => ['card', 'card-body'],
                'props' => ['title' => 'Card Title'],
            ],
            'bottomMenu' => [
                'html' => '<div class="bottomMenu"><a href="#" class="menu-item">Home</a></div>',
                'classes' => ['bottomMenu'],
                'props' => ['items' => []],
            ],
            default => [],
        };
    }
}
