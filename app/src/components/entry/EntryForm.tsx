import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Input, TextArea } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Rating } from '@/components/common/Rating';
import { Select } from '@/components/common/Select';
import { Toggle, ToggleGroup } from '@/components/common/Toggle';
import { PhotoPicker } from '@/components/common/PhotoPicker';
import { Card, CardSection, CardDivider } from '@/components/common/Card';
import { BarcodeScanner } from './BarcodeScanner';
import { EntryInput, BeerMetadata } from '@/types';
import { BEER_STYLES, CURRENCIES, VOLUME_UNITS } from '@/config/constants';
import { Ionicons } from '@expo/vector-icons';

interface EntryFormProps {
  initialValues?: Partial<EntryInput>;
  metadata?: BeerMetadata | null;
  onSubmit: (data: EntryInput, photos: string[]) => void;
  onScanBarcode?: (barcode: string) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function EntryForm({
  initialValues,
  metadata,
  onSubmit,
  onScanBarcode,
  isSubmitting = false,
  submitLabel = 'Save Entry',
}: EntryFormProps): JSX.Element {
  // Form state
  const [name, setName] = useState(initialValues?.name || metadata?.name || '');
  const [barcode, setBarcode] = useState(initialValues?.barcode || metadata?.barcode || '');
  const [brand, setBrand] = useState(initialValues?.brand || metadata?.brand || '');
  const [style, setStyle] = useState(initialValues?.style || metadata?.style || '');
  const [abv, setAbv] = useState(initialValues?.abv?.toString() || metadata?.abv?.toString() || '');
  const [ibu, setIbu] = useState(initialValues?.ibu?.toString() || metadata?.ibu?.toString() || '');
  const [beerCountry, setBeerCountry] = useState(initialValues?.beerCountry || metadata?.country || '');
  const [description, setDescription] = useState(initialValues?.description || metadata?.description || '');
  
  const [ratingNum, setRatingNum] = useState(initialValues?.ratingNum || 0);
  const [notes, setNotes] = useState(initialValues?.notes || '');
  
  const [price, setPrice] = useState(initialValues?.price?.toString() || '');
  const [currency, setCurrency] = useState(initialValues?.currency || 'USD');
  const [volume, setVolume] = useState(initialValues?.volume?.toString() || '');
  const [volumeUnit, setVolumeUnit] = useState<'ml' | 'oz' | 'pint'>(initialValues?.volumeUnit || 'ml');
  const [purchaseLocation, setPurchaseLocation] = useState(initialValues?.purchaseLocation || '');
  
  const [favorite, setFavorite] = useState(initialValues?.favorite || false);
  const [repeatBuy, setRepeatBuy] = useState(initialValues?.repeatBuy || false);
  const [wishlist, setWishlist] = useState(initialValues?.wishlist || false);
  
  const [sharePublic, setSharePublic] = useState(initialValues?.sharePublic || false);
  const [shareMedia, setShareMedia] = useState(initialValues?.shareMedia || false);
  const [sharePrice, setSharePrice] = useState(initialValues?.sharePrice || false);
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  
  // Update form when metadata changes
  useEffect(() => {
    if (metadata) {
      if (metadata.name && !name) setName(metadata.name);
      if (metadata.barcode && !barcode) setBarcode(metadata.barcode);
      if (metadata.brand && !brand) setBrand(metadata.brand);
      if (metadata.style && !style) setStyle(metadata.style);
      if (metadata.abv && !abv) setAbv(metadata.abv.toString());
      if (metadata.ibu && !ibu) setIbu(metadata.ibu.toString());
      if (metadata.country && !beerCountry) setBeerCountry(metadata.country);
      if (metadata.description && !description) setDescription(metadata.description);
    }
  }, [metadata]);
  
  const handleBarcodeScan = (scannedBarcode: string) => {
    setBarcode(scannedBarcode);
    setShowScanner(false);
    onScanBarcode?.(scannedBarcode);
  };
  
  const handleSubmit = () => {
    const data: EntryInput = {
      name: name.trim(),
      barcode: barcode.trim() || undefined,
      brand: brand.trim() || undefined,
      style: style || undefined,
      abv: abv ? parseFloat(abv) : undefined,
      ibu: ibu ? parseInt(ibu, 10) : undefined,
      beerCountry: beerCountry.trim() || undefined,
      description: description.trim() || undefined,
      
      ratingNum,
      notes: notes.trim() || undefined,
      
      price: price ? parseFloat(price) : undefined,
      currency,
      volume: volume ? parseFloat(volume) : undefined,
      volumeUnit,
      purchaseLocation: purchaseLocation.trim() || undefined,
      
      favorite,
      repeatBuy,
      wishlist,
      
      sharePublic,
      shareMedia: sharePublic ? shareMedia : false,
      sharePrice: sharePublic ? sharePrice : false,
    };
    
    onSubmit(data, photos);
  };
  
  const isValid = name.trim().length > 0;
  
  const styleOptions = BEER_STYLES.map((s) => ({ value: s, label: s }));
  const currencyOptions = CURRENCIES.map((c) => ({ value: c.code, label: `${c.symbol} ${c.code}` }));
  const volumeUnitOptions = VOLUME_UNITS.map((v) => ({ value: v.code, label: v.name }));
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Beer Info Section */}
        <Card style={styles.section}>
          <View style={styles.barcodeRow}>
            <Input
              label="Barcode"
              value={barcode}
              onChangeText={setBarcode}
              placeholder="Scan or enter barcode"
              containerStyle={styles.barcodeInput}
            />
            <Button
              title=""
              onPress={() => setShowScanner(true)}
              variant="outline"
              icon={<Ionicons name="barcode-outline" size={24} color="#F59E0B" />}
              style={styles.scanButton}
            />
          </View>
          
          <Input
            label="Beer Name *"
            value={name}
            onChangeText={setName}
            placeholder="Enter beer name"
            error={!name.trim() ? '' : undefined}
          />
          
          <Input
            label="Brand/Brewery"
            value={brand}
            onChangeText={setBrand}
            placeholder="Enter brewery name"
          />
          
          <Select
            label="Style"
            value={style}
            options={styleOptions}
            onChange={setStyle}
            placeholder="Select beer style"
          />
          
          <View style={styles.row}>
            <Input
              label="ABV %"
              value={abv}
              onChangeText={setAbv}
              placeholder="5.5"
              keyboardType="decimal-pad"
              containerStyle={styles.halfInput}
            />
            <Input
              label="IBU"
              value={ibu}
              onChangeText={setIbu}
              placeholder="40"
              keyboardType="number-pad"
              containerStyle={styles.halfInput}
            />
          </View>
          
          <Input
            label="Country of Origin"
            value={beerCountry}
            onChangeText={setBeerCountry}
            placeholder="e.g., Belgium"
          />
        </Card>
        
        {/* Rating Section */}
        <Card style={styles.section}>
          <CardSection>
            <View style={styles.ratingSection}>
              <Rating
                value={ratingNum}
                onChange={setRatingNum}
                size="large"
                showValue
              />
            </View>
          </CardSection>
          
          <TextArea
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Tasting notes, thoughts, etc."
            numberOfLines={4}
          />
        </Card>
        
        {/* Photos Section */}
        <Card style={styles.section}>
          <CardSection>
            <PhotoPicker photos={photos} onChange={setPhotos} />
          </CardSection>
        </Card>
        
        {/* Price & Purchase Section */}
        <Card style={styles.section}>
          <View style={styles.row}>
            <Input
              label="Price"
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
              containerStyle={styles.halfInput}
            />
            <Select
              label="Currency"
              value={currency}
              options={currencyOptions}
              onChange={setCurrency}
            />
          </View>
          
          <View style={styles.row}>
            <Input
              label="Volume"
              value={volume}
              onChangeText={setVolume}
              placeholder="330"
              keyboardType="decimal-pad"
              containerStyle={styles.halfInput}
            />
            <Select
              label="Unit"
              value={volumeUnit}
              options={volumeUnitOptions}
              onChange={(v) => setVolumeUnit(v as 'ml' | 'oz' | 'pint')}
            />
          </View>
          
          <Input
            label="Purchase Location"
            value={purchaseLocation}
            onChangeText={setPurchaseLocation}
            placeholder="Where did you buy this?"
          />
        </Card>
        
        {/* Toggles Section */}
        <Card style={styles.section}>
          <ToggleGroup
            options={[
              { key: 'favorite', label: 'Favorite', icon: 'heart-outline', activeIcon: 'heart' },
              { key: 'repeatBuy', label: 'Repeat Buy', icon: 'refresh-outline', activeIcon: 'refresh' },
              { key: 'wishlist', label: 'Wishlist', icon: 'bookmark-outline', activeIcon: 'bookmark' },
            ]}
            values={{ favorite, repeatBuy, wishlist }}
            onChange={(key, value) => {
              if (key === 'favorite') setFavorite(value);
              if (key === 'repeatBuy') setRepeatBuy(value);
              if (key === 'wishlist') setWishlist(value);
            }}
          />
        </Card>
        
        {/* Sharing Section */}
        <Card style={styles.section}>
          <Toggle
            label="Share Publicly"
            description="Share this entry in the community feed"
            value={sharePublic}
            onValueChange={setSharePublic}
            icon="globe-outline"
          />
          
          {sharePublic && (
            <>
              <CardDivider />
              <Toggle
                label="Include Photos"
                value={shareMedia}
                onValueChange={setShareMedia}
                icon="image-outline"
              />
              <Toggle
                label="Include Price"
                value={sharePrice}
                onValueChange={setSharePrice}
                icon="pricetag-outline"
              />
            </>
          )}
        </Card>
        
        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            title={submitLabel}
            onPress={handleSubmit}
            disabled={!isValid}
            loading={isSubmitting}
            size="large"
          />
        </View>
      </ScrollView>
      
      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScan}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  barcodeInput: {
    flex: 1,
    marginRight: 8,
  },
  scanButton: {
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  ratingSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  submitContainer: {
    padding: 16,
    paddingBottom: 32,
  },
});
