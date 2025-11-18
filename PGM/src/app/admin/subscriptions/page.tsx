'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Edit,
  Calendar,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Users,
  Building2,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

interface Subscription {
  id: string;
  ownerId: string;
  packageName: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';
  startDate: string;
  endDate?: string;
  price: number;
  billingCycle: 'MONTHLY' | 'BI_MONTHLY' | 'QUARTERLY';
  autoRenew: boolean;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    _count: {
      properties: number;
      ownedTenants: number;
    };
  };
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED'>('ALL');
  const [packageFilter, setPackageFilter] = useState<'ALL' | 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE'>('ALL');
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, [statusFilter, packageFilter]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const params: any = { page: 1, limit: 100 };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      if (packageFilter !== 'ALL') {
        params.package = packageFilter;
      }

      const response = await apiClient.get<{ subscriptions: Subscription[] }>('/admin/subscriptions', { params });
      if (response.success && response.data) {
        setSubscriptions(response.data.subscriptions || []);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      toast.error('Failed to load subscriptions');
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (data: any) => {
    if (!editingSubscription) return;

    try {
      const response = await apiClient.put(`/admin/subscriptions/${editingSubscription.ownerId}`, data);
      if (response.success) {
        toast.success('Subscription updated successfully');
        setShowEditModal(false);
        setEditingSubscription(null);
        loadSubscriptions();
      } else {
        toast.error('Failed to update subscription');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update subscription');
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      ACTIVE: { color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle },
      EXPIRED: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: Clock },
      CANCELLED: { color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle },
      SUSPENDED: { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: AlertTriangle },
    };

    const { color, bg, icon: Icon } = config[status as keyof typeof config] || config.ACTIVE;

    return (
      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${color} ${bg}`}>
        <Icon className="w-4 h-4" />
        {status}
      </span>
    );
  };

  const getPackageBadge = (packageName: string) => {
    const config = {
      BASIC: { color: 'text-gray-400', bg: 'bg-gray-500/10' },
      STANDARD: { color: 'text-blue-400', bg: 'bg-blue-500/10' },
      PREMIUM: { color: 'text-purple-400', bg: 'bg-purple-500/10' },
      ENTERPRISE: { color: 'text-[#f5c518]', bg: 'bg-[#f5c518]/10' },
    };

    const { color, bg } = config[packageName as keyof typeof config] || config.BASIC;

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${color} ${bg}`}>
        {packageName}
      </span>
    );
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.owner.name.toLowerCase().includes(search.toLowerCase()) ||
      sub.owner.email.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.status === 'ACTIVE').length,
    expired: subscriptions.filter((s) => s.status === 'EXPIRED').length,
    cancelled: subscriptions.filter((s) => s.status === 'CANCELLED').length,
    totalRevenue: subscriptions.reduce((sum, s) => sum + Number(s.price || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#f5c518] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-[#f5c518]" />
            Owner Subscriptions
          </h1>
          <p className="text-gray-400 mt-2">
            Manage and monitor all owner subscription packages
          </p>
        </div>
        <Button
          onClick={loadSubscriptions}
          variant="outline"
          className="border-[#f5c518] text-[#f5c518] hover:bg-[#f5c518]/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-[#1a1a1a] via-[#1f1f1f] to-[#1a1a1a] border-2 border-[#333333]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Subscriptions</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-[#f5c518]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1a1a1a] via-[#1f1f1f] to-[#1a1a1a] border-2 border-[#333333]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1a1a1a] via-[#1f1f1f] to-[#1a1a1a] border-2 border-[#333333]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Expired</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.expired}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1a1a1a] via-[#1f1f1f] to-[#1a1a1a] border-2 border-[#333333]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Cancelled</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{stats.cancelled}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1a1a1a] via-[#1f1f1f] to-[#1a1a1a] border-2 border-[#333333]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-[#f5c518] mt-1">
                  ₹{stats.totalRevenue.toLocaleString('en-IN')}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#f5c518]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-[#1a1a1a] via-[#1f1f1f] to-[#1a1a1a] border-2 border-[#333333]">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">Search Owner</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-[#0d0d0d] border-[#333333] text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 bg-[#0d0d0d] border border-[#333333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">Package</label>
              <select
                value={packageFilter}
                onChange={(e) => setPackageFilter(e.target.value as any)}
                className="w-full px-4 py-2 bg-[#0d0d0d] border border-[#333333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
              >
                <option value="ALL">All Packages</option>
                <option value="BASIC">Basic</option>
                <option value="STANDARD">Standard</option>
                <option value="PREMIUM">Premium</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card className="bg-gradient-to-br from-[#1a1a1a] via-[#1f1f1f] to-[#1a1a1a] border-2 border-[#333333]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-[#f5c518]" />
            All Subscriptions
          </CardTitle>
          <CardDescription className="text-gray-400">
            Showing {filteredSubscriptions.length} subscription{filteredSubscriptions.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSubscriptions.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No subscriptions found</p>
              <p className="text-gray-500 text-sm mt-2">
                {search || statusFilter !== 'ALL' || packageFilter !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'No subscriptions have been created yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#333333]">
                <thead className="bg-[#252525]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Package
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Billing Cycle
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Auto Renew
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333333] bg-[#1a1a1a]">
                  {filteredSubscriptions.map((subscription) => (
                    <motion.tr
                      key={subscription.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-[#252525] transition-colors"
                    >
                      {/* Owner */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#f5c518] to-[#e6b800] rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-bold text-[#0d0d0d]">
                              {subscription.owner.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{subscription.owner.name}</p>
                            <p className="text-xs text-gray-400">{subscription.owner.email}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {subscription.owner._count.properties} properties
                              </span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {subscription.owner._count.ownedTenants} tenants
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Package */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPackageBadge(subscription.packageName)}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(subscription.status)}
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-[#f5c518]">
                          ₹{Number(subscription.price).toLocaleString('en-IN')}
                        </span>
                        <p className="text-xs text-gray-400">
                          /{subscription.billingCycle.toLowerCase()}
                        </p>
                      </td>

                      {/* Billing Cycle */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-300 capitalize">
                          {subscription.billingCycle.toLowerCase().replace('_', '-')}
                        </span>
                      </td>

                      {/* Auto Renew */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {subscription.autoRenew ? (
                          <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">
                            Yes
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded-full">
                            No
                          </span>
                        )}
                      </td>

                      {/* Start Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {new Date(subscription.startDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* End Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {subscription.endDate ? (
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            {new Date(subscription.endDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No end date</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingSubscription(subscription);
                            setShowEditModal(true);
                          }}
                          className="text-[#f5c518] hover:bg-[#f5c518]/10"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {showEditModal && editingSubscription && (
        <EditSubscriptionModal
          subscription={editingSubscription}
          onClose={() => {
            setShowEditModal(false);
            setEditingSubscription(null);
          }}
          onSave={handleUpdateSubscription}
        />
      )}
    </div>
  );
}

interface EditSubscriptionModalProps {
  subscription: Subscription;
  onClose: () => void;
  onSave: (data: any) => void;
}

function EditSubscriptionModal({ subscription, onClose, onSave }: EditSubscriptionModalProps) {
  const [formData, setFormData] = useState({
    packageName: subscription.packageName,
    status: subscription.status,
    price: Number(subscription.price),
    billingCycle: subscription.billingCycle,
    autoRenew: subscription.autoRenew,
    endDate: subscription.endDate ? new Date(subscription.endDate).toISOString().split('T')[0] : '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      endDate: formData.endDate || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1a1a1a] rounded-lg border-2 border-[#333333] max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-[#333333]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit className="w-5 h-5 text-[#f5c518]" />
            Edit Subscription
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {subscription.owner.name} - {subscription.owner.email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Package</label>
              <select
                value={formData.packageName}
                onChange={(e) => setFormData({ ...formData, packageName: e.target.value as any })}
                className="w-full px-4 py-2 bg-[#0d0d0d] border border-[#333333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
                required
              >
                <option value="BASIC">Basic</option>
                <option value="STANDARD">Standard</option>
                <option value="PREMIUM">Premium</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 bg-[#0d0d0d] border border-[#333333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
                required
              >
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Price (₹)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="bg-[#0d0d0d] border-[#333333] text-white"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Billing Cycle</label>
              <select
                value={formData.billingCycle}
                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as any })}
                className="w-full px-4 py-2 bg-[#0d0d0d] border border-[#333333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
                required
              >
                <option value="MONTHLY">Monthly</option>
                <option value="BI_MONTHLY">Bi-Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">End Date</label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="bg-[#0d0d0d] border-[#333333] text-white"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="autoRenew"
                checked={formData.autoRenew}
                onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
                className="w-4 h-4 text-[#f5c518] bg-[#0d0d0d] border-[#333333] rounded focus:ring-[#f5c518]"
              />
              <label htmlFor="autoRenew" className="text-sm font-medium text-gray-300">
                Auto Renew
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#333333]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[#333333] text-gray-300 hover:bg-[#252525]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#f5c518] text-[#0d0d0d] hover:bg-[#e6b800] font-semibold"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

