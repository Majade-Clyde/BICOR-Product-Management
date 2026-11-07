import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const StockBadge = ({ status, quantity }) => {
  // Determine status if only quantity is provided
  let computedStatus = status;
  if (!computedStatus && quantity !== undefined) {
    if (quantity === 0) computedStatus = 'out_of_stock';
    else if (quantity <= 10) computedStatus = 'low_stock';
    else computedStatus = 'in_stock';
  }

  if (computedStatus === 'in_stock') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        <span>In Stock</span>
      </span>
    );
  }

  if (computedStatus === 'low_stock') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        <span>Low Stock</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
      <XCircle className="w-3.5 h-3.5 text-rose-500" />
      <span>Out of Stock</span>
    </span>
  );
};

export const CategoryBadge = ({ name }) => {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      {name || 'General'}
    </span>
  );
};

