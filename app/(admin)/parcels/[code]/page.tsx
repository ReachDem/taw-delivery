'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Parcel, ParcelStatus, STATUS_LABELS, STATUS_COLORS } from '@/lib/types';
import { formatDate, formatPhone } from '@/lib/utils';

interface TrackingEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

export default function ParcelDetailsPage() {
  const params = useParams();
  const code = params.code as string;
  
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchParcel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const fetchParcel = async () => {
    try {
      const response = await fetch(`/api/parcels/${code}`);
      if (response.ok) {
        const data = await response.json();
        setParcel(data.parcel);
        setEvents(data.events || []);
      } else {
        setError('Colis non trouvé');
      }
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleNotify = async () => {
    if (!parcel) return;
    
    setNotifying(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/notify/${code}`, {
        method: 'POST',
      });

      if (response.ok) {
        setSuccess('SMS envoyé avec succès');
        fetchParcel();
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de l\'envoi');
      }
    } catch {
      setError('Erreur lors de l\'envoi du SMS');
    } finally {
      setNotifying(false);
    }
  };

  const handleStatusChange = async (newStatus: ParcelStatus) => {
    if (!parcel) return;

    try {
      const response = await fetch(`/api/parcels/${code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchParcel();
        setSuccess('Statut mis à jour');
      } else {
        setError('Erreur lors de la mise à jour');
      }
    } catch {
      setError('Erreur lors de la mise à jour');
    }
  };

  const getEventLabel = (type: string) => {
    const labels: Record<string, string> = {
      'parcel_created': 'Colis enregistré',
      'status_changed': 'Statut modifié',
      'notification_sent': 'SMS envoyé',
      'confirmation_received': 'Confirmation reçue',
      'delivery_completed': 'Livraison terminée',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !parcel) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/parcels">
          <Button variant="outline">Retour à la liste</Button>
        </Link>
      </div>
    );
  }

  if (!parcel) return null;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/parcels" 
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            ← Retour aux colis
          </Link>
          <h1 className="text-2xl font-bold">Colis {parcel.code}</h1>
        </div>
        <Badge className={STATUS_COLORS[parcel.status]}>
          {STATUS_LABELS[parcel.status]}
        </Badge>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-4 text-green-700">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Informations du colis */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du colis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Code</p>
                <p className="font-medium">{parcel.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                <Badge className={STATUS_COLORS[parcel.status]}>
                  {STATUS_LABELS[parcel.status]}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Destinataire</p>
                <p className="font-medium">{parcel.recipient_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Téléphone</p>
                <p className="font-medium">{formatPhone(parcel.recipient_phone)}</p>
              </div>
              {parcel.description && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium">{parcel.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Date de création</p>
                <p className="font-medium">{formatDate(parcel.created_at)}</p>
              </div>
              {parcel.notified_at && (
                <div>
                  <p className="text-sm text-gray-500">Notifié le</p>
                  <p className="font-medium">{formatDate(parcel.notified_at)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bouton de notification */}
            {parcel.status === 'ARRIVÉ' && (
              <Button
                onClick={handleNotify}
                disabled={notifying}
                className="w-full"
              >
                {notifying ? 'Envoi en cours...' : 'Envoyer SMS de notification'}
              </Button>
            )}

            {/* Changement de statut */}
            <div>
              <p className="text-sm text-gray-500 mb-2">Changer le statut</p>
              <div className="grid grid-cols-2 gap-2">
                {parcel.status !== 'ARRIVÉ' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('ARRIVÉ')}
                  >
                    Arrivé
                  </Button>
                )}
                {parcel.status !== 'EN_ATTENTE' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('EN_ATTENTE')}
                  >
                    En attente
                  </Button>
                )}
                {parcel.status !== 'EN_LIVRAISON' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('EN_LIVRAISON')}
                  >
                    En livraison
                  </Button>
                )}
                {parcel.status !== 'RETIRÉ' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('RETIRÉ')}
                  >
                    Retiré
                  </Button>
                )}
                {parcel.status !== 'LIVRÉ' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('LIVRÉ')}
                  >
                    Livré
                  </Button>
                )}
              </div>
            </div>

            {/* Lien de confirmation */}
            <div>
              <p className="text-sm text-gray-500 mb-2">Lien de confirmation</p>
              <div className="p-3 bg-gray-50 rounded-md">
                <code className="text-sm break-all">
                  {typeof window !== 'undefined' 
                    ? `${window.location.origin}/c/${parcel.code}`
                    : `/c/${parcel.code}`
                  }
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historique des événements */}
      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Aucun événement enregistré
            </p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div 
                  key={event.id}
                  className="flex items-start gap-4 pb-4 border-b last:border-0"
                >
                  <div className="w-3 h-3 mt-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{getEventLabel(event.event_type)}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(event.created_at)}
                    </p>
                    {event.event_data && Object.keys(event.event_data).length > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        {JSON.stringify(event.event_data)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
