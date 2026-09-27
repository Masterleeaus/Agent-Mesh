<?php

declare(strict_types=1);
namespace App\Extensions\TitanHub\System\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;

final class HubShellController
{
    public function __invoke(Request $request,string $portal): Response
    {
        return response()->view('titan-hub::shell',['portal'=>$portal,'context'=>$request->attributes->get('titan_hub_context',[])])
            ->header('Cache-Control','private, no-store');
    }
}
