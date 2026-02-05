'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500">Configurez votre espace de travail</p>
      </div>

      <div className="grid gap-6">
        {/* Agency Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de l&apos;agence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm">
              Ces paramètres sont gérés par l&apos;administrateur système via Supabase.
            </p>
          </CardContent>
        </Card>

        {/* Delivery Zones */}
        <Card>
          <CardHeader>
            <CardTitle>Zones de livraison</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm mb-4">
              Configurez les zones de livraison et leurs tarifs.
            </p>
            <p className="text-sm text-gray-400 italic">
              Fonctionnalité à venir - Gérable via Supabase Dashboard
            </p>
          </CardContent>
        </Card>

        {/* Delivery Slots */}
        <Card>
          <CardHeader>
            <CardTitle>Créneaux horaires</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm mb-4">
              Configurez les créneaux horaires de livraison disponibles.
            </p>
            <p className="text-sm text-gray-400 italic">
              Fonctionnalité à venir - Gérable via Supabase Dashboard
            </p>
          </CardContent>
        </Card>

        {/* SMS Template */}
        <Card>
          <CardHeader>
            <CardTitle>Template SMS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm">
              Votre colis [CODE] est arrivé à [AGENCE]. Confirmez: https://[DOMAIN]/c/[CODE]
            </div>
            <p className="text-sm text-gray-400 italic mt-4">
              Le template est défini dans le code - modifiable dans lib/sms/mboa.ts
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
