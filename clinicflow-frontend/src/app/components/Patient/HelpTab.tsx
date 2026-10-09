import React from 'react';
import { HelpCircle, Phone, Mail, Clock } from 'lucide-react';

const FAQS = [
  {
    q: 'How do I book an appointment?',
    a: 'Please contact the clinic reception desk by phone or visit in person to schedule an appointment. Your care team will confirm the date and time.',
  },
  {
    q: 'How do I view my test results?',
    a: 'Lab results and medical records are available under the Lab Results and Records tabs once your clinician has reviewed and released them.',
  },
  {
    q: 'How do I pay an invoice?',
    a: 'Outstanding invoices are listed under the Billing tab. Contact the finance desk to process a payment by card, cash, or bank transfer.',
  },
  {
    q: 'How do I update my contact details?',
    a: 'Go to Settings → Patient Profile to update your contact information directly from this portal.',
  },
  {
    q: 'Who do I contact in an emergency?',
    a: 'For medical emergencies call 911 immediately. For urgent clinic matters contact reception on the number below.',
  },
];

export default function HelpTab() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Help & Support</h1>
        <p className="text-slate-500 text-sm mt-0.5">Frequently asked questions and contact information</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {FAQS.map(({ q, a }) => (
          <div key={q} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{q}</p>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{a}</p>
              </div>
            </div>
          </div>
        ))}

        <div className="bg-blue-600 rounded-2xl p-6 text-white">
          <h2 className="font-bold text-sm mb-3">Contact Reception</h2>
          <div className="space-y-2">
            {[
              { icon: Phone, text: '+1 (555) 000-1234' },
              { icon: Mail,  text: 'reception@clinicflow.com' },
              { icon: Clock, text: 'Mon – Fri, 8 am – 6 pm' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-xs text-blue-100">
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
