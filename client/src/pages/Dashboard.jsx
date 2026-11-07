import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { StockBadge, CategoryBadge } from '../components/common/Badge';
import { useSettings } from '../context/SettingsContext';
import {
  Package,
  Layers,
  AlertTriangle,
  XCircle,
  TrendingUp,
  RefreshCw,
  Plus,
  ArrowRight,
  ExternalLink,
  DollarSign,
  Boxes,
  Clock,
  AlertCircle,
} from 'lucide-react';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { formatPrice } = useSettings();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardService.getStats();
      if (res.success && res.data) {
        setData(res.data);
        setLastRefreshed(new Date());
      } else {
        throw new Error(res.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message || 'Could not fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const summary = data?.summary || {
    totalProducts: 0,
    totalStockQuantity: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    inStockCount: 0,
    totalCategories: 0,
    totalInventoryValue: 0,
  };

  const recentProducts = data?.recentProducts || [];
  const lowStockProducts = data?.lowStockProducts || [];
  const categoryStats = data?.categoryStats || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Inventory Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time stock monitoring and dynamic analytics from Supabase PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm focus:outline-none disabled:opacity-50"
            title="Refresh database statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors shadow-sm shadow-brand-200"
          >
            <Plus className="w-4 h-4" />
            <span>Manage Products</span>
          </Link>
        </div>
      </div>

      {/* Error Banner if any */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Unable to load live dashboard statistics</p>
            <p className="text-rose-700 mt-0.5">{error}</p>
            <p className="text-xs text-rose-600 mt-2">
              Make sure the Express backend server is running on <code className="font-mono bg-rose-100 px-1 py-0.5 rounded">http://localhost:5000</code> and Supabase credentials are configured.
            </p>
          </div>
        </div>
      )}

      {/* 4 Primary Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Products */}
        <div
          onClick={() => navigate('/products')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/products')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group select-none active:scale-[0.99]"
          title="Click to view all registered products"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-brand-600 transition-colors">
              Total Products
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-100 transition-all">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {loading ? '—' : summary.totalProducts}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{summary.totalCategories}</span> categories tracked
          </div>
        </div>

        {/* Card 2: Total Stock Quantity */}
        <div
          onClick={() => navigate('/products')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/products')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group select-none active:scale-[0.99]"
          title="Click to view full inventory stock quantities"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">
              Total Stock Quantity
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-indigo-100 transition-all">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {loading ? '—' : summary.totalStockQuantity.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Valuation:</span>
            <span className="font-bold text-slate-700">
              {loading ? formatPrice(0) : formatPrice(summary.totalInventoryValue)}
            </span>
          </div>
        </div>

        {/* Card 3: Low Stock Products */}
        <div
          onClick={() => navigate('/products?status=low_stock')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/products?status=low_stock')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group select-none active:scale-[0.99]"
          title="Click to filter low stock products (1–10 units)"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider group-hover:text-amber-800 transition-colors">
              Low Stock Products
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-100 transition-all">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 tracking-tight">
            {loading ? '—' : summary.lowStockCount}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Stock between 1 and 10 units
          </div>
        </div>

        {/* Card 4: Out of Stock Products */}
        <div
          onClick={() => navigate('/products?status=out_of_stock')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/products?status=out_of_stock')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group select-none active:scale-[0.99]"
          title="Click to filter out of stock products (0 units)"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider group-hover:text-rose-800 transition-colors">
              Out of Stock Products
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-rose-100 transition-all">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 tracking-tight">
            {loading ? '—' : summary.outOfStockCount}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Quantity is 0 (requires restocking)
          </div>
        </div>
      </div>

      {/* Main Grid: Low Stock Alert & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Low Stock & Critical Attention Table */}
        <div className="lg:col-span-2 space-y-8">
          {/* Low Stock Alert Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Low Stock & Urgent Restock Alerts
                  </h2>
                  <p className="text-xs text-slate-500">
                    Products requiring immediate replenishment (10 units or less)
                  </p>
                </div>
              </div>

              <Link
                to="/products?status=low_stock"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Unit Price</th>
                    <th className="py-3 px-4">Remaining</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {lowStockProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        All products are currently well-stocked (&gt;10 units).
                      </td>
                    </tr>
                  ) : (
                    lowStockProducts.slice(0, 5).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-full h-full flex items-center justify-center text-slate-300 ${
                                  item.image_url ? 'hidden' : 'flex'
                                }`}
                              >
                                <Package className="w-4 h-4" />
                              </div>
                            </div>
                            <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate max-w-[180px]">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <CategoryBadge name={item.category_name} />
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700 text-xs sm:text-sm">
                          {formatPrice(item.price)}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800 text-xs sm:text-sm">
                          {item.quantity} units
                        </td>
                        <td className="py-3 px-4 text-right">
                          <StockBadge quantity={item.quantity} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Products Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Recent Products</h2>
                  <p className="text-xs text-slate-500">Newly added items to the database</p>
                </div>
              </div>

              <Link
                to="/products"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <span>View catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No products added yet.
                </div>
              ) : (
                recentProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
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

                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-800 truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          <span>{product.category_name}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StockBadge quantity={product.quantity} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Product Categories & Quick Overview */}
        <div className="space-y-8">
          {/* Category Distribution Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Product Categories</h3>
                  <p className="text-xs text-slate-500">Inventory share by department</p>
                </div>
              </div>

              <Link
                to="/categories"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Manage
              </Link>
            </div>

            <div className="space-y-4 mt-6">
              {categoryStats.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No categories created yet.</p>
              ) : (
                categoryStats.map((cat) => (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{cat.name}</span>
                      <span className="text-slate-500 font-medium">
                        {cat.product_count} items ({cat.total_quantity} units)
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-brand-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(cat.percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stock Status Rules Quick Reference */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Automatic Stock Thresholds
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Stock status indicators adapt dynamically to inventory levels:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-emerald-800">In Stock</span>
                  <p className="text-emerald-700 mt-0.5">Quantity &gt; 10 units</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-amber-800">Low Stock</span>
                  <p className="text-amber-700 mt-0.5">Quantity between 1 and 10 units</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-rose-800">Out of Stock</span>
                  <p className="text-rose-700 mt-0.5">Quantity is exactly 0 units</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

