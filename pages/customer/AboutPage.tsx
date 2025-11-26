import React, { useState } from 'react';
import { CustomerLayout } from '../../components/CustomerLayout';
import { Clock, MapPin, ChevronDown, ChevronUp, Phone, Mail, Calendar } from 'lucide-react';

export const AboutPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: "Do you offer gluten-free options?",
      answer: "Yes! Our signature fries are gluten-free, and we can prepare our steak without the seasoning if requested. Please inform our staff about any allergies."
    },
    {
      question: "Can I book a table in advance?",
      answer: "We operate on a first-come, first-served basis for our outdoor seating area. However, for large groups (8+), please contact us directly."
    },
    {
      question: "Where do you source your meat?",
      answer: "We source all our premium steaks from local, award-winning butchers who prioritize ethical farming practices."
    },
    {
      question: "Do you do delivery?",
      answer: "We currently deliver within a 3-mile radius. For orders outside this zone, please use our partner delivery apps."
    }
  ];

  return (
    <CustomerLayout>
      <div className="space-y-8 animate-fade-in max-w-3xl mx-auto pb-8">
        
        {/* Header */}
        <div className="text-center py-6">
           <h1 className="text-3xl font-bold text-white mb-2 font-heading uppercase">About Us</h1>
           <p className="text-zinc-400">Serving the best steak and fries since 2020</p>
        </div>

        {/* Operating Hours Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
           <div className="p-5 border-b border-zinc-800 flex items-center gap-3 bg-zinc-800/30">
              <div className="p-2 bg-zinc-800 rounded-lg text-brand-yellow">
                 <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-lg uppercase">Operating Hours</h3>
           </div>
           <div className="p-6 grid gap-4">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                 <span className="text-zinc-400">Mon - Thu</span>
                 <span className="font-bold text-white">11:00 AM - 10:00 PM</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                 <span className="text-zinc-400">Fri - Sat</span>
                 <span className="font-bold text-brand-yellow">11:00 AM - 12:00 AM</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-zinc-400">Sunday</span>
                 <span className="font-bold text-white">12:00 PM - 10:00 PM</span>
              </div>
           </div>
        </div>

        {/* Location / Map */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex items-center gap-3 bg-zinc-800/30">
              <div className="p-2 bg-zinc-800 rounded-lg text-brand-yellow">
                 <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-lg uppercase">Find Us</h3>
           </div>
           <div className="h-64 w-full bg-zinc-800 relative">
              {/* Mock Map */}
              <img 
                src="https://picsum.photos/seed/map/800/400?grayscale" 
                alt="Map Location" 
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="relative">
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-black/50 rounded-[100%] blur-sm"></div>
                    <MapPin className="w-10 h-10 text-brand-yellow drop-shadow-lg -translate-y-4" fill="currentColor" />
                 </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-zinc-900/90 backdrop-blur border border-zinc-700 p-4 rounded-xl">
                 <p className="font-bold text-white text-sm">On Fries HQ</p>
                 <p className="text-zinc-400 text-xs">123 Culinary Avenue, Food District, FD 4567</p>
                 <div className="flex gap-4 mt-3">
                    <a href="#" className="text-xs font-bold text-brand-yellow flex items-center gap-1 hover:underline"><Phone className="w-3 h-3"/> +44 123 456 7890</a>
                    <a href="#" className="text-xs font-bold text-brand-yellow flex items-center gap-1 hover:underline"><Mail className="w-3 h-3"/> hello@onfries.com</a>
                 </div>
              </div>
           </div>
        </div>

        {/* FAQs */}
        <div>
           <h3 className="font-bold text-white text-lg uppercase mb-4 px-2">Frequently Asked Questions</h3>
           <div className="space-y-3">
              {faqs.map((faq, idx) => (
                 <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden transition-all">
                    <button 
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full p-4 flex justify-between items-center text-left hover:bg-zinc-800/50 transition-colors"
                    >
                       <span className={`font-medium ${openFaq === idx ? 'text-brand-yellow' : 'text-white'}`}>{faq.question}</span>
                       {openFaq === idx ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${openFaq === idx ? 'max-h-40' : 'max-h-0'}`}>
                       <p className="p-4 pt-0 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/50">
                          {faq.answer}
                       </p>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 pb-4 text-zinc-600 text-xs">
           <p>© 2025 On Fries Management. All rights reserved.</p>
        </div>

      </div>
    </CustomerLayout>
  );
};