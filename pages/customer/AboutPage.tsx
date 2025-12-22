import React, { useState } from 'react';
import { CustomerLayout } from '../../components/CustomerLayout';
import { Clock, MapPin, ChevronDown, ChevronUp, Phone, Mail, Calendar } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AboutPage = () => {
  const { settings } = useStore();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  // Format time from 24h to 12h with AM/PM
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get display hours from settings
  const getDisplayHours = () => {
    if (!settings?.opening_times) {
      return [
        { days: 'Mon - Thu', hours: '11:00 AM - 10:00 PM' },
        { days: 'Fri - Sat', hours: '11:00 AM - 12:00 AM' },
        { days: 'Sunday', hours: '12:00 PM - 10:00 PM' }
      ];
    }

    const times = settings.opening_times;
    const result = [];

    // Group consecutive days with same hours
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    let currentGroup = [days[0]];
    let currentHours = times[days[0]];

    for (let i = 1; i < days.length; i++) {
      const day = days[i];
      const daySchedule = times[day];

      if (daySchedule && currentHours &&
        daySchedule.open === currentHours.open &&
        daySchedule.close === currentHours.close &&
        daySchedule.closed === currentHours.closed) {
        currentGroup.push(day);
      } else {
        // Add previous group
        if (currentGroup.length > 0 && currentHours && !currentHours.closed) {
          const startDay = dayNames[days.indexOf(currentGroup[0])];
          const endDay = dayNames[days.indexOf(currentGroup[currentGroup.length - 1])];
          const displayDays = startDay === endDay ? startDay : `${startDay} - ${endDay}`;
          const displayHours = `${formatTime(currentHours.open)} - ${formatTime(currentHours.close)}`;
          result.push({ days: displayDays, hours: displayHours });
        }
        currentGroup = [day];
        currentHours = daySchedule;
      }
    }

    // Add last group
    if (currentGroup.length > 0 && currentHours && !currentHours.closed) {
      const startDay = dayNames[days.indexOf(currentGroup[0])];
      const endDay = dayNames[days.indexOf(currentGroup[currentGroup.length - 1])];
      const displayDays = startDay === endDay ? startDay : `${startDay} - ${endDay}`;
      const displayHours = `${formatTime(currentHours.open)} - ${formatTime(currentHours.close)}`;
      result.push({ days: displayDays, hours: displayHours });
    }

    return result;
  };

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
        <div className="text-center py-4 md:py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2 font-heading uppercase">About Us</h1>
          <p className="text-zinc-400 text-sm md:text-base">Serving the best steak and fries since 2020</p>
        </div>

        {/* Operating Hours Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-4 md:p-5 border-b border-zinc-800 flex items-center gap-3 bg-zinc-800/30">
            <div className="p-1.5 md:p-2 bg-zinc-800 rounded-lg text-brand-yellow">
              <Clock className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <h3 className="font-bold text-white text-base md:text-lg uppercase">Operating Hours</h3>
          </div>
          <div className="p-4 md:p-6 grid gap-2 md:gap-4">
            {getDisplayHours().map((schedule, index) => (
              <div key={schedule.days} className={`flex justify-between items-center ${index < getDisplayHours().length - 1 ? 'border-b border-zinc-800 pb-2 md:pb-3' : ''}`}>
                <span className="text-zinc-400 text-sm md:text-base">{schedule.days}</span>
                <span className={`font-bold text-sm md:text-base ${schedule.days.includes('Fri') || schedule.days.includes('Sat') ? 'text-brand-yellow' : 'text-white'}`}>{schedule.hours}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Location / Map */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col md:block relative">
          <div className="p-4 md:p-5 border-b border-zinc-800 flex items-center gap-3 bg-zinc-800/30">
            <div className="p-1.5 md:p-2 bg-zinc-800 rounded-lg text-brand-yellow">
              <MapPin className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <h3 className="font-bold text-white text-base md:text-lg uppercase">Find Us</h3>
          </div>

          <div className="h-48 md:h-64 w-full bg-zinc-800 relative cursor-pointer order-first md:order-none" onClick={() => window.open('https://maps.google.com/maps?q=Clock%20Tower%2C%20Kings%20Shade%20Walk%2C%20Epsom%20KT19%208EB', '_blank')}>
            <iframe
              src="https://maps.google.com/maps?q=Clock%20Tower%2C%20Kings%20Shade%20Walk%2C%20Epsom%20KT19%208EB&ll=51.332,-0.267&z=15&output=embed"
              className="w-full h-full border-0"
              style={{ pointerEvents: 'none' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>

            {/* Desktop Float Overlay */}
            <div className="hidden md:block absolute bottom-4 left-4 right-4 bg-zinc-900/90 backdrop-blur border border-zinc-700 p-4 rounded-xl">
              <p className="font-bold text-white text-sm">Clock Tower</p>
              <p className="text-zinc-400 text-xs">Kings Shade Walk, Epsom KT19 8EB</p>
              <div className="flex gap-4 mt-3">
                <a href="https://maps.google.com/maps?daddr=Clock%20Tower%2C%20Kings%20Shade%20Walk%2C%20Epsom%20KT19%208EB" target="_blank" className="text-xs font-bold text-brand-yellow flex items-center gap-1 hover:underline"><MapPin className="w-3 h-3" /> Get Directions</a>
                <a href="#" className="text-xs font-bold text-brand-yellow flex items-center gap-1 hover:underline"><Phone className="w-3 h-3" /> +44 123 456 7890</a>
                <a href="#" className="text-xs font-bold text-brand-yellow flex items-center gap-1 hover:underline"><Mail className="w-3 h-3" /> hello@onfries.com</a>
              </div>
            </div>
          </div>

          {/* Mobile Info Block (Below Map) */}
          <div className="p-4 md:hidden bg-zinc-900 border-t border-zinc-800">
            <p className="font-bold text-white text-sm">Clock Tower</p>
            <p className="text-zinc-400 text-xs mb-3">Kings Shade Walk, Epsom KT19 8EB</p>
            <div className="grid grid-cols-1 gap-2">
              <a href="https://maps.google.com/maps?daddr=Clock%20Tower%2C%20Kings%20Shade%20Walk%2C%20Epsom%20KT19%208EB" target="_blank" className="text-xs font-bold text-brand-yellow flex items-center gap-2 p-2 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors justify-center"><MapPin className="w-3 h-3" /> Get Directions</a>
              <div className="flex gap-2">
                <a href="#" className="flex-1 text-xs font-bold text-brand-yellow flex items-center gap-2 p-2 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors justify-center"><Phone className="w-3 h-3" /> Call Us</a>
                <a href="#" className="flex-1 text-xs font-bold text-brand-yellow flex items-center gap-2 p-2 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors justify-center"><Mail className="w-3 h-3" /> Email</a>
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