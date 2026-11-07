import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { StockBadge, CategoryBadge } from '../components/common/Badge';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { ProductDetailsModal } from '../components/products/ProductDetailsModal';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { useToast } from '../components/common/Toast';
import { useSettings } from '../context/SettingsContext';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  PackageX,
  AlertCircle,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const { formatPrice } = useSettings();

  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryService.getAll();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus;
      if (sortBy) params.sort = sortBy;

      const res = await productService.getAll(params);
      if (res.success && res.data) {
        setProducts(res.data);
      } else {
        throw new Error(res.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err.message || 'Could not load products');
      toast.error(err.message || 'Error loading products');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, selectedStatus, sortBy, toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Sync url params if set
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && ['low_stock', 'out_of_stock', 'in_stock'].includes(statusParam)) {
      setSelectedStatus(statusParam);
    } else {
      setSelectedStatus('all');
    }

    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }

    const searchQ = searchParams.get('search');
    if (searchQ) {
      setSearchTerm(searchQ);
    }

    setCurrentPage(1);
  }, [searchParams]);

  // Status Filter Sync Helper
  const handleStatusFilterChange = (newStatus) => {
    setSelectedStatus(newStatus);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams);
    if (newStatus === 'all') {
      params.delete('status');
    } else {
      params.set('status', newStatus);
    }
    setSearchParams(params);
  };

  const handleClearStatusFilter = () => {
    handleStatusFilterChange('all');
  };

  const handleResetAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setCurrentPage(1);
    setSearchParams(new URLSearchParams());
  };

  // Pagination slicing
  const totalPages = Math.ceil(products.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return products.slice(start, start + itemsPerPage);
  }, [products, currentPage, itemsPerPage]);

  // Handlers
  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setIsFormModalOpen(true);
  };

  const handleOpenDetails = (product) => {
    setSelectedProduct(product);
    setIsDetailsModalOpen(true);
  };

  const handleOpenDelete = (product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  // Submit Add or Edit
  const handleFormSubmit = async (formData) => {
    try {
      setActionLoading(true);
      if (selectedProduct) {
        // Edit mode
        const res = await productService.update(selectedProduct.id, formData);
        if (res.success) {
          toast.success(`"${formData.name}" was successfully updated.`);
          setIsFormModalOpen(false);
          fetchProducts();
        }
      } else {
        // Create mode
        const res = await productService.create(formData);
        if (res.success) {
          toast.success(`Product "${formData.name}" added to inventory.`);
          setIsFormModalOpen(false);
          fetchProducts();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;
    try {
      setActionLoading(true);
      const res = await productService.delete(selectedProduct.id);
      if (res.success) {
        toast.success(`"${selectedProduct.name}" removed from inventory.`);
        setIsDeleteModalOpen(false);
        setSelectedProduct(null);
        fetchProducts();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete product');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {selectedStatus === 'low_stock'
                ? 'Low Stock Products'
                : selectedStatus === 'out_of_stock'
                ? 'Out of Stock Products'
                : 'All Products'}
            </h1>

            {selectedStatus !== 'all' && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  selectedStatus === 'low_stock'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : selectedStatus === 'out_of_stock'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-brand-50 text-brand-700 border border-brand-200'
                }`}
              >
                Filtered View
              </span>
            )}

            {selectedStatus !== 'all' && (
              <button
                onClick={handleClearStatusFilter}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2.5 py-0.5 rounded-full transition-colors"
                title="View all products without stock filter"
              >
                View All &times;
              </button>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {selectedStatus === 'low_stock'
              ? 'Displaying products with critical low inventory (1–10 units) requiring replenishment.'
              : selectedStatus === 'out_of_stock'
              ? 'Displaying depleted items (0 units in stock) requiring immediate restocking.'
              : 'Create, view, update, and manage inventory items stored in Supabase.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none"
            title="Refresh Products"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm shadow-brand-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by product name or description..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
            >
              <option value="all">All Stock Status</option>
              <option value="in_stock">In Stock (&gt;10)</option>
              <option value="low_stock">Low Stock (1-10)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="quantity_asc">Stock: Low to High</option>
              <option value="quantity_desc">Stock: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Tags */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{products.length}</strong> matching product{products.length === 1 ? '' : 's'}
          </span>
          {(searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={handleResetAllFilters}
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-16">Image</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Quantity</th>
                <th className="py-3.5 px-4">Stock Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
                      <span>Loading products from database...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <PackageX className="w-8 h-8" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800 mb-1">
                        No products found
                      </h3>
                      <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                        {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                          ? 'No products matched your search or filter criteria. Try adjusting filters.'
                          : 'Your inventory database is currently empty. Add your first product to get started.'}
                      </p>
                      <button
                        onClick={handleOpenAdd}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add First Product</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50/90 transition-colors group cursor-pointer"
                    onClick={() => handleOpenDetails(product)}
                  >
                    {/* Image */}
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
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
                          className={`w-full h-full flex items-center justify-center text-slate-300 ${
                            product.image_url ? 'hidden' : 'flex'
                          }`}
                        >
                          <Package className="w-5 h-5" />
                        </div>
                      </div>
                    </td>

                    {/* Name & Description */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                        {product.name}
                      </div>
                      {product.description && (
                        <div className="text-xs text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                          {product.description}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <CategoryBadge name={product.category_name} />
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {formatPrice(product.price)}
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800">
                        {product.quantity}
                      </span>{' '}
                      <span className="text-xs text-slate-400">units</span>
                    </td>

                    {/* Stock Status */}
                    <td className="py-3 px-4">
                      <StockBadge quantity={product.quantity} />
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetails(product)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenDelete(product)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {products.length > itemsPerPage && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Page <strong className="text-slate-800">{currentPage}</strong> of{' '}
              <strong className="text-slate-800">{totalPages}</strong>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        categories={categories}
        initialData={selectedProduct}
        isLoading={actionLoading}
      />

      {/* View Product Details Modal */}
      <ProductDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        product={selectedProduct}
        onEdit={(p) => {
          setIsDetailsModalOpen(false);
          handleOpenEdit(p);
        }}
        onDelete={(p) => {
          setIsDetailsModalOpen(false);
          handleOpenDelete(p);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={selectedProduct?.name}
        isLoading={actionLoading}
      />
    </div>
  );
};

