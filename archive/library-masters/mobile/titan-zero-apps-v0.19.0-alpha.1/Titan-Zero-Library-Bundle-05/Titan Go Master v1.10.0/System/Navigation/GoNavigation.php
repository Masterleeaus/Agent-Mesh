<?php
declare(strict_types=1);
namespace App\Extensions\TitanGo\System\Navigation;
final class GoNavigation{public function items():array{return[['id'=>'today','label'=>'Today','route'=>'go.today'],['id'=>'jobs','label'=>'Jobs','route'=>'go.jobs'],['id'=>'schedule','label'=>'Schedule','route'=>'go.schedule'],['id'=>'inbox','label'=>'Inbox','route'=>'go.inbox'],['id'=>'more','label'=>'More','route'=>'go.more']];}}
