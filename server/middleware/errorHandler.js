/**
 * Centralized Error Handling Middleware
 */

const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Format Supabase/PostgreSQL errors nicely
  let message = err.message || 'Internal Server Error';

  if (err.code === '23505') {
    // Unique violation
    message = 'A record with this name already exists.';
  } else if (err.code === '23503') {
    // Foreign key constraint violation
    message = 'Cannot complete operation due to referenced foreign key constraints.';
  }

  console.error(`❌ [Error ${statusCode}]:`, err.message || err);

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};

