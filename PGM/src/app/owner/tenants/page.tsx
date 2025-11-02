'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { RequireRole } from '@/components/common/RBAC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TenantForm } from '@/components/ui/forms';
import { DataTable, Column, StatusBadge } from '@/components/ui/data-table';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  Home,
  User
} from 'lucide-react';
import { useTenants } from '@/hooks/useTenants';
import { useUIStore } from '@/store/ui';
import { useProperties } from '@/hooks/useProperties';
import { useRooms } from '@/hooks/useRooms';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// ❌ MOCK DATA DISABLED - Showing raw/empty state
// Mock data for tenants
// const mockTenants = [
//   {
//     id: '1',
//     ownerId: 'owner-1',
//     name: 'John Doe',
//     email: 'john@example.com',
//     phone: '+91-9876543210',
//     kycId: 'KYC001',
//     propertyId: '1',
//     roomId: 'r1',
//     bedId: 'b1',
//     status: 'ACTIVE' as const,
//     username: 'john_doe',
//     password: 'password123',
//   },
//   {
//     id: '2',
//     ownerId: 'owner-1',
//     name: 'Jane Smith',
//     email: 'jane@example.com',
//     phone: '+91-9876543211',
//     kycId: 'KYC002',
//     propertyId: '2',
//     roomId: 'r2',
//     bedId: 'b2',
//     status: 'ACTIVE' as const,
//     username: 'jane_smith',
//     password: 'password123',
//   },
//   {
//     id: '3',
//     ownerId: 'owner-1',
//     name: 'Bob Johnson',
//     email: 'bob@example.com',
//     phone: '+91-9876543212',
//     kycId: 'KYC003',
//     propertyId: '1',
//     roomId: 'r3',
//     bedId: 'b3',
//     status: 'INACTIVE' as const,
//     username: 'bob_johnson',
//     password: 'password123',
//   },
// ];

// ❌ MOCK DATA DISABLED - Showing raw/empty state
// Mock properties for form
// const mockProperties = [
//   { 
//     id: '1', 
//     name: 'Sunshine PG', 
//     rooms: [
//       { 
//         id: 'r1', 
//         name: 'Room 101', 
//         roomNumber: '101',
//         capacity: 2,
//         occupied: 1,
//         beds: [
//           { id: 'b1', name: 'Bed A', occupied: true },
//           { id: 'b2', name: 'Bed B', occupied: false }
//         ]
//       },
//       { 
//         id: 'r2', 
//         name: 'Room 102', 
//         roomNumber: '102',
//         capacity: 2,
//         occupied: 0,
//         beds: [
//           { id: 'b3', name: 'Bed A', occupied: false },
//           { id: 'b4', name: 'Bed B', occupied: false }
//         ]
//       },
//       { 
//         id: 'r3', 
//         name: 'Room 103', 
//         roomNumber: '103',
//         capacity: 3,
//         occupied: 2,
//         beds: [
//           { id: 'b5', name: 'Bed A', occupied: true },
//           { id: 'b6', name: 'Bed B', occupied: true },
//           { id: 'b7', name: 'Bed C', occupied: false }
//         ]
//       }
//     ]
//   },
//   { 
//     id: '2', 
//     name: 'Green Valley PG', 
//     rooms: [
//       { 
//         id: 'r4', 
//         name: 'Room 201', 
//         roomNumber: '201',
//         capacity: 2,
//         occupied: 1,
//         beds: [
//           { id: 'b8', name: 'Bed A', occupied: true },
//           { id: 'b9', name: 'Bed B', occupied: false }
//         ]
//       },
//       { 
//         id: 'r5', 
//         name: 'Room 202', 
//         roomNumber: '202',
//         capacity: 1,
//         occupied: 0,
//         beds: [
//           { id: 'b10', name: 'Single Bed', occupied: false }
//         ]
//       }
//     ]
//   }
// ];

export default function TenantsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const { tenants, loading, error, createTenant, updateTenant, deleteTenant, fetchTenants } = useTenants();
  const { addNotification } = useUIStore();
  const { properties, loading: propertiesLoading, error: propertiesError, fetchProperties } = useProperties();
  const { rooms, loading: roomsLoading, error: roomsError, fetchRooms } = useRooms();
  
  // ✅ Track which properties we've already fetched rooms for
  const fetchedPropertiesRef = React.useRef<Set<string>>(new Set());

  // ✅ Function to load rooms for new properties (wrapped in useCallback)
  const loadRoomsForNewProperties = React.useCallback(async () => {
    console.log('📦 [TenantsPage] Checking for new properties to fetch rooms...');
    for (const property of properties) {
      // Only fetch if we haven't fetched for this property yet
      if (!fetchedPropertiesRef.current.has(property.id)) {
        console.log('🔄 [TenantsPage] First-time fetch for property:', property.id);
        fetchedPropertiesRef.current.add(property.id);
        await fetchRooms(property.id);  // ✅ Will use cache if available
      }
    }
  }, [properties, fetchRooms]);

  // ✅ Fetch rooms for properties that don't have them yet
  React.useEffect(() => {
    if (properties.length > 0) {
      console.log('🚀 [TenantsPage] Triggering room fetch for properties');
      loadRoomsForNewProperties();
    }
  }, [loadRoomsForNewProperties]);  // ✅ Depend on the stable callback

  // ✅ Build properties with rooms merged in (MUST BE BEFORE CONDITIONAL RETURNS)
  // This MUST recalculate when rooms change!
  const propertiesWithRooms = React.useMemo(() => {
    console.log('🔄 [TenantsPage] Recalculating propertiesWithRooms...');
    console.log('📦 [TenantsPage] Properties:', properties.length);
    console.log('🏘️ [TenantsPage] Rooms:', rooms.length);
    
    return properties.map(property => ({
      ...property,
      rooms: rooms
        .filter(room => room.propertyId === property.id)
        .map(room => {
          console.log(`📋 [TenantsPage] Room ${room.roomNumber}:`, {
            id: room.id,
            hasBeds: !!room.beds,
            bedsCount: room.beds?.length || 0,
            beds: room.beds
          });
          
          return {
            id: room.id,
            name: `Room ${room.roomNumber}`,
            roomNumber: room.roomNumber,
            capacity: room.capacity,
            occupied: room.occupied || 0,
            // ✅ IMPORTANT: Only use REAL beds from API, never synthetic ones!
            beds: room.beds && room.beds.length > 0 
              ? room.beds 
              : [] // ← Don't generate synthetic beds, let UI show empty instead
          };
        })
    }));
  }, [properties, rooms]);  // ✅ Recalculate when properties OR rooms change

  // ✅ CHECK AUTHENTICATION FIRST (SIMPLIFIED)
  React.useEffect(() => {
    if (status === 'loading') {
      return; // Wait for session to load
    }

    if (status === 'unauthenticated') {
      console.warn('⚠️ [TenantsPage] Not authenticated! Redirecting to login...');
      router.push('/login');
      return;
    }

    if (session?.user?.id) {
      console.log('✅ [TenantsPage] User authenticated:', session.user.email);
    }
  }, [status, session, router]);

  // Show loading screen while checking auth
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    return null; // Will redirect in useEffect
  }

  const handleTenantSubmit = async (data: any) => {
    try {
      console.log('📝 [TenantsPage] Submitting tenant form with data:', data);
      
      if (editingTenant) {
        // Update existing tenant
        const result = await updateTenant(editingTenant.id, data);
        if (result) {
          addNotification({
            type: 'success',
            title: 'Tenant Updated',
            message: `${data.name} has been updated successfully.`,
            read: false,
          });
        } else {
          addNotification({
            type: 'error',
            title: 'Update Failed',
            message: 'Failed to update tenant. Please try again.',
            read: false,
          });
        }
      } else {
        // Add new tenant
        console.log('✅ [TenantsPage] Creating new tenant with data:', JSON.stringify(data, null, 2));
        const result = await createTenant(data);
        if (result) {
          addNotification({
            type: 'success',
            title: 'Tenant Added',
            message: `${data.name} has been added successfully with login credentials.`,
            read: false,
          });
        } else {
          addNotification({
            type: 'error',
            title: 'Creation Failed',
            message: 'Failed to create tenant. Please try again.',
            read: false,
          });
        }
      }
      setShowForm(false);
      setEditingTenant(null);
    } catch (err: any) {
      console.error('❌ [TenantsPage] Error in handleTenantSubmit:', err);
      addNotification({
        type: 'error',
        title: 'Error',
        message: err.message || 'An error occurred',
        read: false,
      });
    }
  };

  const handleEditTenant = (tenant: any) => {
    setEditingTenant(tenant);
    setShowForm(true);
  };

  const handleDeleteTenant = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      try {
        const result = await deleteTenant(tenantId);
        if (result) {
          addNotification({
            type: 'success',
            title: 'Tenant Deleted',
            message: `${tenant.name} has been deleted.`,
            read: false,
          });
        } else {
          addNotification({
            type: 'error',
            title: 'Delete Failed',
            message: 'Failed to delete tenant. Please try again.',
            read: false,
          });
        }
      } catch (err: any) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: err.message || 'Failed to delete tenant',
          read: false,
        });
      }
    }
  };

  const handleViewTenant = (tenant: any) => {
    addNotification({
      type: 'info',
      title: 'View Tenant',
      message: `Viewing details for ${tenant.name}...`,
      read: false,
    });
  };

  const handleViewCredentials = (tenant: any) => {
    setSelectedTenant(tenant);
    setShowCredentials(true);
  };

  const handleCallTenant = (tenant: any) => {
    addNotification({
      type: 'info',
      title: 'Call Tenant',
      message: `Calling ${tenant.name} at ${tenant.phone}`,
      read: false,
    });
    // In a real app, this would trigger a phone call or open a dialer
    window.open(`tel:${tenant.phone}`, '_self');
  };

  // Table columns
  const columns: Column<typeof tenants[0]>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { 
      key: 'propertyId', 
      label: 'Property & Room', 
      sortable: true,
      render: (value: string) => {
        const tenant = tenants.find(t => t.propertyId === value);
        if (!tenant) return 'N/A';
        
        // const property = mockProperties.find(p => p.id === tenant.propertyId); // ❌ MOCK DATA DISABLED - Showing raw/empty state
        // const room = property?.rooms?.find(r => r.id === tenant.roomId); // ❌ MOCK DATA DISABLED - Showing raw/empty state
        
        return (
          <div className="text-sm">
            <div className="font-semibold text-gray-900">{/* tenant.propertyId */}</div>
            <div className="text-gray-600">Room {/* tenant.roomId */}</div>
          </div>
        );
      }
    },
    { 
      key: 'status' as any, 
      label: 'Status', 
      sortable: true,
      render: (value: string) => <StatusBadge status={value} />
    },
  ];

  return (
    <RequireRole role="OWNER">
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
              <p className="text-gray-700 font-semibold">Manage tenant information and allocations</p>
            </div>
            <Button 
              onClick={() => {
                setEditingTenant(null);
                setShowForm(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Tenant
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-green-800">Total Tenants</CardTitle>
                <div className="p-2 bg-green-500 rounded-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900">{tenants.length}</div>
                <p className="text-sm text-green-700 font-semibold">Registered tenants</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-blue-800">Active Tenants</CardTitle>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <User className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">
                  {tenants.filter(t => t.status === 'ACTIVE').length}
                </div>
                <p className="text-sm text-blue-700 font-semibold">Currently active</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-purple-800">Occupancy Rate</CardTitle>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Home className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900">85%</div>
                <p className="text-sm text-purple-700 font-semibold">Properties occupied</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-orange-800">New This Month</CardTitle>
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Plus className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900">3</div>
                <p className="text-sm text-orange-700 font-semibold">New registrations</p>
              </CardContent>
            </Card>
          </div>

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <TenantForm
                  onSubmit={handleTenantSubmit}
                  initialData={editingTenant}
                  isEditing={!!editingTenant}
                  properties={propertiesWithRooms}
                  rooms={rooms}
                  onPropertySelect={(propertyId: string) => {
                    // ✅ Fetch rooms when property is selected
                    if (propertyId) {
                      console.log('🔄 Fetching rooms for property:', propertyId);
                      fetchRooms(propertyId);
                    }
                  }}
                />
                <div className="p-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false);
                      setEditingTenant(null);
                    }}
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Credentials Modal */}
          {showCredentials && selectedTenant && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Login Credentials</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setShowCredentials(false);
                        setSelectedTenant(null);
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700 font-semibold mb-2">Tenant: {selectedTenant.name}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-medium">Username:</span>
                          <span className="text-sm font-bold text-gray-900">{selectedTenant.username}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-medium">Password:</span>
                          <span className="text-sm font-bold text-gray-900">{selectedTenant.password}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-700 font-medium">
                        💡 Share these credentials with the tenant for their account access
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(`Username: ${selectedTenant.username}\nPassword: ${selectedTenant.password}`);
                        addNotification({
                          type: 'success',
                          title: 'Copied to Clipboard',
                          message: 'Credentials copied to clipboard',
                          read: false,
                        });
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      Copy Credentials
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowCredentials(false);
                        setSelectedTenant(null);
                      }}
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tenants Table */}
          <DataTable
            data={tenants}
            columns={columns}
            onRowClick={handleViewTenant}
            actions={(row) => (
              <>
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                  onClick={() => handleEditTenant(row)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                  onClick={() => handleViewTenant(row)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Profile
                </button>
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                  onClick={() => handleViewCredentials(row)}
                >
                  <User className="h-4 w-4 mr-2" />
                  View Credentials
                </button>
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                  onClick={() => handleCallTenant(row)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </button>
                <button 
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center"
                  onClick={() => handleDeleteTenant(row.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </>
            )}
          />
        </div>
      </MainLayout>
    </RequireRole>
  );
}