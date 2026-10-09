import React, { useState } from 'react';
import { 
  Search, 
  User, 
  Calendar, 
  CreditCard, 
  ShieldCheck, 
  ChevronDown, 
  MessageSquare, 
  Phone, 
  Mail 
} from 'lucide-react';

// TypeScript Interfaces
interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface CategoryCard {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const HelpPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const categories: CategoryCard[] = [
    { icon: User, title: 'Account & Profile', description: 'Manage your medical records, login credentials, and dependents.' },
    { icon: Calendar, title: 'Appointments', description: 'How to book, reschedule, or cancel consultations with doctors.' },
    { icon: CreditCard, title: 'Billing & Insurance', description: 'Understand hospital invoices, online payments, and claims.' },
    { icon: ShieldCheck, title: 'Privacy & Security', description: 'Learn how your health data (HIPAA) is encrypted and protected.' },
  ];

  const faqs: FAQItem[] = [
    {
      category: 'Appointments',
      question: 'How do I schedule a virtual consultation?',
      answer: 'Navigate to the "Appointments" tab, click "Book New", select your specialist, and choose the "Video Call" option before picking an available time slot.'
    },
    {
      category: 'Billing & Insurance',
      question: 'Can I add my health insurance policy directly to the portal?',
      answer: 'Yes. Go to Settings > Billing Methods > Add Insurance. Upload a clear picture of your insurance card, and our admissions team will verify it within 2 hours.'
    },
    {
      category: 'Account & Profile',
      question: 'How do I download my lab reports and prescriptions?',
      answer: 'All medical records are stored under the "Medical History" module. Select the specific visit date and click the "Download PDF" button next to your report.'
    },
    {
      category: 'Privacy & Security',
      question: 'Who has access to my electronic health records (EHR)?',
      answer: 'Only you and the specific medical professionals explicitly assigned to your care team can view your medical records. All access is strictly logged.'
    }
  ];

  // Filter FAQs based on search input
  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans antialiased selection:bg-teal-100 selection:text-teal-900">
      
      {/* Hero Section */}
      <header className="max-w-4xl mx-auto pt-20 pb-16 px-6 text-center">
        <span className="text-xs font-semibold tracking-widest text-teal-600 uppercase bg-teal-50 px-3 py-1 rounded-full">
          Support Center
        </span>
        <h1 className="mt-4 text-4xl font-light tracking-tight text-slate-900 sm:text-5xl">
          How can we help you today?
        </h1>
        <p className="mt-3 text-lg text-slate-500 font-light">
          Search our knowledge base or browse common topics below.
        </p>

        {/* Minimal Search Bar */}
        <div className="mt-8 max-w-xl mx-auto relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-xl blur transition duration-300 group-focus-within:opacity-100 opacity-0" />
          <div className="relative flex items-center bg-white border border-slate-200/80 rounded-xl px-4 py-3.5 shadow-sm transition duration-200 focus-within:border-slate-400">
            <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Search appointments, prescriptions, billing..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none font-light text-base"
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-6 pb-24">
        
        {/* Categories Grid (Hidden when searching to focus on results) */}
        {searchQuery === '' && (
          <section className="mb-20">
            <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-6">
              Browse by Topic
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <div 
                    key={i} 
                    className="p-6 bg-white border border-slate-100 rounded-xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_20px_-8px_rgba(0,0,0,0.08)] hover:border-slate-200 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors duration-200">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="mt-4 font-medium text-slate-900 group-hover:text-teal-700 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 font-light leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* FAQs Section */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-6">
            {searchQuery ? `Search Results (${filteredFaqs.length})` : 'Frequently Asked Questions'}
          </h2>
          
          {filteredFaqs.length > 0 ? (
            <div className="border border-slate-200/60 bg-white rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
              {filteredFaqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div key={index} className="transition-colors duration-150">
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between p-5 text-left font-light text-slate-800 hover:bg-slate-50/50 transition-colors"
                    >
                      <span className="pr-4 font-normal text-slate-900">{faq.question}</span>
                      <ChevronDown 
                        className={`w-4 h-4 text-slate-400 transition-transform duration-300 shrink-0 ${
                          isOpen ? 'rotate-180 text-teal-600' : ''
                        }`} 
                      />
                    </button>
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-40 border-t border-slate-50 bg-slate-50/30' : 'max-h-0'
                      }`}
                    >
                      <p className="p-5 text-sm text-slate-500 font-light leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-white">
              <p className="text-sm text-slate-400 font-light">No articles match your search parameters. Try a different keyword.</p>
            </div>
          )}
        </section>

        {/* Contact Support Footer */}
        <section className="mt-20 p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-xl relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 text-center max-w-xl mx-auto">
            <h3 className="text-xl font-light tracking-tight">Still looking for answers?</h3>
            <p className="mt-2 text-sm text-slate-400 font-light">
              Our patient care team and system administrators are available 24/7 to assist with critical medical platform issues.
            </p>
            
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm font-light">
              <a href="#livechat" className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <MessageSquare className="w-5 h-5 text-teal-400 mb-2" />
                <span>Live Chat</span>
              </a>
              <a href="tel:+123456789" className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <Phone className="w-5 h-5 text-teal-400 mb-2" />
                <span>Call Helpdesk</span>
              </a>
              <a href="mailto:support@hospital.com" className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <Mail className="w-5 h-5 text-teal-400 mb-2" />
                <span>Email Ticket</span>
              </a>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default HelpPage;