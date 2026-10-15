'use client';

import React, { useState, useEffect } from 'react';
import { BedDouble, Plus, Edit2, Trash2, ShieldAlert, Sparkles } from 'lucide-react';
import { Modal } from '@/components/modal';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toast } from 'sonner';

interface Room {
  room_id: number;
  room_number: string;
  room_type: 'General' | 'Private' | 'ICU';
  capacity: number;
  occupied: number;
  daily_charge: number;
  available: number;
  occupancy_percentage: number;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filterType, setFilterType] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: 'General' as 'General' | 'Private' | 'ICU',
    capacity: '2',
    daily_charge: '1500',
  });

  // Delete State
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/rooms');
      if (!res.ok) throw new Error('Failed to load rooms');
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch (err: any) {
      toast.error(err.message || 'Error loading rooms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setFormData({
      room_number: '',
      room_type: 'General',
      capacity: '2',
      daily_charge: '1500',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      room_number: room.room_number,
      room_type: room.room_type,
      capacity: String(room.capacity),
      daily_charge: String(room.daily_charge),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRoom ? `/api/rooms/${editingRoom.room_id}` : '/api/rooms';
      const method = editingRoom ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save room');

      toast.success(editingRoom ? 'Room updated' : 'Room created successfully');
      setIsModalOpen(false);
      fetchRooms();
    } catch (err: any) {
      toast.error(err.message || 'Error submitting room');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/rooms/${deleteId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete room');

      toast.success('Room deleted successfully');
      setDeleteId(null);
      fetchRooms();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete room');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRooms = filterType === 'All'
    ? rooms
    : rooms.filter((r) => r.room_type === filterType);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            Hospital Bed Capacity & Rooms
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Occupancy values are maintained automatically by MySQL triggers <code className="text-emerald-500 font-mono">after_admission</code> and <code className="text-emerald-500 font-mono">after_discharge</code>.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-green-btn text-xs font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Room</span>
        </button>
      </div>

      {/* Filter Tabs & Summary Alert */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['All', 'General', 'Private', 'ICU'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterType === t
                  ? 'gradient-sidebar-active'
                  : 'bg-white dark:bg-[#0a130e] border border-gray-200 dark:border-emerald-950/60 text-gray-600 dark:text-gray-300 hover:bg-emerald-50/50'
              }`}
            >
              {t} {t !== 'All' ? `(${rooms.filter((r) => r.room_type === t).length})` : `(${rooms.length})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>Full rooms reject admissions automatically via SQLSTATE 45000</span>
        </div>
      </div>

      {/* Room Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl bg-gray-200 dark:bg-emerald-950/30" />
          ))}
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="p-12 text-center bg-gray-50 dark:bg-[#0a130e] rounded-2xl border border-dashed border-gray-300 dark:border-emerald-950/60">
          <BedDouble className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No rooms in this category</h3>
          <p className="text-xs text-gray-400 mt-1">Change your filter or add a new room.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => {
            const isFull = room.occupied >= room.capacity;
            const occupancyPct = Math.min(100, Math.round((room.occupied / room.capacity) * 100));

            return (
              <div
                key={room.room_id}
                className={`rounded-2xl border bg-white dark:bg-[#0a130e] p-6 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                  isFull
                    ? 'border-rose-400/30 dark:border-rose-900/40'
                    : 'border-emerald-500/20 hover:border-emerald-500/40'
                }`}
              >
                <div>
                  {/* Top: Room Number & Type badge */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                          Room {room.room_number}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            room.room_type === 'ICU'
                              ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'
                              : room.room_type === 'Private'
                              ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          {room.room_type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        Daily Charge: ${Number(room.daily_charge).toFixed(2)}/day
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(room)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(room.room_id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Occupancy Indicator Bar */}
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <BedDouble className="w-3.5 h-3.5 text-emerald-500" />
                        Bed Occupancy
                      </span>
                      <span
                        className={`font-bold ${
                          isFull
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {room.occupied} / {room.capacity} ({occupancyPct}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-3 w-full bg-gray-100 dark:bg-emerald-950/50 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull
                            ? 'bg-gradient-to-r from-rose-500 to-rose-600'
                            : room.occupied > 0
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                            : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom status badge */}
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-emerald-950/40 flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Availability:</span>
                  {isFull ? (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      FULL (0 Beds Free)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold">
                      {room.available} {room.available === 1 ? 'Bed' : 'Beds'} Available
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Room Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Add New Hospital Room'}
        description="Room number must be unique. Capacity must be at least 1."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Room Number *
              </label>
              <input
                type="text"
                required
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                placeholder="e.g. G102, P202, I302"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Room Type *
              </label>
              <select
                required
                value={formData.room_type}
                onChange={(e) => setFormData({ ...formData, room_type: e.target.value as any })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="General">General</option>
                <option value="Private">Private</option>
                <option value="ICU">ICU</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Bed Capacity * (Check &gt; 0)
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Daily Charge ($) *
              </label>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={formData.daily_charge}
                onChange={(e) => setFormData({ ...formData, daily_charge: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-emerald-950/40">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-emerald-950/40 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 gradient-green-btn text-sm font-semibold rounded-lg shadow-xs"
            >
              Save Room
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Room"
        message="Are you sure you want to delete this room? If this room has recorded admissions, foreign key constraints will block deletion."
        confirmText="Confirm Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
