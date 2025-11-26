import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Trash2, ShoppingBag, CreditCard, CheckCircle, Gift, X } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { isOrderingAllowed } from '../../lib/utils';
import SquarePaymentForm from '../Checkout/SquarePaymentForm';
import PaymentSuccessScreen from '../Checkout/PaymentSuccessScreen';
import { createOrder, getCustomerCoupons, useCoupon, CustomerCoupon } from '../../lib/database';

interface CartDrawerProps {
   isOpen: boolean;
   onClose: () => void;
   onNavigateToOrders?: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onNavigateToOrders }) => {
    const { items, appliedCoupon, updateQuantity, removeItem, clearCart, applyCoupon, removeCoupon, getTotal, getDiscountedTotal, getItemCount } = useCart();
   const { user } = useAuth();
   const { toast } = useToast();
   const [showPayment, setShowPayment] = useState(false);
   const [showSuccess, setShowSuccess] = useState(false);
   const [orderReference, setOrderReference] = useState('');
   const [createdOrder, setCreatedOrder] = useState<any>(null);
   const [showSuccessTick, setShowSuccessTick] = useState(false);
   const [availableCoupons, setAvailableCoupons] = useState<CustomerCoupon[]>([]);
   const [loadingCoupons, setLoadingCoupons] = useState(false);
   const [isProcessing, setIsProcessing] = useState(false);

   useEffect(() => {
     if (isOpen && user && !user.isAdmin) {
       loadAvailableCoupons();
     }
   }, [isOpen, user]);

   const loadAvailableCoupons = async () => {
     if (!user) return;

     try {
       setLoadingCoupons(true);
       const coupons = await getCustomerCoupons(user.id);
       setAvailableCoupons(coupons);
     } catch (error) {
       console.error('Error loading coupons:', error);
     } finally {
       setLoadingCoupons(false);
     }
   };

   const handleCouponSelect = (couponId: string) => {
     if (couponId === 'none') {
       removeCoupon();
       return;
     }

     const selectedCoupon = availableCoupons.find(c => c.id === couponId);
     if (selectedCoupon) {
       applyCoupon(selectedCoupon);
     }
   };

   const getTimeRemaining = (expiresAt: string) => {
     const now = new Date();
     const expiry = new Date(expiresAt);
     const diffMs = expiry.getTime() - now.getTime();
     const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
     const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

     if (diffHours > 0) {
       return `${diffHours}h ${diffMinutes}m`;
     } else if (diffMinutes > 0) {
       return `${diffMinutes}m`;
     } else {
       return 'Expired';
     }
   };

   const handleStartPayment = async () => {
    if (!user) {
      toast({
        title: 'Please login',
        description: 'You need to login to place an order.',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Add some items to your cart before checking out.',
        variant: 'destructive',
      });
      return;
    }

    if (!isOrderingAllowed()) {
      toast({
        title: 'Ordering not available',
        description: 'The food truck is currently closed. Please check our hours.',
        variant: 'destructive',
      });
      return;
    }

    // Generate order reference
    const orderRef = `ONF-${Date.now()}`;
    setOrderReference(orderRef);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (payment: any) => {
     try {
       // Set processing state to show spinner
       setIsProcessing(true);

       const discountedTotal = getDiscountedTotal();
       console.log('Starting order creation process...', {
         customerId: user?.id || 'guest',
         customerName: user?.name || 'Guest',
         customerEmail: user?.email || '',
         items: items,
         total: discountedTotal,
         appliedCoupon: appliedCoupon?.id,
         orderReference
       });

       // Create order in database
       const newOrder = await createOrder({
         customerId: user?.id || 'guest',
         customerName: user?.name || 'Guest',
         customerEmail: user?.email || '',
         items: items,
         total: discountedTotal,
         notes: appliedCoupon ? `Applied coupon: ${appliedCoupon.coupon?.name}` : '',
         paymentId: payment.id,
         paymentStatus: payment.status
       });

       console.log('Order created successfully:', newOrder);

       // If coupon was used, mark it as used
       if (appliedCoupon) {
         try {
           await useCoupon(appliedCoupon.id, newOrder.id);
         } catch (couponError) {
           console.error('Error marking coupon as used:', couponError);
           // Don't fail the order for this
         }
       }

       // Store order data for success screen
       setCreatedOrder({
         ...newOrder,
         items: items,
         payment: payment,
         appliedCoupon: appliedCoupon
       });

       // Clear cart and show success screen
       clearCart();
       setIsProcessing(false);
       setShowPayment(false);
       setShowSuccess(true);

       toast({
         title: 'Payment Successful!',
         description: `Order #${orderReference} has been placed successfully.`,
       });

     } catch (error: any) {
       console.error('Error creating order:', error);
       console.error('Order creation failed with details:', {
         message: error.message,
         details: error.details,
         hint: error.hint,
         code: error.code
       });
       setIsProcessing(false);
       setShowPayment(false);
       setOrderReference('');
       toast({
         title: 'Order Creation Failed',
         description: `Payment was successful but order creation failed: ${error.message}`,
         variant: 'destructive',
       });
     }
   };

  const handlePaymentError = (error: string) => {
    setShowPayment(false);
    setOrderReference('');
    toast({
      title: 'Payment Failed',
      description: error,
      variant: 'destructive',
    });
  };

  const handleBackToCart = () => {
    setShowPayment(false);
    setOrderReference('');
  };

  // Always render one Sheet component

  if (items.length === 0 && !showSuccess) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Your Cart
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">Add some delicious items to your cart</p>
            <Button onClick={onClose}>Continue Browsing</Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose} key={`cart-sheet-${isOpen}`}>
      <SheetContent className="w-full sm:max-w-md h-screen flex flex-col border-2 border-border">
        {/* Payment Success Screen */}
        {showSuccess && createdOrder ? (
          <PaymentSuccessScreen
            payment={createdOrder.payment}
            orderId={createdOrder.display_id || createdOrder.id}
            total={createdOrder.total}
            customerName={createdOrder.customer_name}
            items={createdOrder.items.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            }))}
            estimatedDelivery={createdOrder.estimated_delivery}
            onBackToMenu={() => {
              setShowSuccess(false);
              setCreatedOrder(null);
              onClose();
            }}
            onViewOrders={() => {
              setShowSuccess(false);
              setCreatedOrder(null);
              onClose();
              if (onNavigateToOrders) {
                onNavigateToOrders();
              }
            }}
            isInDrawer={true}
          />
        ) : (
          <>
            {/* Only show header when not showing success screen */}
            <SheetHeader className="pr-12 pt-5">
              <SheetTitle className="flex items-center gap-3">
                <span className="flex items-center gap-3">
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                        Processing Order...
                      </>
                    ) : showSuccessTick ? (
                      <>
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                        Payment Successful!
                      </>
                    ) : showPayment ? (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Secure Payment
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5" />
                        Your Cart
                      </>
                    )}
                  </span>
                {!showPayment && !showSuccessTick && !isProcessing && (
                  <Badge variant="secondary" className="ml-auto">
                    {getItemCount()} items
                  </Badge>
                )}
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto py-4 pl-6 scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-transparent">
              {isProcessing ? (
                // Processing Screen
                <div className="px-2.5 flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Processing Payment...</h3>
                  <p className="text-muted-foreground text-center">Please wait while we complete your order.</p>
                </div>
              ) : showPayment ? (
                // Payment Form
                <div className="px-2.5">
                  <SquarePaymentForm
                    amount={getTotal()}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    orderReference={orderReference}
                    customerEmail={user?.email}
                    disabled={false}
                  />

                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleBackToCart}
                      disabled={false}
                    >
                      Back to Cart
                    </Button>
                  </div>
                </div>
              ) : (
                // Cart Contents
                <div className="px-2.5 grid grid-cols-1 gap-3">
                  {items.map((item) => (
                    <div key={item.id} className="bg-muted rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">£{item.price.toFixed(2)}</p>
                        </div>

                        <div className="flex items-center gap-2 ml-2">
                          <div
                            className="cursor-pointer p-2 sm:p-1 hover:bg-accent rounded-md transition-colors"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-5 h-5 sm:w-3 sm:h-3 text-foreground" />
                          </div>

                          <span className="text-sm font-medium w-8 text-center text-foreground">
                            {item.quantity}
                          </span>

                          <div
                            className="cursor-pointer p-2 sm:p-1 hover:bg-accent rounded-md transition-colors"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-5 h-5 sm:w-3 sm:h-3 text-foreground" />
                          </div>

                          <div
                            className="cursor-pointer p-1 hover:bg-accent rounded-md transition-colors"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-3 h-3 text-destructive hover:text-destructive" />
                          </div>
                        </div>
                      </div>

                      {/* Display add-ons */}
                      {item.addOns && item.addOns.length > 0 && (
                        <div className="mt-2 pl-4 border-l-2 border-gray-400 dark:border-gray-500">
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1 uppercase tracking-wide">Add-ons</p>
                          <div className="space-y-1">
                            {item.addOns.map((addon) => (
                              <div key={addon.item?.id || Math.random()} className="flex justify-between items-center text-xs">
                                <span className="text-gray-700 dark:text-gray-300">
                                  {addon.item?.name || 'Unknown'} x{addon.quantity}
                                </span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                  £{((addon.item?.price || 0) * addon.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Display drinks */}
                      {item.drinks && item.drinks.length > 0 && (
                        <div className="mt-2 pl-4 border-l-2 border-gray-400 dark:border-gray-500">
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1 uppercase tracking-wide">Drink</p>
                          <div className="space-y-1">
                            {item.drinks.map((drink) => (
                              <div key={drink.item?.id || Math.random()} className="flex justify-between items-center text-xs">
                                <span className="text-gray-700 dark:text-gray-300">
                                  {drink.item?.name || 'Unknown'} x{drink.quantity}
                                </span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                  £{((drink.item?.price || 0) * drink.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!showPayment && (
              <div className="border-t pt-4 mt-4 px-2.5">
                {/* Coupon Selector */}
                {user && !user.isAdmin && availableCoupons.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Apply Coupon</span>
                    </div>
                    <Select
                      value={appliedCoupon?.id || 'none'}
                      onValueChange={handleCouponSelect}
                      disabled={loadingCoupons}
                    >
                      <SelectTrigger className="w-full">
                        <SelectContent>
                          <SelectItem value="none">No coupon</SelectItem>
                          {availableCoupons.map((coupon) => (
                            <SelectItem key={coupon.id} value={coupon.id}>
                              {coupon.coupon?.name} - {getTimeRemaining(coupon.expires_at)} left
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </SelectTrigger>
                    </Select>
                  </div>
                )}

                {/* Applied Coupon Display */}
                {appliedCoupon && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          {appliedCoupon.coupon?.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCoupon()}
                        className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      {appliedCoupon.coupon?.description || 'Coupon applied'}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {appliedCoupon ? (
                    <>
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Subtotal:</span>
                        <span>£{getTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-green-600">
                        <span>Discount ({appliedCoupon.coupon?.name}):</span>
                        <span>-£{(getTotal() - getDiscountedTotal()).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-xl font-bold text-yellow-600">
                          £{getDiscountedTotal().toFixed(2)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-xl font-bold text-yellow-600">
                        £{getTotal().toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mt-4">
                  <Button
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                    size="lg"
                    onClick={handleStartPayment}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay Securely
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearCart}
                  >
                    Clear Cart
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
