import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import Button from 'react-bootstrap/Button';
import { formatPrice } from '../utils/format';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

function PayButton({ total, onPaid, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    onError(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    setSubmitting(false);

    if (error) {
      onError(error.message || 'Payment failed. Please check your card details.');
      return;
    }
    if (paymentIntent?.status === 'succeeded') {
      onPaid(paymentIntent.id);
    } else {
      onError(`Payment status: ${paymentIntent?.status || 'unknown'}. Please try again.`);
    }
  };

  return (
    <div className="d-grid mt-3">
      <Button
        type="button"
        variant="primary"
        size="lg"
        disabled={!stripe || submitting}
        onClick={handlePay}
      >
        <i className="bi bi-shield-lock me-2" />
        {submitting ? 'Processing…' : `Pay ${formatPrice(total)} & place order`}
      </Button>
      <p className="text-muted small text-center mt-2 mb-0">
        Test mode — use card 4242 4242 4242 4242, any future date, any CVC.
      </p>
    </div>
  );
}

// clientSecret: from POST /api/payments/create-intent
// onPaid(paymentIntentId): called once Stripe confirms the charge succeeded
export default function StripeCheckoutForm({ clientSecret, total, onPaid }) {
  const [error, setError] = useState(null);

  if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="alert alert-warning mt-3 mb-0">
        Add <code>VITE_STRIPE_PUBLISHABLE_KEY</code> to the frontend <code>.env</code> to enable
        card payments (see <code>backend/README.md</code>).
      </div>
    );
  }

  return (
    <div className="mt-4 p-3 border rounded-3 bg-light">
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentElement />
        {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
        <PayButton total={total} onPaid={onPaid} onError={setError} />
      </Elements>
    </div>
  );
}
