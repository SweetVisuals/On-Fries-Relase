import React, { useEffect, useState } from 'react';
import { Loader2, CreditCard, Lock, TestTube } from 'lucide-react';
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
  const [paymentMode, setPaymentMode] = useState<'test' | 'live'>('live');
  const [squareFields, setSquareFields] = useState<any>(null);

  // Environment-based Square configuration
  const SQUARE_CONFIG = {
    applicationId: import.meta.env.VITE_SQUARE_APPLICATION_ID || 'sq0idp-oBleGoboqpllvndrWQ9Zuw',
    locationId: import.meta.env.VITE_SQUARE_LOCATION_ID || 'L14KB0DPJ20SD',
    environment: (import.meta.env.VITE_SQUARE_ENVIRONMENT || 'production') as 'sandbox' | 'production',
    scriptUrl: import.meta.env.VITE_SQUARE_ENVIRONMENT === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js'
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

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
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
    setPaymentStatus(paymentMode === 'test' ? 'Processing test payment...' : 'Processing payment...');

    try {
      let token: string;

      if (paymentMode === 'test') {
        // Test mode: simulate tokenization
        const tokenResult = await simulateTokenization();
        if (tokenResult.errors) {
          throw new Error('Card tokenization failed');
        }
        token = tokenResult.token || 'simulated_token_' + Date.now();
      } else {
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
        token = tokenResult.token;
      }

      // Call Supabase Edge Function for payment processing
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          sourceId: token,
          amount: amount,
          currency: 'GBP',
          idempotencyKey: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          isSandbox: paymentMode === 'test'
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

  // Simulate card tokenization for demo purposes
  const simulateTokenization = (): Promise<{token?: string, errors?: any[]}> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate validation
        const cardNumber = cardForm.cardNumber.replace(/\s/g, '');

        // Simulate card decline for certain numbers
        if (cardNumber === '4000000000000002') {
          resolve({ errors: [{ category: 'PAYMENT_METHOD_ERROR', code: 'CARD_DECLINED' }] });
          return;
        }

        resolve({ token: `cnon:card-nonce-${Date.now()}` });
      }, 1000);
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="w-5 h-5 text-brand-yellow" />
        <h3 className="text-lg font-semibold text-white">Payment Details</h3>
        <div className="flex items-center gap-2 ml-auto">
          {paymentMode === 'test' && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-900/20 border border-blue-500/30 rounded text-xs text-blue-400">
              <TestTube className="w-3 h-3" />
              TEST
            </div>
          )}
          <Lock className="w-4 h-4 text-green-400" />
        </div>
      </div>

      {/* Payment Mode Selector */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setPaymentMode('test')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-colors ${
            paymentMode === 'test'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
          }`}
        >
          Test Mode
        </button>
        <button
          type="button"
          onClick={() => setPaymentMode('live')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-colors ${
            paymentMode === 'live'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
          }`}
        >
          Live Mode
        </button>
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

      {/* Card Information */}
      {paymentMode === 'test' && (
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg text-sm">
          <p className="font-bold mb-2 text-blue-400">Test Cards (Demo Mode):</p>
          <p className="text-blue-300">Success: 4111 1111 1111 1111</p>
          <p className="text-blue-300">Decline: 4000 0000 0000 0002</p>
        </div>
      )}
      {paymentMode === 'live' && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/20 rounded-lg text-sm">
          <p className="font-bold mb-2 text-red-400">⚠️ Live Mode Warning:</p>
          <p className="text-red-300">Real money will be charged to your card.</p>
          <p className="text-red-300">Use test mode for demonstration purposes.</p>
        </div>
      )}
    </div>
  );
};

export default SquarePaymentForm;