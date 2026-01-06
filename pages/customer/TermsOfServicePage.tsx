import React from 'react';
import { CustomerLayout } from '../../components/CustomerLayout';

export const TermsOfServicePage: React.FC = () => {
    return (
        <CustomerLayout>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
                <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                    <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
                        <p className="text-gray-700">
                            Welcome to On Fries. By using our website and services, you agree to these Terms of Service.
                            Please read them carefully.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">2. Service Description</h2>
                        <p className="text-gray-700">
                            On Fries provides a platform for customers to order food items. We act as an agent for the restaurant.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">3. Limitation of Liability</h2>
                        <p className="text-gray-700">
                            To the maximum extent permitted by law, On Fries shall not be liable for any indirect, incidental,
                            special, consequential or punitive damages, or any loss of profits or revenues, whether incurred
                            directly or indirectly.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">4. Account Termination</h2>
                        <p className="text-gray-700">
                            We reserve the right to terminate or suspend access to our service immediately, without prior notice,
                            for any breach of these Terms.
                        </p>
                    </section>
                </div>
            </div>
        </CustomerLayout>
    );
};
