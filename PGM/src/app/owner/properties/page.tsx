'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { RequireRole } from '@/components/common/RBAC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PropertyForm } from '@/components/ui/forms';
import { DataTable, Column, StatusBadge } from '@/components/ui/data-table';
import { 
  Building, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  Bed,
  Home
} from 'lucide-react';
import { useProperties } from '@/hooks/useProperties';
import { useUIStore } from '@/store/ui';

export default function PropertiesPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const { properties, loading, error, createProperty, updateProperty, deleteProperty, fetchProperties } = useProperties();
  const { addNotification } = useUIStore();

  const handlePropertySubmit = async (data: any) => {
    try {
      if (editingProperty) {
        const result = await updateProperty(editingProperty.id, data);
        if (result) {
          addNotification({
            type: 'success',
            title: 'Property Updated',
            message: `${data.name} has been updated successfully.`,
            read: false,
          });
        }
      } else {
        const result = await createProperty(data);
        if (result) {
          addNotification({
            type: 'success',
            title: 'Property Added',
            message: `${data.name} has been added successfully.`,
            read: false,
          });
        }
      }
      setShowForm(false);
      setEditingProperty(null);
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: err.message || 'An error occurred',
        read: false,
      });
    }
  };

  const handleEditProperty = (property: any) => {
    setEditingProperty(property);
    setShowForm(true);
  };

  const handleDeleteProperty = async (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      try {
        const result = await deleteProperty(propertyId);
        if (result) {
          addNotification({
            type: 'success',
            title: 'Property Deleted',
            message: `${property.name} has been deleted.`,
            read: false,
          });
        }
      } catch (err: any) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: err.message || 'Failed to delete property',
          read: false,
        });
      }
    }
  };

  const handleViewProperty = (property: any) => {
    router.push(`/owner/room-occupancy?propertyId=${property.id}`);
  };

  const columns: Column<typeof properties[0]>[] = [
    { key: 'name', label: 'Property Name', sortable: true },
    { key: 'address', label: 'Address', sortable: true },
    { key: 'city', label: 'City', sortable: true },
    { key: 'totalRooms', label: 'Rooms', sortable: true },
    { key: 'totalBeds', label: 'Beds', sortable: true },
    { 
      key: 'active', 
      label: 'Status', 
      sortable: true,
      render: (value: boolean) => <StatusBadge status={value ? 'Active' : 'Inactive'} />
    },
  ];

  return (
    <RequireRole role="OWNER">
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Properties</h1>
              <p className="text-sm sm:text-base text-white font-semibold">Manage your PG properties</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setEditingProperty(null);
                  setShowForm(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm sm:text-base font-bold text-blue-800">Total Properties</CardTitle>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Building className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-blue-900">{properties.length}</div>
                <p className="text-xs sm:text-sm text-blue-700 font-semibold">Properties managed</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm sm:text-base font-bold text-green-800">Active Properties</CardTitle>
                <div className="p-2 bg-green-500 rounded-lg">
                  <Home className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-green-900">
                  {properties.filter(p => p.active).length}
                </div>
                <p className="text-xs sm:text-sm text-green-700 font-semibold">Currently active</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm sm:text-base font-bold text-purple-800">Total Rooms</CardTitle>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Bed className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-purple-900">
                  {properties.reduce((sum, p) => sum + (p.totalRooms || 0), 0)}
                </div>
                <p className="text-xs sm:text-sm text-purple-700 font-semibold">Rooms available</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm sm:text-base font-bold text-orange-800">Total Beds</CardTitle>
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-orange-900">
                  {properties.reduce((sum, p) => sum + (p.totalBeds || 0), 0)}
                </div>
                <p className="text-xs sm:text-sm text-orange-700 font-semibold">Beds available</p>
              </CardContent>
            </Card>
          </div>

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <PropertyForm
                  onSubmit={handlePropertySubmit}
                  initialData={editingProperty}
                  isEditing={!!editingProperty}
                />
                <div className="p-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false);
                      setEditingProperty(null);
                    }}
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}


          {/* Properties Table */}
          <DataTable
            data={properties}
            columns={columns}
            onRowClick={handleViewProperty}
            actions={(row) => (
              <>
                <button 
                  className="w-full px-4 py-2 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-blue-800 flex items-center"
                  onClick={() => handleEditProperty(row)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <button 
                  className="w-full px-4 py-2 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-blue-800 flex items-center"
                  onClick={() => router.push(`/owner/room-occupancy?propertyId=${row.id}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Room Details
                </button>
                <button 
                  className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-blue-800 flex items-center"
                  onClick={() => handleDeleteProperty(row.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </>
            )}
          />

          {/* Property Cards with Simple Stats */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Your Properties</h2>
              <p className="text-sm text-gray-400 mt-1">Click property name or "View Rooms" to see room details</p>
            </div>
            
            {properties.map((property) => (
              <Card key={property.id} className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle 
                        className="text-base sm:text-lg font-bold text-gray-900 dark:text-black cursor-pointer hover:text-blue-600 transition-colors inline-flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/owner/room-occupancy?propertyId=${property.id}`);
                        }}
                      >
                        {property.name}
                        <Eye className="w-4 h-4 text-blue-600" />
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-700 font-medium mt-1">
                        {property.address} • {property.city}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/owner/room-occupancy?propertyId=${property.id}`);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Rooms
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Property Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 font-medium">Total Rooms</p>
                      <p className="text-2xl font-bold text-blue-600">{property.totalRooms || 0}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600 font-medium">Total Beds</p>
                      <p className="text-2xl font-bold text-green-600">{property.totalBeds || 0}</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600 font-medium">Amenities</p>
                      <p className="text-2xl font-bold text-purple-600">{(property as any).amenities?.length || 0}</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-gray-600 font-medium">Status</p>
                      <p className={`text-sm font-bold ${property.active ? 'text-green-600' : 'text-red-600'}`}>
                        {property.active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/owner/room-occupancy?propertyId=${property.id}`);
                      }}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Room Details
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProperty(property);
                      }}
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProperty(property.id);
                      }}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    </RequireRole>
  );
}

