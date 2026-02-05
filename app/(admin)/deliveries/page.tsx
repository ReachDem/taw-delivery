'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/badge';
import type { ParcelStatus } from '@/lib/types';
import { formatDate, formatTimeSlot } from '@/lib/utils';

interface Delivery {
  id: string;
  scheduled_date: string;
  status: string;
  delivery_address: string;
  delivery_fee: number;
  parcel: {
    id: string;
    code: string;
    recipient_name: string;
    recipient_phone: string;
    status: ParcelStatus;
    description: string;
  };
  driver: {
    id: string;
    full_name: string;
    phone: string;
  } | null;
  slot: {
    start_time: string;
    end_time: string;
  } | null;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'programmée', label: 'Programmée' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'terminée', label: 'Terminée' },
  { value: 'annulée', label: 'Annulée' },
];

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    async function fetchDeliveries() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.set('status', statusFilter);
        if (dateFilter) params.set('date', dateFilter);

        const res = await fetch(`/api/deliveries?${params.toString()}`);
        if (res.ok) {
          const { data } = await res.json();
          setDeliveries(data || []);
        }
      } catch (error) {
        console.error('Error fetching deliveries:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDeliveries();
  }, [statusFilter, dateFilter]);

  const updateDeliveryStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/deliveries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        // Refresh list
        setDeliveries((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status } : d))
        );
      }
    } catch (error) {
      console.error('Error updating delivery:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'programmée':
        return 'bg-blue-100 text-blue-800';
      case 'en_cours':
        return 'bg-yellow-100 text-yellow-800';
      case 'terminée':
        return 'bg-green-100 text-green-800';
      case 'annulée':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Livraisons</h1>
        <p className="text-gray-500">Gérez les livraisons programmées</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Deliveries List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          </Card>
        ) : deliveries.length === 0 ? (
          <Card className="p-8 text-center">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
              />
            </svg>
            <p className="text-gray-500">Aucune livraison pour cette date</p>
          </Card>
        ) : (
          deliveries.map((delivery) => (
            <Card key={delivery.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-lg">{delivery.parcel.code}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                      {delivery.status}
                    </span>
                    <StatusBadge status={delivery.parcel.status} />
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>Destinataire:</strong> {delivery.parcel.recipient_name} -{' '}
                      {delivery.parcel.recipient_phone}
                    </p>
                    <p>
                      <strong>Adresse:</strong> {delivery.delivery_address}
                    </p>
                    {delivery.slot && (
                      <p>
                        <strong>Créneau:</strong>{' '}
                        {formatTimeSlot(delivery.slot.start_time, delivery.slot.end_time)}
                      </p>
                    )}
                    {delivery.driver && (
                      <p>
                        <strong>Livreur:</strong> {delivery.driver.full_name} - {delivery.driver.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {delivery.status === 'programmée' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateDeliveryStatus(delivery.id, 'en_cours')}
                      >
                        Démarrer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateDeliveryStatus(delivery.id, 'annulée')}
                      >
                        Annuler
                      </Button>
                    </>
                  )}
                  {delivery.status === 'en_cours' && (
                    <Button
                      size="sm"
                      onClick={() => updateDeliveryStatus(delivery.id, 'terminée')}
                    >
                      Terminer
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
