import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Lock, TestTube } from 'lucide-react';
import PaymentModeSelector from './PaymentModeSelector';
import { PAYMENT_MODE } from '../../config/square';
import { 
  createPaymentFromCart, 
  validatePaymentError, 
  getPaymentErrorMessage
} from '../../lib/squarePayment';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

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
  // @ts-ignore - customerEmail parameter intentionally unused but required for interface
  customerEmail,
  disabled = false
}) => {
  const { user } = useAuth();
  const { clearCart } = useCart();
  const { toast } = useToast();
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
  const [paymentMode, setPaymentMode] = useState<'test' | 'live'>(PAYMENT_MODE);

  // Hardcode sandbox configuration to eliminate environment mismatch
  const SQUARE_CONFIG = {
    applicationId: 'sandbox-sq0idb-oggrMwUwXBTTDHGC8sZHTQ',
    locationId: 'L14KB0DPJ20SD',
    environment: 'sandbox' as const,
    scriptUrl: 'https://sandbox.web.squarecdn.com/v1/square.js'
  };

  // Handle payment mode change
  const handleModeChange = (mode: 'test' | 'live') => {
    setPaymentMode(mode);
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
      document.body.removeChild(script);
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
        // Live mode: attempt real payment processing
        // This would normally require a backend API call
        try {
          paymentResponse = await createPaymentFromCart(
            amount,
            token,
            user?.id,
            orderReference || `order_${Date.now()}`
          );

          if (paymentResponse.errors) {
            const error = validatePaymentError(paymentResponse);
            if (error) {
              throw new Error(getPaymentErrorMessage(error));
            }
          }
        } catch (apiError: any) {
          // Handle CORS and other API-related errors
          if (apiError.message.includes('CORS') || apiError.message.includes('Failed to fetch')) {
            throw new Error('Live payment processing requires a backend server. Please use test mode or contact support.');
          }
          throw apiError;
        }
      }

      // Payment successful
      toast({
        title: 'Payment Successful',
        description: `Your payment of £${amount.toFixed(2)} has been processed successfully. (${paymentMode.toUpperCase()} Mode)`,
      });

      // Call success callback (cart clearing is handled by CartDrawer)
      onSuccess(paymentResponse.payment);

    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.message || 'Payment failed. Please try again.';
      setPaymentStatus('');
      onError(errorMessage);
      
      toast({
        title: 'Payment Failed',
        description: errorMessage,
        variant: 'destructive',
      });
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
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <CreditCard className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold">Payment Details</h3>
          <div className="flex items-center gap-2 ml-auto">
            {paymentMode === 'test' && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                <TestTube className="w-3 h-3" />
                TEST
              </div>
            )}
            <Lock className="w-4 h-4 text-green-600" />
          </div>
        </div>

        {/* Payment Mode Selector */}
        <PaymentModeSelector 
          currentMode={paymentMode}
          onModeChange={handleModeChange}
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Number */}
          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardForm.cardNumber}
              onChange={handleCardNumberChange}
              className={errors.cardNumber ? 'border-red-500' : ''}
              disabled={disabled || isLoading}
            />
            {errors.cardNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
            )}
          </div>

          {/* Expiration and CVV */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="expirationMonth">Month</Label>
              <Input
                id="expirationMonth"
                type="text"
                placeholder="MM"
                maxLength={2}
                value={cardForm.expirationMonth}
                onChange={(e) => handleInputChange('expirationMonth', e.target.value)}
                className={errors.expirationMonth ? 'border-red-500' : ''}
                disabled={disabled || isLoading}
              />
              {errors.expirationMonth && (
                <p className="text-red-500 text-sm mt-1">{errors.expirationMonth}</p>
              )}
            </div>
            <div>
              <Label htmlFor="expirationYear">Year</Label>
              <Input
                id="expirationYear"
                type="text"
                placeholder="YYYY"
                maxLength={4}
                value={cardForm.expirationYear}
                onChange={(e) => handleInputChange('expirationYear', e.target.value)}
                className={errors.expirationYear ? 'border-red-500' : ''}
                disabled={disabled || isLoading}
              />
              {errors.expirationYear && (
                <p className="text-red-500 text-sm mt-1">{errors.expirationYear}</p>
              )}
            </div>
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                type="text"
                placeholder="123"
                maxLength={4}
                value={cardForm.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                className={errors.cvv ? 'border-red-500' : ''}
                disabled={disabled || isLoading}
              />
              {errors.cvv && (
                <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
              )}
            </div>
          </div>

          {/* Postal Code */}
          <div>
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input
              id="postalCode"
              type="text"
              placeholder="SW1A 1AA"
              value={cardForm.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              className={errors.postalCode ? 'border-red-500' : ''}
              disabled={disabled || isLoading}
            />
            {errors.postalCode && (
              <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
            )}
          </div>

          {/* Payment Status */}
          {paymentStatus && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>{paymentStatus}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3"
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              `Pay £${amount.toFixed(2)}`
            )}
          </Button>
        </form>

        {/* Card Information */}
        {paymentMode === 'test' && (
          <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg text-sm">
            <p className="font-medium mb-2 text-blue-800 dark:text-blue-200">Test Cards (Demo Mode):</p>
            <p className="text-blue-700 dark:text-blue-300">Success: 4111 1111 1111 1111</p>
            <p className="text-blue-700 dark:text-blue-300">Decline: 4000 0000 0000 0002</p>
          </div>
        )}
        {paymentMode === 'live' && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 rounded-lg text-sm">
            <p className="font-medium mb-2 text-red-800 dark:text-red-200">⚠️ Live Mode Warning:</p>
            <p className="text-red-700 dark:text-red-300">Real money will be charged to your card.</p>
            <p className="text-red-700 dark:text-red-300">Use test mode for demonstration purposes.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SquarePaymentForm;