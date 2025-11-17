'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Phone, 
  Mail,
  Building2,
  Users,
  Home,
  DollarSign,
  Trash2,
  Edit,
  MoreVertical,
  AlertTriangle,
  Download,
  ChevronDown,
  ChevronRight,
  Bed,
  MapPin
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
  createdAt: string;
  ownerVerification?: {
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    documents: any[];
  };
  _count: {
    properties: number;
    ownedTenants: number;
  };
  properties?: {
    id: string;
    name: string;
    totalRooms: number;
    totalBeds: number;
    _count: {
      rooms: number;
      tenants: number;
    };
  }[];
  monthlyRevenue?: number;
  totalRooms?: number;
  occupiedRooms?: number;
  vacantRooms?: number;
}

export default function OwnersPage() {
  const router = useRouter();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedOwner, setExpandedOwner] = useState<string | null>(null);
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);

  useEffect(() => {
    loadOwners();
  }, [filter]);

  const loadOwners = async () => {
    try {
      let url = '/admin/owners?page=1&limit=100';
      if (filter !== 'ALL') {
        url += `&verificationStatus=${filter}`;
      }

      const response = await apiClient.get<{ owners: Owner[] }>(url);
      if (response.success && response.data) {
        setOwners(response.data.owners || []);
      }
    } catch (error) {
      console.error('Failed to load owners:', error);
      // Set empty array on error
      setOwners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOwner = async (ownerId: string, ownerName: string) => {
    if (deleteConfirm !== ownerId) {
      setDeleteConfirm(ownerId);
      return;
    }

    setDeleting(true);
    try {
      const response = await apiClient.delete(`/admin/owners/${ownerId}`);
      if (response.success) {
        toast.success(`Owner "${ownerName}" and all related data deleted successfully`);
        setOwners(owners.filter(o => o.id !== ownerId));
        setDeleteConfirm(null);
      } else {
        toast.error('Failed to delete owner');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete owner');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status?: 'PENDING' | 'VERIFIED' | 'REJECTED') => {
    if (!status) status = 'PENDING';
    
    const config = {
      PENDING: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: Clock },
      VERIFIED: { color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle },
      REJECTED: { color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle },
    };

    const { color, bg, icon: Icon } = config[status];

    return (
      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${color} ${bg}`}>
        <Icon className="w-4 h-4" />
        {status}
      </span>
    );
  };

  const filteredOwners = owners.filter((owner) =>
    owner.name.toLowerCase().includes(search.toLowerCase()) ||
    owner.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 bg-[#1a1a1a] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const calculateTotalRooms = (owner: Owner) => {
    if (!owner.properties) return 0;
    return owner.properties.reduce((sum, prop) => sum + (prop.totalRooms || 0), 0);
  };

  const calculateOccupiedRooms = (owner: Owner) => {
    if (!owner.properties) return 0;
    return owner.properties.reduce((sum, prop) => sum + (prop._count?.tenants || 0), 0);
  };

  const calculateVacantRooms = (owner: Owner) => {
    const total = calculateTotalRooms(owner);
    const occupied = calculateOccupiedRooms(owner);
    return total - occupied;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats Summary */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">Owners Management</h1>
          <p className="text-gray-400 mt-2">Complete overview and control of all property owners</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-[#1a1a1a] border border-[#333333] rounded-xl">
            <p className="text-xs text-gray-400">Total Owners</p>
            <p className="text-2xl font-bold text-[#f5c518]">{filteredOwners.length}</p>
          </div>
          <Button
            onClick={() => loadOwners()}
            variant="outline"
            className="border-[#333333] text-white hover:bg-[#252525]"
          >
            <Download className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-[#1a1a1a] border-[#333333]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#252525] border-[#333333] text-white"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map((status) => (
                <Button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  variant={filter === status ? 'default' : 'outline'}
                  className={
                    filter === status
                      ? 'bg-[#f5c518] text-[#0d0d0d] hover:bg-[#ffd000]'
                      : 'border-[#333333] text-white hover:bg-[#252525]'
                  }
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Owners Data Table */}
      <Card className="bg-[#1a1a1a] border-2 border-[#333333]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">All Owners</CardTitle>
              <CardDescription className="text-gray-400">
                Comprehensive view with properties, rooms, and revenue data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredOwners.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No owners found</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#252525] border-y border-[#333333]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Owner Details</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase">Properties</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase">Total Rooms</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase">Occupied</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase">Vacant</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase">Tenants</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase">Monthly Revenue</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333333]">
                  {filteredOwners.map((owner, index) => (
                    <React.Fragment key={owner.id}>
                      <motion.tr
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-[#252525] transition-colors group cursor-pointer"
                      >
                        {/* Owner Details - Clickable */}
                        <td 
                          className="px-6 py-4"
                          onClick={() => setExpandedOwner(expandedOwner === owner.id ? null : owner.id)}
                        >
                          <div className="flex items-start gap-3">
                            {/* Expand/Collapse Icon */}
                            <button className="mt-2">
                              {expandedOwner === owner.id ? (
                                <ChevronDown className="w-5 h-5 text-[#f5c518]" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                            
                            <div className="w-10 h-10 bg-gradient-to-br from-[#f5c518] to-[#ffd000] rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-[#0d0d0d] font-bold text-lg">
                                {owner.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-white group-hover:text-[#f5c518] transition-colors">
                                {owner.name}
                              </p>
                              <div className="flex flex-col gap-0.5 mt-1">
                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                  <Mail className="w-3 h-3" />
                                  {owner.email}
                                </div>
                                {owner.phone && (
                                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                    <Phone className="w-3 h-3" />
                                    {owner.phone}
                                    {owner.phoneVerified && (
                                      <CheckCircle className="w-3 h-3 text-green-500" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                      {/* Properties */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-400" />
                          <span className="text-lg font-bold text-white">{owner._count?.properties || 0}</span>
                        </div>
                      </td>

                      {/* Total Rooms */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Home className="w-4 h-4 text-cyan-400" />
                          <span className="text-lg font-bold text-white">{calculateTotalRooms(owner)}</span>
                        </div>
                      </td>

                      {/* Occupied Rooms */}
                      <td className="px-6 py-4 text-center">
                        <div className="px-3 py-1 bg-green-500/10 rounded-lg inline-block">
                          <span className="text-lg font-bold text-green-400">{calculateOccupiedRooms(owner)}</span>
                        </div>
                      </td>

                      {/* Vacant Rooms */}
                      <td className="px-6 py-4 text-center">
                        <div className="px-3 py-1 bg-red-500/10 rounded-lg inline-block">
                          <span className="text-lg font-bold text-red-400">{calculateVacantRooms(owner)}</span>
                        </div>
                      </td>

                      {/* Tenants */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Users className="w-4 h-4 text-green-400" />
                          <span className="text-lg font-bold text-white">{owner._count?.ownedTenants || 0}</span>
                        </div>
                      </td>

                      {/* Monthly Revenue */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <DollarSign className="w-4 h-4 text-[#f5c518]" />
                          <span className="text-lg font-bold text-[#f5c518]">
                            {formatCurrency(owner.monthlyRevenue || 0)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {getStatusBadge(owner.ownerVerification?.verificationStatus)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() => router.push(`/admin/owners/${owner.id}`)}
                            size="sm"
                            className="bg-[#f5c518] text-[#0d0d0d] hover:bg-[#ffd000]"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            onClick={() => handleDeleteOwner(owner.id, owner.name)}
                            size="sm"
                            variant="outline"
                            className={`${
                              deleteConfirm === owner.id
                                ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                                : 'border-[#333333] text-red-400 hover:bg-red-500/10 hover:border-red-500/50'
                            }`}
                            disabled={deleting}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            {deleteConfirm === owner.id ? 'Confirm?' : 'Delete'}
                          </Button>
                        </div>
                        {deleteConfirm === owner.id && (
                          <p className="text-xs text-red-400 text-center mt-2">
                            Click again to confirm deletion
                          </p>
                        )}
                      </td>
                    </motion.tr>

                    {/* Expanded Properties Section */}
                    {expandedOwner === owner.id && owner.properties && owner.properties.length > 0 && (
                      <tr>
                        <td colSpan={9} className="px-0 py-0 bg-[#0d0d0d]/50">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="p-6"
                          >
                            <div className="bg-[#252525] rounded-xl p-6 border-2 border-[#f5c518]/30">
                              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-[#f5c518]" />
                                Properties of {owner.name}
                              </h3>
                              
                              <div className="space-y-3">
                                {owner.properties.map((property) => (
                                  <div key={property.id}>
                                    {/* Property Row */}
                                    <div
                                      onClick={() => setExpandedProperty(expandedProperty === property.id ? null : property.id)}
                                      className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg hover:bg-[#1f1f1f] cursor-pointer border border-[#333333] hover:border-[#f5c518]/50 transition-all"
                                    >
                                      <div className="flex items-center gap-3">
                                        {expandedProperty === property.id ? (
                                          <ChevronDown className="w-5 h-5 text-[#f5c518]" />
                                        ) : (
                                          <ChevronRight className="w-5 h-5 text-gray-400" />
                                        )}
                                        <Building2 className="w-5 h-5 text-purple-400" />
                                        <div>
                                          <p className="font-semibold text-white">{property.name}</p>
                                          <p className="text-xs text-gray-400">Click to view rooms</p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-6">
                                        <div className="text-center">
                                          <p className="text-xs text-gray-400">Total Rooms</p>
                                          <p className="text-lg font-bold text-white">{property.totalRooms || 0}</p>
                                        </div>
                                        <div className="text-center">
                                          <p className="text-xs text-gray-400">Total Beds</p>
                                          <p className="text-lg font-bold text-cyan-400">{property.totalBeds || 0}</p>
                                        </div>
                                        <div className="text-center">
                                          <p className="text-xs text-gray-400">Tenants</p>
                                          <p className="text-lg font-bold text-green-400">{property._count?.tenants || 0}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Expanded Rooms Section */}
                                    {expandedProperty === property.id && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="ml-12 mt-3 p-4 bg-[#1a1a1a]/50 rounded-lg border border-[#f5c518]/20"
                                      >
                                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                          <Home className="w-4 h-4 text-cyan-400" />
                                          Rooms in {property.name}
                                        </h4>
                                        
                                        {/* Rooms Table */}
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-sm">
                                            <thead className="bg-[#252525]/50 border-b border-[#333333]">
                                              <tr>
                                                <th className="px-4 py-2 text-left text-xs text-gray-400">Room Number</th>
                                                <th className="px-4 py-2 text-center text-xs text-gray-400">Type</th>
                                                <th className="px-4 py-2 text-center text-xs text-gray-400">Total Beds</th>
                                                <th className="px-4 py-2 text-center text-xs text-gray-400">Occupied</th>
                                                <th className="px-4 py-2 text-center text-xs text-gray-400">Available</th>
                                                <th className="px-4 py-2 text-right text-xs text-gray-400">Rent/Month</th>
                                                <th className="px-4 py-2 text-center text-xs text-gray-400">Status</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#333333]/50">
                                              {/* Mock room data - replace with API call */}
                                              {[...Array(property.totalRooms || 3)].map((_, idx) => (
                                                <tr key={idx} className="hover:bg-[#252525]/50">
                                                  <td className="px-4 py-3 text-white font-medium">
                                                    Room {idx + 101}
                                                  </td>
                                                  <td className="px-4 py-3 text-center text-gray-300">
                                                    {idx % 2 === 0 ? 'Single' : 'Double'}
                                                  </td>
                                                  <td className="px-4 py-3 text-center text-white font-semibold">
                                                    {idx % 2 === 0 ? '1' : '2'}
                                                  </td>
                                                  <td className="px-4 py-3 text-center">
                                                    <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded">
                                                      {idx % 2 === 0 ? '1' : '2'}
                                                    </span>
                                                  </td>
                                                  <td className="px-4 py-3 text-center">
                                                    <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded">
                                                      0
                                                    </span>
                                                  </td>
                                                  <td className="px-4 py-3 text-right text-[#f5c518] font-semibold">
                                                    ₹{idx % 2 === 0 ? '12,000' : '15,000'}
                                                  </td>
                                                  <td className="px-4 py-3 text-center">
                                                    <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">
                                                      Active
                                                    </span>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </motion.div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

