// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface PaymentRequest {
  sourceId?: string
  amount: number
  currency: string
  idempotencyKey: string
  isSandbox?: boolean
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
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
    const { sourceId, amount, currency, idempotencyKey, isSandbox = false, type = 'payment' }: PaymentRequest = await req.json()

    // Validate required fields
    if (type === 'payment' && !sourceId) {
      return new Response(JSON.stringify({ error: 'Missing sourceId for payment' }), {
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

    // Get Square credentials based on environment
    const accessToken = isSandbox
      ? Deno.env.get('SQUARE_SANDBOX_ACCESS_TOKEN')
      : Deno.env.get('SQUARE_PRODUCTION_ACCESS_TOKEN')

    const locationId = isSandbox
      ? Deno.env.get('SQUARE_SANDBOX_LOCATION_ID')
      : Deno.env.get('SQUARE_PRODUCTION_LOCATION_ID')

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
      squareUrl = isSandbox
        ? 'https://connect.squareupsandbox.com/v2/online-checkout/payment-links'
        : 'https://connect.squareup.com/v2/online-checkout/payment-links'

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
      squareUrl = isSandbox
        ? 'https://connect.squareupsandbox.com/v2/payments'
        : 'https://connect.squareup.com/v2/payments'

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

    const response = await fetch(squareUrl, {
      method: 'POST',
      headers: {
        'Square-Version': '2025-10-16',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Square API error:', result)
      const errorMessage = type === 'checkout' ? 'Checkout creation failed' : 'Payment failed'
      const detailedError = result.errors ? result.errors[0]?.detail || result.errors[0]?.code || 'Unknown error' : 'Unknown error'
      return new Response(JSON.stringify({
        error: `${errorMessage}: ${detailedError}`,
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
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
