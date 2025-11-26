'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { RequireRole } from '@/components/common/RBAC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Plus, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Eye,
  Calendar,
  User,
  Filter,
  Loader
} from 'lucide-react';
import { formatDate, getPriorityColor, getStatusColor } from '@/lib/utils';
import { useMaintenanceTickets } from '@/hooks/useMaintenanceTickets';
import { useUIStore } from '@/store/ui';
import type { MaintenanceTicket } from '@/hooks/useMaintenanceTickets';

// ❌ MOCK DATA DISABLED - Showing raw/empty state
// Mock data for maintenance requests
// const mockRequests: MaintenanceTicket[] = [
//   {
//     id: 'request-1',
//     ownerId: 'owner-1',
//     tenantId: 'tenant-1',
//     title: 'WiFi not working',
//     description: 'The WiFi connection in my room is very slow and keeps disconnecting. Please fix this issue.',
//     status: 'OPEN',
//     priority: 'HIGH',
//     createdAt: '2024-01-15T10:30:00Z',
//     updatedAt: '2024-01-15T10:30:00Z',
//     assignedTo: null,
//     resolvedAt: null,
//   },
//   {
//     id: 'request-2',
//     ownerId: 'owner-1',
//     tenantId: 'tenant-1',
//     title: 'AC not cooling properly',
//     description: "The AC in my room is not cooling properly. It's making noise and not maintaining the temperature.",
//     status: 'IN_PROGRESS',
//     priority: 'MEDIUM',
//     createdAt: '2024-01-20T14:15:00Z',
//     updatedAt: '2024-01-22T09:30:00Z',
//     assignedTo: 'Maintenance Team',
//     resolvedAt: null,
//   },
//   {
//     id: 'request-3',
//     ownerId: 'owner-1',
//     tenantId: 'tenant-1',
//     title: 'Water leakage in bathroom',
//     description: "There's a water leakage in the bathroom. Water is dripping from the ceiling.",
//     status: 'RESOLVED',
//     priority: 'HIGH',
//     createdAt: '2024-01-10T08:45:00Z',
//     updatedAt: '2024-01-12T16:20:00Z',
//     assignedTo: 'Plumber',
//     resolvedAt: '2024-01-12T16:20:00Z',
//   },
// ];

export default function TenantRequestsPage() {
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [newRequest, setNewRequest] = useState({ 
    title: '', 
    description: '', 
    priority: 'MEDIUM',
    category: 'OTHER'
  });

  const { tickets, loading, error, createTicket, fetchTickets } = useMaintenanceTickets();
  const { addNotification } = useUIStore();

  // ✅ Initialize with mock data if empty
  React.useEffect(() => {
    if (tickets.length === 0) {
      fetchTickets();
    }
  }, [tickets.length, fetchTickets]);

  const handleCreateRequest = async () => {
    if (newRequest.title && newRequest.description && newRequest.category) {
      try {
        const result = await createTicket({
          title: newRequest.title,
          description: newRequest.description,
          priority: newRequest.priority as 'LOW' | 'MEDIUM' | 'HIGH' | undefined,
          status: 'OPEN',
          category: newRequest.category,
        });

        if (result) {
          addNotification({
            type: 'success',
            title: 'Request Created',
            message: 'Your maintenance request has been submitted successfully!',
            read: false,
          });

          setIsCreatingRequest(false);
          setNewRequest({ title: '', description: '', priority: 'MEDIUM', category: 'OTHER' });
        } else {
          addNotification({
            type: 'error',
            title: 'Creation Failed',
            message: 'Failed to create maintenance request. Please try again.',
            read: false,
          });
        }
      } catch (err: any) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: err.message || 'An error occurred',
          read: false,
        });
      }
    } else {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields.',
        read: false,
      });
    }
  };

  const handleViewRequest = (requestId: string) => {
    const request = tickets.find((r) => r.id === requestId);
    if (request) {
      addNotification({
        type: 'info',
        title: 'View Request',
        message: `Viewing details for "${request.title}"...`,
        read: false,
      });
    }
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

  return (
    <RequireRole role="TENANT">
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white dark:text-white">Maintenance Requests</h1>
              <p className="text-sm sm:text-base text-gray-300 dark:text-gray-300 font-semibold">Submit and track maintenance requests</p>
            </div>
            <div className="bg-black rounded-lg p-2">
              <Button onClick={() => setIsCreatingRequest(true)}>
                <Plus className="mr-2 h-4 w-4 text-white font-bold" />
                <p className="text-xl font-medium text-white font-bold">New Request</p>
              </Button>
            </div>
          </div>

          {/* Create Request Form */}
          {isCreatingRequest && (
            <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
                <CardTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-black">Create New Request</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-700 font-semibold">
                  Describe the issue you're experiencing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-black font-bold">
                    Title
                  </Label>
                  <Input
                    className="bg-white text-black border-1 margin-top-2"
                    id="title"
                    value={newRequest.title}
                    onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                    placeholder="Brief description of the issue"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-black font-bold">
                    Description
                  </Label>
                  <Textarea
                    className="bg-white text-black border-1 margin-top-2"
                    id="description"
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                    placeholder="Provide detailed information about the issue..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="priority" className="text-black font-bold">
                    Priority
                  </Label>
                  <Select
                    value={newRequest.priority}
                    onValueChange={(value: string) =>
                      setNewRequest({ ...newRequest, priority: value as 'LOW' | 'MEDIUM' | 'HIGH' })
                    }
                  >
                    <SelectTrigger className="bg-gray-800 !text-white border-1 margin-top-2 [&>span]:!text-white [&_span]:!text-white [&_*]:!text-white">
                      <SelectValue placeholder="Select priority" className="!text-white" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 !text-white border-1 margin-top-2">
                      <SelectItem value="LOW" className="!text-white focus:!text-white hover:!text-white">Low</SelectItem>
                      <SelectItem value="MEDIUM" className="!text-white focus:!text-white hover:!text-white">Medium</SelectItem>
                      <SelectItem value="HIGH" className="!text-white focus:!text-white hover:!text-white">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category" className="text-black font-bold">
                    Category
                  </Label>
                  <Select
                    value={newRequest.category}
                    onValueChange={(value: string) =>
                      setNewRequest({ ...newRequest, category: value as 'OTHER' | 'ELECTRICAL' | 'PLUMBING' | 'MECHANICAL' | 'CLEANING' | 'SECURITY' | 'OTHER' })
                    }
                  >
                    <SelectTrigger className="bg-gray-800 !text-white border-1 margin-top-2 [&>span]:!text-white [&_span]:!text-white [&_*]:!text-white">
                      <SelectValue placeholder="Select category" className="!text-white" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 !text-white border-1 margin-top-2">
                      <SelectItem value="OTHER" className="!text-white focus:!text-white hover:!text-white">Other</SelectItem>
                      <SelectItem value="ELECTRICAL" className="!text-white focus:!text-white hover:!text-white">Electrical</SelectItem>
                      <SelectItem value="PLUMBING" className="!text-white focus:!text-white hover:!text-white">Plumbing</SelectItem>
                      <SelectItem value="MECHANICAL" className="!text-white focus:!text-white hover:!text-white">Mechanical</SelectItem>
                      <SelectItem value="CLEANING" className="!text-white focus:!text-white hover:!text-white">Cleaning</SelectItem>
                      <SelectItem value="SECURITY" className="!text-white focus:!text-white hover:!text-white">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex space-x-2">
                  <Button
                    className="bg-black text-white border-1 margin-top-2"
                    onClick={handleCreateRequest}
                    disabled={!newRequest.title || !newRequest.description || !newRequest.category}
                  >
                    Submit Request
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreatingRequest(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Requests List */}
          <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
              <CardTitle className="text-base sm:text-lg font-bold text-black-900 dark:text-black">
                Your Requests ({tickets.length})
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-700 font-semibold">
                Track the status of your maintenance requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tickets.map((request) => (
                  <div
                    key={request.id}
                    className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 text-black font-bold">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {getStatusIcon(request.status)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{request.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-700 mt-1">{request.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-700">
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
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                            <Badge className={getPriorityColor(request.priority)}>
                              {request.priority}
                            </Badge>
                          </div>
                          {request.resolvedAt && (
                            <div className="text-xs text-green-600">
                              Resolved: {formatDate(request.resolvedAt)}
                            </div>
                          )}
                        </div>

                        <Button variant="outline" size="sm" onClick={() => handleViewRequest(request.id)}
                          className="bg-green-500 text-white border-1 margin-top-2 hover:bg-black-600"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
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
