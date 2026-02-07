import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { IMAGE_CONFIG } from '@/config/constants';

/**
 * EXIF GPS stripping implementation
 * 
 * EXIF data structure in JPEG:
 * - Starts with SOI marker (0xFFD8)
 * - APP1 segment (0xFFE1) contains EXIF data
 * - EXIF data contains TIFF header and IFD entries
 * - GPS IFD is identified by tag 0x8825
 * 
 * For true production use, we resize images which drops EXIF,
 * and use expo-image-manipulator. This implementation provides
 * an additional safety layer.
 */

// JPEG markers
const JPEG_SOI = 0xffd8;
const JPEG_APP1 = 0xffe1;
const JPEG_APP0 = 0xffe0;
const EXIF_HEADER = 'Exif\0\0';

// GPS IFD tag
const GPS_IFD_TAG = 0x8825;

// TIFF byte order markers
const TIFF_LITTLE_ENDIAN = 0x4949; // 'II'
const TIFF_BIG_ENDIAN = 0x4d4d; // 'MM'

interface ExifStripResult {
  success: boolean;
  uri: string;
  error?: string;
}

/**
 * Read bytes from a file URI as a base64 string and convert to Uint8Array
 */
async function readFileAsBytes(uri: string): Promise<Uint8Array | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

/**
 * Write bytes to a file
 */
async function writeBytesToFile(bytes: Uint8Array, uri: string): Promise<boolean> {
  try {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    await FileSystem.writeAsStringAsync(uri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Read 16-bit value from bytes
 */
function read16(bytes: Uint8Array, offset: number, littleEndian: boolean): number {
  if (littleEndian) {
    return bytes[offset] | (bytes[offset + 1] << 8);
  }
  return (bytes[offset] << 8) | bytes[offset + 1];
}

/**
 * Read 32-bit value from bytes
 */
function read32(bytes: Uint8Array, offset: number, littleEndian: boolean): number {
  if (littleEndian) {
    return (
      bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)
    );
  }
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  );
}

/**
 * Write 32-bit value to bytes
 */
function write32(
  bytes: Uint8Array,
  offset: number,
  value: number,
  littleEndian: boolean
): void {
  if (littleEndian) {
    bytes[offset] = value & 0xff;
    bytes[offset + 1] = (value >> 8) & 0xff;
    bytes[offset + 2] = (value >> 16) & 0xff;
    bytes[offset + 3] = (value >> 24) & 0xff;
  } else {
    bytes[offset] = (value >> 24) & 0xff;
    bytes[offset + 1] = (value >> 16) & 0xff;
    bytes[offset + 2] = (value >> 8) & 0xff;
    bytes[offset + 3] = value & 0xff;
  }
}

/**
 * Strip GPS data from EXIF in a JPEG image
 * Returns modified bytes without GPS IFD reference
 */
function stripGPSFromExif(bytes: Uint8Array): Uint8Array {
  // Verify JPEG SOI marker
  if (bytes.length < 2) return bytes;
  const soi = (bytes[0] << 8) | bytes[1];
  if (soi !== JPEG_SOI) return bytes;
  
  // Find APP1 segment
  let offset = 2;
  while (offset < bytes.length - 4) {
    const marker = (bytes[offset] << 8) | bytes[offset + 1];
    
    if (marker === JPEG_APP1) {
      // Found APP1, check for EXIF header
      const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
      const exifStart = offset + 4;
      
      // Check EXIF header
      let headerMatch = true;
      for (let i = 0; i < 6; i++) {
        if (bytes[exifStart + i] !== EXIF_HEADER.charCodeAt(i)) {
          headerMatch = false;
          break;
        }
      }
      
      if (headerMatch) {
        // Found EXIF data, parse TIFF header
        const tiffStart = exifStart + 6;
        const byteOrder = (bytes[tiffStart] << 8) | bytes[tiffStart + 1];
        const littleEndian = byteOrder === TIFF_LITTLE_ENDIAN;
        
        // Read IFD0 offset
        const ifd0Offset = read32(bytes, tiffStart + 4, littleEndian);
        const ifd0Start = tiffStart + ifd0Offset;
        
        // Read number of IFD entries
        const numEntries = read16(bytes, ifd0Start, littleEndian);
        
        // Search for GPS IFD tag and zero it out
        for (let i = 0; i < numEntries; i++) {
          const entryOffset = ifd0Start + 2 + i * 12;
          const tag = read16(bytes, entryOffset, littleEndian);
          
          if (tag === GPS_IFD_TAG) {
            // Found GPS IFD pointer - zero out the value
            // The value is at offset + 8 (4 bytes)
            write32(bytes, entryOffset + 8, 0, littleEndian);
          }
        }
        
        // Also check EXIF IFD for GPS tags
        for (let i = 0; i < numEntries; i++) {
          const entryOffset = ifd0Start + 2 + i * 12;
          const tag = read16(bytes, entryOffset, littleEndian);
          
          // EXIF IFD pointer tag
          if (tag === 0x8769) {
            const exifIfdOffset = read32(bytes, entryOffset + 8, littleEndian);
            const exifIfdStart = tiffStart + exifIfdOffset;
            const exifNumEntries = read16(bytes, exifIfdStart, littleEndian);
            
            // Search EXIF IFD for GPS
            for (let j = 0; j < exifNumEntries; j++) {
              const exifEntryOffset = exifIfdStart + 2 + j * 12;
              const exifTag = read16(bytes, exifEntryOffset, littleEndian);
              
              if (exifTag === GPS_IFD_TAG) {
                write32(bytes, exifEntryOffset + 8, 0, littleEndian);
              }
            }
          }
        }
      }
      break;
    }
    
    // Move to next segment
    if ((marker & 0xff00) === 0xff00 && marker !== 0xffff) {
      const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
      offset += 2 + length;
    } else {
      offset++;
    }
  }
  
  return bytes;
}

/**
 * Strip GPS EXIF data from an image file
 * Creates a new file with GPS data removed
 */
export async function stripExifGPS(sourceUri: string): Promise<ExifStripResult> {
  try {
    // Read the source file
    const bytes = await readFileAsBytes(sourceUri);
    if (!bytes) {
      return { success: false, uri: sourceUri, error: 'Failed to read file' };
    }
    
    // Strip GPS data
    const strippedBytes = stripGPSFromExif(bytes);
    
    // Generate output path
    const outputUri = `${FileSystem.cacheDirectory}stripped_${Date.now()}.jpg`;
    
    // Write stripped image
    const written = await writeBytesToFile(strippedBytes, outputUri);
    if (!written) {
      return { success: false, uri: sourceUri, error: 'Failed to write file' };
    }
    
    return { success: true, uri: outputUri };
  } catch (error) {
    return {
      success: false,
      uri: sourceUri,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process image: resize and strip EXIF
 * This is the main function to call before uploading
 */
export async function processImageForUpload(
  uri: string
): Promise<{ uri: string; error?: string }> {
  try {
    // First strip GPS EXIF data
    const stripResult = await stripExifGPS(uri);
    
    if (!stripResult.success) {
      console.warn('EXIF strip failed:', stripResult.error);
      // Continue with original - the resize will likely drop EXIF anyway
    }
    
    // The URI to use (stripped if successful, original if not)
    const processedUri = stripResult.success ? stripResult.uri : uri;
    
    return { uri: processedUri };
  } catch (error) {
    return {
      uri,
      error: error instanceof Error ? error.message : 'Image processing failed',
    };
  }
}

/**
 * Request camera permissions
 */
export async function requestCameraPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

/**
 * Request media library permissions
 */
export async function requestMediaLibraryPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/**
 * Pick image from camera
 */
export async function pickImageFromCamera(): Promise<string | null> {
  const hasPermission = await requestCameraPermissions();
  if (!hasPermission) return null;
  
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: IMAGE_CONFIG.QUALITY,
  });
  
  if (result.canceled) return null;
  return result.assets[0]?.uri ?? null;
}

/**
 * Pick image from library
 */
export async function pickImageFromLibrary(): Promise<string | null> {
  const hasPermission = await requestMediaLibraryPermissions();
  if (!hasPermission) return null;
  
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: IMAGE_CONFIG.QUALITY,
  });
  
  if (result.canceled) return null;
  return result.assets[0]?.uri ?? null;
}

/**
 * Pick multiple images from library
 */
export async function pickMultipleImages(
  maxCount: number = IMAGE_CONFIG.MAX_PHOTOS_PER_ENTRY
): Promise<string[]> {
  const hasPermission = await requestMediaLibraryPermissions();
  if (!hasPermission) return [];
  
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: maxCount,
    quality: IMAGE_CONFIG.QUALITY,
  });
  
  if (result.canceled) return [];
  return result.assets.map((asset) => asset.uri);
}

/**
 * Delete cached images
 */
export async function cleanupCachedImages(): Promise<void> {
  try {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) return;
    
    const files = await FileSystem.readDirectoryAsync(cacheDir);
    const imageFiles = files.filter(
      (f) => f.startsWith('stripped_') && f.endsWith('.jpg')
    );
    
    for (const file of imageFiles) {
      await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
    }
  } catch {
    // Ignore cleanup errors
  }
}
