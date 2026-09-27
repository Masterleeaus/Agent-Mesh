<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Receipts;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Receipts\ReceiptPresenterContract;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationNode;

final class GovernanceReceiptPresenter implements ReceiptPresenterContract
{
    public function present(InterfaceReceipt $receipt): PresentationNode
    {
        return new PresentationNode('component','execution-receipt-' . substr(hash('sha256',$receipt->receiptId),0,12),[
            'component_hint'=>'approval-card',
            'receipt'=>$receipt->jsonSerialize(),
            'change_summary'=>is_array($receipt->metadata['change_summary']??null)?$receipt->metadata['change_summary']:[],
            'rollback_available'=>$receipt->isReversible(),
            'projection_only'=>true,
        ]);
    }
}
