const { supabase } = require('../config/supabase');

/**
 * @route   GET /api/categories
 * @desc    Get all categories with dynamic count of associated products
 */
const getCategories = async (req, res, next) => {
  try {
    // Fetch categories and join count of products
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        description,
        created_at,
        products (
          id
        )
      `)
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    // Format output with product count
    const formattedCategories = (categories || []).map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      created_at: cat.created_at,
      product_count: Array.isArray(cat.products) ? cat.products.length : 0,
    }));

    return res.status(200).json({
      success: true,
      count: formattedCategories.length,
      data: formattedCategories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/categories/:id
 * @desc    Get a single category with product count
 */
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: category, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        description,
        created_at,
        products (
          id
        )
      `)
      .eq('id', id)
      .single();

    if (error || !category) {
      return res.status(404).json({
        success: false,
        message: `Category with ID ${id} not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: category.id,
        name: category.name,
        description: category.description,
        created_at: category.created_at,
        product_count: Array.isArray(category.products) ? category.products.length : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    // Check if category name already exists (case-insensitive)
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', name.trim())
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Category "${name}" already exists.`,
      });
    }

    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert([
        {
          name: name.trim(),
          description: description || null,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        ...newCategory,
        product_count: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/categories/:id
 * @desc    Update an existing category
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if category exists
    const { data: currentCat, error: findError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', id)
      .single();

    if (findError || !currentCat) {
      return res.status(404).json({
        success: false,
        message: `Category with ID ${id} not found.`,
      });
    }

    // Check if name is taken by another category
    const { data: nameCheck } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', name.trim())
      .neq('id', id)
      .maybeSingle();

    if (nameCheck) {
      return res.status(400).json({
        success: false,
        message: `Category name "${name}" is already used by another category.`,
      });
    }

    const { data: updatedCat, error } = await supabase
      .from('categories')
      .update({
        name: name.trim(),
        description: description || null,
      })
      .eq('id', id)
      .select(`
        id,
        name,
        description,
        created_at,
        products (
          id
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: {
        id: updatedCat.id,
        name: updatedCat.name,
        description: updatedCat.description,
        created_at: updatedCat.created_at,
        product_count: Array.isArray(updatedCat.products) ? updatedCat.products.length : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category (Only if no products are assigned!)
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category exists and count associated products
    const { data: category, error: findError } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        products (
          id
        )
      `)
      .eq('id', id)
      .single();

    if (findError || !category) {
      return res.status(404).json({
        success: false,
        message: `Category with ID ${id} not found.`,
      });
    }

    const associatedCount = Array.isArray(category.products) ? category.products.length : 0;

    // Requirement: Prevent deleting a category that is still assigned to existing products
    if (associatedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${category.name}". It is currently assigned to ${associatedCount} product(s). Please reassign or delete these products first.`,
        product_count: associatedCount,
      });
    }

    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return res.status(200).json({
      success: true,
      message: `Category "${category.name}" was successfully deleted.`,
      deletedId: id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

