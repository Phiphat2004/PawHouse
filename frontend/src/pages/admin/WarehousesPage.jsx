import { useState, useEffect } from 'react';
import api from '../../services/api';

// Create warehouse API inline since export seems to have issues
const warehouseApi = {
  getAll: () => api.get("/stock/warehouses"),
  create: (data) => api.post("/stock/warehouses", data),
};

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Vietnam'
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await warehouseApi.getAll();
      setWarehouses(response.warehouses || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load warehouse list');
      console.error('Error fetching warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      // Build address object
      const address = {};
      if (formData.street) address.street = formData.street;
      if (formData.city) address.city = formData.city;
      if (formData.state) address.state = formData.state;
      if (formData.zipCode) address.zipCode = formData.zipCode;
      if (formData.country) address.country = formData.country;

      const warehouseData = {
        name: formData.name,
        code: formData.code,
        address: Object.keys(address).length > 0 ? address : undefined
      };

      console.log('Sending warehouse data:', warehouseData);
      console.log('Form data:', formData);
      
      await warehouseApi.create(warehouseData);
      
      setSuccess('✅ Warehouse created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        code: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Vietnam'
      });
      
      // Refresh warehouse list
      await fetchWarehouses();
      
      // Hide form after 2 seconds
      setTimeout(() => {
        setShowForm(false);
        setSuccess('');
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Failed to create warehouse');
      console.error('Error creating warehouse:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      name: '',
      code: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Vietnam'
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Warehouse Management</h1>
          <p className="text-gray-600 mt-1">Manage warehouses in the system</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Warehouse
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Warehouse</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Hanoi Warehouse"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  placeholder="e.g., WH-HN-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                placeholder="e.g., 123 Tran Hung Dao Street"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="VD: Hà Nội"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g., Hanoi"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="e.g., 100000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="e.g., Vietnam"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={formLoading || !formData.name.trim() || !formData.code.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                {formLoading ? 'Creating...' : 'Create Warehouse'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={formLoading}
                className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Warehouse List */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            Warehouse List ({warehouses.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading warehouse list...</p>
          </div>
        ) : warehouses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-lg font-medium mb-2">No warehouses</p>
            <p className="text-sm">Click "Create New Warehouse" button to add the first warehouse</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {warehouses.map((warehouse) => (
                  <tr key={warehouse._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{warehouse.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 font-mono">{warehouse.code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {warehouse.address?.street && (
                          <div>{warehouse.address.street}</div>
                        )}
                        {(warehouse.address?.city || warehouse.address?.state) && (
                          <div className="text-gray-500">
                            {[warehouse.address.city, warehouse.address.state]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        )}
                        {warehouse.address?.zipCode && (
                          <div className="text-gray-500 text-xs">{warehouse.address.zipCode}</div>
                        )}
                        {!warehouse.address?.street && 
                         !warehouse.address?.city && 
                         !warehouse.address?.state && (
                          <span className="text-gray-400 italic">No address</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        warehouse.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {warehouse.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(warehouse.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
