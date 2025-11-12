'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Switch } from './switch';
import { Checkbox } from './checkbox';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Calendar, Upload, Save, X, Plus, Trash2, Home } from 'lucide-react';

// Form validation schemas
export const propertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  totalRooms: z.number().min(1, 'Total rooms must be at least 1'),
  totalBeds: z.number().min(1, 'Total beds must be at least 1'),
  amenities: z.array(z.string()).optional(),
  active: z.boolean().default(true)
});

export const tenantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  phone: z.string().min(1, 'Phone is required'),
  propertyId: z.string().min(1, 'Property selection is required'),
  roomId: z.string().min(1, 'Room selection is required'),
  bedId: z.string().min(1, 'Bed selection is required'),
  securityDeposit: z.number().min(0, 'Security deposit must be 0 or more'),
  monthlyRent: z.number().min(1, 'Monthly rent must be greater than 0'),
  moveInDate: z.string().min(1, 'Move-in date is required'),
  kycId: z.string().optional(),
  kycDocument: z.string().optional(),
  password: z.string().min(1, 'Password is required').optional(),
  emergencyContact: z.string().optional(),
  address: z.string().optional()
});

export const invoiceSchema = z.object({
  tenantId: z.string().min(1, 'Tenant selection is required'),
  month: z.string().min(1, 'Month is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  dueDate: z.string().min(1, 'Due date is required'),
  description: z.string().optional()
});

// Room Details Schema
export const roomSchema = z.object({
  propertyId: z.string().min(1, 'Property selection is required'),
  roomNumber: z.string().min(1, 'Room number is required'),
  floor: z.number().min(0, 'Floor must be 0 or higher'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  rentPerBed: z.number().min(1, 'Rent per bed must be greater than 0'),
  sharingType: z.enum(['single', 'double', 'triple'])
});

// Property Form Component
export function PropertyForm({ onSubmit, initialData, isEditing = false }: {
  onSubmit: (data: any) => void;
  initialData?: any;
  isEditing?: boolean;
}) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(propertySchema),
    defaultValues: initialData || {
      name: '',
      address: '',
      city: '',
      totalRooms: 1,
      totalBeds: 1,
      amenities: [],
      active: true
    }
  });

  const [amenities, setAmenities] = useState(initialData?.amenities || []);
  const [newAmenity, setNewAmenity] = useState('');

  const addAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      const updated = [...amenities, newAmenity.trim()];
      setAmenities(updated);
      setValue('amenities', updated);
      setNewAmenity('');
    }
  };

  const removeAmenity = (amenity: string) => {
    const updated = amenities.filter((a: string) => a !== amenity);
    setAmenities(updated);
    setValue('amenities', updated);
  };

  return (
    <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
        <CardTitle className="flex items-center text-lg font-bold text-gray-900 dark:text-black-200">
          <div className="p-2 bg-blue-500 rounded-lg mr-3">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          {isEditing ? 'Edit Property' : 'Add New Property'}
        </CardTitle>
        <CardDescription className="text-sm text-gray-600 font-semibold dark:text-black">
          {isEditing ? 'Update property information' : 'Create a new property listing'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" className="text-gray-700 font-semibold">Property Name</Label>
              <Input
                id="name"
                {...register('name')}
                className="!text-black bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black"
                placeholder="Enter property name"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{typeof errors.name.message === 'string' ? errors.name.message : 'Invalid input'}</p>}
            </div>

            <div>
              <Label htmlFor="city" className="text-gray-700 font-semibold">City</Label>
              <Input
                id="city"
                {...register('city')}
                className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
                placeholder="Enter city"
              />
              {errors.city && <p className="text-red-600 text-sm mt-1">{typeof errors.city.message === 'string' ? errors.city.message : 'Invalid input'}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="address" className="text-gray-700 font-semibold">Address</Label>
            <Textarea
              id="address"
              {...register('address')}
              className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
              placeholder="Enter full address"
              rows={3}
            />
            {errors.address && <p className="text-red-600 text-sm mt-1">{typeof errors.address.message === 'string' ? errors.address.message : 'Invalid input'}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="totalRooms" className="text-gray-700 font-semibold">Total Rooms</Label>
              <Input
                id="totalRooms"
                type="number"
                {...register('totalRooms', { valueAsNumber: true })}
                className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
                placeholder="Number of rooms"
              />
              {errors.totalRooms && <p className="text-red-600 text-sm mt-1">{typeof errors.totalRooms.message === 'string' ? errors.totalRooms.message : 'Invalid input'}</p>}
            </div>

            <div>
              <Label htmlFor="totalBeds" className="text-gray-700 font-semibold">Total Beds</Label>
              <Input
                id="totalBeds"
                type="number"
                {...register('totalBeds', { valueAsNumber: true })}
                className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
                placeholder="Number of beds"
              />
              {errors.totalBeds && <p className="text-red-600 text-sm mt-1">{typeof errors.totalBeds.message === 'string' ? errors.totalBeds.message : 'Invalid input'}</p>}
            </div>
          </div>

          <div>
            <Label className="text-gray-700 font-semibold">Amenities</Label>
            <div className="flex gap-2 mb-3">
              <Input
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="Add amenity"
                className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
              />
              <Button type="button" onClick={addAmenity} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity: string, index: number) => (
                <Badge key={index} className="bg-blue-100 text-blue-800 border-blue-200">
                  {amenity}
                  <button
                    type="button"
                    onClick={() => removeAmenity(amenity)}
                    className="ml-2 hover:text-blue-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={watch('active')}
              onCheckedChange={(checked) => setValue('active', checked)}
            />
            <Label htmlFor="active" className="text-gray-700 font-semibold">Active Property</Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Update Property' : 'Create Property'}
            </Button>
            <Button type="button" variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Tenant Form Component
export function TenantForm({ onSubmit, initialData, isEditing = false, properties = [], rooms = [], onPropertySelect }: {
  onSubmit: (data: any) => void;
  initialData?: any;
  isEditing?: boolean;
  properties?: Array<{ id: string; name: string; rooms?: Array<{ id: string; name: string; beds?: Array<{ id: string; name: string }> }> }>;
  rooms?: Array<any>;
  onPropertySelect?: (propertyId: string) => void;
}) {
  const { register, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm({
    resolver: zodResolver(tenantSchema),
    defaultValues: initialData || {
      name: '',
      email: '',
      phone: '',
      propertyId: '',
      roomId: '',
      bedId: '',
      securityDeposit: 0,
      monthlyRent: 0,
      moveInDate: '',
      kycId: '',
      kycDocument: '',
      password: '',
      emergencyContact: '',
      address: '',
    }
  });

  const selectedProperty = watch('propertyId');
  const selectedRoom = watch('roomId');

  // ✅ Handle property selection and trigger room fetch
  React.useEffect(() => {
    if (selectedProperty && onPropertySelect) {
      console.log('🏠 Property selected:', selectedProperty);
      onPropertySelect(selectedProperty);
      // Only clear room/bed if property actually changed from previous
      // This prevents clearing when just re-rendering
      setValue('roomId', '');
      setValue('bedId', '');
    }
  }, [selectedProperty, onPropertySelect, setValue]);

  // ✅ Get rooms for selected property
  const getRoomsForProperty = () => {
    if (!selectedProperty) {
      console.log('⚠️ [TenantForm] No property selected');
      return [];
    }

    console.log('📝 [TenantForm] Getting rooms for property:', selectedProperty);
    console.log('📦 [TenantForm] Available properties count:', properties.length);
    console.log('🏘️ [TenantForm] Available rooms count:', rooms.length);
    console.log('📋 [TenantForm] Properties data:', properties.map(p => ({ id: p.id, name: p.name, hasRooms: !!p.rooms, roomsCount: p.rooms?.length || 0 })));
    
    // First try to get rooms from property.rooms (merged data)
    const property = properties.find(p => p.id === selectedProperty);
    console.log('🔍 [TenantForm] Found property:', property?.name, 'with nested rooms:', property?.rooms?.length || 0);
    
    if (property?.rooms && property.rooms.length > 0) {
      console.log('✅ [TenantForm] Using rooms from property.rooms:', property.rooms);
      return property.rooms;
    }
    
    // Otherwise filter from rooms array
    const filteredRooms = rooms.filter(room => room.propertyId === selectedProperty);
    console.log('✅ [TenantForm] Using rooms from rooms array:', filteredRooms);
    
    if (filteredRooms.length === 0 && rooms.length > 0) {
      console.warn('⚠️ [TenantForm] No rooms found for property', selectedProperty, '. Available rooms:', rooms);
    }
    
    return filteredRooms;
  };

  // ✅ Use useMemo to avoid recalculating on every render
  const propertyRooms = React.useMemo(() => {
    console.log('🔄 [TenantForm] Recalculating propertyRooms...');
    return getRoomsForProperty();
  }, [selectedProperty, properties, rooms]);

  return (
    <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
        <CardTitle className="flex items-center text-lg font-bold text-black-200 dark:text-black">
          <div className="p-2 bg-green-500 rounded-lg mr-3">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          {isEditing ? 'Edit Tenant' : 'Add New Tenant'}
        </CardTitle>
        <CardDescription className="text-sm text-gray-600 dark:text-black-200 font-semibold">
          {isEditing ? 'Update tenant information' : 'Register a new tenant'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" className="text-gray-700 font-semibold">Full Name</Label>
              <Input
                id="name"
                {...register('name')}
                className="bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
                placeholder="Enter full name"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{typeof errors.name.message === 'string' ? errors.name.message : 'Invalid input'}</p>}
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-700 font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className="bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
                placeholder="Enter email address"
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{typeof errors.email.message === 'string' ? errors.email.message : 'Invalid input'}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="phone" className="text-gray-700 font-semibold">Phone Number</Label>
              <Input
                id="phone"
                {...register('phone')}
                className="bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
                placeholder="Enter phone number"
              />
              {errors.phone && <p className="text-red-600 text-sm mt-1">{typeof errors.phone.message === 'string' ? errors.phone.message : 'Invalid input'}</p>}
            </div>

            <div>
              <Label htmlFor="emergencyContact" className="text-gray-700 font-semibold">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                {...register('emergencyContact')}
                className="bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
                placeholder="Emergency contact number"
              />
              {errors.emergencyContact && <p className="text-red-600 text-sm mt-1">{typeof errors.emergencyContact.message === 'string' ? errors.emergencyContact.message : 'Invalid input'}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="propertyId" className="text-gray-700  font-semibold">Property</Label>
            <Select onValueChange={(value) => setValue('propertyId', value)}>
              <SelectTrigger className="!text-black bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300 [&>span]:!text-black [&_span]:!text-black [&_*]:!text-black">
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id} className="!text-black hover:!text-white focus:!text-white">
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.propertyId && <p className="text-red-600 text-sm mt-1">{typeof errors.propertyId.message === 'string' ? errors.propertyId.message : 'Invalid input'}</p>}
          </div>

          {selectedProperty && (
            <div>
              <Label htmlFor="roomId" className="text-gray-700 font-semibold">Room</Label>
              <Select 
                value={selectedRoom || ''}
                onValueChange={(value) => {
                  console.log('🎯 Room selected:', value);
                  setValue('roomId', value);
                  trigger('roomId');  // ✅ Trigger validation immediately
                }}>
                <SelectTrigger className="!text-black bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300 [&>span]:!text-black [&_span]:!text-black [&_*]:!text-black">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {propertyRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id} className="!text-black hover:!text-white focus:!text-black">
                      <div className="flex flex-col">
                        <span className="font-semibold">{room.name}</span>
                        <span className="text-sm text-gray-500">
                          Room {room.name} • Capacity: {room.beds?.length || 0} • Occupied: 0/{room.beds?.length || 0}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roomId && <p className="text-red-600 text-sm mt-1">{typeof errors.roomId.message === 'string' ? errors.roomId.message : 'Invalid input'}</p>}
            </div>
          )}

          {selectedRoom && (
            <div>
              <Label htmlFor="bedId" className="text-gray-700 font-semibold">Bed</Label>
              <Select 
                value={watch('bedId') || ''}
                onValueChange={(value) => {
                  console.log('🛏️ Bed selected:', value);
                  setValue('bedId', value);
                  trigger('bedId');  // ✅ Trigger validation immediately
                }}>
                <SelectTrigger className="!text-black bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300 [&>span]:!text-black [&_span]:!text-black [&_*]:!text-black">
                  <SelectValue placeholder="Select bed" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {propertyRooms.find(r => r.id === selectedRoom)?.beds?.map((bed: any) => (
                    <SelectItem 
                      key={bed.id} 
                      value={bed.id}
                      disabled={false}
                      className="!text-black hover:!text-white focus:!text-white"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold">
                          {bed.name}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">
                          Available
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bedId && <p className="text-red-600 text-sm mt-1">{typeof errors.bedId.message === 'string' ? errors.bedId.message : 'Invalid input'}</p>}
            </div>
          )}

          {/* Room Details Section */}
          {selectedRoom && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-bold text-gray-900 mb-3">Room Details</h4>
              {(() => {
                const selectedRoomData = properties.find(p => p.id === selectedProperty)?.rooms?.find(r => r.id === selectedRoom);
                if (!selectedRoomData) return null;
                
                return (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 font-medium">Room Number:</span>
                      <span className="ml-2 font-bold text-gray-900">{selectedRoomData.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Capacity:</span>
                      <span className="ml-2 font-bold text-gray-900">{selectedRoomData.beds?.length || 0} tenants</span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Currently Occupied:</span>
                      <span className="ml-2 font-bold text-gray-900">0 tenants</span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Available Beds:</span>
                      <span className="ml-2 font-bold text-green-600">
                        {selectedRoomData.beds?.length || 0} beds
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <div>
            <Label htmlFor="address" className="text-gray-700 font-semibold">Address</Label>
            <Textarea
              id="address"
              {...register('address')}
              className="bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
              placeholder="Enter permanent address"
              rows={3}
            />
            {errors.address && <p className="text-red-600 text-sm mt-1">{typeof errors.address.message === 'string' ? errors.address.message : 'Invalid input'}</p>}
          </div>

          {/* Allocation Summary */}
          {selectedRoom && selectedProperty && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <h4 className="text-sm font-bold text-gray-900 mb-3">Allocation Summary</h4>
              {(() => {
                const selectedPropertyData = properties.find(p => p.id === selectedProperty);
                const selectedRoomData = selectedPropertyData?.rooms?.find(r => r.id === selectedRoom);
                if (!selectedPropertyData || !selectedRoomData) return null;
                
                return (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Property:</span>
                      <span className="font-bold text-gray-900">{selectedPropertyData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Room:</span>
                      <span className="font-bold text-gray-900">Room {selectedRoomData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Room Capacity:</span>
                      <span className="font-bold text-gray-900">{selectedRoomData.beds?.length || 0} tenants</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Current Occupancy:</span>
                      <span className="font-bold text-gray-900">0/{selectedRoomData.beds?.length || 0}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Financial & KYC Information */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Financial & KYC Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Label htmlFor="monthlyRent" className="text-gray-700 font-semibold">Monthly Rent (₹)</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('monthlyRent', { valueAsNumber: true })}
                  className="bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
                  placeholder="Enter monthly rent amount"
                />
                {errors.monthlyRent && <p className="text-red-600 text-sm mt-1">{typeof errors.monthlyRent.message === 'string' ? errors.monthlyRent.message : 'Invalid input'}</p>}
              </div>

              <div>
                <Label htmlFor="securityDeposit" className="text-gray-700 font-semibold">Security Deposit (₹)</Label>
                <Input
                  id="securityDeposit"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('securityDeposit', { valueAsNumber: true })}
                  className="bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
                  placeholder="Enter security deposit amount"
                />
                {errors.securityDeposit && <p className="text-red-600 text-sm mt-1">{typeof errors.securityDeposit.message === 'string' ? errors.securityDeposit.message : 'Invalid input'}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="moveInDate" className="text-gray-700 font-semibold">Move-In Date</Label>
                <Input
                  id="moveInDate"
                  type="date"
                  {...register('moveInDate')}
                  className="bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300 !text-black"
                />
                {errors.moveInDate && <p className="text-red-600 text-sm mt-1">{typeof errors.moveInDate.message === 'string' ? errors.moveInDate.message : 'Invalid input'}</p>}
              </div>

              <div>
                <Label htmlFor="kycId" className="text-gray-700 font-semibold">KYC ID (Optional)</Label>
                <Input
                  id="kycId"
                  {...register('kycId')}
                  className="bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
                  placeholder="Enter KYC ID (Aadhaar, PAN, etc.)"
                />
                {errors.kycId && <p className="text-red-600 text-sm mt-1">{typeof errors.kycId.message === 'string' ? errors.kycId.message : 'Invalid input'}</p>}
              </div>
            </div>

            <div className="mt-6">
              <Label htmlFor="kycDocument" className="text-gray-700 font-semibold">KYC Document URL (Optional)</Label>
              <Input
                id="kycDocument"
                {...register('kycDocument')}
                className="bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
                placeholder="URL to KYC document image"
              />
              {errors.kycDocument && <p className="text-red-600 text-sm mt-1">{typeof errors.kycDocument.message === 'string' ? errors.kycDocument.message : 'Invalid input'}</p>}
            </div>
          </div>

          {/* Login Credentials Section */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Login Credentials</h3>
            <p className="text-sm text-gray-600 mb-4 font-medium">
              Set password for tenant to access their account (leave blank for auto-generated)
            </p>
            
            <div>
              <Label htmlFor="password" className="text-gray-700 font-semibold">Password (Optional)</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                className="bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
                placeholder="Leave blank for auto-generated password"
              />
              {errors.password && <p className="text-red-600 text-sm mt-1">{typeof errors.password.message === 'string' ? errors.password.message : 'Invalid input'}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Update Tenant' : 'Create Tenant'}
            </Button>
            <Button type="button" variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Invoice Form Component
export function InvoiceForm({ onSubmit, initialData, isEditing = false, tenants = [] }: {
  onSubmit: (data: any) => void;
  initialData?: any;
  isEditing?: boolean;
  tenants?: Array<{ id: string; name: string; email: string }>;
}) {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialData || {
      tenantId: '',
      month: '',
      amount: 0,
      dueDate: '',
      description: ''
    }
  });

  return (
    <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
        <CardTitle className="flex items-center text-lg font-bold text-gray-900 dark:text-gray-900">
          <div className="p-2 bg-purple-500 rounded-lg mr-3">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          {isEditing ? 'Edit Invoice' : 'Create New Invoice'}
        </CardTitle>
        <CardDescription className="text-sm text-black-900 dark:text-gray-900 font-semibold">
          {isEditing ? 'Update invoice details' : 'Generate a new invoice for tenant'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="tenantId" className="text-gray-700 font-semibold">Tenant</Label>
            <Select onValueChange={(value) => setValue('tenantId', value)}>
              <SelectTrigger className="text-black border-gray-600 bg-gradient-to-r from-gray-50 to-purple-50 border-2 border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl font-medium transition-all duration-300">
                <SelectValue placeholder="Select tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name} ({tenant.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tenantId && <p className="text-red-600 text-sm mt-1">{typeof errors.tenantId.message === 'string' ? errors.tenantId.message : 'Invalid input'}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="month" className="text-gray-700 font-semibold">Month</Label>
              <Input
                id="month"
                type="month"
                {...register('month')}
                className="bg-gradient-to-r from-gray-50 to-purple-50 border-2 border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl font-medium transition-all duration-300 !text-black"
              />
              {errors.month && <p className="text-red-600 text-sm mt-1">{typeof errors.month.message === 'string' ? errors.month.message : 'Invalid input'}</p>}
            </div>

            <div>
              <Label htmlFor="amount" className="text-gray-700 font-semibold">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                {...register('amount', { valueAsNumber: true })}
                className="bg-gradient-to-r from-gray-50 to-purple-50 border-2 border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
                placeholder="Enter amount"
              />
              {errors.amount && <p className="text-red-600 text-sm mt-1">{typeof errors.amount.message === 'string' ? errors.amount.message : 'Invalid input'}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="dueDate" className="text-gray-700 font-semibold">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              {...register('dueDate')}
              className="bg-gradient-to-r from-gray-50 to-purple-50 border-2 border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl font-medium transition-all duration-300 !text-black"
            />
            {errors.dueDate && <p className="text-red-600 text-sm mt-1">{typeof errors.dueDate.message === 'string' ? errors.dueDate.message : 'Invalid input'}</p>}
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-700 font-semibold">Description (Optional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              className="bg-gradient-to-r from-gray-50 to-purple-50 border-2 border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
              placeholder="Additional notes or description"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Update Invoice' : 'Create Invoice'}
            </Button>
            <Button type="button" variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Room Details Form Component
export function RoomDetailsForm({ onSubmit, initialData, isEditing = false, properties = [] }: {
  onSubmit: (data: any) => void;
  initialData?: any;
  isEditing?: boolean;
  properties?: Array<{ id: string; name: string }>;
}) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(roomSchema),
    defaultValues: initialData || {
      propertyId: '',
      roomNumber: '',
      floor: 0,
      capacity: 1,
      rentPerBed: 0,
      sharingType: 'double'
    }
  });

  const capacity = watch('capacity');
  const sharingType = watch('sharingType');

  // Get sharing type details
  const getSharingTypeDetails = (type: string) => {
    const details: { [key: string]: { label: string; description: string; icon: string } } = {
      single: { label: 'Single', description: '1 bed per room', icon: '🛏️' },
      double: { label: 'Double', description: '2 beds per room', icon: '🛏️🛏️' },
      triple: { label: 'Triple', description: '3 beds per room', icon: '🛏️🛏️🛏️' }
    };
    return details[type];
  };

  return (
    <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
        <CardTitle className="flex items-center text-lg font-bold dark:text-black">
          <div className="p-2 bg-green-500 rounded-lg mr-3">
            <Home className="h-5 w-5 text-white" />
          </div>
          {isEditing ? 'Edit Room Details' : 'Add Room Configuration'}
        </CardTitle>
        <CardDescription className="text-sm dark:text-black-200 font-semibold">
          {isEditing ? 'Update room configuration' : 'Create a new room with sharing type and bed capacity'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Property Selection */}
          <div>
            <Label htmlFor="propertyId" className="text-gray-700 font-semibold">Select Property</Label>
            <Select 
              onValueChange={(value) => setValue('propertyId', value)}
              defaultValue={initialData?.propertyId}
            >
              <SelectTrigger className="bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.propertyId && <p className="text-red-600 text-sm mt-1">{typeof errors.propertyId.message === 'string' ? errors.propertyId.message : 'Invalid input'}</p>}
          </div>

          {/* Sharing Type Selection */}
          <div>
            <Label className="text-gray-700 font-semibold mb-3 block">Room Sharing Type</Label>
            <RadioGroup defaultValue={initialData?.sharingType || 'double'} onValueChange={(value) => setValue('sharingType', value)}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['single', 'double', 'triple'].map((type) => {
                  const details = getSharingTypeDetails(type);
                  return (
                    <div 
                      key={type}
                      className={`relative flex items-center space-x-2 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        sharingType === type
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-gray-50 hover:border-green-300'
                      }`}
                    >
                      <RadioGroupItem value={type} id={type} />
                      <Label htmlFor={type} className="cursor-pointer flex-1 flex items-center gap-2">
                        <span className="text-2xl">{details.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{details.label}</p>
                          <p className="text-xs text-gray-600">{details.description}</p>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
            {errors.sharingType && <p className="text-red-600 text-sm mt-1">{typeof errors.sharingType.message === 'string' ? errors.sharingType.message : 'Invalid input'}</p>}
          </div>

          {/* Room Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Room Number */}
            <div>
              <Label htmlFor="roomNumber" className="text-gray-700 font-semibold">Room Number</Label>
              <Input
                id="roomNumber"
                {...register('roomNumber')}
                className="bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
                placeholder="e.g., 101, 102, 201"
              />
              {errors.roomNumber && <p className="text-red-600 text-sm mt-1">{typeof errors.roomNumber.message === 'string' ? errors.roomNumber.message : 'Invalid input'}</p>}
            </div>

            {/* Floor */}
            <div>
              <Label htmlFor="floor" className="text-gray-700 font-semibold">Floor Number</Label>
              <Input
                id="floor"
                type="number"
                {...register('floor', { valueAsNumber: true })}
                className="bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
                placeholder="0 for Ground Floor"
              />
              {errors.floor && <p className="text-red-600 text-sm mt-1">{typeof errors.floor.message === 'string' ? errors.floor.message : 'Invalid input'}</p>}
            </div>
          </div>

          {/* Capacity and Rent Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Capacity */}
            <div>
              <Label htmlFor="capacity" className="text-gray-700 font-semibold">Number of Members</Label>
              <Input
                id="capacity"
                type="number"
                {...register('capacity', { valueAsNumber: true })}
                className="bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
                placeholder="Number of beds/members"
                min="1"
                max="6"
              />
              {errors.capacity && <p className="text-red-600 text-sm mt-1">{typeof errors.capacity.message === 'string' ? errors.capacity.message : 'Invalid input'}</p>}
              <p className="text-xs text-gray-500 mt-1">Enter the number of beds/members in this {sharingType} sharing room</p>
            </div>

            {/* Rent Per Bed */}
            <div>
              <Label htmlFor="rentPerBed" className="text-gray-700 font-semibold">Rent Per Bed (₹)</Label>
              <Input
                id="rentPerBed"
                type="number"
                {...register('rentPerBed', { valueAsNumber: true })}
                className="bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300 placeholder:text-black !text-black"
                placeholder="Enter monthly rent per bed"
                min="0"
              />
              {errors.rentPerBed && <p className="text-red-600 text-sm mt-1">{typeof errors.rentPerBed.message === 'string' ? errors.rentPerBed.message : 'Invalid input'}</p>}
            </div>
          </div>

          {/* Summary Card */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Room Configuration Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Sharing Type</p>
                  <p className="font-semibold text-gray-900 capitalize">{sharingType || 'double'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Capacity</p>
                  <p className="font-semibold text-gray-900">{capacity || 1} Member(s)</p>
                </div>
                <div>
                  <p className="text-gray-600">Rent Per Bed</p>
                  <p className="font-semibold text-gray-900">₹{watch('rentPerBed') || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Room Rent</p>
                  <p className="font-semibold text-green-700">₹{((watch('rentPerBed') || 0) * (capacity || 1)).toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Update Room' : 'Add Room'}
            </Button>
            <Button type="button" variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
