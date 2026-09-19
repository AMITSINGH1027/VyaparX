import React from 'react';
import { Printer, Download, Store, CheckCircle, Clock } from 'lucide-react';

export const InvoiceDocument = ({ sale, onPrint }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const business = sale.business_details || {};
  const customer = sale.customer_details || {};
  const isPaid = sale.payment_status === 'Paid';

  return (
    <div className="space-y-4">
      {/* Print / Actions Bar (hidden during print) */}
      <div className="flex justify-end gap-2 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print / Save PDF
        </button>
      </div>

      {/* Actual Printable Invoice Container */}
      <div
        id="printable-invoice"
        className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-start pb-8 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {business.name || 'VyaparX Store'}
                </h2>
                <p className="text-xs text-slate-500">
                  {business.address || 'Commercial Center, Tech Hub'}
                </p>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500 space-y-0.5">
              <p>Email: {business.email || 'support@vyaparx.com'} | Phone: {business.phone || '+91 9876543210'}</p>
              <p>GST/VAT: <span className="font-semibold text-slate-800">{business.tax_id_gst || '07AAAAA0000A1Z5'}</span></p>
            </div>
          </div>

          <div className="text-right">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">TAX INVOICE</h1>
            <p className="text-sm font-bold text-indigo-600 mt-1">{sale.invoice_number}</p>
            <p className="text-xs text-slate-400 mt-1">
              Date: {new Date(sale.sale_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100">
              {isPaid ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> PAID
                </span>
              ) : (
                <span className="text-amber-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {sale.payment_status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Customer Bill To */}
        <div className="py-6 border-b border-slate-200 grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Billed To
            </span>
            <h4 className="text-sm font-bold text-slate-900 mt-1">
              {customer.name || sale.customer_name || 'Walk-in Customer'}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">{customer.address || 'Standard Counter Delivery'}</p>
            {customer.phone && <p className="text-xs text-slate-500">Phone: {customer.phone}</p>}
            {customer.tax_id && <p className="text-xs text-slate-500">GSTIN: {customer.tax_id}</p>}
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Payment Details
            </span>
            <p className="text-xs font-semibold text-slate-800 mt-1">
              Method: {sale.payment_method}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Paid Amount: ₹{sale.paid_amount?.toLocaleString('en-IN')}
            </p>
            {sale.grand_total - sale.paid_amount > 0 && (
              <p className="text-xs font-bold text-rose-600 mt-0.5">
                Balance Due: ₹{(sale.grand_total - sale.paid_amount).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 font-bold">#</th>
                <th className="py-2.5 font-bold">Product Item</th>
                <th className="py-2.5 font-bold text-center">Qty</th>
                <th className="py-2.5 font-bold text-right">Price</th>
                <th className="py-2.5 font-bold text-center">Tax %</th>
                <th className="py-2.5 font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items?.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="py-3 text-slate-400">{idx + 1}</td>
                  <td className="py-3 font-semibold text-slate-800">{item.product_name}</td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right">₹{item.unit_price?.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-center text-slate-500">{item.tax_rate}%</td>
                  <td className="py-3 text-right font-bold text-slate-900">
                    ₹{item.total_price?.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary & Totals */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">₹{sale.subtotal?.toLocaleString('en-IN')}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span>-₹{sale.discount_amount?.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>GST / Tax Total:</span>
              <span className="font-semibold text-slate-800">₹{sale.tax_amount?.toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-2 border-t border-slate-300 flex justify-between text-sm font-bold text-slate-900">
              <span>Grand Total:</span>
              <span className="text-indigo-600 text-base">₹{sale.grand_total?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-[11px] text-slate-400">
          <p className="font-semibold text-slate-700">Thank you for your business!</p>
          <p className="mt-0.5">For inquiries or warranty support, contact {business.email || 'support@vyaparx.com'}</p>
          <p className="mt-2 text-[10px] text-slate-400 font-medium">Powered by VyaparX AI Business Management Platform</p>
        </div>
      </div>
    </div>
  );
};
