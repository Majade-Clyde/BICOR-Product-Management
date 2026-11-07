import React, { useState, useEffect, useCallback } from 'react';
import { categoryService } from '../services/categoryService';
import { CategoryFormModal } from '../components/categories/CategoryFormModal';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { useToast } from '../components/common/Toast';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  RefreshCw,
  AlertCircle,
  Calendar,
  Layers3,
  ShieldAlert,
} from 'lucide-react';

export const Categories = () => {
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await categoryService.getAll();
      if (res.success && res.data) {
        setCategories(res.data);
      } else {
        throw new Error(res.message || 'Failed to fetch categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error(err.message || 'Could not load categories');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filtered categories
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setSelectedCategory(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setSelectedCategory(category);
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (category) => {
    if (category.product_count > 0) {
      toast.warning(
        `Cannot delete "${category.name}". It is currently assigned to ${category.product_count} product(s). Please reassign or delete these products first.`
      );
      return;
    }
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      setActionLoading(true);
      if (selectedCategory) {
        const res = await categoryService.update(selectedCategory.id, formData);
        if (res.success) {
          toast.success(`Category "${formData.name}" updated successfully.`);
          setIsFormModalOpen(false);
          fetchCategories();
        }
      } else {
        const res = await categoryService.create(formData);
        if (res.success) {
          toast.success(`Category "${formData.name}" added successfully.`);
          setIsFormModalOpen(false);
          fetchCategories();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;
    try {
      setActionLoading(true);
      const res = await categoryService.delete(selectedCategory.id);
      if (res.success) {
        toast.success(`Category "${selectedCategory.name}" was deleted.`);
        setIsDeleteModalOpen(false);
        setSelectedCategory(null);
        fetchCategories();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete category');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Category Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize inventory items into departments and track product counts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCategories}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none"
            title="Refresh Categories"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm shadow-brand-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Search and Summary */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Categories: <strong className="text-slate-800">{categories.length}</strong>
        </div>
      </div>

      {/* Category Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12">#</th>
                <th className="py-3.5 px-4">Category Name</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Assigned Products</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
                      <span>Loading categories...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Layers3 className="w-8 h-8" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800 mb-1">
                        No categories found
                      </h3>
                      <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                        {searchTerm
                          ? 'No category matched your search keyword.'
                          : 'No categories exist yet. Add your first category to group products.'}
                      </p>
                      <button
                        onClick={handleOpenAdd}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Category</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category, index) => {
                  const createdDate = category.created_at
                    ? new Date(category.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—';

                  const hasProducts = category.product_count > 0;

                  return (
                    <tr key={category.id} className="hover:bg-slate-50/90 transition-colors">
                      <td className="py-3 px-4 text-xs font-medium text-slate-400">
                        {index + 1}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-3.5 h-3.5" />
                          </div>
                          <span>{category.name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                        {category.description || '—'}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            hasProducts
                              ? 'bg-blue-50 text-brand-700 border border-brand-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          <Package className="w-3 h-3" />
                          <span>{category.product_count} products</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{createdDate}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(category)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenDelete(category)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              hasProducts
                                ? 'text-slate-300 hover:text-amber-600 hover:bg-amber-50 cursor-pointer'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title={
                              hasProducts
                                ? `Cannot delete: ${category.product_count} products assigned`
                                : 'Delete Category'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedCategory}
        isLoading={actionLoading}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={selectedCategory?.name}
        message={`Are you sure you want to delete the category "${selectedCategory?.name}"?`}
        isLoading={actionLoading}
      />
    </div>
  );
};

