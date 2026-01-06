import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RefundPolicyPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-brand-black text-white p-4 pb-24 md:pb-8">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-2xl font-bold text-brand-yellow">Refund Policy</h1>
                </div>

                {/* Content */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6 text-zinc-300">
                    <section>
                        <h2 className="text-lg font-bold text-white mb-2">Order Issues</h2>
                        <p>
                            At On Fries, we strive to ensure every order is perfect. If you have an issue with your order (e.g., missing items, incorrect items, or poor quality), please contact us immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-2">Refunds</h2>
                        <p>
                            Refunds may be processed for orders that do not meet our quality standards or if items are missing. To request a refund, please speak to a member of staff or contact us via our support channels within 24 hours of your order.
                        </p>
                        <p className="mt-2">
                            Approved refunds will be processed back to the original payment method. Please allow 5-10 business days for the funds to appear in your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-2">Cancellations</h2>
                        <p>
                            As our food is prepared to order, we cannot accept cancellations once the order status usually indicates 'Cooking' or 'Preparing'. If you need to cancel immediately after placing an order, please contact the restaurant directly.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-2">Contact Us</h2>
                        <p>
                            If you have any questions about our refund policy, please contact us at:
                            <br />
                            Email: support@onfries.com
                            <br />
                            Phone: [Restaurant Phone Number]
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};
