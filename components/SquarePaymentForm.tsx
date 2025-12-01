import React, { useEffect, useState } from 'react';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

declare global {
  interface Window {
    Square?: any;
  }
}

interface SquarePaymentFormProps {
  amount: number;
  onSuccess: (payment: any) => void;
  onError: (error: string) => void;
  orderReference?: string;
  customerEmail?: string;
  disabled?: boolean;
}

interface CardFormData {
  cardNumber: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
  postalCode: string;
}

const SquarePaymentForm: React.FC<SquarePaymentFormProps> = ({
  amount,
  onSuccess,
  onError,
  orderReference,
  customerEmail,
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [cardForm, setCardForm] = useState<CardFormData>({
    cardNumber: '',
    expirationMonth: '',
    expirationYear: '',
    cvv: '',
    postalCode: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [squareFields, setSquareFields] = useState<any>(null);

  // Environment-based Square configuration - Force production for live payments
  const SQUARE_CONFIG = {
    applicationId: 'sq0idp-oBleGoboqpllvndrWQ9Zuw',
    locationId: 'L14KB0DPJ20SD',
    environment: 'production' as 'production',
    scriptUrl: 'https://web.squarecdn.com/v1/square.js'
  };
  useEffect(() => {
    console.log('Initializing Square with config:', SQUARE_CONFIG);

    // Load Square Web Payments SDK
    const script = document.createElement('script');
    script.src = SQUARE_CONFIG.scriptUrl;
    script.async = true;
    script.onload = () => initializeSquare(SQUARE_CONFIG);
    script.onerror = () => {
      onError('Failed to load Square Web Payments SDK');
    };
    document.body.appendChild(script);

    // Add CSS for Square hosted fields
    const style = document.createElement('style');
    style.textContent = `
      #card-container input {
        color: white !important;
      }
      #card-container input::placeholder {
        color: rgba(255, 255, 255, 0.6) !important;
      }
      #card-container .sq-input {
        color: white !important;
      }
      #card-container .sq-input::placeholder {
        color: rgba(255, 255, 255, 0.6) !important;
      }
      #card-container iframe {
        color-scheme: dark;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
      if (style.parentNode) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const initializeSquare = async (config?: typeof SQUARE_CONFIG) => {
    try {
      if (!window.Square) {
        throw new Error('Square Web Payments SDK not loaded');
      }

      setPaymentStatus('Initializing payment form...');

      const activeConfig = config || SQUARE_CONFIG;
      console.log('Initializing Square with:', {
        applicationId: activeConfig.applicationId,
        locationId: activeConfig.locationId
      });

      // Initialize Square Web Payments SDK
      const payments = window.Square.payments(
        activeConfig.applicationId,
        activeConfig.locationId
      );

      // Create hosted card element (includes all card fields)
      const card = await payments.card();

      // Attach card to DOM element
      await card.attach('#card-container');

      // Store card reference for tokenization
      setSquareFields({
        card: card
      });

      setPaymentStatus('');
    } catch (error) {
      console.error('Failed to initialize Square:', error);
      onError('Failed to initialize payment system. Please try again.');
    }
  };

  const validateForm = (): boolean => {
    // With hosted fields, Square handles validation
    // We just need to check if fields are initialized
    if (!squareFields) {
      onError('Payment form not initialized. Please refresh and try again.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setPaymentStatus('Processing payment...');

    try {
      // Live mode: tokenize with Square hosted fields
      if (!squareFields) {
        throw new Error('Payment form not initialized');
      }

      const tokenResult = await squareFields.card.tokenize();
      if (tokenResult.status === 'INVALID') {
        throw new Error('Invalid card information. Please check your details and try again.');
      } else if (tokenResult.status === 'FAILURE') {
        throw new Error('Card tokenization failed. Please try again.');
      }
      const token = tokenResult.token;

      // Call Supabase Edge Function for payment processing
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          sourceId: token,
          amount: amount,
          currency: 'GBP',
          idempotencyKey: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      });

      if (error) {
        throw new Error(`Payment failed: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Payment processing failed');
      }

      const paymentResponse = { payment: data.payment, errors: null };

      // Payment successful
      onSuccess(paymentResponse.payment);

    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.message || 'Payment failed. Please try again.';
      setPaymentStatus('');
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="w-5 h-5 text-brand-yellow" />
        <h3 className="text-lg font-semibold text-white">Payment Details</h3>
        <div className="flex items-center gap-2 ml-auto">
          <Lock className="w-4 h-4 text-green-400" />
        </div>
      </div>


      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Details (Hosted by Square) */}
        <div>
          <label className="block text-sm font-bold text-white mb-2">Card Details</label>
          <div
            id="card-container"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg focus-within:ring-2 focus-within:ring-brand-yellow/50"
            style={{ minHeight: '48px' }}
          />
        </div>

        {/* Payment Status */}
        {paymentStatus && (
          <div className="p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg text-blue-400 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {paymentStatus}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-4 bg-brand-yellow text-black font-bold text-lg rounded-xl hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-900/20 flex justify-center items-center gap-2"
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay £${amount.toFixed(2)}`
          )}
        </button>
      </form>
    </div>
  );
};

export default SquarePaymentForm;