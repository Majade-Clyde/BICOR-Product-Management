const { supabase } = require('../config/supabase');
const { getStockStatus } = require('./productController');

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dynamic summary statistics, low stock items, recent products, and category stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Fetch all products to compute dynamic metrics
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        quantity,
        image_url,
        created_at,
        category_id,
        categories (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (productsError) {
      throw productsError;
    }

    const allProducts = products || [];

    // 2. Fetch all categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true });

    if (catError) {
      throw catError;
    }

    const allCategories = categories || [];

    // 3. Dynamic calculations
    const totalProducts = allProducts.length;

    let totalStockQuantity = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let inStockCount = 0;
    let totalInventoryValue = 0;

    const lowStockProducts = [];

    allProducts.forEach((p) => {
      const qty = Number(p.quantity) || 0;
      const price = parseFloat(p.price) || 0;

      totalStockQuantity += qty;
      totalInventoryValue += price * qty;

      if (qty === 0) {
        outOfStockCount += 1;
        lowStockProducts.push({
          ...p,
          category_name: p.categories?.name || 'Uncategorized',
          stock_status: 'out_of_stock',
        });
      } else if (qty <= 10) {
        lowStockCount += 1;
        lowStockProducts.push({
          ...p,
          category_name: p.categories?.name || 'Uncategorized',
          stock_status: 'low_stock',
        });
      } else {
        inStockCount += 1;
      }
    });

    // Sort low stock items by quantity ascending (critical 0s first, then 1, 2...)
    lowStockProducts.sort((a, b) => a.quantity - b.quantity);

    // Recent products (last 5 added)
    const recentProducts = allProducts.slice(0, 5).map((p) => ({
      ...p,
      category_name: p.categories?.name || 'Uncategorized',
      stock_status: getStockStatus(p.quantity),
    }));

    // Category distribution
    const categoryStats = allCategories.map((category) => {
      const categoryProducts = allProducts.filter((p) => p.category_id === category.id);
      const productCount = categoryProducts.length;
      const categoryStock = categoryProducts.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      return {
        id: category.id,
        name: category.name,
        product_count: productCount,
        total_quantity: categoryStock,
        percentage: totalProducts > 0 ? Math.round((productCount / totalProducts) * 100) : 0,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalProducts,
          totalStockQuantity,
          lowStockCount,
          outOfStockCount,
          inStockCount,
          totalCategories: allCategories.length,
          totalInventoryValue: parseFloat(totalInventoryValue.toFixed(2)),
        },
        recentProducts,
        lowStockProducts,
        categoryStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};

