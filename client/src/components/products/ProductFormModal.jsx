import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { StockBadge } from '../common/Badge';
import { useSettings } from '../../context/SettingsContext';
import { productService } from '../../services/productService';
import {
  UploadCloud,
  Link2,
  Trash2,
  RefreshCw,
  Layers,
  Package,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const ProductFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  categories = [],
  initialData = null,
  isLoading = false,
}) => {
  const isEditMode = Boolean(initialData);
  const { formatPrice, currencySymbol, currencyCode } = useSettings();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    quantity: '0',
  });

  // Confirmed image state: null (State A) OR { type: 'file' | 'url' | 'initial', url: string, name: string, file?: File } (State B)
  const [confirmedImage, setConfirmedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [inputLink, setInputLink] = useState('');
  const [validatingLink, setValidatingLink] = useState(false);
  const [isImageRemoved, setIsImageRemoved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fileError, setFileError] = useState(null);

  const [errors, setErrors] = useState({});

  // Reset or initialize state when modal opens or initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        category_id: initialData.category_id ? String(initialData.category_id) : '',
        price: initialData.price !== undefined ? String(initialData.price) : '',
        quantity: initialData.quantity !== undefined ? String(initialData.quantity) : '0',
      });

      if (initialData.image_url) {
        let initialName = 'stored-image.jpg';
        try {
          const parts = initialData.image_url.split('/');
          const rawLast = parts[parts.length - 1]?.split('?')[0];
          if (rawLast) initialName = decodeURIComponent(rawLast);
        } catch (_) {}

        setConfirmedImage({
          type: 'initial',
          url: initialData.image_url,
          name: initialName,
        });
      } else {
        setConfirmedImage(null);
      }
    } else {
      setFormData({
        name: '',
        description: '',
        category_id: categories.length > 0 ? String(categories[0].id) : '',
        price: '',
        quantity: '0',
      });
      setConfirmedImage(null);
    }

    setSelectedFile(null);
    setInputLink('');
    setValidatingLink(false);
    setIsImageRemoved(false);
    setIsDragging(false);
    setUploadingImage(false);
    setFileError(null);
    setErrors({});
  }, [initialData, isOpen, categories]);

  // Clean up blob URL on unmount or when image changes
  useEffect(() => {
    return () => {
      if (confirmedImage?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(confirmedImage.url);
      }
    };
  }, [confirmedImage]);

  // Handle device file validation and staging
  const handleValidateAndStageFile = (file) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExt = '.' + (file.name.split('.').pop() || '').toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExt)) {
      setFileError('Unsupported file format. Please select a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError('File size exceeds 5 MB. Please select an image under 5 MB.');
      return;
    }

    // Revoke previous blob URL if needed
    if (confirmedImage?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(confirmedImage.url);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setConfirmedImage({
      type: 'file',
      url: objectUrl,
      name: file.name,
      file: file,
    });
    setInputLink('');
    setIsImageRemoved(false);
    setFileError(null);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleValidateAndStageFile(e.target.files[0]);
    }
  };

  // Confirm image link (validate accessibility and switch UI to Preview Card)
  const handleConfirmImageLink = () => {
    const url = inputLink.trim();
    if (!url) return;

    // Validate standard HTTP/HTTPS format
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setFileError('Please enter a valid HTTP or HTTPS image URL.');
        return;
      }
    } catch {
      setFileError('Please enter a valid URL.');
      return;
    }

    setValidatingLink(true);
    setFileError(null);

    // Test load image in memory to ensure URL is accessible
    const testImg = new window.Image();
    testImg.onload = () => {
      setValidatingLink(false);

      // Derive suitable filename from URL
      let derivedName = 'image-link.jpg';
      try {
        const pathname = new URL(url).pathname;
        const lastSegment = pathname.substring(pathname.lastIndexOf('/') + 1);
        if (lastSegment && lastSegment.length > 2) {
          derivedName = decodeURIComponent(lastSegment.split('?')[0]);
        }
      } catch (_) {}

      // Revoke any previous blob URL
      if (confirmedImage?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(confirmedImage.url);
      }

      setConfirmedImage({
        type: 'url',
        url: url,
        name: derivedName,
      });
      setSelectedFile(null);
      setInputLink('');
      setIsImageRemoved(false);
    };

    testImg.onerror = () => {
      setValidatingLink(false);
      setFileError('Unable to load image from this URL. Please verify the link is accessible.');
    };

    testImg.src = url;
  };

  // Intercept ENTER key on Image Link input to prevent form submission
  const handleImageLinkKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleConfirmImageLink();
    }
  };

  // Remove confirmed image and restore original input area
  const handleRemoveImage = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (confirmedImage?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(confirmedImage.url);
    }
    setConfirmedImage(null);
    setSelectedFile(null);
    setInputLink('');
    setIsImageRemoved(true);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open device file picker
  const handleOpenPicker = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleValidateAndStageFile(e.dataTransfer.files[0]);
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Product name is required';
    }

    if (!formData.category_id) {
      errs.category_id = 'Please select a category';
    }

    const priceNum = parseFloat(formData.price);
    if (!formData.price || isNaN(priceNum) || priceNum <= 0) {
      errs.price = `Price must be greater than ${currencySymbol}0.00`;
    }

    const qtyNum = Number(formData.quantity);
    if (formData.quantity === '' || isNaN(qtyNum) || !Number.isInteger(qtyNum) || qtyNum < 0) {
      errs.quantity = 'Quantity must be a positive integer (0 or more)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    let finalImageUrl = null;

    try {
      if (confirmedImage?.type === 'file' && selectedFile) {
        // Upload device file to Supabase Storage
        setUploadingImage(true);
        const uploadRes = await productService.uploadImage(selectedFile);
        if (uploadRes?.success && uploadRes?.imageUrl) {
          finalImageUrl = uploadRes.imageUrl;
        } else {
          throw new Error(uploadRes?.message || 'Failed to upload image to Supabase Storage');
        }
      } else if (confirmedImage?.type === 'url') {
        // Save direct image URL
        finalImageUrl = confirmedImage.url;
      } else if (confirmedImage?.type === 'initial' && !isImageRemoved) {
        // Retain existing image
        finalImageUrl = confirmedImage.url;
      } else {
        finalImageUrl = null;
      }

      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category_id: parseInt(formData.category_id, 10),
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity, 10),
        image_url: finalImageUrl,
      });
    } catch (err) {
      setFileError(err.message || 'Error saving product image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const selectedCategoryName =
    categories.find((c) => String(c.id) === String(formData.category_id))?.name || 'Category';

  const previewQty = Number(formData.quantity) || 0;
  const isBusy = isLoading || uploadingImage || validatingLink;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Product Details' : 'Add New Product'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Live Preview Bar */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
            {confirmedImage?.url ? (
              <img
                src={confirmedImage.url}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextElementSibling) {
                    e.target.nextElementSibling.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div
              className={`w-full h-full flex items-center justify-center text-slate-300 bg-slate-100 ${
                confirmedImage?.url ? 'hidden' : 'flex'
              }`}
            >
              <Package className="w-7 h-7" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                Live Preview
              </span>
              <StockBadge quantity={previewQty} />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 truncate">
              {formData.name || 'Product Name Preview'}
            </h4>
            <p className="text-xs text-slate-500">
              {selectedCategoryName} •{' '}
              <span className="font-semibold text-slate-700">
                {formatPrice(formData.price || 0)}
              </span>{' '}
              • {previewQty} in stock
            </p>
          </div>
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
            Product Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Package className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Ergonomic Office Chair"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                errors.name
                  ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20'
                  : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100'
              }`}
            />
          </div>
          {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
        </div>

        {/* Category & Price Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Category <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Layers className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className={`w-full pl-10 pr-8 py-2.5 rounded-xl border text-sm transition-all appearance-none bg-white focus:outline-none focus:ring-2 ${
                  errors.category_id
                    ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20'
                    : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100'
                }`}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.category_id && (
              <p className="mt-1 text-xs text-rose-500">{errors.category_id}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Price ({currencyCode}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="w-4 text-center text-xs font-bold absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="29.99"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                  errors.price
                    ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20'
                    : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100'
                }`}
              />
            </div>
            {errors.price && <p className="mt-1 text-xs text-rose-500">{errors.price}</p>}
          </div>
        </div>

        {/* Stock Quantity */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
            Stock Quantity <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="text-xs font-bold absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              QTY
            </span>
            <input
              type="number"
              step="1"
              min="0"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="0"
              className={`w-full pl-12 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                errors.quantity
                  ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20'
                  : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100'
              }`}
            />
          </div>
          {errors.quantity && (
            <p className="mt-1 text-xs text-rose-500">{errors.quantity}</p>
          )}
        </div>

        {/* PRODUCT IMAGE SECTION */}
        <div>
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {confirmedImage ? (
            /* STATE B: Image Preview Card (Hides upload area, Choose Image button, and Image Link bar) */
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm transition-all">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Product Image Thumbnail */}
                <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <img
                    src={confirmedImage.url}
                    alt={confirmedImage.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextElementSibling) {
                        e.target.nextElementSibling.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="w-full h-full hidden items-center justify-center text-slate-300 bg-slate-100">
                    <Package className="w-6 h-6" />
                  </div>
                </div>

                {/* Filename / Image Name */}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <p
                    className="text-sm font-semibold text-slate-800 truncate"
                    title={confirmedImage.name}
                  >
                    {confirmedImage.name}
                  </p>
                </div>

                {/* Blue Replace Image & Red Remove Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenPicker}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors focus:outline-none disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Replace Image
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors focus:outline-none disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* STATE A: Drag & Drop Area, Choose Image button, and Image Link input bar */
            <div className="space-y-3">
              {/* Drag and drop upload area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleOpenPicker}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-brand-500 bg-brand-50/50 scale-[0.99]'
                    : 'border-slate-200 hover:border-brand-400 bg-slate-50/60 hover:bg-brand-50/20'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 mx-auto flex items-center justify-center mb-2">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700 mb-2.5">
                  Drag and drop an image here
                </p>
                <button
                  type="button"
                  onClick={handleOpenPicker}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm shadow-brand-200 transition-colors pointer-events-none"
                >
                  Choose Image
                </button>
              </div>

              {/* Image Link Input Bar */}
              <div className="relative">
                <Link2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  value={inputLink}
                  onChange={(e) => {
                    setInputLink(e.target.value);
                    if (fileError) setFileError(null);
                  }}
                  onKeyDown={handleImageLinkKeyDown}
                  placeholder="Image Link"
                  disabled={validatingLink}
                  className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-slate-200 text-sm transition-all focus:outline-none focus:ring-2 focus:border-brand-500 focus:ring-brand-100"
                />
                {validatingLink && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Validation Error Banner */}
          {fileError && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
              <span>{fileError}</span>
              <button
                type="button"
                onClick={() => setFileError(null)}
                className="text-rose-500 hover:text-rose-800 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
            Product Description <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide key product specifications, dimensions, features..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm transition-all focus:outline-none focus:ring-2 focus:border-brand-500 focus:ring-brand-100 resize-none"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isBusy}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 active:bg-brand-800 transition-colors shadow-sm shadow-brand-200 focus:outline-none disabled:opacity-50"
          >
            {isBusy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {uploadingImage
                    ? 'Uploading Image to Supabase...'
                    : validatingLink
                    ? 'Verifying Image Link...'
                    : 'Saving Product...'}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{isEditMode ? 'Update Product' : 'Save Product'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
