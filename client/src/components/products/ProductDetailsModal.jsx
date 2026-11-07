import React from 'react';
import { Modal } from '../common/Modal';
import { StockBadge, CategoryBadge } from '../common/Badge';
import { useSettings } from '../../context/SettingsContext';
import { Package, Calendar, Clock, Edit3, Trash2 } from 'lucide-react';

export const ProductDetailsModal = ({
  isOpen,
  onClose,
  product,
  onEdit,
  onDelete,
}) => {
  const { formatPrice } = useSettings();
  if (!product) return null;

  const formattedPrice = parseFloat(product.price).toFixed(2);
  const createdDate = product.created_at
    ? new Date(product.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';
  const updatedDate = product.updated_at
    ? new Date(product.updated_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Product Details" maxWidth="max-w-xl">
      <div className="space-y-6">
        {/* Top Product Hero */}
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-full sm:w-36 h-36 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-full h-full flex items-center justify-center text-slate-300 bg-slate-100 ${
                product.image_url ? 'hidden' : 'flex'
              }`}
            >
              <Package className="w-12 h-12" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <CategoryBadge name={product.category_name || product.categories?.name} />
              <StockBadge quantity={product.quantity} />
            </div>

            <h3 className="text-xl font-bold text-slate-900 leading-snug mb-2">
              {product.name}
            </h3>

            <div className="text-2xl font-extrabold text-brand-600 mb-2">
              {formatPrice(product.price)}
            </div>

            <p className="text-sm text-slate-500 leading-relaxed">
              {product.description || 'No description provided for this item.'}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600">
          <div>
            <span className="block text-slate-400 font-medium mb-1">Product ID</span>
            <span className="font-semibold text-slate-800">#{product.id}</span>
          </div>

          <div>
            <span className="block text-slate-400 font-medium mb-1">Available Stock</span>
            <span className="font-semibold text-slate-800 text-sm">
              {product.quantity} units
            </span>
          </div>

          <div>
            <span className="block text-slate-400 font-medium mb-1">Total Valuation</span>
            <span className="font-semibold text-slate-800">
              {formatPrice(product.quantity * product.price)}
            </span>
          </div>

          <div>
            <span className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Date Added
            </span>
            <span className="font-semibold text-slate-800">{createdDate}</span>
          </div>

          <div className="col-span-2">
            <span className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Last Updated
            </span>
            <span className="font-semibold text-slate-800">{updatedDate}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(product);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-brand-200"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Product</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

