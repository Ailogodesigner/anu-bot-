"use client";

import React, { useEffect, useState } from "react";
import {
  QrCode,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  CreditCard,
  CheckCircle2,
  ExternalLink,
  Layers,
} from "lucide-react";

interface PaymentItem {
  id: string;
  title: string;
  provider: string;
  accountAddress: string;
  qrImageUrl: string | null;
  note: string | null;
  isActive: boolean;
  order: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("UPI");
  const [accountAddress, setAccountAddress] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [note, setNote] = useState("");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments");
      const data = await res.json();
      if (data.success) {
        setPayments(data.paymentMethods || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !accountAddress) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          provider,
          accountAddress,
          qrImageUrl: qrImageUrl || undefined,
          note: note || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setTitle("");
        setAccountAddress("");
        setQrImageUrl("");
        setNote("");
        fetchPayments();
      } else {
        alert(data.error || "Failed to add payment method");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !current }),
      });
      fetchPayments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this payment QR code?")) return;
    try {
      await fetch(`/api/payments?id=${id}`, { method: "DELETE" });
      fetchPayments();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#0D0D10] border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden shadow-card">
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-accent/15 border border-accent/40 text-accent font-bold">
              PAYMENT GATEWAY CONTROLLER
            </span>
            <span className="text-[11px] font-mono text-muted">UPI, Crypto & Fiat Billing</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Payment QR Codes & Wallets</span>
          </h1>
          <p className="text-xs text-muted max-w-xl">
            Configure payment methods displayed via the Discord `/pay` command and in ticket queues. Supports instant UPI QR
            generation, TRC20/ERC20 wallets, and PayPal instructions.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 self-start md:self-auto">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs transition shadow-glow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Payment QR</span>
          </button>
          <button
            onClick={fetchPayments}
            disabled={loading}
            className="p-2.5 rounded-xl bg-card border border-border text-muted hover:text-white hover:border-accent transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Grid of Payment QR Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {payments.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-[#0D0D10] border border-border">
            <QrCode className="w-10 h-10 text-muted/40 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No payment methods configured</h3>
            <p className="text-xs text-muted mt-1">Add UPI or Crypto QR codes so customers can pay directly via `/pay`.</p>
          </div>
        ) : (
          payments.map((p) => (
            <div
              key={p.id}
              className={`p-5 rounded-2xl bg-[#0D0D10] border relative flex flex-col justify-between overflow-hidden shadow-card transition ${
                p.isActive ? "border-accent/40" : "border-border opacity-70"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-accent/15 border border-accent/40 text-accent">
                    {p.provider}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleActive(p.id, p.isActive)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition ${
                        p.isActive
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                          : "bg-muted/15 border-muted/30 text-muted"
                      }`}
                    >
                      {p.isActive ? "ACTIVE" : "INACTIVE"}
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-muted hover:text-red-400 p-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{p.title}</h3>
                  {p.note && <p className="text-xs text-muted mt-0.5">{p.note}</p>}
                </div>

                {/* QR Image Display */}
                {p.qrImageUrl && (
                  <div className="flex justify-center p-3 rounded-xl bg-[#050505] border border-border/80">
                    <img
                      src={p.qrImageUrl}
                      alt={p.title}
                      className="w-36 h-36 object-contain rounded-lg bg-white p-1"
                    />
                  </div>
                )}

                {/* Account Address / VPA */}
                <div className="p-2.5 rounded-xl bg-[#050505] border border-border/80 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-white truncate max-w-[200px]">
                    {p.accountAddress}
                  </span>
                  <button
                    onClick={() => copyToClipboard(p.accountAddress, p.id)}
                    className="p-1 rounded text-muted hover:text-accent transition"
                    title="Copy Address"
                  >
                    {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-[11px] text-muted font-mono">
                <span>Display Order: #{p.order}</span>
                <span className="text-accent">Available in /pay</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0D0D10] border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-accent" />
                <span>Add Payment Method / QR</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-white text-xs font-mono">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-muted font-medium mb-1 block">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPI (Google Pay / PhonePe / Paytm)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted font-medium mb-1 block">Provider Type</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                  >
                    <option value="UPI">UPI (India)</option>
                    <option value="CRYPTO">Crypto (USDT / BTC / ETH)</option>
                    <option value="PAYPAL">PayPal</option>
                    <option value="STRIPE">Stripe</option>
                    <option value="BANK">Bank Wire</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-muted font-medium mb-1 block">Address / VPA / Wallet *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. cavrix@upi or 0x123..."
                    value={accountAddress}
                    onChange={(e) => setAccountAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-muted font-medium mb-1 block">Custom QR Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="Auto-generated if left empty for UPI and Crypto"
                  value={qrImageUrl}
                  onChange={(e) => setQrImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-muted font-medium mb-1 block">Instruction Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Upload transaction screenshot in your support ticket"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-card border border-border text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-accent text-black font-bold hover:bg-accent-hover transition shadow-glow"
                >
                  {submitting ? "Saving..." : "Save Payment Gateway"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

