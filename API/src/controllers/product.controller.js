const productController = {
  async getAll(req, res) {
    res.json({ products: [] });
  }
};
module.exports = productController;
