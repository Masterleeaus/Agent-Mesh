<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

use App\Extensions\TitanAppsCore\System\Contracts\AppSurface;

final class AppWorkspaceSectionRegistry
{
    /** @param array<string,list<array<string,mixed>>>|null $profiles */
    public function __construct(?array $profiles=null)
    {
        $this->profiles=$profiles??(array)config('titan-apps-core.workspace_sections',[]);
    }

    /** @var array<string,list<array<string,mixed>>> */
    private array $profiles;

    /** @return list<array<string,mixed>> */
    public function all(string|AppSurface $surface): array
    {
        $surface=$surface instanceof AppSurface?$surface:AppSurface::resolve($surface);
        $rows=[];
        foreach((array)($this->profiles[$surface->value]??[]) as $row){
            if(!is_array($row)) continue;
            $id=trim((string)($row['id']??''));
            if($id==='') continue;
            $rows[]=[
                'id'=>$id,
                'label'=>trim((string)($row['label']??ucfirst($id))),
                'icon'=>trim((string)($row['icon']??'•')),
                'modules'=>array_values(array_unique(array_filter(array_map('strval',(array)($row['modules']??[]))))),
                'default'=>(bool)($row['default']??false),
            ];
        }
        return $rows;
    }

    /** @return list<string> */
    public function ids(string|AppSurface $surface): array
    {
        return array_values(array_map(static fn(array $r):string=>$r['id'],$this->all($surface)));
    }

    /** @return array<string,mixed> */
    public function get(string|AppSurface $surface,string $section): array
    {
        foreach($this->all($surface) as $row) if($row['id']===$section) return $row;
        throw new \InvalidArgumentException('Unknown app workspace section: '.$section);
    }

    /** @return array<string,mixed> */
    public function default(string|AppSurface $surface): array
    {
        $rows=$this->all($surface);
        foreach($rows as $row) if($row['default']===true) return $row;
        return $rows[0]??throw new \LogicException('No workspace sections registered for app surface.');
    }
}
