'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { RequireRole } from '@/components/common/RBAC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PropertyForm, RoomDetailsForm } from '@/components/ui/forms';
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
import { useRooms } from '@/hooks/useRooms';

// ❌ MOCK DATA DISABLED - Showing raw/empty state
// const mockProperties = [
//   {
//     id: '1',
//     ownerId: 'owner-1',
//     name: 'Sunshine PG',
//     address: '123 Main Street, Koramangala',
//     city: 'Bangaxlore',
//     totalRooms: 10,
//     totalBeds: 20,
//     amenities: ['WiFi', 'AC', 'Parking', 'Security'],
//     active: true,
//     rooms: [
//       { 
//         id: 'r1', 
//         propertyId: '1',
//         name: 'Room 101',
//         roomNumber: '101', 
//         capacity: 2, 
//         occupied: 1, 
//         beds: [
//           { id: 'b1', roomId: 'r1', name: 'Bed A', occupied: true },
//           { id: 'b2', roomId: 'r1', name: 'Bed B', occupied: false }
//         ]
//       },
//       { 
//         id: 'r2', 
//         propertyId: '1',
//         name: 'Room 102',
//         roomNumber: '102', 
//         capacity: 2, 
//         occupied: 0, 
//         beds: [
//           { id: 'b3', roomId: 'r2', name: 'Bed A', occupied: false },
//           { id: 'b4', roomId: 'r2', name: 'Bed B', occupied: false }
//         ]
//       },
//       { 
//         id: 'r3', 
//         propertyId: '1',
//         name: 'Room 103',
//         roomNumber: '103', 
//         capacity: 3, 
//         occupied: 2, 
//         beds: [
//           { id: 'b5', roomId: 'r3', name: 'Bed A', occupied: true },
//           { id: 'b6', roomId: 'r3', name: 'Bed B', occupied: true },
//           { id: 'b7', roomId: 'r3', name: 'Bed C', occupied: false }
//         ]
//       },
//       { 
//         id: 'r4', 
//         propertyId: '1',
//         name: 'Room 104',
//         roomNumber: '104', 
//         capacity: 2, 
//         occupied: 2, 
//         beds: [
//           { id: 'b8', roomId: 'r4', name: 'Bed A', occupied: true },
//           { id: 'b9', roomId: 'r4', name: 'Bed B', occupied: true }
//         ]
//       },
//       { 
//         id: 'r5', 
//         propertyId: '1',
//         name: 'Room 105',
//         roomNumber: '105', 
//         capacity: 1, 
//         occupied: 1, 
//         beds: [
//           { id: 'b10', roomId: 'r5', name: 'Single Bed', occupied: true }
//         ]
//       },
//     ]
//   },
//   {
//     id: '2',
//     ownerId: 'owner-1',
//     name: 'Green Valley PG',
//     address: '456 Park Avenue, Indiranagar',
//     city: 'Bangalore',
//     totalRooms: 8,
//     totalBeds: 16,
//     amenities: ['WiFi', 'AC', 'CCTV'],
//     active: true,
//     rooms: [
//       { 
//         id: 'r6', 
//         propertyId: '2',
//         name: 'Room 201',
//         roomNumber: '201', 
//         capacity: 2, 
//         occupied: 1, 
//         beds: [
//           { id: 'b11', roomId: 'r6', name: 'Bed A', occupied: true },
//           { id: 'b12', roomId: 'r6', name: 'Bed B', occupied: false }
//         ]
//       },
//       { 
//         id: 'r7', 
//         propertyId: '2',
//         name: 'Room 202',
//         roomNumber: '202', 
//         capacity: 1, 
//         occupied: 0, 
//         beds: [
//           { id: 'b13', roomId: 'r7', name: 'Single Bed', occupied: false }
//         ]
//       },
//       { 
//         id: 'r8', 
//         propertyId: '2',
//         name: 'Room 203',
//         roomNumber: '203', 
//         capacity: 2, 
//         occupied: 2, 
//         beds: [
//           { id: 'b14', roomId: 'r8', name: 'Bed A', occupied: true },
//           { id: 'b15', roomId: 'r8', name: 'Bed B', occupied: true }
//         ]
//       },
//     ]
//   },
//   {
//     id: '3',
//     ownerId: 'owner-1',
//     name: 'Royal Gardens',
//     address: '789 Garden Road, Whitefield',
//     city: 'Bangalore',
//     totalRooms: 12,
//     totalBeds: 24,
//     amenities: ['WiFi', 'AC', 'Parking', 'Security', 'Gym'],
//     active: false,
//     rooms: [
//       { 
//         id: 'r9', 
//         propertyId: '3',
//         name: 'Room 301',
//         roomNumber: '301', 
//         capacity: 2, 
//         occupied: 0, 
//         beds: [
//           { id: 'b16', roomId: 'r9', name: 'Bed A', occupied: false },
//           { id: 'b17', roomId: 'r9', name: 'Bed B', occupied: false }
//         ]
//       },
//       { 
//         id: 'r10', 
//         propertyId: '3',
//         name: 'Room 302',
//         roomNumber: '302', 
//         capacity: 2, 
//         occupied: 1, 
//         beds: [
//           { id: 'b18', roomId: 'r10', name: 'Bed A', occupied: true },
//           { id: 'b19', roomId: 'r10', name: 'Bed B', occupied: false }
//         ]
//       },
//     ]
//   },
// ];
// 
// Note: Full mock properties data commented out.
// To restore, uncomment the array and its complete structure from git history.

export default function PropertiesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const { properties, loading, error, createProperty, updateProperty, deleteProperty, fetchProperties } = useProperties();
  const { addNotification } = useUIStore();
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const { rooms, createRoom, updateRoom: updateRoomApi, deleteRoom, fetchRooms, fixMissingBeds } = useRooms();

  // Initialize with mock data if empty
  React.useEffect(() => {
    if (properties.length === 0) {
      // setProperties(mockProperties); // This line is commented out as per the new_code
    }
  }, [properties.length]);

  // ✅ Room filters state
  const [roomFilters, setRoomFilters] = React.useState({
    searchTerm: '',
    sharingType: 'all', // all, single, double, triple
    occupancyStatus: 'all', // all, empty, partial, full
  });

  // ✅ Filtered rooms based on filters
  const getFilteredRooms = () => {
    return rooms.filter(room => {
      // Search by room number or name
      const matchesSearch = 
        room.roomNumber.toLowerCase().includes(roomFilters.searchTerm.toLowerCase()) ||
        room.name.toLowerCase().includes(roomFilters.searchTerm.toLowerCase());

      // Filter by sharing type
      const matchesSharingType = 
        roomFilters.sharingType === 'all' || 
        room.sharingType === roomFilters.sharingType;

      // Filter by occupancy status
      let matchesOccupancy = true;
      if (roomFilters.occupancyStatus === 'empty') {
        matchesOccupancy = room.occupied === 0;
      } else if (roomFilters.occupancyStatus === 'partial') {
        matchesOccupancy = room.occupied > 0 && room.occupied < room.capacity;
      } else if (roomFilters.occupancyStatus === 'full') {
        matchesOccupancy = room.occupied === room.capacity;
      }

      return matchesSearch && matchesSharingType && matchesOccupancy;
    });
  };

  // ✅ Fetch rooms for all properties on page load
  React.useEffect(() => {
    const loadAllRooms = async () => {
      console.log('📦 Loading rooms for all properties');
      for (const property of properties) {
        console.log(`🔄 Fetching rooms for property: ${property.name} (${property.id})`);
        await fetchRooms(property.id);
      }
    };

    if (properties.length > 0) {
      loadAllRooms();
    }
  }, [properties, fetchRooms]);

  const handlePropertySubmit = async (data: any) => {
    try {
      if (editingProperty) {
        // Update existing property
        const result = await updateProperty(editingProperty.id, data);
        if (result) {
          addNotification({
            type: 'success',
            title: 'Property Updated',
            message: `${data.name} has been updated successfully.`,
            read: false,
          });
        } else {
          addNotification({
            type: 'error',
            title: 'Update Failed',
            message: 'Failed to update property. Please try again.',
            read: false,
          });
        }
      } else {
        // Add new property
        const result = await createProperty(data);
        if (result) {
          addNotification({
            type: 'success',
            title: 'Property Added',
            message: `${data.name} has been added successfully.`,
            read: false,
          });
        } else {
          addNotification({
            type: 'error',
            title: 'Creation Failed',
            message: 'Failed to create property. Please try again.',
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

  const handleRoomSubmit = async (data: any) => {
    try {
      // Add name field if not present (generate from roomNumber)
      const roomData = {
        ...data,
        name: data.name || `Room ${data.roomNumber}`,
        floor: parseInt(data.floor) || 0,
        capacity: parseInt(data.capacity) || 1,
        rentPerBed: parseFloat(data.rentPerBed) || 0
      };

      console.log('📤 Sending room data:', roomData);

      if (editingRoom) {
        // Update existing room
        const result = await updateRoomApi(editingRoom.id, roomData);
        if (result) {
          addNotification({
            type: 'success',
            title: 'Room Updated',
            message: `Room ${data.roomNumber} has been updated successfully.`,
            read: false,
          });
        } else {
          addNotification({
            type: 'error',
            title: 'Update Failed',
            message: 'Failed to update room. Please try again.',
            read: false,
          });
        }
      } else {
        // Create new room - SAVES TO DATABASE ✅
        const result = await createRoom(roomData);
        if (result) {
          console.log('✅ Room created successfully:', result);
          addNotification({
            type: 'success',
            title: 'Room Added',
            message: `Room ${data.roomNumber} (${data.sharingType} sharing) has been added successfully to database.`,
            read: false,
          });
          
          // ✅ Fetch rooms for this property to refresh UI
          if (roomData.propertyId) {
            console.log('🔄 Fetching rooms for property:', roomData.propertyId);
            await fetchRooms(roomData.propertyId);
          }
        } else {
          addNotification({
            type: 'error',
            title: 'Creation Failed',
            message: 'Failed to create room. Please try again.',
            read: false,
          });
        }
      }
      setShowRoomForm(false);
      setEditingRoom(null);
    } catch (err: any) {
      console.error('❌ Error in handleRoomSubmit:', err);
      addNotification({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to process room request',
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
        } else {
          addNotification({
            type: 'error',
            title: 'Delete Failed',
            message: 'Failed to delete property. Please try again.',
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
    addNotification({
      type: 'info',
      title: 'View Property',
      message: `Viewing details for ${property.name}...`,
      read: false,
    });
  };

  // ✅ Handle fixing missing beds
  const handleFixMissingBeds = async () => {
    try {
      const result = await fixMissingBeds();
      if (result) {
        addNotification({
          type: 'success',
          title: 'Beds Fixed',
          message: `Fixed ${result.fixedCount} rooms by creating missing beds.`,
          read: false,
        });
        // Refresh all rooms
        for (const property of properties) {
          await fetchRooms(property.id);
        }
      }
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: 'Fix Failed',
        message: err.message || 'Failed to fix missing beds',
        read: false,
      });
    }
  };

  // Table columns
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
              <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
              <p className="text-gray-700 font-semibold">Manage your PG properties</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleFixMissingBeds}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-lg"
              >
                <Bed className="mr-2 h-4 w-4" />
                Fix Missing Beds
              </Button>
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
                <CardTitle className="text-sm font-bold text-blue-800">Total Properties</CardTitle>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Building className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{properties.length}</div>
                <p className="text-sm text-blue-700 font-semibold">Properties managed</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-green-800">Active Properties</CardTitle>
                <div className="p-2 bg-green-500 rounded-lg">
                  <Home className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900">
                  {properties.filter(p => p.active).length}
                </div>
                <p className="text-sm text-green-700 font-semibold">Currently active</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-purple-800">Total Rooms</CardTitle>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Bed className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900">
                  {properties.reduce((sum, p) => sum + p.totalRooms, 0)}
                </div>
                <p className="text-sm text-purple-700 font-semibold">Rooms available</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-orange-800">Total Beds</CardTitle>
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900">
                  {properties.reduce((sum, p) => sum + p.totalBeds, 0)}
                </div>
                <p className="text-sm text-orange-700 font-semibold">Beds available</p>
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

          {/* Room Form Modal */}
          {showRoomForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <RoomDetailsForm
                  onSubmit={handleRoomSubmit}
                  initialData={editingRoom}
                  isEditing={!!editingRoom}
                  properties={properties}
                />
                <div className="p-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowRoomForm(false);
                      setEditingRoom(null);
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
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                  onClick={() => handleEditProperty(row)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                  onClick={() => handleViewProperty(row)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </button>
                <button 
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center"
                  onClick={() => handleDeleteProperty(row.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </>
            )}
          />

          {/* Room Details for Each Property */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Room Occupancy Details</h2>
              <Button 
                onClick={() => {
                  setEditingRoom(null);
                  setShowRoomForm(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Room
              </Button>
            </div>
            {properties.map((property) => (
              <Card key={property.id} className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                  <CardTitle className="text-lg font-bold text-gray-900">{property.name}</CardTitle>
                  <CardDescription className="text-sm text-gray-600 font-medium">
                    {property.address} • {property.city}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {/* ✅ FILTER SECTION */}
                  {rooms && rooms.length > 0 && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <Search className="h-5 w-5 mr-2 text-blue-600" />
                        Filter Rooms
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Search Room</label>
                          <input
                            type="text"
                            placeholder="Search by room number or name..."
                            value={roomFilters.searchTerm}
                            onChange={(e) => setRoomFilters({...roomFilters, searchTerm: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          />
                        </div>

                        {/* Sharing Type Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Sharing Type</label>
                          <select
                            value={roomFilters.sharingType}
                            onChange={(e) => setRoomFilters({...roomFilters, sharingType: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          >
                            <option value="all">All Sharing Types</option>
                            <option value="single">🛏️ Single</option>
                            <option value="double">🛏️🛏️ Double</option>
                            <option value="triple">🛏️🛏️🛏️ Triple</option>
                          </select>
                        </div>

                        {/* Occupancy Status Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Occupancy Status</label>
                          <select
                            value={roomFilters.occupancyStatus}
                            onChange={(e) => setRoomFilters({...roomFilters, occupancyStatus: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          >
                            <option value="all">All Status</option>
                            <option value="empty">🟢 Empty</option>
                            <option value="partial">🟡 Partial</option>
                            <option value="full">🔴 Full</option>
                          </select>
                        </div>
                      </div>

                      {/* Results Count */}
                      <div className="mt-3 text-sm text-gray-600 font-medium">
                        Showing <span className="font-bold text-blue-700">{getFilteredRooms().length}</span> of <span className="font-bold text-gray-700">{rooms.length}</span> rooms
                      </div>
                    </div>
                  )}

                  {/* Filter rooms for this specific property */}
                  {rooms && getFilteredRooms().length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getFilteredRooms().map((room) => (
                        <div key={room.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-900">Room {room.roomNumber}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              room.occupied === room.capacity 
                                ? "bg-red-100 text-red-600" 
                                : room.occupied > 0 
                                  ? "bg-yellow-100 text-yellow-600"
                                  : "bg-green-100 text-green-600"
                            }`}>
                              {room.occupied === room.capacity ? "Full" : room.occupied > 0 ? "Partial" : "Empty"}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Capacity:</span>
                              <span className="font-semibold">{room.capacity} tenants</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Occupied:</span>
                              <span className="font-semibold">{room.occupied} tenants</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Available:</span>
                              <span className="font-semibold text-green-600">{room.capacity - room.occupied} beds</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sharing:</span>
                              <span className="font-semibold text-blue-600 capitalize">{room.sharingType || 'double'}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  room.occupied === room.capacity 
                                    ? "bg-red-500" 
                                    : room.occupied > 0 
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                }`}
                                style={{ width: `${(room.occupied / room.capacity) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No room details available</p>
                      <p className="text-sm text-gray-500 mt-2">Click "Add Room" to create rooms for this property</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    </RequireRole>
  );
}