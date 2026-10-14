'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { PublicCheckoutShell } from '@/components/checkout/PublicCheckoutShell';
import {
  CheckoutApiError,
  checkoutFetch,
  formatPublicMoney,
  formatSessionPktLine,
  NETWORK_MESSAGE,
  RATE_LIMIT_MESSAGE,
} from '@/lib/checkout-client';
import { prepareProofImage } from '@/lib/checkout-client/imagePrepare';
import {
  SHOW_BANK_TRANSFER_DETAILS,
  WALLET_PAYMENT,
} from '@/data/paymentDisplay';

type OrderStatus = {
  orderNumber: string;
  status: string;
  planName: string;
  currency: string;
  amounts: {
    basePrice: number;
    discountAmount: number;
    finalPrice: number;
    installmentsCount: number;
    totalAmount: number;
  };
  session: {
    startsAt: string;
    durationMinutes: number;
    timezone: string;
  } | null;
  holdExpiresAt: string | null;
  proofUploaded: boolean;
  canReplaceProof: boolean;
  rejectionReason: string | null;
  maskedEmail: string;
  serverNow: string;
  seatHoldExpired: boolean;
};

type PaymentInfo = {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  paymentInstructions: string;
  amountToPay: number;
  currency: string;
};

export function PayClient({ token }: { token: string }) {
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [payInfo, setPayInfo] = useState<PaymentInfo | null>(null);
  const [payInfoUnavailable, setPayInfoUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [clockOffsetMs, setClockOffsetMs] = useState(0);
  const [offsetReady, setOffsetReady] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [soldOutAlert, setSoldOutAlert] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pollStopped = useRef(false);

  const loadOrder = useCallback(async () => {
    try {
      const data = await checkoutFetch<OrderStatus>(
        `/api/public/orders/${token}`
      );
      setOrder(data);
      setNotFound(false);
      if (!offsetReady) {
        const server = new Date(data.serverNow).getTime();
        if (!Number.isNaN(server)) {
          setClockOffsetMs(server - Date.now());
          setOffsetReady(true);
        }
      }
      return data;
    } catch (err) {
      if (err instanceof CheckoutApiError && err.status === 404) {
        setNotFound(true);
        pollStopped.current = true;
      } else if (err instanceof CheckoutApiError && err.status === 429) {
        pollStopped.current = true;
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, offsetReady]);

  const loadPaymentInfo = useCallback(async () => {
    try {
      const data = await checkoutFetch<PaymentInfo>(
        `/api/public/orders/${token}/payment-info`
      );
      setPayInfo(data);
      setPayInfoUnavailable(false);
    } catch {
      setPayInfo(null);
      setPayInfoUnavailable(true);
    }
  }, [token]);

  useEffect(() => {
    void (async () => {
      const data = await loadOrder();
      if (
        data &&
        (data.status === 'awaiting_payment' ||
          data.status === 'pending_verification')
      ) {
        await loadPaymentInfo();
      }
    })();
  }, [loadOrder, loadPaymentInfo]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!order) return;
    const live =
      order.status === 'awaiting_payment' ||
      order.status === 'pending_verification';
    if (!live || pollStopped.current) return;

    const tick = () => {
      if (document.visibilityState !== 'visible' || pollStopped.current) return;
      void loadOrder();
    };

    const id = window.setInterval(tick, 30_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [order?.status, loadOrder]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const correctedNow = nowTick + clockOffsetMs;
  const holdMs = order?.holdExpiresAt
    ? new Date(order.holdExpiresAt).getTime() - correctedNow
    : null;
  const holdEnded =
    order?.status === 'awaiting_payment' &&
    (order.seatHoldExpired || (holdMs != null && holdMs <= 0));

  const onPickFile = async (picked: File | null) => {
    setError('');
    if (!picked) {
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }
    const prepared = await prepareProofImage(picked);
    if (!prepared.ok) {
      setError(prepared.message);
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(prepared.file);
    setPreviewUrl(URL.createObjectURL(prepared.file));
  };

  const uploadProof = () => {
    if (!file || uploading) return;
    setUploading(true);
    setUploadProgress(0);
    setError('');
    setSoldOutAlert('');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/public/orders/${token}/proof`);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    xhr.onload = () => {
      setUploading(false);
      setUploadProgress(null);
      let json: {
        ok?: boolean;
        data?: { status?: string };
        error?: { code?: string; message?: string };
      } | null = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        json = null;
      }
      if (xhr.status === 429) {
        setError(RATE_LIMIT_MESSAGE);
        return;
      }
      if (json?.ok && json.data) {
        setReplacing(false);
        setFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        void loadOrder();
        return;
      }
      if (xhr.status === 409 && json?.error?.code === 'sold_out') {
        setSoldOutAlert(
          json.error.message ||
            'Sorry, this session just sold out. If you already paid, please contact us.'
        );
        return;
      }
      setError(json?.error?.message || 'Something went wrong');
    };
    xhr.onerror = () => {
      setUploading(false);
      setUploadProgress(null);
      setError(NETWORK_MESSAGE);
    };
    const form = new FormData();
    form.append('file', file);
    xhr.send(form);
  };

  const copyText = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(''), 2000);
    } catch {
      /* ignore */
    }
  };

  const copyPageLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <PublicCheckoutShell>
        <div className="mx-auto max-w-lg space-y-3">
          <div className="checkout-skeleton h-8 w-2/3" />
          <div className="checkout-skeleton h-40" />
        </div>
      </PublicCheckoutShell>
    );
  }

  if (notFound || !order) {
    return (
      <PublicCheckoutShell>
        <div className="mx-auto max-w-md text-center checkout-card space-y-4">
          <p className="text-base">We could not find this reservation.</p>
          <Link
            href="/"
            className="btn-ahmixen inline-flex min-h-10 px-5 py-2.5 rounded-xl font-semibold"
          >
            Back to home
          </Link>
        </div>
      </PublicCheckoutShell>
    );
  }

  return (
    <PublicCheckoutShell>
      <div className="mx-auto max-w-lg space-y-5">
        {soldOutAlert ? (
          <p
            role="alert"
            aria-live="polite"
            className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-500"
          >
            {soldOutAlert}
          </p>
        ) : null}

        {order.status === 'awaiting_payment' && !holdEnded && (
          <AwaitingPayment
            order={order}
            payInfo={payInfo}
            payInfoUnavailable={payInfoUnavailable}
            holdMs={holdMs}
            file={file}
            previewUrl={previewUrl}
            fileInputRef={fileInputRef}
            onPickFile={onPickFile}
            onUpload={uploadProof}
            uploading={uploading}
            uploadProgress={uploadProgress}
            error={error}
            copiedKey={copiedKey}
            onCopy={copyText}
          />
        )}

        {order.status === 'awaiting_payment' && holdEnded && (
          <EndedHold />
        )}

        {order.status === 'pending_verification' && !replacing && (
          <PendingState
            order={order}
            linkCopied={linkCopied}
            onCopyLink={copyPageLink}
            onReplace={() => setReplacing(true)}
          />
        )}

        {order.status === 'pending_verification' && replacing && (
          <AwaitingPayment
            order={order}
            payInfo={payInfo}
            payInfoUnavailable={payInfoUnavailable}
            holdMs={null}
            file={file}
            previewUrl={previewUrl}
            fileInputRef={fileInputRef}
            onPickFile={onPickFile}
            onUpload={uploadProof}
            uploading={uploading}
            uploadProgress={uploadProgress}
            error={error}
            copiedKey={copiedKey}
            onCopy={copyText}
            replaceMode
          />
        )}

        {order.status === 'approved' && (
          <ApprovedState
            order={order}
            linkCopied={linkCopied}
            onCopyLink={copyPageLink}
          />
        )}

        {order.status === 'rejected' && (
          <div className="checkout-card space-y-3">
            <h1 className="text-2xl font-bold">We could not verify your payment</h1>
            {order.rejectionReason ? (
              <p className="text-sm text-[var(--text-secondary)]">
                {order.rejectionReason}
              </p>
            ) : null}
            <Link
              href="/reserve"
              className="btn-ahmixen inline-flex min-h-10 px-5 py-2.5 rounded-xl font-semibold"
            >
              Reserve again
            </Link>
          </div>
        )}

        {order.status === 'expired' && <EndedHold />}

        {order.status === 'cancelled' && (
          <div className="checkout-card space-y-3">
            <h1 className="text-2xl font-bold">This reservation was cancelled</h1>
            <Link
              href="/"
              className="btn-ahmixen inline-flex min-h-10 px-5 py-2.5 rounded-xl font-semibold"
            >
              Back to home
            </Link>
          </div>
        )}

        <p className="text-xs text-[var(--text-muted)] text-center">
          {order.maskedEmail}
        </p>
      </div>
    </PublicCheckoutShell>
  );
}

function EndedHold() {
  return (
    <div className="checkout-card space-y-3">
      <h1 className="text-2xl font-bold">Your seat hold has ended</h1>
      <Link
        href="/reserve"
        className="btn-ahmixen inline-flex min-h-10 px-5 py-2.5 rounded-xl font-semibold"
      >
        Reserve again
      </Link>
    </div>
  );
}

function PendingState({
  order,
  linkCopied,
  onCopyLink,
  onReplace,
}: {
  order: OrderStatus;
  linkCopied: boolean;
  onCopyLink: () => void;
  onReplace: () => void;
}) {
  return (
    <div className="checkout-card space-y-3">
      <h1 className="text-2xl font-bold">We received your payment proof</h1>
      <p className="text-sm text-[var(--text-secondary)]">
        We will check it and confirm your seat. You can leave this page and come
        back with the same link.
      </p>
      <button
        type="button"
        onClick={onCopyLink}
        className="btn-ahmixen min-h-10 px-4 py-2.5 rounded-xl font-semibold"
      >
        {linkCopied ? 'Copied' : 'Copy link to this page'}
      </button>
      <span className="sr-only" aria-live="polite">
        {linkCopied ? 'Copied' : ''}
      </span>
      {order.canReplaceProof ? (
        <button
          type="button"
          onClick={onReplace}
          className="block text-sm font-medium text-purple-400 underline-offset-2 hover:underline min-h-10"
        >
          Replace screenshot
        </button>
      ) : null}
    </div>
  );
}

function ApprovedState({
  order,
  linkCopied,
  onCopyLink,
}: {
  order: OrderStatus;
  linkCopied: boolean;
  onCopyLink: () => void;
}) {
  return (
    <div className="checkout-card space-y-3">
      <h1 className="text-2xl font-bold">Your seat is confirmed</h1>
      {order.session ? (
        <p className="text-sm text-[var(--text-secondary)]">
          {formatSessionPktLine(order.session.startsAt, order.session.timezone)}
        </p>
      ) : null}
      <p className="text-sm">Booking {order.orderNumber}</p>
      <button
        type="button"
        onClick={onCopyLink}
        className="btn-ahmixen min-h-10 px-4 py-2.5 rounded-xl font-semibold"
      >
        {linkCopied ? 'Copied' : 'Copy link to this page'}
      </button>
      <span className="sr-only" aria-live="polite">
        {linkCopied ? 'Copied' : ''}
      </span>
    </div>
  );
}

function AwaitingPayment({
  order,
  payInfo,
  payInfoUnavailable,
  holdMs,
  file,
  previewUrl,
  fileInputRef,
  onPickFile,
  onUpload,
  uploading,
  uploadProgress,
  error,
  copiedKey,
  onCopy,
  replaceMode,
}: {
  order: OrderStatus;
  payInfo: PaymentInfo | null;
  payInfoUnavailable: boolean;
  holdMs: number | null;
  file: File | null;
  previewUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onPickFile: (f: File | null) => void;
  onUpload: () => void;
  uploading: boolean;
  uploadProgress: number | null;
  error: string;
  copiedKey: string;
  onCopy: (key: string, value: string) => void;
  replaceMode?: boolean;
}) {
  const mmss =
    holdMs != null && holdMs > 0
      ? `${String(Math.floor(holdMs / 60000)).padStart(2, '0')}:${String(
          Math.floor((holdMs % 60000) / 1000)
        ).padStart(2, '0')}`
      : null;

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">
          {replaceMode ? 'Replace screenshot' : 'Complete your payment'}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Booking {order.orderNumber}
        </p>
        {!replaceMode && mmss ? (
          <p
            role="timer"
            aria-live="off"
            className="text-sm font-medium text-[var(--text-main)]"
          >
            Your seat is held for {mmss}
          </p>
        ) : null}
      </header>

      <div className="checkout-card">
        <p className="text-sm text-[var(--text-muted)]">Amount to pay</p>
        <p className="text-3xl font-extrabold mt-1">
          {formatPublicMoney(order.currency, order.amounts.finalPrice)}
        </p>
      </div>

      {payInfoUnavailable || !payInfo ? (
        <p className="checkout-card text-sm text-[var(--text-secondary)]">
          Payment details are not available right now. Please contact us.
        </p>
      ) : (
        <div className="checkout-card space-y-3">
          <h2 className="font-semibold">JazzCash / Easypaisa details</h2>
          <CopyRow
            label="JazzCash / Easypaisa"
            value={WALLET_PAYMENT.number}
            copied={copiedKey === 'wallet'}
            onCopy={() => onCopy('wallet', WALLET_PAYMENT.number)}
          />
          <CopyRow
            label="Name"
            value={WALLET_PAYMENT.accountName}
            copied={copiedKey === 'walletName'}
            onCopy={() => onCopy('walletName', WALLET_PAYMENT.accountName)}
          />
          <p className="text-sm text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
            {WALLET_PAYMENT.instructions}
          </p>

          {/* Bank transfer kept for future — hidden from customers for now */}
          {SHOW_BANK_TRANSFER_DETAILS ? (
            <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
              <h3 className="font-semibold text-sm">Bank transfer details</h3>
              <CopyRow
                label="Bank"
                value={payInfo.bankName}
                copied={copiedKey === 'bank'}
                onCopy={() => onCopy('bank', payInfo.bankName)}
              />
              <CopyRow
                label="Account title"
                value={payInfo.accountTitle}
                copied={copiedKey === 'title'}
                onCopy={() => onCopy('title', payInfo.accountTitle)}
              />
              <CopyRow
                label="Account number"
                value={payInfo.accountNumber}
                copied={copiedKey === 'number'}
                onCopy={() => onCopy('number', payInfo.accountNumber)}
              />
              <CopyRow
                label="IBAN"
                value={payInfo.iban}
                copied={copiedKey === 'iban'}
                onCopy={() => onCopy('iban', payInfo.iban)}
              />
              {payInfo.paymentInstructions ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  {payInfo.paymentInstructions}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      <div className="checkout-card space-y-3">
        <h2 className="font-semibold">Upload your payment screenshot</h2>
        <p className="text-sm text-[var(--text-muted)]">
          JPG, PNG or WebP, up to 2 MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => void onPickFile(e.target.files?.[0] || null)}
        />
        {!previewUrl ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void onPickFile(e.dataTransfer.files?.[0] || null);
            }}
            className="w-full min-h-24 rounded-xl border border-dashed border-[var(--border-subtle)] px-4 py-6 text-sm text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            Drop a screenshot here or choose a file
          </button>
        ) : (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Payment screenshot preview"
              className="w-full max-h-64 object-contain rounded-xl border border-[var(--border-subtle)]"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-10 px-4 rounded-xl border border-[var(--border-subtle)] text-sm font-medium"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => void onPickFile(null)}
                className="min-h-10 px-4 rounded-xl border border-[var(--border-subtle)] text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {uploadProgress != null ? (
          <div
            className="h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden"
            aria-valuenow={uploadProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          >
            <div
              className="h-full bg-purple-500"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        ) : null}

        {error ? (
          <p role="alert" aria-live="polite" className="text-sm text-red-500">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={!file || uploading}
          onClick={onUpload}
          className="btn-ahmixen w-full min-h-10 py-3 rounded-xl font-semibold disabled:opacity-60"
        >
          {uploading ? 'Uploading…' : 'Submit payment proof'}
        </button>
      </div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <div>
        <p className="text-[var(--text-muted)]">{label}</p>
        <p className="font-medium break-all">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copy ${label}`}
        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Copied' : ''}
      </span>
    </div>
  );
}
