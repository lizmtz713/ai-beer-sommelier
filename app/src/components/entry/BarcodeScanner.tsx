import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/common/Button';

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({
  visible,
  onClose,
  onScan,
}: BarcodeScannerProps): JSX.Element {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  
  useEffect(() => {
    if (visible) {
      setScanned(false);
    }
  }, [visible]);
  
  const handleBarcodeScanned = ({ data, type }: BarcodeScanningResult) => {
    if (scanned) return;
    
    setScanned(true);
    onScan(data);
    onClose();
  };
  
  if (!visible) return <></>;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {!permission?.granted ? (
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>
              We need camera access to scan barcodes
            </Text>
            <Button
              title="Grant Permission"
              onPress={requestPermission}
              variant="primary"
              style={styles.permissionButton}
            />
            <Button
              title="Cancel"
              onPress={onClose}
              variant="ghost"
            />
          </View>
        ) : (
          <>
            <CameraView
              style={styles.camera}
              facing="back"
              enableTorch={torch}
              barcodeScannerSettings={{
                barcodeTypes: [
                  'ean13',
                  'ean8',
                  'upc_a',
                  'upc_e',
                  'code128',
                  'code39',
                  'code93',
                ],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            >
              {/* Overlay */}
              <View style={styles.overlay}>
                {/* Top bar */}
                <View style={styles.topBar}>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => setTorch(!torch)}
                    style={styles.torchButton}
                  >
                    <Ionicons
                      name={torch ? 'flash' : 'flash-outline'}
                      size={24}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
                
                {/* Scan frame */}
                <View style={styles.scanArea}>
                  <View style={styles.scanFrame}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                  </View>
                </View>
                
                {/* Instructions */}
                <View style={styles.instructions}>
                  <Text style={styles.instructionText}>
                    Position the barcode within the frame
                  </Text>
                </View>
              </View>
            </CameraView>
          </>
        )}
      </View>
    </Modal>
  );
}

// ============================================
// MINI SCANNER (inline variant)
// ============================================

interface MiniScannerProps {
  onScan: (barcode: string) => void;
}

export function MiniScanner({ onScan }: MiniScannerProps): JSX.Element {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  
  const handleBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    onScan(data);
  };
  
  const handleRescan = () => {
    setScanned(false);
  };
  
  if (!permission?.granted) {
    return (
      <TouchableOpacity style={styles.miniPermission} onPress={requestPermission}>
        <Ionicons name="camera" size={24} color="#6B7280" />
        <Text style={styles.miniPermissionText}>Tap to enable camera</Text>
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={styles.miniContainer}>
      <CameraView
        style={styles.miniCamera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />
      {scanned && (
        <TouchableOpacity style={styles.miniRescan} onPress={handleRescan}>
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const { width } = Dimensions.get('window');
const SCAN_FRAME_SIZE = width * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  torchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE * 0.6,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#F59E0B',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  instructions: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  
  // Permission
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  permissionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  permissionButton: {
    marginBottom: 12,
  },
  
  // Mini scanner
  miniContainer: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  miniCamera: {
    flex: 1,
  },
  miniRescan: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 8,
  },
  miniPermission: {
    height: 150,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPermissionText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});
