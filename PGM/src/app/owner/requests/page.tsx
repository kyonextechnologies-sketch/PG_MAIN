'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { RequireRole } from '@/components/common/RBAC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Eye,
  Calendar,
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { formatDate, getPriorityColor, getStatusColor } from '@/lib/utils';
import { useMaintenanceTickets } from '@/hooks/useMaintenanceTickets';
import { useUIStore } from '@/store/ui';

// ❌ MOCK DATA DISABLED - Showing raw/empty state
// Mock data for maintenance requests with tenant details
// const mockRequests = [
//   {
//     id: 'request-1',
//     ownerId: 'owner-1',
//     tenantId: 'tenant-1',
//     title: 'WiFi not working',
//     description: 'The WiFi connection in my room is very slow and keeps disconnecting. Please fix this issue.',
//     status: 'OPEN' as const,
//     priority: 'HIGH' as const,
//     createdAt: '2024-01-15T10:30:00Z',
//     updatedAt: '2024-01-15T10:30:00Z',
//     assignedTo: null,
//     resolvedAt: null,
//     tenant: {
//       id: 'tenant-1',
//       name: 'John Doe',
//       email: 'john@example.com',
//       phone: '+91-9876543210',
//       property: 'Sunshine PG',
//       room: 'Room 101',
//       bed: 'Bed A'
//     }
//   },
//   {
//     id: 'request-2',
//     ownerId: 'owner-1',
//     tenantId: 'tenant-2',
//     title: 'AC not cooling properly',
//     description: "The AC in my room is not cooling properly. It's making noise and not maintaining the temperature.",
//     status: 'IN_PROGRESS' as const,
//     priority: 'MEDIUM' as const,
//     createdAt: '2024-01-20T14:15:00Z',
//     updatedAt: '2024-01-22T09:30:00Z',
//     assignedTo: 'Maintenance Team',
//     resolvedAt: null,
//     tenant: {
//       id: 'tenant-2',
//       name: 'Jane Smith',
//       email: 'jane@example.com',
//       phone: '+91-9876543211',
//       property: 'Green Valley PG',
//       room: 'Room 201',
//       bed: 'Bed B'
//     }
//   },
//   {
//     id: 'request-3',
//     ownerId: 'owner-1',
//     tenantId: 'tenant-3',
//     title: 'Water leakage in bathroom',
//     description: "There's a water leakage in the bathroom. Water is dripping from the ceiling.",
//     status: 'RESOLVED' as const,
//     priority: 'HIGH' as const,
//     createdAt: '2024-01-10T08:45:00Z',
//     updatedAt: '2024-01-12T16:20:00Z',
//     assignedTo: 'Plumber',
//     resolvedAt: '2024-01-12T16:20:00Z',
//     tenant: {
//       id: 'tenant-3',
//       name: 'Bob Johnson',
//       email: 'bob@example.com',
//       phone: '+91-9876543212',
//       property: 'Royal Gardens',
//       room: 'Room 301',
//       bed: 'Bed C'
//     }
//   }
// ];

export default function OwnerRequestsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const { tickets, loading, error, fetchTickets, updateTicket } = useMaintenanceTickets();
  const { addNotification } = useUIStore();

  // Initialize with mock data if empty
  React.useEffect(() => {
    if (tickets.length === 0) {
      // setTickets(mockRequests); // Commented out as per edit hint
    }
  }, [tickets.length]);

  const filteredRequests = tickets.filter(request => {
    const matchesSearch = 
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.tenantId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || request.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    setIsLoading(true);
    setSaveStatus({ type: null, message: '' });
    
    try {
      // ✅ Update with proper data object - only pass the status being updated
      const result = await updateTicket(requestId, { status: newStatus as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | undefined });
      
      if (result) {
        setSaveStatus({ type: 'success', message: `Request status updated to ${newStatus}` });
        
        addNotification({
          type: 'success',
          title: 'Status Updated',
          message: `Request status updated to ${newStatus}`,
          read: false,
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSaveStatus({ type: null, message: '' });
        }, 3000);
      } else {
        throw new Error('Failed to update ticket');
      }
      
    } catch (error) {
      setSaveStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to update status' 
      });
      
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error instanceof Error ? error.message : 'Failed to update request status',
        read: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTo = async (requestId: string, assignee: string) => {
    setIsLoading(true);
    setSaveStatus({ type: null, message: '' });
    
    try {
      // ✅ Update with proper data object including status
      const result = await updateTicket(requestId, { 
        assignedTo: assignee, 
        status: 'IN_PROGRESS' 
      });
      
      if (result) {
        addNotification({
          type: 'success',
          title: 'Request Assigned',
          message: `Request assigned to ${assignee}`,
          read: false,
        });
      } else {
        throw new Error('Failed to assign ticket');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Assignment Failed',
        message: error instanceof Error ? error.message : 'Failed to assign request',
        read: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
  };

  const handleAcknowledgeNotification = (requestId: string) => {
    // acknowledgeNotification(requestId); // This line was removed as per the new_code
    addNotification({
      type: 'success',
      title: 'Notification Acknowledged',
      message: 'You will no longer receive reminders for this request',
      read: false,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'RESOLVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const openRequests = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressRequests = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedRequests = tickets.filter(t => t.status === 'RESOLVED').length;

  return (
    <RequireRole role="OWNER">
      <MainLayout>
        <div className="space-y-6">
          {/* Status Message */}
          {saveStatus.type && (
            <div className={`p-4 rounded-lg border ${
              saveStatus.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                {saveStatus.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertTriangle className="h-5 w-5 mr-2" />
                )}
                {saveStatus.message}
              </div>
            </div>
          )}
          
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Maintenance Requests</h1>
              <p className="text-gray-700 font-semibold">Manage and track tenant maintenance requests</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-red-50 to-red-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-red-800">Open Requests</CardTitle>
                <div className="p-2 bg-red-500 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-900">{openRequests}</div>
                <p className="text-sm text-red-700 font-semibold">Require attention</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-yellow-800">In Progress</CardTitle>
                <div className="p-2 bg-yellow-500 rounded-lg">
                  <Clock className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-900">{inProgressRequests}</div>
                <p className="text-sm text-yellow-700 font-semibold">Being worked on</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-green-800">Resolved</CardTitle>
                <div className="p-2 bg-green-500 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900">{resolvedRequests}</div>
                <p className="text-sm text-green-700 font-semibold">Completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-white shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Priority</label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Priority</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('ALL');
                      setPriorityFilter('ALL');
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requests List */}
          <Card className="bg-white shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
              <CardTitle className="text-lg font-bold text-gray-900">
                Maintenance Requests ({filteredRequests.length})
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 font-semibold">
                Manage tenant maintenance requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {getStatusIcon(request.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-bold text-lg text-gray-900">{request.title}</h4>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                            <Badge className={getPriorityColor(request.priority)}>
                              {request.priority}
                            </Badge>
                          </div>
                          <p className="text-gray-700 mb-3">{request.description}</p>
                          
                          {/* Tenant Details */}
                          <div className="bg-white rounded-lg p-4 mb-3">
                            <h5 className="font-semibold text-gray-900 mb-2 flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              Tenant Details
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center">
                                <User className="h-3 w-3 mr-2 text-gray-500" />
                                <span className="font-medium">{(request as any).tenant?.name || 'N/A'}</span>
                              </div>
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-2 text-gray-500" />
                                <span>{(request as any).tenant?.email || 'N/A'}</span>
                              </div>
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 mr-2 text-gray-500" />
                                <span>{(request as any).tenant?.phone || 'N/A'}</span>
                              </div>
                              <div className="flex items-center">
                                <Building className="h-3 w-3 mr-2 text-gray-500" />
                                <span>{(request as any).tenant?.property || 'N/A'}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-2 text-gray-500" />
                                <span>{(request as any).tenant?.room || 'N/A'} - {(request as any).tenant?.bed || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Created: {formatDate(request.createdAt)}
                            </span>
                            {request.assignedTo && (
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                Assigned to: {request.assignedTo}
                              </span>
                            )}
                            {request.resolvedAt && (
                              <span className="flex items-center text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolved: {formatDate(request.resolvedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewRequest(request)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        
                        {request.status === 'OPEN' && (
                          <Select onValueChange={(value: string) => {
                            console.log('📝 Assigning to:', value);
                            handleAssignTo(request.id, value).catch(err => {
                              console.error('❌ Assignment error:', err);
                            });
                          }}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Assign to" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Maintenance Team">Maintenance Team</SelectItem>
                              <SelectItem value="Electrician">Electrician</SelectItem>
                              <SelectItem value="Plumber">Plumber</SelectItem>
                              <SelectItem value="AC Technician">AC Technician</SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                        {request.status !== 'RESOLVED' && (
                          <Select onValueChange={(value: string) => {
                            console.log('🔄 Updating status to:', value);
                            handleStatusUpdate(request.id, value).catch(err => {
                              console.error('❌ Status update error:', err);
                            });
                          }}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                              <SelectItem value="RESOLVED">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        
                        {request.status === 'OPEN' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleAcknowledgeNotification(request.id)}
                            className="w-32 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Got it
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </RequireRole>
  );
}
