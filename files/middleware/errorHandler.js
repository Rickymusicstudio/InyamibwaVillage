module.exports = (err, req, res, next) => {
  console.error('💥 Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Server error'
  });
};