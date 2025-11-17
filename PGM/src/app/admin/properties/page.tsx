'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Building2, Home, Users, MapPin } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Property {
  id: string;
  name: string;
  address: string;
  totalRooms: number;
  totalBeds: number;
  active: boolean;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    tenants: number;
    rooms: number;
  };
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const response = await apiClient.get<{ properties: Property[] }>('/properties', {
        params: { page: 1, limit: 100 },
      });
      if (response.success) {
        const data = Array.isArray(response.data)
          ? (response.data as Property[])
          : (response.data as { properties?: Property[] })?.properties || [];
        setProperties(data);
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(
    (property) =>
      property.name.toLowerCase().includes(search.toLowerCase()) ||
      property.address.toLowerCase().includes(search.toLowerCase()) ||
      property.owner.name.toLowerCase().includes(search.toLowerCase())
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
        <h1 className="text-2xl font-bold text-white">Properties</h1>
        <p className="text-gray-400 mt-1">View all properties in the system</p>
      </div>

      {/* Search */}
      <Card className="bg-[#1a1a1a] border-[#333333]">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search properties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#252525] border-[#333333] text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProperties.length === 0 ? (
          <Card className="bg-[#1a1a1a] border-[#333333] col-span-full">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">No properties found</p>
            </CardContent>
          </Card>
        ) : (
          filteredProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-[#1a1a1a] border-[#333333] hover:border-[#f5c518]/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{property.name}</h3>
                      <div className="flex items-start gap-2 text-sm text-gray-400">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{property.address}</span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        property.active
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {property.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-[#252525] rounded-lg">
                      <Home className="w-5 h-5 text-[#f5c518] mx-auto mb-1" />
                      <p className="text-xl font-bold text-white">{property.totalRooms}</p>
                      <p className="text-xs text-gray-400">Rooms</p>
                    </div>
                    <div className="text-center p-3 bg-[#252525] rounded-lg">
                      <Building2 className="w-5 h-5 text-[#f5c518] mx-auto mb-1" />
                      <p className="text-xl font-bold text-white">{property.totalBeds}</p>
                      <p className="text-xs text-gray-400">Beds</p>
                    </div>
                    <div className="text-center p-3 bg-[#252525] rounded-lg">
                      <Users className="w-5 h-5 text-[#f5c518] mx-auto mb-1" />
                      <p className="text-xl font-bold text-white">{property._count.tenants}</p>
                      <p className="text-xs text-gray-400">Tenants</p>
                    </div>
                  </div>

                  {/* Owner Info */}
                  <div className="pt-4 border-t border-[#333333]">
                    <p className="text-xs text-gray-500 mb-1">Owner</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{property.owner.name}</p>
                        <p className="text-xs text-gray-400">{property.owner.email}</p>
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

