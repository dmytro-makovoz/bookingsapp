import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, 
  Search, 
  Save, 
  X, 
  Edit, 
  Trash2, 
  Building2,
  Upload,
  Download,
  Archive,
  ArchiveRestore,
  Check
} from 'lucide-react';
import { 
  fetchBusinessTypes, 
  addBusinessType,
  updateBusinessType, 
  deleteBusinessType 
} from '../store/slices/bookingSlice';
import { businessTypesAPI } from '../utils/api';
import { toast } from 'react-toastify';

const BusinessTypes = () => {
  const dispatch = useDispatch();
  const { businessTypes, loading } = useSelector((state) => state.booking);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBusinessTypes, setFilteredBusinessTypes] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [newBusinessTypeName, setNewBusinessTypeName] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    dispatch(fetchBusinessTypes(showArchived));
  }, [dispatch, showArchived]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredBusinessTypes(
        businessTypes.filter(businessType =>
          businessType.section.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => a.section.localeCompare(b.section))
      );
    } else {
      setFilteredBusinessTypes([...businessTypes].sort((a, b) => a.section.localeCompare(b.section)));
    }
  }, [businessTypes, searchTerm]);

  const handleEdit = (businessType) => {
    setEditingId(businessType._id);
    setEditingValue(businessType.section);
  };

  const handleSave = async (businessTypeId) => {
    if (!editingValue.trim()) {
      toast.error('Business type name cannot be empty');
      return;
    }

    try {
      const response = await businessTypesAPI.update(businessTypeId, { section: editingValue.trim() });
      dispatch(updateBusinessType(response.data));
      toast.success('Business type updated successfully');
      setEditingId(null);
      setEditingValue('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const handleAddNew = async () => {
    if (!newBusinessTypeName.trim()) {
      toast.error('Business type name cannot be empty');
      return;
    }

    try {
      const response = await businessTypesAPI.create({ section: newBusinessTypeName.trim() });
      dispatch(addBusinessType(response.data));
      toast.success('Business type created successfully');
      setNewBusinessTypeName('');
      setIsAddingNew(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  const handleCancelAdd = () => {
    setNewBusinessTypeName('');
    setIsAddingNew(false);
  };

  const handleDelete = async (businessTypeId) => {
    if (window.confirm('Are you sure you want to delete this business type? This action cannot be undone if customers are using this type.')) {
      try {
        await businessTypesAPI.delete(businessTypeId);
        dispatch(deleteBusinessType(businessTypeId));
        toast.success('Business type deleted successfully');
      } catch (error) {
        toast.error(error.response?.data?.message || 'An error occurred');
      }
    }
  };

  const handleArchiveToggle = async (businessType) => {
    try {
      const response = await businessTypesAPI.archive(businessType._id, !businessType.archived);
      dispatch(updateBusinessType(response.data));
      toast.success(`Business type ${businessType.archived ? 'unarchived' : 'archived'} successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  const handleCSVImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const response = await businessTypesAPI.importCSV(formData);
      const { summary, errors } = response.data;
      
      let message = `Import completed: ${summary.created} created`;
      if (summary.duplicates > 0) {
        message += `, ${summary.duplicates} duplicates skipped`;
      }
      if (summary.errors > 0) {
        message += `, ${summary.errors} errors`;
      }
      
      toast.success(message);
      
      if (errors.length > 0) {
        console.log('Import errors:', errors);
      }
      
      // Refresh the list
      dispatch(fetchBusinessTypes(showArchived));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import CSV');
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "section\nRestaurant & Food Service\nRetail Store\nHealthcare Services\nProfessional Services\nAutomotive Services";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'business_types_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Business Types</h1>
        <p className="mt-2 text-gray-600">Manage business type categories for customer classification</p>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search business types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Archive Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showArchived"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showArchived" className="text-sm text-gray-700">
              Show archived
            </label>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          {/* CSV Import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCSVImport}
            accept=".csv"
            className="hidden"
          />
          
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Template
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Importing...' : 'Import CSV'}
          </button>
          
          <button
            onClick={() => setIsAddingNew(true)}
            disabled={isAddingNew}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Business Type
          </button>
        </div>
      </div>

      {/* Business Types Table */}
      {loading.businessTypes ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Loading business types...</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Add New Row */}
              {isAddingNew && (
                <tr className="bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <input
                          type="text"
                          value={newBusinessTypeName}
                          onChange={(e) => setNewBusinessTypeName(e.target.value)}
                          placeholder="Enter business type name..."
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddNew();
                            } else if (e.key === 'Escape') {
                              handleCancelAdd();
                            }
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={handleAddNew}
                        className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        title="Save"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancelAdd}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              
              {/* Existing Business Types */}
              {filteredBusinessTypes.length > 0 ? (
                filteredBusinessTypes.map((businessType) => (
                  <tr key={businessType._id} className={businessType.archived ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          {editingId === businessType._id ? (
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              autoFocus
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleSave(businessType._id);
                                } else if (e.key === 'Escape') {
                                  handleCancel();
                                }
                              }}
                            />
                          ) : (
                            <div className={`text-sm font-medium ${businessType.archived ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {businessType.section}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        businessType.archived 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {businessType.archived ? 'Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === businessType._id ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleSave(businessType._id)}
                            className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            title="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleArchiveToggle(businessType)}
                            className={`p-2 focus:outline-none focus:ring-2 rounded-md ${
                              businessType.archived 
                                ? 'text-gray-400 hover:text-green-600 focus:ring-green-500' 
                                : 'text-gray-400 hover:text-yellow-600 focus:ring-yellow-500'
                            }`}
                            title={businessType.archived ? 'Unarchive' : 'Archive'}
                          >
                            {businessType.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleEdit(businessType)}
                            className="p-2 text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(businessType._id)}
                            className="p-2 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No business types found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first business type.'}
                    </p>
                    {!searchTerm && !isAddingNew && (
                      <div className="mt-6">
                        <button
                          onClick={() => setIsAddingNew(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Business Type
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BusinessTypes; 