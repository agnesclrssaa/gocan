const errorHandler = (error, _req, res, _next) => {
  console.error('API request failed:', error);
  res.status(500).json({ error: 'Terjadi kesalahan internal server.' });
};

module.exports = errorHandler;
