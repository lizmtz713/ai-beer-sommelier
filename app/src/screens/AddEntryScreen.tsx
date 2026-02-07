import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Header } from '@/components/common/Header';
import { EntryForm } from '@/components/entry/EntryForm';
import { useCreateEntry } from '@/hooks/useEntries';
import { useBarcodeScanner } from '@/hooks/useBarcode';
import { EntryInput, BeerMetadata } from '@/types';

export function AddEntryScreen(): JSX.Element {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const createEntry = useCreateEntry();
  const { metadata, onBarcodeScanned, isLookingUp } = useBarcodeScanner();
  
  const handleSubmit = async (data: EntryInput, photos: string[]) => {
    try {
      const result = await createEntry.mutateAsync({ input: data, photoUris: photos });
      
      if (result.success) {
        navigation.goBack();
      } else if (result.status === 'error') {
        Alert.alert(
          'Entry Saved with Errors',
          'Your entry was saved but some uploads failed. You can retry from the diary.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    }
  };
  
  const handleScanBarcode = (barcode: string) => {
    onBarcodeScanned(barcode);
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Add Beer"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />
      
      <EntryForm
        metadata={metadata}
        onSubmit={handleSubmit}
        onScanBarcode={handleScanBarcode}
        isSubmitting={createEntry.isPending || isLookingUp}
        submitLabel="Save Beer"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});
