const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { validateCategory } = require('../middleware/validator');

// /api/categories
router.route('/')
  .get(getCategories)
  .post(validateCategory, createCategory);

// /api/categories/:id
router.route('/:id')
  .get(getCategoryById)
  .put(validateCategory, updateCategory)
  .delete(deleteCategory);

module.exports = router;

