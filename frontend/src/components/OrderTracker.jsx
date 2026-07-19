import { ORDER_STEPS } from '../context/AuthContext';

// Horizontal (desktop) / vertical (mobile) status timeline for an order.
export default function OrderTracker({ statusIndex = 0 }) {
  return (
    <div className="order-tracker">
      {ORDER_STEPS.map((step, idx) => {
        const done = idx <= statusIndex;
        const current = idx === statusIndex;
        return (
          <div
            key={step.key}
            className={`order-step${done ? ' is-done' : ''}${current ? ' is-current' : ''}`}
          >
            <div className="order-step__dot">
              <i className={`bi ${done ? step.icon : 'bi-circle'}`} />
            </div>
            <div className="order-step__label">{step.label}</div>
          </div>
        );
      })}
    </div>
  );
}
