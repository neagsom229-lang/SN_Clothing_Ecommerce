import { useEffect, useState, useRef } from 'react';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { createBakongQr, checkBakongPayment } from '../api/client';
import { formatPrice } from '../utils/format';

export default function BakongPayment({ items, carrier, currency = 'USD', token, expectedTotal, onSuccess, onExpired }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null); // { md5, tranId, checkoutUrl, qrImageUrl, qr, amount, orderId, expiresAt }
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes default window
  const [checking, setChecking] = useState(false);

  const pollIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const pollingElapsedRef = useRef(0);

  // Generate QR / checkout session on mount
  useEffect(() => {
    let cancelled = false;

    async function initPayment() {
      try {
        setLoading(true);
        setError(null);
        const res = await createBakongQr({ items, carrier, currency, expectedTotal, token });
        if (cancelled) return;

        if (expectedTotal !== undefined && Math.abs(res.amount - expectedTotal) > 0.001) {
          throw new Error(`Amount mismatch: QR amount ($${res.amount}) does not match cart total ($${expectedTotal}).`);
        }

        setPaymentData(res);
        if (res.expiresAt) {
          const diffSec = Math.max(0, Math.floor((new Date(res.expiresAt).getTime() - Date.now()) / 1000));
          setTimeLeft(diffSec);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to initialize KHQR checkout session.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    initPayment();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSuccessRef = useRef(onSuccess);
  const onExpiredRef = useRef(onExpired);

  useEffect(() => { onSuccessRef.current = onSuccess; });
  useEffect(() => { onExpiredRef.current = onExpired; });

  // Countdown timer
  useEffect(() => {
    if (!paymentData) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          if (onExpiredRef.current) onExpiredRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [paymentData]);

  // Polling payment status every 4000ms, capped at 10 minutes (600 seconds)
  useEffect(() => {
    if (!paymentData?.md5) return;

    pollIntervalRef.current = setInterval(async () => {
      pollingElapsedRef.current += 4;
      if (pollingElapsedRef.current >= 600) {
        clearInterval(pollIntervalRef.current);
        if (onExpiredRef.current) onExpiredRef.current();
        return;
      }

      try {
        setChecking(true);
        const statusRes = await checkBakongPayment(paymentData.md5, token);
        if (statusRes.paid) {
          clearInterval(pollIntervalRef.current);
          clearInterval(timerIntervalRef.current);
          if (onSuccessRef.current) onSuccessRef.current(statusRes.orderId, paymentData.md5, statusRes.orphaned);
        } else if (statusRes.status === 'expired') {
          clearInterval(pollIntervalRef.current);
          clearInterval(timerIntervalRef.current);
          if (onExpiredRef.current) onExpiredRef.current();
        }
      } catch (err) {
        console.error('[bakong poll] error:', err);
      } finally {
        setChecking(false);
      }
    }, 4000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [paymentData?.md5, token]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleOpenCheckout = () => {
    if (paymentData?.checkoutUrl) {
      window.location.href = paymentData.checkoutUrl;
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-4 p-5 border rounded-3 bg-light">
        <Spinner animation="border" variant="primary" className="mb-3" />
        <p className="fw-semibold mb-0 text-muted">Initializing KHQR Checkout…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger mt-4 p-4 text-center">
        <i className="bi bi-exclamation-triangle-fill fs-3 d-block mb-2" />
        <p className="fw-semibold mb-2">{error}</p>
        <Button variant="outline-danger" size="sm" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (timeLeft === 0) {
    return (
      <div className="alert alert-warning mt-4 p-4 text-center">
        <i className="bi bi-clock-history fs-3 d-block mb-2" />
        <p className="fw-semibold mb-2">QR Code Expired</p>
        <p className="text-muted small mb-3">This payment session has expired after 10 minutes.</p>
        <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
          Generate New QR
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center mt-4 p-4 border rounded-3 bg-light">
      <p className="fw-semibold mb-1">Scan QR or open hosted checkout page</p>
      <p className="text-muted small mb-3">
        Amount: <strong className="text-dark">{formatPrice(paymentData?.amount || 0)}</strong> · Expires in{' '}
        <span className="text-danger fw-bold">{formatTime(timeLeft)}</span>
      </p>

      {/* Inline QR Image fallback */}
      {paymentData?.qrImageUrl && (
        <div className="d-inline-block bg-white p-3 rounded-3 shadow-sm mb-3">
          <img
            src={paymentData.qrImageUrl}
            alt="KHQR Payment Code"
            className="img-fluid rounded"
            style={{ width: 220, height: 220, objectFit: 'contain' }}
          />
          <div className="fw-bold mt-2 text-danger">Bakong KHQR</div>
          <div className="small text-muted">
            {formatPrice(paymentData?.amount || 0)} · Ref {paymentData?.md5?.slice(0, 8)}
          </div>
        </div>
      )}

      {/* Hosted Checkout Page Button */}
      {paymentData?.checkoutUrl && (
        <div className="d-grid gap-2 mb-3">
          <Button variant="danger" size="lg" onClick={handleOpenCheckout}>
            <i className="bi bi-box-arrow-up-right me-2" />
            Open KHQR Hosted Checkout
          </Button>
        </div>
      )}

      <div className="mt-2 text-muted small d-flex align-items-center justify-content-center gap-2">
        {checking && <Spinner animation="border" size="sm" variant="secondary" />}
        <span>Waiting for payment confirmation…</span>
      </div>
    </div>
  );
}
