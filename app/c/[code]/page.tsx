'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/badge';
import type { ParcelStatus } from '@/lib/types';
import { formatDate, formatCurrency, getNextDays, DAYS_OF_WEEK } from '@/lib/utils';

interface ParcelData {
  id: string;
  code: string;
  description: string | null;
  recipient_name: string;
  status: ParcelStatus;
  created_at: string;
  can_confirm: boolean;
  agency: {
    id: string;
    name: string;
    city: string;
    address: string;
    phone: string;
  };
  confirmation: {
    choice: string;
    confirmed_at: string;
  } | null;
  delivery_zones: Array<{
    id: string;
    zone_name: string;
    delivery_fee: number;
  }> | null;
  delivery_slots: Array<{
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }> | null;
}

export default function ConfirmationPage() {
  const params = useParams();
  const code = params.code as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [parcel, setParcel] = useState<ParcelData | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [choice, setChoice] = useState<'retrait' | 'livraison' | ''>('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [slotId, setSlotId] = useState('');
  const [preferredDate, setPreferredDate] = useState('');

  useEffect(() => {
    async function fetchParcel() {
      try {
        const res = await fetch(`/api/confirm/${code}`);
        if (!res.ok) {
          throw new Error('Colis non trouvé');
        }
        const { data } = await res.json();
        setParcel(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchParcel();
  }, [code]);

  const selectedZone = parcel?.delivery_zones?.find((z) => z.id === zoneId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!choice) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/confirm/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choice,
          delivery_address: deliveryAddress || undefined,
          zone_id: zoneId || undefined,
          slot_id: slotId || undefined,
          preferred_date: preferredDate || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la confirmation');
      }

      setSuccess(data.message);
      // Refresh parcel data
      const refreshRes = await fetch(`/api/confirm/${code}`);
      if (refreshRes.ok) {
        const { data: refreshedParcel } = await refreshRes.json();
        setParcel(refreshedParcel);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !parcel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <svg
              className="w-16 h-16 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Colis non trouvé</h1>
            <p className="text-gray-500">
              Le colis avec le code <strong>{code}</strong> n&apos;existe pas ou n&apos;est plus disponible.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableDates = getNextDays(7).map((date) => ({
    value: date.toISOString().split('T')[0],
    label: `${DAYS_OF_WEEK[date.getDay()]} ${formatDate(date)}`,
    dayOfWeek: date.getDay(),
  }));

  const availableSlots =
    parcel?.delivery_slots?.filter((slot) => {
      if (!preferredDate) return true;
      const selectedDay = availableDates.find((d) => d.value === preferredDate)?.dayOfWeek;
      return slot.day_of_week === selectedDay;
    }) || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Confirmation de réception</h1>
          <p className="text-gray-500 mt-1">Votre colis est arrivé!</p>
        </div>

        {/* Parcel Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du colis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Code</span>
              <span className="font-mono font-bold">{parcel?.code}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Destinataire</span>
              <span className="font-medium">{parcel?.recipient_name}</span>
            </div>
            {parcel?.description && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Description</span>
                <span>{parcel.description}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Statut</span>
              <StatusBadge status={parcel?.status as ParcelStatus} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Agence</span>
              <span>{parcel?.agency?.name}</span>
            </div>
            {parcel?.agency?.address && (
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-500">Adresse de l&apos;agence:</p>
                <p className="text-sm">{parcel.agency.address}</p>
                {parcel.agency.phone && (
                  <p className="text-sm text-blue-600">{parcel.agency.phone}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Already confirmed */}
        {parcel?.confirmation && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6 text-center">
              <svg
                className="w-12 h-12 text-green-600 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-lg font-bold text-green-800">Déjà confirmé</h2>
              <p className="text-green-600 mt-1">
                Vous avez choisi:{' '}
                <strong>
                  {parcel.confirmation.choice === 'retrait' ? 'Retrait en agence' : 'Livraison à domicile'}
                </strong>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Success message */}
        {success && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6 text-center">
              <svg
                className="w-12 h-12 text-green-600 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-green-800">{success}</p>
            </CardContent>
          </Card>
        )}

        {/* Confirmation Form */}
        {parcel?.can_confirm && !success && (
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Comment souhaitez-vous récupérer votre colis?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Choice */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setChoice('retrait')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      choice === 'retrait'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <svg
                      className={`w-8 h-8 mx-auto mb-2 ${
                        choice === 'retrait' ? 'text-blue-600' : 'text-gray-400'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span className={choice === 'retrait' ? 'font-medium text-blue-600' : 'text-gray-600'}>
                      Retrait en agence
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChoice('livraison')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      choice === 'livraison'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <svg
                      className={`w-8 h-8 mx-auto mb-2 ${
                        choice === 'livraison' ? 'text-blue-600' : 'text-gray-400'
                      }`}
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
                    <span className={choice === 'livraison' ? 'font-medium text-blue-600' : 'text-gray-600'}>
                      Livraison à domicile
                    </span>
                  </button>
                </div>

                {/* Delivery Options */}
                {choice === 'livraison' && (
                  <div className="space-y-4 pt-4 border-t">
                    <Input
                      label="Adresse de livraison *"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Votre adresse complète"
                      required
                    />

                    {parcel.delivery_zones && parcel.delivery_zones.length > 0 && (
                      <Select
                        label="Zone de livraison"
                        options={parcel.delivery_zones.map((zone) => ({
                          value: zone.id,
                          label: `${zone.zone_name} - ${formatCurrency(zone.delivery_fee)}`,
                        }))}
                        value={zoneId}
                        onChange={(e) => setZoneId(e.target.value)}
                        placeholder="Sélectionnez une zone"
                      />
                    )}

                    <Select
                      label="Date souhaitée"
                      options={availableDates}
                      value={preferredDate}
                      onChange={(e) => {
                        setPreferredDate(e.target.value);
                        setSlotId(''); // Reset slot when date changes
                      }}
                      placeholder="Sélectionnez une date"
                    />

                    {preferredDate && availableSlots.length > 0 && (
                      <Select
                        label="Créneau horaire"
                        options={availableSlots.map((slot) => ({
                          value: slot.id,
                          label: `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`,
                        }))}
                        value={slotId}
                        onChange={(e) => setSlotId(e.target.value)}
                        placeholder="Sélectionnez un créneau"
                      />
                    )}

                    {selectedZone && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          Frais de livraison:{' '}
                          <strong>{formatCurrency(selectedZone.delivery_fee)}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!choice || (choice === 'livraison' && !deliveryAddress)}
                  isLoading={submitting}
                >
                  Confirmer mon choix
                </Button>
              </CardContent>
            </Card>
          </form>
        )}
      </div>
    </div>
  );
}
