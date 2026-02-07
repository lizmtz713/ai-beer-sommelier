import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { lookupBeerByBarcode } from '@/services/metadataProviders';
import { useUserId } from '@/providers/AuthProvider';
import { BeerMetadata, MetadataProviderResult } from '@/types';

// ============================================
// BARCODE LOOKUP HOOK
// ============================================

export function useBarcodeLookup() {
  const userId = useUserId();
  
  return useMutation<MetadataProviderResult, Error, string>({
    mutationFn: async (barcode: string) => {
      return lookupBeerByBarcode(barcode, userId || undefined);
    },
  });
}

// ============================================
// BARCODE SCANNER STATE HOOK
// ============================================

export function useBarcodeScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<BeerMetadata | null>(null);
  const [metadataSource, setMetadataSource] = useState<string | null>(null);
  
  const lookup = useBarcodeLookup();
  
  const onBarcodeScanned = useCallback(async (barcode: string) => {
    // Prevent duplicate scans
    if (barcode === scannedBarcode) return;
    
    setScannedBarcode(barcode);
    setIsScanning(false);
    
    // Look up metadata
    const result = await lookup.mutateAsync(barcode);
    
    if (result.found && result.metadata) {
      setMetadata(result.metadata);
      setMetadataSource(result.source);
    } else {
      setMetadata({ barcode, name: '' });
      setMetadataSource('stub');
    }
  }, [scannedBarcode, lookup]);
  
  const startScanning = useCallback(() => {
    setIsScanning(true);
    setScannedBarcode(null);
    setMetadata(null);
    setMetadataSource(null);
  }, []);
  
  const stopScanning = useCallback(() => {
    setIsScanning(false);
  }, []);
  
  const reset = useCallback(() => {
    setIsScanning(false);
    setScannedBarcode(null);
    setMetadata(null);
    setMetadataSource(null);
  }, []);
  
  return {
    // State
    isScanning,
    scannedBarcode,
    metadata,
    metadataSource,
    isLookingUp: lookup.isPending,
    lookupError: lookup.error?.message,
    
    // Actions
    onBarcodeScanned,
    startScanning,
    stopScanning,
    reset,
    
    // Computed
    hasMetadata: metadata !== null,
    isFromUserCatalog: metadataSource === 'user_catalog',
    isFromExternal: metadataSource === 'openfoodfacts',
    isStub: metadataSource === 'stub',
  };
}

// ============================================
// MANUAL BARCODE ENTRY HOOK
// ============================================

export function useManualBarcode() {
  const [barcode, setBarcode] = useState('');
  const lookup = useBarcodeLookup();
  
  const lookupBarcode = useCallback(async () => {
    if (!barcode.trim()) return null;
    
    const result = await lookup.mutateAsync(barcode.trim());
    return result;
  }, [barcode, lookup]);
  
  const clear = useCallback(() => {
    setBarcode('');
  }, []);
  
  return {
    barcode,
    setBarcode,
    lookupBarcode,
    isLookingUp: lookup.isPending,
    error: lookup.error?.message,
    clear,
  };
}
