// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface PaymentRequest {
  sourceId?: string
  cardDetails?: {
    number: string
    expirationMonth: string
    expirationYear: string
    cvv: string
    postalCode: string
  }
  amount: number
  currency: string
  idempotencyKey: string
  type?: 'payment' | 'checkout'
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey'
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }

  try {
    const { sourceId, cardDetails, amount, currency, idempotencyKey, type = 'payment' }: PaymentRequest = await req.json()

    // Validate required fields
    if (type === 'payment' && !sourceId && !cardDetails) {
      return new Response(JSON.stringify({ error: 'Missing sourceId or cardDetails for payment' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    if (!amount || !currency || !idempotencyKey) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Get Square production credentials
    const accessToken = Deno.env.get('SQUARE_PRODUCTION_ACCESS_TOKEN')
    const locationId = Deno.env.get('SQUARE_PRODUCTION_LOCATION_ID')

    if (!accessToken || !locationId) {
      return new Response(JSON.stringify({ error: 'Square configuration missing' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    let squareUrl: string;
    let requestBody: any;

    if (type === 'checkout') {
      // Create payment link
      squareUrl = 'https://connect.squareup.com/v2/online-checkout/payment-links'

      requestBody = {
        idempotency_key: idempotencyKey,
        quick_pay: {
          name: 'Order payment',
          price_money: {
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toUpperCase()
          },
          location_id: locationId
        },
        checkout_options: {
          redirect_url: `${Deno.env.get('VITE_APP_URL') || 'http://localhost:3000'}/payment-success`
        }
      }
    } else {
      // Create payment
      squareUrl = 'https://connect.squareup.com/v2/payments'

      if (cardDetails) {
        // Use card details directly (for development/testing - not recommended for production)
        requestBody = {
          idempotency_key: idempotencyKey,
          amount_money: {
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toUpperCase()
          },
          location_id: locationId,
          source_id: 'cnon:card-nonce-ok', // Required placeholder for card details
          card_details: {
            number: cardDetails.number.replace(/\s/g, ''),
            expiration_month: parseInt(cardDetails.expirationMonth),
            expiration_year: parseInt(cardDetails.expirationYear),
            cvv: cardDetails.cvv,
            billing_address: {
              postal_code: cardDetails.postalCode
            }
          },
          autocomplete: true
        }
      } else {
        // Use source_id (token)
        requestBody = {
          source_id: sourceId,
          idempotency_key: idempotencyKey,
          amount_money: {
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toUpperCase()
          },
          location_id: locationId,
          autocomplete: true
        }
      }
    }

    const response = await fetch(squareUrl, {
      method: 'POST',
      headers: {
        'Square-Version': '2024-10-17',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Square API error:', result)

      // Handle specific Square error codes with user-friendly messages
      let userFriendlyMessage = 'Payment failed. Please try again.';
      if (result.errors && result.errors.length > 0) {
        const primaryError = result.errors[0];
        switch (primaryError.code) {
          case 'EXPIRATION_FAILURE':
            userFriendlyMessage = 'Card expired. Please check your expiration date and try again.';
            break;
          case 'CVV_FAILURE':
            userFriendlyMessage = 'Invalid security code. Please check your CVV and try again.';
            break;
          case 'CARD_DECLINED':
            userFriendlyMessage = 'Card declined. Please try a different card or contact your bank.';
            break;
          case 'INSUFFICIENT_FUNDS':
            userFriendlyMessage = 'Insufficient funds. Please check your account balance or try a different card.';
            break;
          case 'INVALID_CARD':
            userFriendlyMessage = 'Invalid card. Please check your card details and try again.';
            break;
          case 'GENERIC_DECLINE':
            userFriendlyMessage = 'Payment declined. Please try a different card or contact your bank.';
            break;
          case 'CARD_NOT_SUPPORTED':
            userFriendlyMessage = 'Card type not supported. Please try a different card.';
            break;
          case 'TRANSACTION_LIMIT':
            userFriendlyMessage = 'Transaction limit exceeded. Please contact your bank.';
            break;
          default:
            userFriendlyMessage = 'Payment failed. Please check your card details and try again.';
        }
      }

      return new Response(JSON.stringify({
        error: userFriendlyMessage,
        details: result
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    if (type === 'checkout') {
      return new Response(JSON.stringify({
        success: true,
        checkout_url: result.payment_link.url
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    } else {
      return new Response(JSON.stringify({
        success: true,
        payment: result.payment
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

  } catch (error) {
    console.error('Payment processing error:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

   curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/process-payment' \
     --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
     --header 'Content-Type': application/json' \
     --data '{"name":"Functions"}'

 */