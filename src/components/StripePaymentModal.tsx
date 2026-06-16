import { FormEvent, useState } from "react";
import { CreditCard, Lock } from "lucide-react";
import Modal from "./Modal.jsx";
import {
  formatCardNumber,
  formatExpiry,
  validateCardForm,
} from "../utils/cardForm.js";
import { keepCaretAtEnd } from "../utils/inputCaret.js";
import { Bill } from "../types.js";
import { useToast } from "../context/ToastContext.js";

interface StripePaymentModalProps {
  bill: Bill | null;
  open: boolean;
  onClose: () => void;
  onPayBill: (billId: string) => Promise<boolean>;
}

export default function StripePaymentModal({
  bill,
  open,
  onClose,
  onPayBill,
}: StripePaymentModalProps) {
  const { pushToast } = useToast();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);

  const reset = () => {
    setCardNumber("");
    setExpiry("");
    setCvc("");
    setName("");
  };

  const handleClose = () => {
    if (processing) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!bill) return;

    const error = validateCardForm({ cardNumber, expiry, cvc, name });
    if (error) {
      pushToast(error, "error");
      return;
    }

    setProcessing(true);
    const ok = await onPayBill(bill.id);
    setProcessing(false);
    if (ok) {
      reset();
      onClose();
    }
  };

  if (!bill) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      titleId="stripe-pay-title"
      className="vms-panel p-0 max-w-md w-full shadow-xl overflow-hidden"
    >
      <div className="bg-[#635bff] px-6 py-4 text-white flex items-center gap-2">
        <CreditCard className="w-5 h-5" />
        <h2 id="stripe-pay-title" className="font-bold">
          Stripe Checkout
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <p className="text-sm text-ink-muted">
          Pay <span className="font-semibold text-ink">{bill.vendorName}</span>{" "}
          — ${bill.amount.toFixed(2)}
        </p>

        <div>
          <label htmlFor="card-name" className="vms-label mb-1">
            Name on card
          </label>
          <input
            id="card-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="vms-input"
            autoComplete="cc-name"
            required
          />
        </div>

        <div>
          <label htmlFor="card-number" className="vms-label mb-1">
            Card number
          </label>
          <input
            id="card-number"
            inputMode="numeric"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="4242 4242 4242 4242"
            className="vms-input font-mono"
            autoComplete="cc-number"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="card-expiry" className="vms-label mb-1">
              Expiry
            </label>
            <input
              id="card-expiry"
              inputMode="numeric"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY"
              className="vms-input font-mono"
              autoComplete="cc-exp"
              required
            />
          </div>
          <div>
            <label htmlFor="card-cvc" className="vms-label mb-1">
              CVC
            </label>
            <input
              id="card-cvc"
              value={cvc}
              onChange={(e) => {
                setCvc(e.target.value.replace(/\D/g, "").slice(0, 4));
                keepCaretAtEnd(e);
              }}
              placeholder="123"
              className="vms-input font-mono"
              autoComplete="cc-csc"
              inputMode="numeric"
              maxLength={4}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={processing}
            className="vms-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={processing}
            className="vms-btn-primary"
          >
            {processing ? "Processing…" : `Pay $${bill.amount.toFixed(2)}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
