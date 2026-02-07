import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { EntryDoc } from '@/types';
import { format } from 'date-fns';

/**
 * Escape CSV field value
 */
function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  
  const str = String(value);
  // If contains comma, newline, or quote, wrap in quotes and escape inner quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert entries to CSV string
 */
export function entriesToCSV(entries: EntryDoc[]): string {
  // CSV headers
  const headers = [
    'Date',
    'Name',
    'Brand',
    'Style',
    'ABV',
    'IBU',
    'Rating',
    'Notes',
    'Price',
    'Currency',
    'Volume',
    'Volume Unit',
    'Purchase Location',
    'City',
    'Country',
    'Favorite',
    'Repeat Buy',
    'Wishlist',
    'Barcode',
  ];
  
  // Convert entries to rows
  const rows = entries.map((entry) => [
    entry.consumedAt ? format(entry.consumedAt, 'yyyy-MM-dd HH:mm') : '',
    entry.name,
    entry.brand || '',
    entry.style || '',
    entry.abv?.toString() || '',
    entry.ibu?.toString() || '',
    entry.ratingNum.toString(),
    entry.notes || '',
    entry.price?.toString() || '',
    entry.currency || '',
    entry.volume?.toString() || '',
    entry.volumeUnit || '',
    entry.purchaseLocation || '',
    entry.location?.city || '',
    entry.location?.country || '',
    entry.favorite ? 'Yes' : 'No',
    entry.repeatBuy ? 'Yes' : 'No',
    entry.wishlist ? 'Yes' : 'No',
    entry.barcode || '',
  ]);
  
  // Build CSV string
  const csvLines = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ];
  
  return csvLines.join('\n');
}

/**
 * Export entries to CSV file and share
 */
export async function exportToCSV(entries: EntryDoc[]): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, error: 'Sharing is not available on this device' };
    }
    
    // Generate CSV content
    const csv = entriesToCSV(entries);
    
    // Create file path
    const fileName = `beer_diary_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    // Write file
    await FileSystem.writeAsStringAsync(filePath, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    // Share file
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Beer Diary',
      UTI: 'public.comma-separated-values-text',
    });
    
    // Clean up file after sharing
    await FileSystem.deleteAsync(filePath, { idempotent: true });
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

/**
 * Generate CSV preview (first 10 rows)
 */
export function getCSVPreview(entries: EntryDoc[]): string {
  const preview = entries.slice(0, 10);
  return entriesToCSV(preview);
}
