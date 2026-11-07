const path = require('path');
const { supabase } = require('../config/supabase');

/**
 * Safely removes an image file from the Supabase Storage 'product-images' bucket
 */
const deleteStorageImage = async (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return;
  try {
    if (imageUrl.includes('/product-images/')) {
      const parts = imageUrl.split('/product-images/');
      if (parts.length > 1) {
        const fileKey = parts[1].split('?')[0];
        if (fileKey) {
          const decodedKey = decodeURIComponent(fileKey);
          await supabase.storage.from('product-images').remove([decodedKey]);
        }
      }
    }
  } catch (err) {
    console.warn('[Storage] Failed to remove image from Supabase:', err.message);
  }
};

/**
 * Helper to compute stock status based on rules:
 * - In Stock: Quantity > 10
 * - Low Stock: Quantity between 1 and 10
 * - Out of Stock: Quantity = 0
 */
const getStockStatus = (quantity) => {
  if (quantity === 0) return 'out_of_stock';
  if (quantity <= 10) return 'low_stock';
  return 'in_stock';
};

/**
 * @route   GET /api/products
 * @desc    Get all products with filtering, searching, and sorting
 */
const getProducts = async (req, res, next) => {
  try {
    const { search, category, status, sort } = req.query;

    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        quantity,
        image_url,
        created_at,
        updated_at,
        category_id,
        categories (
          id,
          name
        )
      `);

    // Search filter (product name or description)
    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
    }

    // Category filter
    if (category && category !== 'all' && !isNaN(Number(category))) {
      query = query.eq('category_id', Number(category));
    }

    // Stock status filter
    if (status) {
      if (status === 'out_of_stock') {
        query = query.eq('quantity', 0);
      } else if (status === 'low_stock') {
        query = query.gt('quantity', 0).lte('quantity', 10);
      } else if (status === 'in_stock') {
        query = query.gt('quantity', 10);
      }
    }

    // Sorting
    switch (sort) {
      case 'name_asc':
        query = query.order('name', { ascending: true });
        break;
      case 'name_desc':
        query = query.order('name', { ascending: false });
        break;
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'quantity_asc':
        query = query.order('quantity', { ascending: true });
        break;
      case 'quantity_desc':
        query = query.order('quantity', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data: products, error } = await query;

    if (error) {
      throw error;
    }

    // Append calculated stock status to each product
    const formattedProducts = (products || []).map((product) => ({
      ...product,
      category_name: product.categories?.name || 'Uncategorized',
      stock_status: getStockStatus(product.quantity),
    }));

    return res.status(200).json({
      success: true,
      count: formattedProducts.length,
      data: formattedProducts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        quantity,
        image_url,
        created_at,
        updated_at,
        category_id,
        categories (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error || !product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...product,
        category_name: product.categories?.name || 'Uncategorized',
        stock_status: getStockStatus(product.quantity),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/products
 * @desc    Create a new product
 */
const createProduct = async (req, res, next) => {
  try {
    const { name, description, category_id, price, quantity, image_url } = req.body;

    // Verify category exists
    const { data: categoryExists, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', category_id)
      .single();

    if (catError || !categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category: Selected category does not exist.',
      });
    }

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert([
        {
          name,
          description,
          category_id,
          price,
          quantity,
          image_url,
        },
      ])
      .select(`
        id,
        name,
        description,
        price,
        quantity,
        image_url,
        created_at,
        updated_at,
        category_id,
        categories (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        ...newProduct,
        category_name: newProduct.categories?.name || categoryExists.name,
        stock_status: getStockStatus(newProduct.quantity),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/products/upload-image
 * @desc    Upload product image directly to Supabase Storage ('product-images' bucket)
 */
const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded. Please select an image file.',
      });
    }

    const file = req.file;
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const sanitizedBase = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .substring(0, 30);
    const fileName = `${sanitizedBase}-${timestamp}-${randomSuffix}${ext}`;
    const filePath = `uploads/${fileName}`;

    // Ensure bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = (buckets || []).some((b) => b.name === 'product-images');
      if (!bucketExists) {
        await supabase.storage.createBucket('product-images', {
          public: true,
          fileSizeLimit: 5242880,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        });
      }
    } catch (_) {
      // Continue if bucket check encounters minor network glitch
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Supabase Storage Upload Error]:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image to Supabase Storage.',
        error: uploadError.message,
      });
    }

    // Retrieve public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return res.status(200).json({
      success: true,
      message: 'Product image uploaded successfully.',
      imageUrl: urlData.publicUrl,
      filePath: uploadData.path,
      fileName: file.originalname,
      size: file.size,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/products/:id
 * @desc    Update existing product
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, category_id, price, quantity, image_url } = req.body;

    // Check if product exists
    const { data: existing, error: checkError } = await supabase
      .from('products')
      .select('id, image_url')
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found.`,
      });
    }

    // Clean up old Supabase storage image if replaced or removed
    if (existing.image_url && existing.image_url !== image_url) {
      deleteStorageImage(existing.image_url);
    }

    // Verify category exists
    const { data: categoryExists, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', category_id)
      .single();

    if (catError || !categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category: Selected category does not exist.',
      });
    }

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update({
        name,
        description,
        category_id,
        price,
        quantity,
        image_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        id,
        name,
        description,
        price,
        quantity,
        image_url,
        created_at,
        updated_at,
        category_id,
        categories (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: {
        ...updatedProduct,
        category_name: updatedProduct.categories?.name || categoryExists.name,
        stock_status: getStockStatus(updatedProduct.quantity),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if product exists first
    const { data: product, error: findError } = await supabase
      .from('products')
      .select('id, name, image_url')
      .eq('id', id)
      .single();

    if (findError || !product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found.`,
      });
    }

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    // Clean up associated Supabase Storage image if present
    if (product.image_url) {
      deleteStorageImage(product.image_url);
    }

    return res.status(200).json({
      success: true,
      message: `Product "${product.name}" was successfully deleted.`,
      deletedId: id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  getStockStatus,
};

