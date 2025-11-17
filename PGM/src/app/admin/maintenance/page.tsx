'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MaintenanceTicket {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  gotItByOwner: boolean;
  tenant: { name: string; email: string };
  property: { name: string; address: string };
  owner: { name: string };
}

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');

  useEffect(() => {
    loadTickets();
  }, [filter]);

  const loadTickets = async () => {
    try {
      const params: any = { page: 1, limit: 100 };
      if (filter !== 'ALL') {
        params.status = filter;
      }

      const response = await apiClient.get('/maintenance', { params });
      if (response.success) {
        setTickets(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const config: any = {
      LOW: { color: 'text-blue-500', bg: 'bg-blue-500/10' },
      MEDIUM: { color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
      HIGH: { color: 'text-red-500', bg: 'bg-red-500/10' },
    };
    const { color, bg } = config[priority] || config.LOW;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${color} ${bg}`}>
        {priority}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const config: any = {
      PENDING: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: Clock },
      IN_PROGRESS: { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: AlertTriangle },
      RESOLVED: { color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle },
      CLOSED: { color: 'text-gray-500', bg: 'bg-gray-500/10', icon: CheckCircle },
    };
    const { color, bg, icon: Icon } = config[status] || config.PENDING;
    return (
      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${color} ${bg}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const filteredTickets = tickets.filter((ticket) =>
    ticket.title.toLowerCase().includes(search.toLowerCase()) ||
    ticket.property.name.toLowerCase().includes(search.toLowerCase())
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Maintenance Requests</h1>
        <p className="text-gray-400 mt-1">View all maintenance tickets across properties</p>
      </div>

      {/* Filters */}
      <Card className="bg-[#1a1a1a] border-[#333333]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#252525] border-[#333333] text-white"
              />
            </div>

            <div className="flex gap-2">
              {['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED'].map((status) => (
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
                  {status.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card className="bg-[#1a1a1a] border-[#333333]">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">No tickets found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket, index) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-[#1a1a1a] border-[#333333] hover:border-[#f5c518]/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">{ticket.title}</h3>
                          <p className="text-sm text-gray-400 line-clamp-2">{ticket.description}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {getPriorityBadge(ticket.priority)}
                          {getStatusBadge(ticket.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500">Property</p>
                          <p className="text-sm text-white">{ticket.property.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Tenant</p>
                          <p className="text-sm text-white">{ticket.tenant.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Owner</p>
                          <p className="text-sm text-white">{ticket.owner.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs text-gray-500">
                          Created {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                        {ticket.gotItByOwner && (
                          <span className="flex items-center gap-1 text-xs text-green-500">
                            <CheckCircle className="w-3 h-3" />
                            Owner Acknowledged
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

