const supabase = require('../config/db');

const getProducts = async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*');

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
};

module.exports = { getProducts };
