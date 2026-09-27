<?php

declare(strict_types=1);

namespace Illuminate\Contracts\Foundation {
    interface Application {
        public function bound($abstract);
        public function make($abstract, array $parameters = []);
    }
}

namespace {
    $root=dirname(__DIR__);
    require_once $root.'/System/Host/TitanInterfaceRuntimeMenuContributor.php';
    require_once $root.'/System/Host/TitanHostMenuCompatibilityAdapter.php';

    use App\Extensions\TitanInterfaceRuntime\System\Host\TitanHostMenuCompatibilityAdapter;
    use App\Extensions\TitanInterfaceRuntime\System\Host\TitanInterfaceRuntimeMenuContributor;

    final class FakeSchema {
        public function hasTable(string $table): bool { return $table==='menus'; }
        public function hasColumn(string $table,string $column): bool { return $table==='menus' && in_array($column,$this->getColumnListing($table),true); }
        public function getColumnListing(string $table): array { return ['id','parent_id','key','route','route_slug','label','icon','svg','order','is_active','params','type','badge','extension','bolt_menu','bolt_background','bolt_foreground','letter_icon','letter_icon_bg','custom_menu','created_at','updated_at']; }
    }

    final class FakeTable {
        private ?string $whereKey=null;
        private mixed $whereValue=null;
        private ?array $whereInValues=null;
        public function __construct(private FakeConnection $connection) {}
        public function where(string $key,mixed $value): self { $clone=clone $this; $clone->whereKey=$key; $clone->whereValue=$value; return $clone; }
        public function whereIn(string $key,array $values): self { $clone=clone $this; $clone->whereKey=$key; $clone->whereInValues=$values; return $clone; }
        private function matches(array $row): bool {
            if($this->whereKey===null) return true;
            if($this->whereInValues!==null) return in_array($row[$this->whereKey]??null,$this->whereInValues,true);
            return ($row[$this->whereKey]??null)===$this->whereValue;
        }
        public function first(): ?object { foreach($this->connection->rows as $row) if($this->matches($row)) return (object)$row; return null; }
        public function value(string $column): mixed { foreach($this->connection->rows as $row) if($this->matches($row)) return $row[$column]??null; return null; }
        public function insert(array $row): bool { if(!isset($row['id'])) $row['id']=$this->connection->nextId++; $this->connection->rows[]=$row; return true; }
        public function update(array $values): int { $n=0; foreach($this->connection->rows as &$row) if($this->matches($row)){ foreach($values as $k=>$v)$row[$k]=$v; $n++; } unset($row); return $n; }
        public function delete(): int { $before=count($this->connection->rows); $this->connection->rows=array_values(array_filter($this->connection->rows,fn($row)=>!$this->matches($row))); return $before-count($this->connection->rows); }
    }

    final class FakeConnection {
        public array $rows=[];
        public int $nextId=1;
        private FakeSchema $schema;
        public function __construct(){ $this->schema=new FakeSchema(); }
        public function getSchemaBuilder(): FakeSchema { return $this->schema; }
        public function table(string $table): FakeTable { if($table!=='menus') throw new \RuntimeException('unexpected table'); return new FakeTable($this); }
    }
    final class FakeDbManager { public function __construct(public FakeConnection $connectionObj){} public function connection(): FakeConnection { return $this->connectionObj; } }
    final class FakeApp implements \Illuminate\Contracts\Foundation\Application {
        public function __construct(private FakeDbManager $db){}
        public function bound($abstract): bool { return false; }
        public function make($abstract,array $parameters=[]): mixed { if($abstract==='db') return $this->db; throw new \RuntimeException('unbound '.$abstract); }
    }

    $connection=new FakeConnection();
    $adapter=new TitanHostMenuCompatibilityAdapter(new FakeApp(new FakeDbManager($connection)));
    $status=$adapter->sync();
    if(($status['mode']??null)!=='legacy-db') throw new \RuntimeException('legacy hierarchy sync did not run');
    $definitions=TitanInterfaceRuntimeMenuContributor::definitions();
    if(count($definitions)!==18) throw new \RuntimeException('expected parent + 17 child definitions');
    if(count($connection->rows)!==18) throw new \RuntimeException('legacy sync did not materialize all menu rows');
    $byKey=[]; foreach($connection->rows as $row) $byKey[$row['key']]=$row;
    $parent=$byKey[TitanInterfaceRuntimeMenuContributor::USER_PARENT]??null;
    if(!$parent || ($parent['parent_id']??null)!==null) throw new \RuntimeException('parent menu row invalid');
    foreach($definitions as $definition){
        $row=$byKey[$definition['key']]??null;
        if(!$row) throw new \RuntimeException('missing row '.$definition['key']);
        if(($definition['parent_key']??null)!==null && ($row['parent_id']??null)!==($parent['id']??null)) throw new \RuntimeException('child parent_id mismatch '.$definition['key']);
        if(($row['route']??null)!==($definition['route']??null)) throw new \RuntimeException('route mismatch '.$definition['key']);
        if(($row['route_slug']??null)!==($definition['route_slug']??null)) throw new \RuntimeException('route_slug mismatch '.$definition['key']);
    }
    $adapter->remove();
    if($connection->rows!==[]) throw new \RuntimeException('uninstall did not remove all extension-owned menu rows');
    echo "PASS 20H3 MENU SYNC: parent + 17 children materialize with correct parent_id/route_slug and uninstall removes all owned rows\n";
}
