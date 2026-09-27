<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Http\Controllers;

use App\Http\Controllers\AccountBaseController;
use Illuminate\Http\Request;
use Modules\CustomerFeedback\Entities\FeedbackEmailSetting;

final class FeedbackEmailSettingController extends AccountBaseController
{
    public function index()
    {
        $this->setting = FeedbackEmailSetting::firstOrNew(['company_id' => company()->id]);
        return view('customer-feedback::settings.email', $this->data);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'imap_host' => 'required|string|max:191',
            'imap_port' => 'required|integer',
            'imap_encryption' => 'required|in:ssl,tls,none',
            'imap_username' => 'required|string|max:191',
            'imap_password' => 'nullable|string',
            'email_address' => 'required|email',
            'auto_reply' => 'nullable|boolean',
            'reply_message' => 'nullable|string',
        ]);
        $companyId = (int) company()->id;
        $data['company_id'] = $companyId;
        if (!isset($data['imap_password']) || trim((string) $data['imap_password']) === '') {
            unset($data['imap_password']);
        }
        FeedbackEmailSetting::updateOrCreate(['company_id' => $companyId], $data);
        return redirect()->back()->with('success', 'Email settings saved.');
    }
}
