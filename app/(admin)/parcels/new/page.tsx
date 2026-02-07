'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function NewParcelForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromScan = searchParams.get('code') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sendSMS, setSendSMS] = useState(true);

  const [formData, setFormData] = useState({
    code: codeFromScan,
    recipient_name: '',
    recipient_phone: '',
    recipient_email: '',
    recipient_address: '',
    sender_name: '',
    sender_phone: '',
    description: '',
    weight: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create parcel
      const res = await fetch('/api/parcels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la création');
      }

      const { data: parcel } = await res.json();

      // Send SMS if requested
      if (sendSMS) {
        await fetch(`/api/notify/${parcel.code}`, { method: 'POST' });
      }

      // Redirect to parcel details
      router.push(`/parcels/${parcel.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau colis</h1>
        <p className="text-gray-500">Enregistrez les informations du colis</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations du colis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Code du colis *"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              placeholder="Ex: TAW-2024-001"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Ex: Vêtements, électronique..."
              />
              <Input
                label="Poids (kg)"
                name="weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={handleChange}
                placeholder="Ex: 5.5"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Destinataire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nom complet *"
                name="recipient_name"
                value={formData.recipient_name}
                onChange={handleChange}
                required
                placeholder="Nom du destinataire"
              />
              <Input
                label="Téléphone *"
                name="recipient_phone"
                value={formData.recipient_phone}
                onChange={handleChange}
                required
                placeholder="Ex: 6XXXXXXXX"
              />
            </div>

            <Input
              label="Email"
              name="recipient_email"
              type="email"
              value={formData.recipient_email}
              onChange={handleChange}
              placeholder="email@exemple.com"
            />

            <Input
              label="Adresse"
              name="recipient_address"
              value={formData.recipient_address}
              onChange={handleChange}
              placeholder="Adresse du destinataire"
            />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Expéditeur (optionnel)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nom"
                name="sender_name"
                value={formData.sender_name}
                onChange={handleChange}
                placeholder="Nom de l'expéditeur"
              />
              <Input
                label="Téléphone"
                name="sender_phone"
                value={formData.sender_phone}
                onChange={handleChange}
                placeholder="Téléphone de l'expéditeur"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardContent className="pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendSMS}
                onChange={(e) => setSendSMS(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Envoyer un SMS de notification au destinataire
              </span>
            </label>
          </CardContent>
        </Card>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" isLoading={loading}>
            Enregistrer le colis
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewParcelPage() {
  return (
    <Suspense fallback={<div className="p-4">Chargement...</div>}>
      <NewParcelForm />
    </Suspense>
  );
}
