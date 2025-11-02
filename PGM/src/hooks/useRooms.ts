'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';

export interface Room {
  id: string;
  propertyId: string;
  name: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  occupied: number;
  rentPerBed: number;
  sharingType?: string;
  createdAt?: string;
  updatedAt?: string;
  beds?: any[];
}

interface UseRoomsReturn {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  fetchRooms: (propertyId?: string) => Promise<void>;
  createRoom: (data: Partial<Room>) => Promise<Room | null>;
  updateRoom: (id: string, data: Partial<Room>) => Promise<Room | null>;
  deleteRoom: (id: string) => Promise<boolean>;
  getRoomById: (id: string) => Promise<Room | null>;
  fixMissingBeds: () => Promise<any>;
}

// ✅ GLOBAL CACHE - Survives component re-renders
const ROOMS_CACHE = new Map<string, Room[]>();
const FETCHING = new Set<string>();

export const useRooms = (): UseRoomsReturn => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async (propertyId?: string) => {
    if (!propertyId) {
      console.warn('⚠️ [useRooms] fetchRooms: propertyId is required');
      setRooms([]);
      return;
    }

    // ✅ Check cache first
    if (ROOMS_CACHE.has(propertyId)) {
      console.log('✅ [useRooms] Found rooms in cache for property:', propertyId);
      const cachedRooms = ROOMS_CACHE.get(propertyId)!;
      setRooms(cachedRooms);
      return;
    }

    // ✅ Skip if already fetching this property
    if (FETCHING.has(propertyId)) {
      console.log('⏳ [useRooms] Already fetching rooms for property:', propertyId);
      return;
    }

    FETCHING.add(propertyId);
    setLoading(true);
    setError(null);
    try {
      const url = `/rooms/property/${propertyId}`;
      console.log('🔄 [useRooms] Fetching rooms from:', url);
      const response = await apiClient.get(url);
      console.log('📥 [useRooms] Rooms response:', response);
      
      if (response.success && Array.isArray(response.data)) {
        const roomsData = response.data as Room[];
        
        // ✅ Store in cache
        ROOMS_CACHE.set(propertyId, roomsData);
        console.log('💾 [useRooms] Cached rooms for property:', propertyId, 'count:', roomsData.length);
        
        setRooms(roomsData);
        console.log('✅ [useRooms] Rooms set:', roomsData.length);
      } else {
        setRooms([]);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch rooms';
      console.error('❌ [useRooms] Fetch rooms error:', errorMsg, err);
      setError(errorMsg);
      setRooms([]);
    } finally {
      setLoading(false);
      FETCHING.delete(propertyId);  // ✅ Mark as done
    }
  }, []);

  const createRoom = useCallback(async (data: Partial<Room>): Promise<Room | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post('/rooms', data);
      if (response.success) {
        const newRoom = response.data as Room;
        setRooms((prev: Room[]) => [...prev, newRoom]);
        // ✅ Update cache after creating room
        if (newRoom.propertyId && ROOMS_CACHE.has(newRoom.propertyId)) {
          const cached = ROOMS_CACHE.get(newRoom.propertyId)!;
          ROOMS_CACHE.set(newRoom.propertyId, [...cached, newRoom]);
        }
        return newRoom;
      }
      return null;
    } catch (err: any) {
      const message = err.message || 'Failed to create room';
      setError(message);
      console.error('❌ [useRooms] Error creating room:', message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ NEW: Fix missing beds for existing rooms
  const fixMissingBeds = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔧 [useRooms] Calling fixMissingBeds endpoint...');
      const response = await apiClient.post('/rooms/fix-beds');
      if (response.success) {
        console.log('✅ [useRooms] Fixed missing beds:', response.data);
        // ✅ Clear cache AND reset rooms to force fresh fetch
        ROOMS_CACHE.clear();
        setRooms([]); // Reset rooms so they'll be refetched
        FETCHING.clear(); // Also clear fetching set
        console.log('🔄 [useRooms] Cache cleared, rooms reset for refresh');
        return response.data;
      }
    } catch (err: any) {
      const message = err.message || 'Failed to fix missing beds';
      console.error('❌ [useRooms] Error fixing beds:', message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRoom = useCallback(async (id: string, data: Partial<Room>): Promise<Room | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.put(`/rooms/${id}`, data);
      if (response.success && response.data) {
        const updatedRoom = response.data as Room;
        setRooms((prev: Room[]) => prev.map(r => (r.id === id ? updatedRoom : r)));
        return updatedRoom;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to update room');
      console.error('Error updating room:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRoom = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.delete(`/rooms/${id}`);
      if (response.success) {
        setRooms((prev: Room[]) => prev.filter(r => r.id !== id));
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || 'Failed to delete room');
      console.error('Error deleting room:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRoomById = useCallback(async (id: string): Promise<Room | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/rooms/${id}`);
      if (response.success && response.data) {
        return response.data as Room;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch room');
      console.error('Error fetching room:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Don't fetch on mount - propertyId is not available yet
  useEffect(() => {
    // Rooms will be fetched when property is selected
  }, []);

  return {
    rooms,
    loading,
    error,
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    getRoomById,
    fixMissingBeds,
  };
};
