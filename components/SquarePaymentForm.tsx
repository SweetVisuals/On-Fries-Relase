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
  const [paymentMode, setPaymentMode] = useState<'test' | 'live'>('test');

  // Hardcode sandbox configuration
  const SQUARE_CONFIG = {
    applicationId: 'sandbox-sq0idb-oggrMwUwXBTTDHGC8sZHTQ',
    locationId: 'L14KB0DPJ20SD',
    environment: 'sandbox' as const,
    scriptUrl: 'https://sandbox.web.squarecdn.com/v1/square.js'
  };

  useEffect(() => {
    console.log('Initializing Square with hardcoded sandbox config:', SQUARE_CONFIG);

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
      window.Square.payments(
        activeConfig.applicationId,
        activeConfig.locationId
      );

      setPaymentStatus('');
    } catch (error) {
      console.error('Failed to initialize Square:', error);
      onError('Failed to initialize payment system. Please try again.');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Card number validation (basic)
    if (!cardForm.cardNumber.replace(/\s/g, '') || cardForm.cardNumber.replace(/\s/g, '').length < 16) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }

    // Expiration date validation
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const expMonth = parseInt(cardForm.expirationMonth);
    const expYear = parseInt(cardForm.expirationYear);

    if (!expMonth || expMonth < 1 || expMonth > 12) {
      newErrors.expirationMonth = 'Invalid month';
    }

    if (!expYear || expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      newErrors.expirationYear = 'Card has expired';
    }

    // CVV validation
    if (!cardForm.cvv || cardForm.cvv.length < 3) {
      newErrors.cvv = 'Invalid CVV';
    }

    // Postal code validation (basic)
    if (!cardForm.postalCode || cardForm.postalCode.length < 3) {
      newErrors.postalCode = 'Invalid postal code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CardFormData, value: string) => {
    setCardForm(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      handleInputChange('cardNumber', formatted);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setPaymentStatus(paymentMode === 'test' ? 'Processing test payment...' : 'Processing payment...');

    try {
      // Tokenize card data
      const tokenResult = await simulateTokenization();

      if (tokenResult.errors) {
        throw new Error('Card tokenization failed');
      }

      const token = tokenResult.token || 'simulated_token_' + Date.now();

      let paymentResponse;

      if (paymentMode === 'test') {
        // Test mode: simulate payment processing
        const simulatedPayment = {
          id: 'test_payment_' + Date.now(),
          status: 'COMPLETED',
          amount: amount,
          currency: 'GBP',
          orderReference: orderReference || `order_${Date.now()}`,
          timestamp: new Date().toISOString(),
          cardDetails: {
            last4: cardForm.cardNumber.slice(-4),
            brand: 'VISA'
          }
        };

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        paymentResponse = { payment: simulatedPayment, errors: null };

      } else {
        // Live mode: call Supabase Edge Function for payment processing
        const { data, error } = await supabase.functions.invoke('process-payment', {
          body: {
            sourceId: token,
            amount: amount,
            currency: 'GBP',
            idempotencyKey: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            isSandbox: false
          }
        });

        if (error) {
          throw new Error(`Payment failed: ${error.message}`);
        }

        if (!data.success) {
          throw new Error(data.error || 'Payment processing failed');
        }

        paymentResponse = { payment: data.payment, errors: null };
      }

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
        {/* Card Number */}
        <div>
          <label className="block text-sm font-bold text-zinc-400 mb-2">Card Number</label>
          <input
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cardForm.cardNumber}
            onChange={handleCardNumberChange}
            className={`w-full px-4 py-3 bg-zinc-900 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-yellow/50 ${errors.cardNumber ? 'border-red-500' : 'border-zinc-700'}`}
            disabled={disabled || isLoading}
          />
          {errors.cardNumber && (
            <p className="text-red-400 text-sm mt-1">{errors.cardNumber}</p>
          )}
        </div>

        {/* Expiration and CVV */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-2">Month</label>
            <input
              type="text"
              placeholder="MM"
              maxLength={2}
              value={cardForm.expirationMonth}
              onChange={(e) => handleInputChange('expirationMonth', e.target.value)}
              className={`w-full px-3 py-3 bg-zinc-900 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-yellow/50 ${errors.expirationMonth ? 'border-red-500' : 'border-zinc-700'}`}
              disabled={disabled || isLoading}
            />
            {errors.expirationMonth && (
              <p className="text-red-400 text-sm mt-1">{errors.expirationMonth}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-2">Year</label>
            <input
              type="text"
              placeholder="YYYY"
              maxLength={4}
              value={cardForm.expirationYear}
              onChange={(e) => handleInputChange('expirationYear', e.target.value)}
              className={`w-full px-3 py-3 bg-zinc-900 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-yellow/50 ${errors.expirationYear ? 'border-red-500' : 'border-zinc-700'}`}
              disabled={disabled || isLoading}
            />
            {errors.expirationYear && (
              <p className="text-red-400 text-sm mt-1">{errors.expirationYear}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-2">CVV</label>
            <input
              type="text"
              placeholder="123"
              maxLength={4}
              value={cardForm.cvv}
              onChange={(e) => handleInputChange('cvv', e.target.value)}
              className={`w-full px-3 py-3 bg-zinc-900 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-yellow/50 ${errors.cvv ? 'border-red-500' : 'border-zinc-700'}`}
              disabled={disabled || isLoading}
            />
            {errors.cvv && (
              <p className="text-red-400 text-sm mt-1">{errors.cvv}</p>
            )}
          </div>
        </div>

        {/* Postal Code */}
        <div>
          <label className="block text-sm font-bold text-zinc-400 mb-2">Postal Code</label>
          <input
            type="text"
            placeholder="SW1A 1AA"
            value={cardForm.postalCode}
            onChange={(e) => handleInputChange('postalCode', e.target.value)}
            className={`w-full px-4 py-3 bg-zinc-900 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-yellow/50 ${errors.postalCode ? 'border-red-500' : 'border-zinc-700'}`}
            disabled={disabled || isLoading}
          />
          {errors.postalCode && (
            <p className="text-red-400 text-sm mt-1">{errors.postalCode}</p>
          )}
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