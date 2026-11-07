import api from './api';

export const categoryService = {
  // Get all categories with product counts
  getAll: async () => {
    return await api.get('/categories');
  },

  // Get single category by ID
  getById: async (id) => {
    return await api.get(`/categories/${id}`);
  },

  // Create new category
  create: async (categoryData) => {
    return await api.post('/categories', categoryData);
  },

  // Update existing category
  update: async (id, categoryData) => {
    return await api.put(`/categories/${id}`, categoryData);
  },

  // Delete category (server will reject if products are assigned)
  delete: async (id) => {
    return await api.delete(`/categories/${id}`);
  },
};

