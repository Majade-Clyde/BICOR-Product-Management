/**
 * Request validation middleware for products and categories
 */

const validateProduct = (req, res, next) => {
  const { name, category_id, price, quantity, description, image_url } = req.body;
  const errors = [];

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Product name is required.');
  } else if (name.trim().length > 255) {
    errors.push('Product name must not exceed 255 characters.');
  }

  // Category validation
  if (category_id === undefined || category_id === null || category_id === '') {
    errors.push('Category is required.');
  } else if (isNaN(Number(category_id)) || Number(category_id) <= 0) {
    errors.push('Valid Category ID is required.');
  }

  // Price validation
  if (price === undefined || price === null || price === '') {
    errors.push('Price is required.');
  } else {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      errors.push('Price must be a valid number greater than zero.');
    }
  }

  // Quantity validation
  if (quantity === undefined || quantity === null || quantity === '') {
    errors.push('Quantity is required.');
  } else {
    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
      errors.push('Quantity must be a non-negative whole integer.');
    }
  }

  // Optional image URL validation
  if (image_url && typeof image_url === 'string' && image_url.trim().length > 0) {
    try {
      new URL(image_url.trim());
    } catch {
      // Allow relative or standard web URLs, only warn if completely malformed
      if (!image_url.startsWith('http://') && !image_url.startsWith('https://') && !image_url.startsWith('/')) {
        errors.push('Product Image URL must be a valid URL starting with http:// or https://');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Clean and sanitize body fields
  req.body.name = name.trim();
  req.body.category_id = parseInt(category_id, 10);
  req.body.price = parseFloat(parseFloat(price).toFixed(2));
  req.body.quantity = parseInt(quantity, 10);
  req.body.description = description ? description.trim() : null;
  req.body.image_url = image_url && image_url.trim().length > 0 ? image_url.trim() : null;

  next();
};

const validateCategory = (req, res, next) => {
  const { name, description } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Category name is required.');
  } else if (name.trim().length > 100) {
    errors.push('Category name must not exceed 100 characters.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.name = name.trim();
  req.body.description = description ? description.trim() : null;

  next();
};

module.exports = {
  validateProduct,
  validateCategory
};

