<?php

declare(strict_types=1);

use App\Extensions\TitanInterfaceRuntime\System\Http\Controllers\IndexController;
use App\Extensions\TitanInterfaceRuntime\System\Http\Controllers\InteractionPresentationController;
use App\Extensions\TitanInterfaceRuntime\System\Http\Controllers\GlobalWorkTrayController;
use App\Extensions\TitanInterfaceRuntime\System\Http\Controllers\ContextInspectorController;
use App\Extensions\TitanInterfaceRuntime\System\Http\Controllers\ObjectWorkspaceController;
use App\Extensions\TitanInterfaceRuntime\System\Http\Controllers\CommandSurfaceController;
use App\Extensions\TitanInterfaceRuntime\System\Http\Controllers\CollectionViewController;
use App\Extensions\TitanInterfaceRuntime\System\Http\Controllers\SpatialWorkspaceController;
use App\Extensions\TitanInterfaceRuntime\System\Http\Controllers\DecisionWorkspaceController;
use App\Extensions\TitanInterfaceRuntime\System\Http\Controllers\GovernanceWorkspaceController;
use App\Extensions\TitanInterfaceRuntime\System\Http\Controllers\WorkingSetWorkspaceController;
use App\Extensions\TitanInterfaceRuntime\System\Http\Controllers\ConfigurationLifecycleWorkspaceController;
use App\Extensions\TitanInterfaceRuntime\System\Http\Controllers\ProductSurfacePolicyController;
use App\Extensions\TitanInterfaceRuntime\System\Http\Controllers\OfflineSyncWorkspaceController;
use App\Extensions\TitanInterfaceRuntime\System\Http\Controllers\ExperienceShellController;
use App\Extensions\TitanInterfaceRuntime\System\Http\Controllers\RuntimeMenuPageController;
use Illuminate\Routing\Router;

/** @var Router $router */
$router->get('/', IndexController::class)
    ->defaults('interface_product_surface', 'command')
    ->defaults('interface_domain', 'interface-runtime')
    ->name('index');


$router->get('/menu/{page}', RuntimeMenuPageController::class)
    ->where('page', 'explore|commands|continue|attention|approvals|inbox|sync|workspaces|collections|spatial|decisions|governance|working-sets|configuration|experience|surfaces')
    ->defaults('interface_product_surface', 'command')
    ->defaults('interface_domain', 'interface-runtime')
    ->name('menu.page');

$router->get('/interactions/{session}/{mode}', InteractionPresentationController::class)
    ->where('session', '[A-Za-z0-9._:-]+')
    ->where('mode', 'chat|panel|full-workspace|conversational|hybrid|structured')
    ->defaults('interface_product_surface', 'command')
    ->defaults('interface_domain', 'interface-runtime')
    ->name('interaction.present');


$router->get('/trays/{tray}', GlobalWorkTrayController::class)
    ->where('tray', 'continue|attention|approvals|inbox|sync')
    ->defaults('interface_product_surface', 'command')
    ->defaults('interface_domain', 'interface-runtime')
    ->name('tray.show');

$router->get('/inspect/{objectReference}', ContextInspectorController::class)
    ->where('objectReference', '[A-Za-z0-9._~@:-]+')
    ->defaults('interface_product_surface', 'command')
    ->defaults('interface_domain', 'interface-runtime')
    ->name('inspect.show');

$router->get('/workspaces/{objectReference}', ObjectWorkspaceController::class)
    ->where('objectReference', '[A-Za-z0-9._~@:-]+')
    ->defaults('interface_product_surface', 'command')
    ->defaults('interface_domain', 'interface-runtime')
    ->name('workspace.show');

$router->get('/commands', CommandSurfaceController::class)
    ->defaults('interface_product_surface', 'command')
    ->defaults('interface_domain', 'interface-runtime')
    ->name('commands.search');

$router->get('/collections/{objectKey}', CollectionViewController::class)
    ->where('objectKey', '[A-Za-z0-9._-]+')
    ->defaults('interface_product_surface', 'command')
    ->defaults('interface_domain', 'interface-runtime')
    ->name('collections.show');


$router->get('/spatial/{objectKey}', SpatialWorkspaceController::class)
    ->where('objectKey', '[A-Za-z0-9._-]+')
    ->defaults('interface_product_surface', 'command')
    ->defaults('interface_domain', 'interface-runtime')
    ->name('spatial.show');

$router->get('/decide/{objectKey}', DecisionWorkspaceController::class)
    ->where('objectKey', '[A-Za-z0-9._-]+')
    ->defaults('interface_product_surface', 'command')
    ->defaults('interface_domain', 'interface-runtime')
    ->name('decide.show');


$router->get('/governance/{objectReference}/{actionKey}', GovernanceWorkspaceController::class)
    ->where('objectReference', '[A-Za-z0-9._~@:-]+')
    ->where('actionKey', '[A-Za-z0-9._-]+')
    ->defaults('interface_product_surface', 'command')
    ->defaults('interface_domain', 'interface-runtime')
    ->name('governance.show');


$router->get('/working-sets/{workingSetId}', WorkingSetWorkspaceController::class)
    ->where('workingSetId', '[1-9][0-9]{0,18}')
    ->defaults('interface_product_surface', 'command')
    ->defaults('interface_domain', 'interface-runtime')
    ->name('working-set.show');



$router->get('/configuration/{objectReference}', ConfigurationLifecycleWorkspaceController::class)
    ->where('objectReference', '[A-Za-z0-9._~@:-]+')
    ->defaults('interface_product_surface', 'command')
    ->defaults('interface_domain', 'interface-runtime')
    ->name('configuration.show');

$router->get('/surface/{interface_product_surface}', ProductSurfacePolicyController::class)
    ->where('interface_product_surface', 'command|go|hub|onboarding')
    ->defaults('interface_domain', 'platform')
    ->name('surface.policy');

$router->get('/sync', OfflineSyncWorkspaceController::class)
    ->defaults('interface_product_surface', 'command')
    ->defaults('interface_domain', 'interface-runtime')
    ->name('sync.workspace');

$router->get('/experience', ExperienceShellController::class)
    ->defaults('interface_product_surface', 'command')
    ->defaults('interface_domain', 'interface-runtime')
    ->name('experience.shell');
