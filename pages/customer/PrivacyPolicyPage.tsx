import React from 'react';
import { CustomerLayout } from '../../components/CustomerLayout';

export const PrivacyPolicyPage: React.FC = () => {
    return (
        <CustomerLayout>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
                <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                    <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
                        <p className="text-gray-700">
                            We collect information you provide directly to us, such as when you create an account, place an order,
                            or contact us. This may include your name, email address, phone number, and delivery address.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
                        <p className="text-gray-700">
                            We use the information we collect to:
                            <ul className="list-disc ml-5 mt-2">
                                <li>Process your orders and payments</li>
                                <li>Communicate with you about your orders</li>
                                <li>Improve our services</li>
                                <li>Comply with legal obligations</li>
                            </ul>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">3. Data Sharing</h2>
                        <p className="text-gray-700">
                            We share your information with restaurants to fulfill your orders and with payment processors to
                            process payments. We do not sell your personal data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">4. Your Rights</h2>
                        <p className="text-gray-700">
                            You have the right to access, correct, or delete your personal data. You can manage your account
                            settings in your profile page or contact us for assistance.
                        </p>
                    </section>
                </div>
            </div>
        </CustomerLayout>
    );
};
