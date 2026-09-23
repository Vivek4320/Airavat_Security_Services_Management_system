'use client';

import { useEffect, useState } from 'react';
import { getInvoices, addInvoice, updateInvoiceStatus } from '@/lib/data';
import { Invoice, InvoiceItem } from '@/lib/types';
import { formatCurrency, formatDate, generateId, generateInvoiceNumber, invoiceStatusClass, todayStr } from '@/lib/utils';

const COMPANY = {
  name: 'AIRAVAT SECURITY SERVICE',
  address: '1st Floor, Akash Complex, Nilkamal Chowk, Khodiyar Colony, Jamnagar, Gujarat - 361006',
  phone: '+91-9426865263',
  email: 'airavats1@gmail.com',
  gstin: '24AABCA1234B1Z5',
};

function emptyItem(): InvoiceItem {
  return { description: 'Security Guard Services', guards: 1, days: 30, ratePerDay: 600, amount: 0 };
}

function calcItem(item: InvoiceItem): InvoiceItem {
  return { ...item, amount: item.guards * item.days * item.ratePerDay };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    clientName: '',
    clientAddress: '',
    clientGST: '',
    clientPhone: '',
    date: todayStr(),
    dueDate: '',
    fromDate: '',
    toDate: '',
    gstRate: 18,
    notes: '',
    status: 'Draft' as Invoice['status'],
  });
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => { setInvoices(getInvoices()); }, []);

  const setField = (k: string, v: string | number) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setFormErrors((prev) => ({ ...prev, [k]: '' }));
  };

  const setItem = (idx: number, field: keyof InvoiceItem, value: number | string) => {
    setItems((prev) => {
      const next = [...prev];
      const updated = { ...next[idx], [field]: value };
      next[idx] = calcItem(updated as InvoiceItem);
      return next;
    });
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, i) => s + calcItem(i).amount, 0);
  const gstAmount = Math.round((subtotal * form.gstRate) / 100);
  const total = subtotal + gstAmount;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.clientName.trim()) e.clientName = 'Client name is required';
    if (!form.clientAddress.trim()) e.clientAddress = 'Client address is required';
    if (!form.fromDate) e.fromDate = 'Service from date is required';
    if (!form.toDate) e.toDate = 'Service to date is required';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const existingNums = invoices.map((i) => i.invoiceNumber);
      const inv: Invoice = {
        id: generateId(),
        invoiceNumber: generateInvoiceNumber(existingNums),
        clientName: form.clientName,
        clientAddress: form.clientAddress,
        clientGST: form.clientGST,
        clientPhone: form.clientPhone,
        date: form.date,
        dueDate: form.dueDate || form.date,
        fromDate: form.fromDate,
        toDate: form.toDate,
        items: items.map(calcItem),
        subtotal,
        gstRate: form.gstRate,
        gstAmount,
        total,
        status: form.status,
        notes: form.notes,
      };
      addInvoice(inv);
      const updated = getInvoices();
      setInvoices(updated);
      setShowForm(false);
      setPrintInvoice(inv);
      setLoading(false);
      setItems([emptyItem()]);
      setForm({ clientName: '', clientAddress: '', clientGST: '', clientPhone: '', date: todayStr(), dueDate: '', fromDate: '', toDate: '', gstRate: 18, notes: '', status: 'Draft' });
    }, 600);
  };

  const handleStatusChange = (id: string, status: Invoice['status']) => {
    updateInvoiceStatus(id, status);
    setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
  };

  // ─── Invoice Print View ──────────────────────────────────────────────────────
  if (printInvoice) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="no-print flex items-center gap-3 mb-6">
          <button onClick={() => setPrintInvoice(null)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
            ← Back to Invoices
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #040936, #0a1147)', color: 'white' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print / Download PDF
          </button>
        </div>

        {/* Invoice Paper */}
        <div className="invoice-print-area bg-white rounded-2xl shadow-lg max-w-4xl mx-auto overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="flex items-start justify-between p-8 pb-6" style={{ background: 'linear-gradient(135deg, #040936 0%, #0a1147 100%)' }}>
            <div className="flex items-center gap-4">
              <img src="https://www.airavatsecurity.in/logo.png" alt="Airavat" className="w-20 h-20 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wider">{COMPANY.name}</h1>
                <p className="text-xs text-white/60 mt-1 max-w-xs">{COMPANY.address}</p>
                <p className="text-xs mt-1" style={{ color: '#C9A84C' }}>📞 {COMPANY.phone} · ✉ {COMPANY.email}</p>
                <p className="text-xs text-white/50 mt-0.5">GSTIN: {COMPANY.gstin}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-white/90">INVOICE</p>
              <div className="mt-2 text-right">
                <p className="font-mono font-bold text-lg" style={{ color: '#C9A84C' }}>{printInvoice.invoiceNumber}</p>
                <p className="text-white/60 text-xs mt-1">Date: {formatDate(printInvoice.date)}</p>
                {printInvoice.dueDate && <p className="text-white/60 text-xs">Due: {formatDate(printInvoice.dueDate)}</p>}
              </div>
            </div>
          </div>

          {/* Status + Service Period */}
          <div className="flex items-center justify-between px-8 py-3 border-b border-gray-100" style={{ background: '#f8f9fc' }}>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Service Period: <strong className="text-gray-700">{formatDate(printInvoice.fromDate)} – {formatDate(printInvoice.toDate)}</strong></span>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${invoiceStatusClass(printInvoice.status)}`}>{printInvoice.status}</span>
          </div>

          {/* Bill To */}
          <div className="px-8 py-5 border-b border-gray-100">
            <p className="text-xs font-bold tracking-widest text-gray-400 mb-2">BILL TO</p>
            <p className="font-bold text-gray-800 text-lg">{printInvoice.clientName}</p>
            <p className="text-gray-500 text-sm mt-1">{printInvoice.clientAddress}</p>
            {printInvoice.clientPhone && <p className="text-gray-500 text-sm">📞 {printInvoice.clientPhone}</p>}
            {printInvoice.clientGST && <p className="text-gray-500 text-sm">GSTIN: {printInvoice.clientGST}</p>}
          </div>

          {/* Items Table */}
          <div className="px-8 py-5">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#040936', color: 'white' }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold rounded-l-lg">Description</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold">Guards</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold">Days</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold">Rate/Day</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold rounded-r-lg">Amount</th>
                </tr>
              </thead>
              <tbody>
                {printInvoice.items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-4 py-3.5 text-sm text-gray-700">{item.description}</td>
                    <td className="px-4 py-3.5 text-sm text-center text-gray-600">{item.guards}</td>
                    <td className="px-4 py-3.5 text-sm text-center text-gray-600">{item.days}</td>
                    <td className="px-4 py-3.5 text-sm text-right text-gray-600">{formatCurrency(item.ratePerDay)}</td>
                    <td className="px-4 py-3.5 text-sm text-right font-semibold text-gray-800">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span><span className="font-medium">{formatCurrency(printInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>GST ({printInvoice.gstRate}%)</span><span className="font-medium">{formatCurrency(printInvoice.gstAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold rounded-xl px-4 py-3" style={{ background: '#040936', color: 'white' }}>
                  <span>Total Amount</span><span style={{ color: '#C9A84C' }}>{formatCurrency(printInvoice.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes + Footer */}
          {printInvoice.notes && (
            <div className="px-8 pb-4">
              <p className="text-xs font-semibold text-gray-400 mb-1">NOTES</p>
              <p className="text-sm text-gray-600">{printInvoice.notes}</p>
            </div>
          )}
          <div className="px-8 py-4 mt-2 border-t border-gray-100 text-center" style={{ background: '#f8f9fc' }}>
            <p className="text-xs text-gray-400">Thank you for choosing Airavat Security Service · सर्वदा शक्तिशाली</p>
            <p className="text-xs text-gray-300 mt-0.5">Payment terms: Due within 15 days of invoice date</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Invoice List ────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
          <p className="text-gray-500 text-sm mt-0.5">{invoices.length} invoices · {invoices.filter((i) => i.status !== 'Paid').length} pending</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #040936, #0a1147)', color: 'white', boxShadow: '0 2px 8px rgba(4,9,54,0.25)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          New Invoice
        </button>
      </div>

      {/* Invoice List */}
      {invoices.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-20 text-center">
          <p className="text-5xl mb-3">🧾</p>
          <p className="text-gray-500">No invoices yet. Create your first invoice!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div key={inv.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(4,9,54,0.06)', color: '#040936' }}>{inv.invoiceNumber}</span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${invoiceStatusClass(inv.status)}`}>{inv.status}</span>
                </div>
                <p className="font-semibold text-gray-800">{inv.clientName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(inv.fromDate)} – {formatDate(inv.toDate)} · Created {formatDate(inv.date)}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-xl font-bold" style={{ color: '#040936' }}>{formatCurrency(inv.total)}</p>
                <select
                  value={inv.status}
                  onChange={(e) => handleStatusChange(inv.id, e.target.value as Invoice['status'])}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-navy"
                  style={{ color: '#040936' }}
                >
                  <option>Draft</option>
                  <option>Sent</option>
                  <option>Paid</option>
                </select>
                <button
                  onClick={() => setPrintInvoice(inv)}
                  className="p-2 rounded-lg transition-colors hover:bg-gray-50"
                  title="View / Print Invoice"
                  style={{ color: '#C9A84C' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Invoice Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-6 animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Create New Invoice</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Client Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Client Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Client Name *</label>
                    <input value={form.clientName} onChange={(e) => setField('clientName', e.target.value)} className="form-input text-sm" placeholder="Client company / person name" />
                    {formErrors.clientName && <p className="text-red-500 text-xs mt-0.5">{formErrors.clientName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Client Phone</label>
                    <input value={form.clientPhone} onChange={(e) => setField('clientPhone', e.target.value)} className="form-input text-sm" placeholder="Phone number" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Client Address *</label>
                    <textarea value={form.clientAddress} onChange={(e) => setField('clientAddress', e.target.value)} className="form-input text-sm" rows={2} placeholder="Full address" />
                    {formErrors.clientAddress && <p className="text-red-500 text-xs mt-0.5">{formErrors.clientAddress}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Client GSTIN</label>
                    <input value={form.clientGST} onChange={(e) => setField('clientGST', e.target.value)} className="form-input text-sm font-mono" placeholder="GSTIN (optional)" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Invoice Date</label>
                    <input type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} className="form-input text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Service From *</label>
                    <input type="date" value={form.fromDate} onChange={(e) => setField('fromDate', e.target.value)} className="form-input text-sm" />
                    {formErrors.fromDate && <p className="text-red-500 text-xs mt-0.5">{formErrors.fromDate}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Service To *</label>
                    <input type="date" value={form.toDate} onChange={(e) => setField('toDate', e.target.value)} className="form-input text-sm" />
                    {formErrors.toDate && <p className="text-red-500 text-xs mt-0.5">{formErrors.toDate}</p>}
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Service Items</h3>
                  <button type="button" onClick={addItem} className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-80" style={{ background: 'rgba(4,9,54,0.06)', color: '#040936' }}>+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-12 sm:col-span-4">
                        <input value={item.description} onChange={(e) => setItem(i, 'description', e.target.value)} className="form-input text-xs" placeholder="Description" />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <input type="number" value={item.guards} min={1} onChange={(e) => setItem(i, 'guards', Number(e.target.value))} className="form-input text-xs" placeholder="Guards" />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <input type="number" value={item.days} min={1} onChange={(e) => setItem(i, 'days', Number(e.target.value))} className="form-input text-xs" placeholder="Days" />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <input type="number" value={item.ratePerDay} min={1} onChange={(e) => setItem(i, 'ratePerDay', Number(e.target.value))} className="form-input text-xs" placeholder="Rate/Day" />
                      </div>
                      <div className="col-span-2 sm:col-span-1 text-xs font-semibold text-right text-gray-700">
                        {formatCurrency(calcItem(item).amount)}
                      </div>
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="col-span-1 text-red-400 hover:text-red-600 text-center">
                          <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* GST + Totals */}
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} className="form-input text-sm" rows={2} placeholder="Additional notes..." />
                </div>
                <div className="w-full sm:w-64 space-y-2 p-4 rounded-xl" style={{ background: '#f8f9fc' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-xs font-medium text-gray-600">GST Rate:</label>
                    <select value={form.gstRate} onChange={(e) => setField('gstRate', Number(e.target.value))} className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none">
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-xs text-gray-500"><span>GST ({form.gstRate}%)</span><span className="font-medium">{formatCurrency(gstAmount)}</span></div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-200" style={{ color: '#040936' }}><span>Total</span><span>{formatCurrency(total)}</span></div>
                </div>
              </div>

              {/* Status + Submit */}
              <div className="flex items-center gap-3 pt-2">
                <select value={form.status} onChange={(e) => setField('status', e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-navy" style={{ color: '#040936' }}>
                  <option value="Draft">Save as Draft</option>
                  <option value="Sent">Mark as Sent</option>
                  <option value="Paid">Mark as Paid</option>
                </select>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #040936, #0a1147)', color: 'white' }}
                >
                  {loading ? 'Creating...' : 'Create Invoice →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
