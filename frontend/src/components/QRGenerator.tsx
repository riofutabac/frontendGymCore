"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, QrCode, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { accessControlApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface QRGeneratorProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const QRGenerator: React.FC<QRGeneratorProps> = ({ 
  autoRefresh = true, 
  refreshInterval = 30000 
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await accessControlApi.getMyQR();
      
      if (response.data.qrCode) {
        setQrCodeUrl(response.data.qrCode);
        setTimeLeft(30); // Reset countdown
        
        toast({
          title: "QR Actualizado",
          description: "Tu código QR ha sido generado correctamente",
        });
      } else {
        throw new Error("No se recibió el código QR");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Error al generar código QR";
      setError(errorMessage);
      console.error('QR Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh QR code
  useEffect(() => {
    if (autoRefresh) {
      fetchQRCode(); // Initial load
      
      const interval = setInterval(() => {
        fetchQRCode();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Countdown timer
  useEffect(() => {
    if (autoRefresh && timeLeft > 0 && !loading) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [timeLeft, autoRefresh, loading]);

  const handleManualRefresh = () => {
    fetchQRCode();
  };

  if (loading && !qrCodeUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Código QR de Acceso
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p className="text-sm text-muted-foreground">Generando código QR...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Código QR de Acceso
            </CardTitle>
            <CardDescription>
              Muestra este código al personal para ingresar al gimnasio
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {autoRefresh && !error && (
              <Badge variant={timeLeft > 10 ? "secondary" : "destructive"}>
                {timeLeft}s
              </Badge>
            )}
            <Button
              onClick={handleManualRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        {error && (
          <Alert variant="destructive" className="w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {qrCodeUrl ? (
          <div className="relative">
            <div className="p-4 bg-white rounded-lg shadow-sm border">
              <Image
                src={qrCodeUrl}
                alt="Código QR de acceso al gimnasio"
                width={200}
                height={200}
                className="rounded"
                priority
              />
            </div>
            {loading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="w-[200px] h-[200px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No hay código QR disponible
              </p>
            </div>
          </div>
        )}
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Este código es válido por 30 segundos
          </p>
          {autoRefresh && !error && (
            <p className="text-xs text-muted-foreground mt-1">
              Se renovará automáticamente
            </p>
          )}
        </div>

        {error && (
          <Button onClick={handleManualRefresh} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default QRGenerator;