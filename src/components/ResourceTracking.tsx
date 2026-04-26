import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Package, MapPin, AlertTriangle, CheckCircle2, MoreVertical, History, Layers, Trash2 } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Resource } from '../types';
import { cn } from '../lib/utils';
import { dataService } from '../services/dataService';

export const ResourceTracking = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [newResource, setNewResource] = useState<Omit<Resource, 'id' | 'createdAt' | 'lastUpdated'>>({
    name: '',
    category: 'Textbooks',
    schoolId: '',
    quantity: 0,
    condition: 'Good',
  });

  useEffect(() => {
    const unsubscribe = dataService.subscribeToResources((data) => {
      setResources(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.addResource({
        ...newResource,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });
      setIsAddModalOpen(false);
      setNewResource({
        name: '',
        category: 'Textbooks',
        schoolId: '',
        quantity: 0,
        condition: 'Good',
      });
    } catch (error) {
      console.error('Error adding resource:', error);
    }
  };

  const handleEditResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;
    try {
      await dataService.updateResource(editingResource.id, {
        ...editingResource,
        lastUpdated: new Date().toISOString(),
      });
      setIsEditModalOpen(false);
      setEditingResource(null);
    } catch (error) {
      console.error('Error updating resource:', error);
    }
  };

  const filteredResources = resources.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.schoolId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const aggregation = resources.reduce((acc, resource) => {
    const cat = resource.category;
    acc[cat] = (acc[cat] || 0) + resource.quantity;
    return acc;
  }, {} as Record<string, number>);

  const electronicsTotal = (aggregation['Electronics'] || 0) + (aggregation['Computers'] || 0) + (aggregation['Printers'] || 0);
  const booksTotal = (aggregation['Textbooks'] || 0) + (aggregation['Library Books'] || 0);
  const furnitureTotal = aggregation['Furniture'] || 0;
  const otherTotal = (aggregation['Lab Equipment'] || 0) + (aggregation['Sports Equipment'] || 0) + (aggregation['Other'] || 0);

  const getConditionIcon = (condition: Resource['condition']) => {
    switch (condition) {
      case 'Good': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'Fair': return <History size={16} className="text-amber-500" />;
      case 'Poor': return <AlertTriangle size={16} className="text-red-500" />;
      default: return <Package size={16} className="text-zinc-400" />;
    }
  };

  const getConditionColor = (condition: Resource['condition']) => {
    switch (condition) {
      case 'Good': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Fair': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Poor': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-zinc-50 text-zinc-700 border-zinc-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Zonal Aggregation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-emerald-50 border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
              <Package size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Total Electronics</p>
              <p className="text-2xl font-bold text-emerald-900">{electronicsTotal}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500 text-white flex items-center justify-center">
              <Search size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Total Books</p>
              <p className="text-2xl font-bold text-blue-900">{booksTotal}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-amber-50 border-amber-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <Layers size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Total Furniture</p>
              <p className="text-2xl font-bold text-amber-900">{furnitureTotal}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-zinc-50 border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-zinc-500 text-white flex items-center justify-center">
              <Filter size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Other Assets</p>
              <p className="text-2xl font-bold text-zinc-900">{otherTotal}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <Input 
            placeholder="Search by resource, category, or school..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Filter size={18} />
            Filters
          </Button>
          <Button 
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={18} />
            Add Resource
          </Button>
        </div>
      </div>

      {/* Add Resource Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 p-6">
              <h2 className="text-xl font-bold text-zinc-900">Add Resource</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>✕</Button>
            </div>
            <form onSubmit={handleAddResource} className="space-y-4 p-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Resource Name</label>
                <Input 
                  required
                  placeholder="e.g. Mathematics Textbook Grade 5"
                  value={newResource.name}
                  onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Category</label>
                  <select 
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newResource.category}
                    onChange={(e) => setNewResource({ ...newResource, category: e.target.value as any })}
                  >
                    <option value="Textbooks">Textbooks</option>
                    <option value="Library Books">Library Books</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Computers">Computers</option>
                    <option value="Printers">Printers</option>
                    <option value="Lab Equipment">Lab Equipment</option>
                    <option value="Sports Equipment">Sports Equipment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">School ID</label>
                  <Input 
                    required
                    placeholder="e.g. SCH001"
                    value={newResource.schoolId}
                    onChange={(e) => setNewResource({ ...newResource, schoolId: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Quantity</label>
                  <Input 
                    required
                    type="number"
                    min="0"
                    value={newResource.quantity}
                    onChange={(e) => setNewResource({ ...newResource, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Condition</label>
                  <select 
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newResource.condition}
                    onChange={(e) => setNewResource({ ...newResource, condition: e.target.value as any })}
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Add Resource</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Resource Modal */}
      {isEditModalOpen && editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 p-6">
              <h2 className="text-xl font-bold text-zinc-900">Edit Resource</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(false)}>✕</Button>
            </div>
            <form onSubmit={handleEditResource} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Resource Name</label>
                <Input 
                  required
                  value={editingResource.name}
                  onChange={(e) => setEditingResource({ ...editingResource, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</label>
                  <select 
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={editingResource.category}
                    onChange={(e) => setEditingResource({ ...editingResource, category: e.target.value as any })}
                  >
                    <option value="Textbooks">Textbooks</option>
                    <option value="Library Books">Library Books</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Computers">Computers</option>
                    <option value="Printers">Printers</option>
                    <option value="Lab Equipment">Lab Equipment</option>
                    <option value="Sports Equipment">Sports Equipment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">School ID</label>
                  <Input 
                    required
                    value={editingResource.schoolId}
                    onChange={(e) => setEditingResource({ ...editingResource, schoolId: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Quantity</label>
                  <Input 
                    required
                    type="number"
                    min="0"
                    value={editingResource.quantity}
                    onChange={(e) => setEditingResource({ ...editingResource, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Condition</label>
                  <select 
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={editingResource.condition}
                    onChange={(e) => setEditingResource({ ...editingResource, condition: e.target.value as any })}
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Update Resource</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Resources Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-zinc-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
            <p>Loading resources...</p>
          </div>
        ) : filteredResources.map((resource) => (
          <Card key={resource.id} className="group hover:border-emerald-500 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="h-12 w-12 rounded-xl bg-zinc-50 text-zinc-600 flex items-center justify-center">
                <Package size={24} />
              </div>
              <div className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5",
                getConditionColor(resource.condition)
              )}>
                {getConditionIcon(resource.condition)}
                {resource.condition}
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-zinc-900 mb-1">{resource.name}</h3>
            <p className="text-sm text-zinc-500 mb-6 flex items-center gap-1">
              <MapPin size={14} />
              School ID: {resource.schoolId}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Category</p>
                <div className="flex items-center gap-1 text-sm font-medium text-zinc-700">
                  <Layers size={14} className="text-zinc-400" />
                  {resource.category}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Quantity</p>
                <p className="text-sm font-medium text-zinc-700">{resource.quantity}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Last Updated</p>
                <div className="flex items-center gap-1 text-sm font-medium text-zinc-700">
                  <History size={14} className="text-zinc-400" />
                  {new Date(resource.lastUpdated).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => {
                  setEditingResource(resource);
                  setIsEditModalOpen(true);
                }}
              >
                Update Status
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to delete ${resource.name}?`)) {
                    try {
                      await dataService.deleteResource(resource.id);
                    } catch (error) {
                      console.error('Error deleting resource:', error);
                    }
                  }
                }}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {!loading && filteredResources.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package size={48} className="text-zinc-200 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900">No resources found</h3>
          <p className="text-zinc-500">No resources match your search criteria.</p>
        </div>
      )}
    </div>
  );
};
