'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, User, Activity } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await apiClient.get('/admin/audit-logs', {
        params: { page: 1, limit: 100 },
      });
      if (response.success) {
        setLogs(response.data.logs || []);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'text-green-500';
    if (action.includes('UPDATE')) return 'text-blue-500';
    if (action.includes('DELETE')) return 'text-red-500';
    if (action.includes('LOGIN')) return 'text-purple-500';
    if (action.includes('VERIFY')) return 'text-yellow-500';
    return 'text-gray-400';
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.user?.name && log.user.name.toLowerCase().includes(search.toLowerCase())) ||
      log.resourceType.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-24 bg-[#1a1a1a] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-gray-400 mt-1">View all system activities and user actions</p>
      </div>

      {/* Search */}
      <Card className="bg-[#1a1a1a] border-[#333333]">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search logs by action, user, or resource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#252525] border-[#333333] text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <Card className="bg-[#1a1a1a] border-[#333333]">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">No logs found</p>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <Card className="bg-[#1a1a1a] border-[#333333] hover:border-[#f5c518]/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Activity className={`w-5 h-5 ${getActionColor(log.action)}`} />
                        <span className={`font-semibold ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-sm text-gray-400">{log.resourceType}</span>
                        {log.resourceId && (
                          <>
                            <span className="text-gray-500">•</span>
                            <span className="text-xs text-gray-500 font-mono">{log.resourceId}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{log.user?.name || 'System'}</span>
                          {log.user?.role && (
                            <span className="px-2 py-0.5 bg-[#252525] rounded text-xs">
                              {log.user.role}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>

                        {log.ipAddress && (
                          <span className="text-xs text-gray-500">IP: {log.ipAddress}</span>
                        )}
                      </div>

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-[#f5c518] cursor-pointer hover:underline">
                            View metadata
                          </summary>
                          <pre className="mt-2 p-2 bg-[#0d0d0d] rounded text-xs text-gray-400 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
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

