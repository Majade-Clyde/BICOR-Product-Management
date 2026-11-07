import api from './api';

export const productService = {
  // Get all products with optional filters { search, category, status, sort }
  getAll: async (params = {}) => {
    return await api.get('/products', { params });
  },

  // Get single product by ID
  getById: async (id) => {
    return await api.get(`/products/${id}`);
  },

  // Create new product
  create: async (productData) => {
    return await api.post('/products', productData);
  },

  // Update existing product
  update: async (id, productData) => {
    return await api.put(`/products/${id}`, productData);
  },

  // Delete product
  delete: async (id) => {
    return await api.delete(`/products/${id}`);
  },

  // Upload product image to Supabase Storage ('product-images' bucket)
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return await api.post('/products/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

