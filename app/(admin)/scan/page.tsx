'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ScanPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    setError('');
    setScanning(true);

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // On successful scan
          setScannedCode(decodedText);
          html5QrCode.stop();
          setScanning(false);
        },
        () => {
          // Ignore scan errors (no QR detected)
        }
      );
    } catch (err) {
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
      setScanning(false);
      console.error('Scanner error:', err);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      setScannedCode(manualCode.trim());
    }
  };

  const proceedWithCode = () => {
    if (scannedCode) {
      router.push(`/parcels/new?code=${encodeURIComponent(scannedCode)}`);
    }
  };

  const resetScan = () => {
    setScannedCode('');
    setManualCode('');
    setError('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scanner un colis</h1>
        <p className="text-gray-500">Scannez le QR code ou entrez le code manuellement</p>
      </div>

      {!scannedCode ? (
        <>
          {/* QR Scanner */}
          <Card>
            <CardHeader>
              <CardTitle>Scanner QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                id="qr-reader"
                className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden"
              />

              {error && (
                <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
              )}

              <div className="mt-4 flex justify-center">
                {!scanning ? (
                  <Button onClick={startScanning}>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Démarrer le scan
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={stopScanning}>
                    Arrêter le scan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">ou</span>
            </div>
          </div>

          {/* Manual Entry */}
          <Card>
            <CardHeader>
              <CardTitle>Saisie manuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="flex gap-4">
                <Input
                  placeholder="Entrez le code du colis"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={!manualCode.trim()}>
                  Valider
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Code Scanned - Confirmation */
        <Card>
          <CardHeader>
            <CardTitle>Code détecté</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="p-6 bg-green-50 rounded-lg">
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
              <p className="text-lg font-mono font-bold text-gray-900">{scannedCode}</p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={resetScan}>
                Scanner un autre
              </Button>
              <Button onClick={proceedWithCode}>
                Enregistrer ce colis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
