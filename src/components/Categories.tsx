import React, { useState } from 'react';
import { useTransactions } from './TransactionContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useTransactions();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  const predefinedColors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  ];

  const predefinedIcons = [
    '💰', '🏠', '🛒', '🍽️', '⛽', '🏥', '💳', '📱',
    '💡', '🎬', '✈️', '🎓', '👕', '🚗', '📚', '🎮',
  ];

  const handleAddCategory = () => {
    if (!newCategoryName.trim() || !newCategoryIcon) {
      toast.error('Please fill in all fields');
      return;
    }

    addCategory({
      name: newCategoryName.trim(),
      icon: newCategoryIcon,
      color: newCategoryColor,
      type: newCategoryType,
    });

    // Reset form
    setNewCategoryName('');
    setNewCategoryIcon('');
    setNewCategoryColor('#3B82F6');
    setNewCategoryType('expense');
    setIsAddDialogOpen(false);
    toast.success('Category added successfully!');
  };

  const handleEditCategory = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      setNewCategoryName(category.name);
      setNewCategoryIcon(category.icon);
      setNewCategoryColor(category.color);
      setNewCategoryType(category.type);
      setEditingCategory(categoryId);
      setIsAddDialogOpen(true);
    }
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;

    updateCategory(editingCategory, {
      name: newCategoryName.trim(),
      icon: newCategoryIcon,
      color: newCategoryColor,
      type: newCategoryType,
    });

    // Reset form
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryIcon('');
    setNewCategoryColor('#3B82F6');
    setNewCategoryType('expense');
    setIsAddDialogOpen(false);
    toast.success('Category updated successfully!');
  };

  const handleDeleteCategory = (categoryId: string) => {
    deleteCategory(categoryId);
    toast.success('Category deleted successfully!');
  };

  const resetForm = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryIcon('');
    setNewCategoryColor('#3B82F6');
    setNewCategoryType('expense');
    setIsAddDialogOpen(false);
  };

  return (
    <div className="min-h-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-white mb-2">Categories</h1>
            <p className="text-indigo-100 text-sm">Manage your expense categories</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-white/20 hover:bg-white/30 text-white border-white/20">
                <Plus size={16} className="mr-2" />
                Add
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name</Label>
                <Input
                  id="categoryName"
                  placeholder="Enter category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Category Type</Label>
                <Select value={newCategoryType} onValueChange={(value: 'income' | 'expense') => setNewCategoryType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Choose Icon</Label>
                <div className="grid grid-cols-6 gap-2">
                  {predefinedIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewCategoryIcon(icon)}
                      className={`p-2 text-xl border rounded-lg transition-colors ${
                        newCategoryIcon === icon
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Choose Color</Label>
                <div className="grid grid-cols-8 gap-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategoryColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        newCategoryColor === color
                          ? 'border-gray-800 scale-110'
                          : 'border-gray-200 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={resetForm}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                  className="flex-1"
                >
                  {editingCategory ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      </div>

      <div className="px-6 -mt-4 pb-6 space-y-6">
        {/* Income Categories */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-gray-900">Income Categories</h3>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {incomeCategories.length} categories
              </Badge>
            </div>
            {incomeCategories.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No income categories yet</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {incomeCategories.map((category) => (
                  <div
                    key={category.id}
                    className="p-4 border-2 rounded-xl hover:shadow-md transition-all duration-200"
                    style={{ borderColor: category.color + '40', backgroundColor: category.color + '08' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <p className="text-gray-900 text-sm">{category.name}</p>
                          <div 
                            className="w-4 h-4 rounded-full mt-1"
                            style={{ backgroundColor: category.color }}
                          />
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditCategory(category.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Expense Categories */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-gray-900">Expense Categories</h3>
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                {expenseCategories.length} categories
              </Badge>
            </div>
            {expenseCategories.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No expense categories yet</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {expenseCategories.map((category) => (
                  <div
                    key={category.id}
                    className="p-4 border-2 rounded-xl hover:shadow-md transition-all duration-200"
                    style={{ borderColor: category.color + '40', backgroundColor: category.color + '08' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <p className="text-gray-900 text-sm">{category.name}</p>
                          <div 
                            className="w-4 h-4 rounded-full mt-1"
                            style={{ backgroundColor: category.color }}
                          />
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditCategory(category.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}