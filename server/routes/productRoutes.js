const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} = require('../controllers/productController');
const { validateProduct } = require('../middleware/validator');
const { handleUpload } = require('../middleware/upload');

// POST /api/products/upload-image
router.post('/upload-image', handleUpload, uploadProductImage);

// /api/products
router.route('/')
  .get(getProducts)
  .post(validateProduct, createProduct);

// /api/products/:id
router.route('/:id')
  .get(getProductById)
  .put(validateProduct, updateProduct)
  .delete(deleteProduct);

module.exports = router;

