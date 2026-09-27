<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Receipts;

use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationNode;
use App\Extensions\TitanInterfaceRuntime\System\Receipts\InterfaceReceipt;

interface ReceiptPresenterContract
{
    public function present(InterfaceReceipt $receipt): PresentationNode;
}
