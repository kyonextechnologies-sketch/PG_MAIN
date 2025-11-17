'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { RequireRole } from '@/components/common/RBAC';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Home, 
  Users, 
  Bed,
  DollarSign,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Building2,
  ArrowLeft,
  Download,
  Eye,
  UserPlus,
  Clock,
  MapPin,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/apiClient';
import { useProperties } from '@/hooks/useProperties';
import { RoomDetailsForm } from '@/components/ui/forms';
import { useRooms } from '@/hooks/useRooms';
import { useUIStore } from '@/store/ui';

interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  sharingType: 'SINGLE' | 'DOUBLE' | 'TRIPLE';
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  rentPerBed: number;
  propertyId: string;
  propertyName: string;
  active: boolean;
  tenants: {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
  }[];
}

export default function RoomOccupancyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyIdParam = searchParams.get('propertyId');
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<string>(propertyIdParam || 'ALL');
  const [occupancyFilter, setOccupancyFilter] = useState<'ALL' | 'FULL' | 'VACANT' | 'PARTIAL'>('ALL');
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  
  const { properties } = useProperties();
  const { createRoom, updateRoom } = useRooms();
  const { addNotification } = useUIStore();

  useEffect(() => {
    loadRooms();
  }, [selectedProperty]);

  const handleRoomSubmit = async (data: any) => {
    try {
      const roomData = {
        ...data,
        name: data.name || `Room ${data.roomNumber}`,
        floor: parseInt(data.floor) || 0,
        capacity: parseInt(data.capacity) || 1,
        rentPerBed: parseFloat(data.rentPerBed) || 0
      };

      if (editingRoom) {
        const result = await updateRoom(editingRoom.id, roomData);
        if (result) {
          addNotification({
            type: 'success',
            title: 'Room Updated',
            message: `Room ${data.roomNumber} has been updated successfully.`,
            read: false,
          });
        }
      } else {
        const result = await createRoom(roomData);
        if (result) {
          addNotification({
            type: 'success',
            title: 'Room Added',
            message: `Room ${data.roomNumber} has been added successfully.`,
            read: false,
          });
        }
      }
      setShowRoomForm(false);
      setEditingRoom(null);
      loadRooms(); // Refresh room list
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to process room request',
        read: false,
      });
    }
  };

  const loadRooms = async () => {
    setLoading(true);
    try {
      // TODO: Replace with real API call
      // const response = await apiClient.get('/rooms', {
      //   ownerId: currentUser.id,  // Only fetch current owner's rooms
      //   propertyId: selectedProperty !== 'ALL' ? selectedProperty : undefined
      // });

      // Mock data for current owner only
      const mockRooms: Room[] = [
        {
          id: '1',
          roomNumber: '101',
          floor: 1,
          sharingType: 'SINGLE',
          totalBeds: 1,
          occupiedBeds: 1,
          availableBeds: 0,
          rentPerBed: 12000,
          propertyId: 'prop1',
          propertyName: 'Green Valley PG',
          active: true,
          tenants: [{ id: '1', name: 'John Doe', email: 'john@example.com', phone: '+91-9876543210', status: 'ACTIVE' }],
        },
        {
          id: '2',
          roomNumber: '102',
          floor: 1,
          sharingType: 'DOUBLE',
          totalBeds: 2,
          occupiedBeds: 2,
          availableBeds: 0,
          rentPerBed: 10000,
          propertyId: 'prop1',
          propertyName: 'Green Valley PG',
          active: true,
          tenants: [
            { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+91-9876543211', status: 'ACTIVE' },
            { id: '3', name: 'Bob Johnson', email: 'bob@example.com', phone: '+91-9876543212', status: 'ACTIVE' },
          ],
        },
        {
          id: '3',
          roomNumber: '201',
          floor: 2,
          sharingType: 'TRIPLE',
          totalBeds: 3,
          occupiedBeds: 2,
          availableBeds: 1,
          rentPerBed: 8000,
          propertyId: 'prop1',
          propertyName: 'Green Valley PG',
          active: true,
          tenants: [
            { id: '4', name: 'Alice Brown', email: 'alice@example.com', phone: '+91-9876543213', status: 'ACTIVE' },
            { id: '5', name: 'Charlie Davis', email: 'charlie@example.com', phone: '+91-9876543214', status: 'ACTIVE' },
          ],
        },
        {
          id: '4',
          roomNumber: '202',
          floor: 2,
          sharingType: 'DOUBLE',
          totalBeds: 2,
          occupiedBeds: 0,
          availableBeds: 2,
          rentPerBed: 10000,
          propertyId: 'prop1',
          propertyName: 'Green Valley PG',
          active: true,
          tenants: [],
        },
      ];

      setRooms(mockRooms);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get current owner's property IDs
  const ownerPropertyIds = properties.map(p => p.id);

  const filteredRooms = rooms.filter((room) => {
    // IMPORTANT: Only show rooms from current owner's properties
    if (!ownerPropertyIds.includes(room.propertyId)) {
      return false;
    }

    // Property filter
    if (selectedProperty !== 'ALL' && room.propertyId !== selectedProperty) {
      return false;
    }

    // Search filter
    if (search && !room.roomNumber.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    // Occupancy filter
    if (occupancyFilter === 'FULL' && room.availableBeds > 0) return false;
    if (occupancyFilter === 'VACANT' && room.occupiedBeds > 0) return false;
    if (occupancyFilter === 'PARTIAL' && (room.availableBeds === 0 || room.occupiedBeds === 0)) return false;

    return true;
  });

  const totalRooms = filteredRooms.length;
  const totalBeds = filteredRooms.reduce((sum, room) => sum + room.totalBeds, 0);
  const occupiedBeds = filteredRooms.reduce((sum, room) => sum + room.occupiedBeds, 0);
  const vacantBeds = filteredRooms.reduce((sum, room) => sum + room.availableBeds, 0);
  const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0;
  const monthlyRevenue = filteredRooms.reduce((sum, room) => sum + (room.occupiedBeds * room.rentPerBed), 0);

  if (loading) {
    return (
      <RequireRole role="OWNER">
        <MainLayout>
          <div className="space-y-6">
            <div className="h-12 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded animate-pulse" />
          </div>
        </MainLayout>
      </RequireRole>
    );
  }

  return (
    <RequireRole role="OWNER">
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Home className="w-8 h-8 text-blue-600" />
                Room Occupancy Details
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Complete overview of all rooms across your properties
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setEditingRoom(null);
                  setShowRoomForm(true);
                }}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Room
              </Button>
              <Button
                onClick={() => router.push('/owner/properties')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Home className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Rooms</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalRooms}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-100 rounded-xl">
                    <Bed className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Beds</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBeds}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Occupied</p>
                    <p className="text-2xl font-bold text-green-600">{occupiedBeds}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Vacant</p>
                    <p className="text-2xl font-bold text-red-600">{vacantBeds}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80">Occupancy Rate</p>
                    <p className="text-2xl font-bold text-white">{occupancyRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Property Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Filter by Property
                  </label>
                  <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                    <SelectTrigger className="bg-gray-50 dark:bg-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Properties</SelectItem>
                      {properties.map((prop: any) => (
                        <SelectItem key={prop.id} value={prop.id}>
                          {prop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Occupancy Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Occupancy Status
                  </label>
                  <div className="flex gap-2">
                    {['ALL', 'FULL', 'PARTIAL', 'VACANT'].map((status) => (
                      <Button
                        key={status}
                        onClick={() => setOccupancyFilter(status as any)}
                        variant={occupancyFilter === status ? 'default' : 'outline'}
                        size="sm"
                        className={
                          occupancyFilter === status
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 dark:text-gray-300'
                        }
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Search */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Search Room
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Room number..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 bg-gray-50 dark:bg-gray-900"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rooms Table */}
          <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">
                    Room Details
                  </CardTitle>
                  <CardDescription>
                    Showing {filteredRooms.length} rooms • Monthly Revenue: ₹{monthlyRevenue.toLocaleString('en-IN')}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredRooms.length === 0 ? (
                <div className="p-12 text-center">
                  <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No rooms found</p>
                  <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          Room Details
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          Property
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          Total Beds
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          Occupied
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          Available
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          Rent/Bed
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          Monthly Revenue
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          Tenants
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredRooms.map((room, index) => (
                        <motion.tr
                          key={room.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                          {/* Room Details */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white">Room {room.roomNumber}</p>
                                <p className="text-xs text-gray-500">Floor {room.floor}</p>
                              </div>
                            </div>
                          </td>

                          {/* Property */}
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Building2 className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {room.propertyName}
                              </span>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-6 py-4 text-center">
                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-full">
                              {room.sharingType}
                            </span>
                          </td>

                          {/* Total Beds */}
                          <td className="px-6 py-4 text-center">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{room.totalBeds}</span>
                          </td>

                          {/* Occupied */}
                          <td className="px-6 py-4 text-center">
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-lg font-bold rounded-lg">
                              {room.occupiedBeds}
                            </span>
                          </td>

                          {/* Available */}
                          <td className="px-6 py-4 text-center">
                            <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-lg font-bold rounded-lg">
                              {room.availableBeds}
                            </span>
                          </td>

                          {/* Rent per Bed */}
                          <td className="px-6 py-4 text-center">
                            <span className="text-base font-semibold text-gray-900 dark:text-white">
                              ₹{room.rentPerBed.toLocaleString('en-IN')}
                            </span>
                          </td>

                          {/* Monthly Revenue */}
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="text-lg font-bold text-green-600">
                                ₹{(room.occupiedBeds * room.rentPerBed).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </td>

                          {/* Tenants */}
                          <td className="px-6 py-4">
                            <div className="flex flex-col items-center gap-2">
                              {room.tenants.length > 0 ? (
                                <>
                                  <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {room.tenants.length}
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs text-blue-600 hover:text-blue-700"
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
                                  </Button>
                                </>
                              ) : (
                                <div className="flex items-center gap-1 text-gray-400">
                                  <Clock className="w-4 h-4" />
                                  <span className="text-sm">Empty</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 text-center">
                            {room.active ? (
                              <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm font-medium rounded-full">
                                Active
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-sm font-medium rounded-full">
                                Inactive
                              </span>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

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
        </div>
      </MainLayout>
    </RequireRole>
  );
}

