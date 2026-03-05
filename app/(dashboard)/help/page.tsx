'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const faqs = [
  {
    question: 'Does using Verit cost money?',
    answer:
      'Verit offers a free plan that lets you manage up to 3 properties. For larger portfolios, our Premium plan unlocks unlimited properties, advanced financial reports, bulk tenant messaging, and priority support.',
  },
  {
    question: 'How do I add a new property?',
    answer:
      'Navigate to the Properties page from the sidebar and click the "Add Property" button. Fill in the property name, address, type (residential or commercial), and the number of units. Once saved, you can begin adding units to that property.',
  },
  {
    question: 'How do I record a rent payment?',
    answer:
      'Go to the Payments page and click "Register Payment". Select the tenant and unit, enter the amount paid, choose the payment date, and confirm. The system will automatically apply the payment to the outstanding schedule and update the tenant\'s balance.',
  },
  {
    question: 'How does mobile money integration work?',
    answer:
      'Verit integrates with Uganda\'s major mobile money networks (MTN Mobile Money and Airtel Money). Tenants can initiate payments directly from the Verit Tenant App, and the funds are tracked automatically in your dashboard.',
  },
  {
    question: 'How do I generate a financial report?',
    answer:
      'Visit the Finances page to view income summaries, occupancy rates, and outstanding balances. You can export detailed reports as PDF from the Exports section, which includes rent schedules, lease summaries, and payment receipts.',
  },
  {
    question: 'What happens when a tenant is in arrears?',
    answer:
      'Tenants with outstanding balances appear in the "Tenants in Arrears" section on your Dashboard. You can view the exact amount owed and the number of days overdue. Use the Tenants page to send a broadcast message reminding them to pay.',
  },
];

const guides = [
  { label: 'Getting Started with Verit »', href: '#' },
  { label: 'Adding Properties & Units »', href: '#' },
  { label: 'Managing Tenants »', href: '#' },
  { label: 'Recording Payments »', href: '#' },
  { label: 'Financial Reports Guide »', href: '#' },
  { label: 'Maintenance Requests Guide »', href: '#' },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-black hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{question}</span>
        <Icon
          icon="solar:alt-arrow-down-broken"
          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 border-t border-gray-100">
          <p className="pt-3">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-black">Need Help?</h1>
      </div>

      {/* Support Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Help Center */}
        <Card className="flex flex-col items-center text-center p-6 gap-4">
          <CardContent className="flex flex-col items-center gap-4 p-0 w-full">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
              <Icon icon="solar:question-circle-broken" className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-bold text-base text-black">Visit The Help Center</p>
              <p className="text-sm text-gray-500 mt-1">
                Browse articles and guides written by the Verit team.
              </p>
            </div>
            <Button className="w-full uppercase tracking-wide text-xs rounded-full" asChild>
              <a href="#" target="_blank" rel="noopener noreferrer">
                Visit Help Center
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Send a Message */}
        <Card className="flex flex-col items-center text-center p-6 gap-4">
          <CardContent className="flex flex-col items-center gap-4 p-0 w-full">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
              <Icon icon="solar:chat-round-dots-broken" className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-bold text-base text-black">Send Us a Message</p>
              <p className="text-sm text-gray-500 mt-1">
                Our Uganda-based support team is here to help. Start a chat or{' '}
                <a href="mailto:support@verit.ug" className="text-primary underline">
                  send us an email
                </a>
                .
              </p>
            </div>
            <Button className="w-full uppercase tracking-wide text-xs rounded-full">
              Chat With Us
            </Button>
          </CardContent>
        </Card>

        {/* Call Us */}
        <Card className="flex flex-col items-center text-center p-6 gap-4 relative overflow-hidden">
          {/* Premium badge */}
          <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-bl-md flex items-center gap-1">
            <Icon icon="solar:star-bold" className="w-3 h-3" />
            PREMIUM
          </div>
          <CardContent className="flex flex-col items-center gap-4 p-0 w-full">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
              <Icon icon="solar:phone-calling-broken" className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-bold text-base text-black">Still Need Help? Call Us!</p>
              <p className="text-sm text-gray-500 mt-1">
                Upgrade to call our Uganda-based support team directly.
              </p>
            </div>
            <Button className="w-full uppercase tracking-wide text-xs rounded-full">
              Learn More
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQs + Guides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FAQs */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xl font-bold text-black">FAQs</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>

        {/* Guides */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black">Guides</h2>
          <div className="space-y-2">
            {guides.map((guide) => (
              <a
                key={guide.label}
                href={guide.href}
                className="block text-sm text-primary font-medium hover:underline py-1"
              >
                {guide.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
