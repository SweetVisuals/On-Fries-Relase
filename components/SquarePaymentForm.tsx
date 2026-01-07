import React, { useEffect, useState, useMemo } from 'react';
import { Loader2, CreditCard, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

declare global {
  interface Window {
    Square?: any;
  }
}

interface SquarePaymentFormProps {
  amount: number;
  cart: any[];
  onSuccess: (payment: any) => void;
  onError: (error: string) => void;
  orderReference?: string;
  customerEmail?: string;
  customerName?: string;
  disabled?: boolean;
}

interface UserDetails {
  givenName: string;
  familyName: string;
  email: string;
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
  cart,
  onSuccess,
  onError,
  orderReference,
  customerEmail,
  customerName,
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [squareFields, setSquareFields] = useState<any>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Environment-based Square configuration - FORCED PRODUCTION
  const SQUARE_CONFIG = useMemo(() => {
    return {
      applicationId: import.meta.env.VITE_SQUARE_PROD_APP_ID,
      locationId: import.meta.env.VITE_SQUARE_PROD_LOCATION_ID,
      environment: 'production' as const,
      scriptUrl: 'https://web.squarecdn.com/v1/square.js'
    };
  }, []);
  useEffect(() => {


    // Clear any existing card container content
    const cardContainer = document.getElementById('card-container');
    if (cardContainer) {
      cardContainer.innerHTML = '';
    }

    // Load Square Web Payments SDK
    const script = document.createElement('script');
    script.src = SQUARE_CONFIG.scriptUrl;
    script.async = true;
    script.onload = () => initializeSquare(SQUARE_CONFIG);
    script.onerror = () => {
      onError('Failed to load Square Web Payments SDK');
    };
    document.body.appendChild(script);

    // Minimal CSS for container only - Square handles iframe styling internally
    const style = document.createElement('style');
    style.textContent = `
      /* Container styling only */
      #card-container {
        background-color: rgb(39 39 42) !important;
        border: 1px solid rgb(63 63 70) !important;
        border-radius: 8px !important;
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
      // Clear card container on cleanup
      const container = document.getElementById('card-container');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []); // SQUARE_CONFIG is memoized, so this only runs once

  const initializeSquare = async (config?: typeof SQUARE_CONFIG) => {
    try {
      if (!window.Square) {
        throw new Error('Square Web Payments SDK not loaded');
      }

      setPaymentStatus('Initializing payment form...');

      const activeConfig = config || SQUARE_CONFIG;

      // Initialize Square Web Payments SDK
      const payments = window.Square.payments(
        activeConfig.applicationId,
        activeConfig.locationId
      );

      // Create hosted card element (includes all card fields)
      const card = await payments.card({
        style: {
          input: {
            color: '#ffffff',
            fontSize: '16px',
            backgroundColor: 'transparent'
          },
          'input::placeholder': {
            color: 'rgba(255, 255, 255, 0.6)'
          }
        }
      });

      // Attach card to DOM element
      await card.attach('#card-container');

      // Store card reference for tokenization
      setSquareFields({
        card: card,
        payments: payments
      });

      setPaymentStatus('');
    } catch (error) {

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

    // Clear any previous errors
    setPaymentError(null);
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

      // START SCA: Verify the buyer
      let verificationToken = undefined;

      try {
        const verificationDetails = {
          amount: amount.toString(),
          billingContact: {
            givenName: customerName || 'Guest',
            familyName: 'User',
            email: customerEmail || 'guest@example.com',
          },
          currencyCode: 'GBP',
          intent: 'CHARGE',
        };

        const verificationResult = await squareFields.payments.verifyBuyer(
          token,
          verificationDetails
        );

        if (verificationResult.token) {
          verificationToken = verificationResult.token;
        } else {
          // Not all cards require verification, but if it fails to produce a token when required, it might error later.
        }
      } catch (verifyError) {
        // Often better to fail here than let the backend fail with a less clear error
        throw new Error('Card verification failed. Please try again.');
      }

      // Call Supabase Edge Function for payment processing
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          sourceId: token,
          verificationToken: verificationToken,
          cart: cart,
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
      const errorMessage = error.message || 'Payment failed. Please try again.';
      setPaymentStatus('');
      setPaymentError(errorMessage);
      // IMPORTANT: We do NOT call onError(errorMessage) here for payment declines
      // because that would close the parent internal modal/drawer.
      // We only want to show the error LOCALLY so the user can retry.
      if (errorMessage.includes('initialize') || errorMessage.includes('SDK')) {
        onError(errorMessage); // Only close for fatal setup errors
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="w-full max-w-md mx-auto text-white">
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

        {/* Postal Code helper if needed (Square handles it inside iframe usually, but we ensure container expects white text) */}

        {/* Payment Error */}
        {paymentError && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300 mb-1">Payment Failed</p>
              <p className="text-red-400">{paymentError}</p>
            </div>
          </div>
        )}

        {/* Payment Status */}
        {paymentStatus && !paymentError && (
          <div className="p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg text-blue-400 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {paymentStatus}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-4 bg-brand-yellow text-black font-bold text-lg rounded-xl hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-900/20 flex justify-center items-center gap-2"
          disabled={disabled || isLoading || !squareFields}
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
