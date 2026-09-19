import React, { useState, useEffect, useRef } from 'react';
import {
  Package, Plus, Search, Filter, Download, Upload,
  Edit2, Trash2, Tag, AlertCircle, Check, ArrowUpDown, FileSpreadsheet
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';

export const Products = () => {
  const { business, isManager } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // CSV Import State
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: '',
    supplier_id: '',
    brand: '',
    description: '',
    cost_price: 0,
    selling_price: 0,
    tax_rate: 18.0,
    current_stock: 10,
    min_stock_alert: 8,
    unit: 'units',
  });
  const [newCatName, setNewCatName] = useState('');

  const currency = business?.currency_symbol || '₹';

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `/products/?page=${page}&limit=15`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (selectedCat) url += `&category_id=${selectedCat}`;

      const res = await api.get(url);
      let list = res.data.items;
      if (sortBy === 'price_asc') list.sort((a, b) => a.selling_price - b.selling_price);
      if (sortBy === 'price_desc') list.sort((a, b) => b.selling_price - a.selling_price);
      if (sortBy === 'stock_low') list.sort((a, b) => a.current_stock - b.current_stock);
      setProducts(list);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [cats, supps] = await Promise.all([
        api.get('/products/categories'),
        api.get('/suppliers/?limit=50'),
      ]);
      setCategories(cats.data);
      setSuppliers(supps.data.items);
    } catch (err) {
      console.error('Meta fetch failed', err);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, search, selectedCat, sortBy]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      category_id: categories[0]?.id || '',
      supplier_id: suppliers[0]?.id || '',
      brand: '',
      description: '',
      cost_price: 500,
      selling_price: 850,
      tax_rate: 18.0,
      current_stock: 25,
      min_stock_alert: 8,
      unit: 'units',
    });
    setShowProductModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      category_id: p.category_id || '',
      supplier_id: p.supplier_id || '',
      brand: p.brand || '',
      description: p.description || '',
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      tax_rate: p.tax_rate,
      current_stock: p.current_stock,
      min_stock_alert: p.min_stock_alert,
      unit: p.unit,
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
      } else {
        await api.post('/products/', formData);
      }
      setShowProductModal(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save product');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete '${name}'?`)) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert('Cannot delete product with existing transaction history.');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      await api.post('/products/categories', { name: newCatName });
      setNewCatName('');
      setShowCategoryModal(false);
      fetchMeta();
    } catch (err) {
      alert('Failed to create category');
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/products/categories/${catId}`);
      fetchMeta();
      fetchProducts();
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  const handleExportCSV = () => {
    window.open(`${api.defaults.baseURL}/products/export/csv`, '_blank');
  };

  const handleUploadCSV = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const data = new FormData();
      data.append('file', importFile);
      const res = await api.post('/products/import/csv', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      fetchProducts();
      fetchMeta();
    } catch (err) {
      alert('Failed to process CSV import');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Products Catalog
          </h1>
          <p className="text-xs text-slate-400">
            Manage inventory items, pricing margins, SKU codes, and bulk import/export.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-surface-900 hover:bg-slate-100 dark:hover:bg-surface-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          {isManager && (
            <>
              <button
                onClick={() => {
                  setImportFile(null);
                  setImportResult(null);
                  setShowImportModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-surface-900 hover:bg-slate-100 dark:hover:bg-surface-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Bulk Import
              </button>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-surface-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <Tag className="w-3.5 h-3.5" /> Categories ({categories.length})
              </button>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-surface-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, SKU or brand..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 text-slate-900 dark:text-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCat}
            onChange={(e) => {
              setSelectedCat(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 text-slate-900 dark:text-white focus:outline-hidden"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 text-slate-900 dark:text-white focus:outline-hidden"
          >
            <option value="name">Sort by Name</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="stock_low">Lowest Stock First</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-bold">Product Item</th>
                <th className="py-3 px-4 font-bold">SKU</th>
                <th className="py-3 px-4 font-bold">Category</th>
                <th className="py-3 px-4 font-bold text-right">Cost Price</th>
                <th className="py-3 px-4 font-bold text-right">Selling Price</th>
                <th className="py-3 px-4 font-bold text-center">Stock</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
                {isManager && <th className="py-3 px-4 font-bold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No products found matching criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.current_stock <= p.min_stock_alert && p.current_stock > 0;
                  const isOut = p.current_stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-surface-800/50">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.brand || 'Standard Brand'}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {p.sku}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {p.category_name || 'General'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {currency}{p.cost_price?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {currency}{p.selling_price?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            isOut
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : isLow
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-surface-800 dark:text-slate-300'
                          }`}
                        >
                          {p.current_stock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}
                          size="sm"
                        >
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Active'}
                        </Badge>
                      </td>
                      {isManager && (
                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 text-slate-400 hover:text-brand-600 rounded-md"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400">Page {page} of {totalPages || 1}</span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded bg-slate-100 dark:bg-surface-800 disabled:opacity-40 font-semibold"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded bg-slate-100 dark:bg-surface-800 disabled:opacity-40 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CSV Bulk Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Bulk Import Products from CSV">
        <form onSubmit={handleUploadCSV} className="space-y-4">
          <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
            <FileSpreadsheet className="w-8 h-8 text-brand-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select CSV spreadsheet to import products
            </p>
            <p className="text-[11px] text-slate-400">
              Columns supported: Name, SKU, Category, Brand, Cost Price, Selling Price, Tax Rate, Current Stock, Min Stock Alert
            </p>
            <input
              type="file"
              accept=".csv"
              required
              onChange={(e) => setImportFile(e.target.files[0])}
              className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>

          {importResult && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs space-y-1">
              <p className="font-bold text-emerald-800 dark:text-emerald-200">
                Imported {importResult.imported_count} of {importResult.total_records} products!
              </p>
              {importResult.errors?.length > 0 && (
                <ul className="text-rose-600 text-[11px] list-disc list-inside">
                  {importResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowImportModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-surface-800"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={importLoading || !importFile}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-lg shadow-xs"
            >
              {importLoading ? 'Processing...' : 'Upload & Import'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">SKU Code *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Cost Price ({currency})</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Selling Price ({currency}) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Tax Rate (%)</label>
              <input
                type="number"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {!editingProduct && (
              <div>
                <label className="block text-xs font-semibold mb-1">Opening Stock</label>
                <input
                  type="number"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold mb-1">Min Stock Alert</label>
              <input
                type="number"
                value={formData.min_stock_alert}
                onChange={(e) => setFormData({ ...formData, min_stock_alert: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowProductModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-surface-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Category Manager Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Product Categories Management"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <form onSubmit={handleCreateCategory} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="New Category Name (e.g. Gaming Gear)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg"
            >
              Add Category
            </button>
          </form>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
            {categories.map((c) => (
              <div key={c.id} className="py-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
                <button
                  onClick={() => handleDeleteCategory(c.id)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
