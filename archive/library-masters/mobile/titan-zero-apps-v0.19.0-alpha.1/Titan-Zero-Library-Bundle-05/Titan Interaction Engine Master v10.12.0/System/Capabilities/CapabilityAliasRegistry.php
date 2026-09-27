<?php
declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Capabilities;
final class CapabilityAliasRegistry
{
    private array $aliases;
    public function __construct(?array $aliases=null){$this->aliases=$aliases??[
        'jobs.create'=>'crm.work_order.create','jobs.complete'=>'crm.work_order.complete','quotes.create'=>'crm.quote.create',
        'finance.invoice.create'=>'crm.invoice.create','finance.payment.record'=>'crm.payment.record','field_services.bookings.create'=>'crm.appointment.create',
        'field_services.job_variations.approve'=>'crm.work_order.update','construction.materials.request'=>'crm.work_order.material.add',
        'construction.site_variations.approve'=>'crm.work_order.update','construction.practical_completion.record'=>'crm.work_order.update',
        'assurance.incidents.report'=>'crm.form.submit','assurance.inspections.complete'=>'crm.form.submit',
        'field_services.onboarding.compile'=>'interaction.onboarding.compile',
        'field_services.onboarding.company.configure'=>'crm.business.profile.update','field_services.onboarding.profile.configure'=>'crm.business.profile.update',
        'field_services.onboarding.availability.configure'=>'crm.business.hours.update','field_services.onboarding.territory.configure'=>'crm.business.service_area.update',
        'field_services.onboarding.catalogue.configure'=>'crm.business.service.create','field_services.onboarding.booking.configure'=>'crm.business.booking_rules.update',
        'field_services.onboarding.payments.configure'=>'crm.business.payment_settings.update','field_services.onboarding.workforce.configure'=>'crm.staff.invite',
        'field_services.onboarding.customer_experience.configure'=>'crm.business.profile.update','field_services.onboarding.access.configure'=>'builder.features.update',
        'field_services.onboarding.communications.configure'=>'mobile.notification.configure','field_services.onboarding.ai.configure'=>'ai.business.preferences.update',
        'field_services.onboarding.integrations.configure'=>'builder.features.update','field_services.onboarding.brand.configure'=>'builder.brand.update',
        'field_services.onboarding.compliance.configure'=>'crm.business.compliance.update','field_services.onboarding.activate'=>'interaction.onboarding.activate',
    ];}
    public function canonical(string $capability):string{return (string)($this->aliases[$capability]??$capability);}
    public function isAlias(string $capability):bool{return isset($this->aliases[$capability]);}
    public function aliases():array{return $this->aliases;}
}
