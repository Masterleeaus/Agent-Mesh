<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Http\Controllers;

use App\Helper\Reply;
use App\Http\Controllers\AccountBaseController;
use Illuminate\Http\Request;
use Modules\CustomerFeedback\Actions\EscalateComplaintAction;
use Modules\CustomerFeedback\Actions\ResolveComplaintAction;
use Modules\CustomerFeedback\Entities\FeedbackTicket;
use Modules\CustomerFeedback\Services\FeedbackWorkItemService;

final class ComplaintLifecycleController extends AccountBaseController
{
    private function ticketForCompany(FeedbackTicket $ticket): FeedbackTicket
    {
        $companyId = (int) company()->id;
        abort_404_if((int) $ticket->company_id !== $companyId || !$ticket->isComplaint());
        return $ticket;
    }

    public function escalate(Request $request, FeedbackTicket $ticket, EscalateComplaintAction $action)
    {
        abort_403(user()->permission('edit_feedback') === 'none');
        $ticket = $this->ticketForCompany($ticket);
        $data = $request->validate(['reason' => 'nullable|string|max:5000']);
        $action->execute($ticket, $data['reason'] ?? null, ['edit_feedback']);
        return Reply::success('Complaint escalated.');
    }

    public function resolve(Request $request, FeedbackTicket $ticket, ResolveComplaintAction $action)
    {
        abort_403(user()->permission('edit_feedback') === 'none');
        $ticket = $this->ticketForCompany($ticket);
        $data = $request->validate([
            'resolution_outcome' => 'nullable|string|max:5000',
            'resolution_type' => 'nullable|in:refund,reclean,credit,apology,no_action,other',
            'refund_amount' => 'nullable|numeric|min:0',
        ]);
        $data['resolved_by'] = user()->id;
        $action->execute($ticket, $data);
        return Reply::success('Complaint resolved.');
    }

    public function correctiveWork(FeedbackTicket $ticket, FeedbackWorkItemService $workItems)
    {
        abort_403(user()->permission('edit_feedback') === 'none');
        $ticket = $this->ticketForCompany($ticket);
        $result = $workItems->requestCorrectiveWork($ticket, ['edit_feedback']);
        if (!empty($result['work_item_id'])) {
            $ticket->corrective_work_item_id = (string) $result['work_item_id'];
            $ticket->save();
        }
        return response()->json($result);
    }
}
