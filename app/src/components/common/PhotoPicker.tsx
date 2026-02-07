import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  pickImageFromCamera,
  pickImageFromLibrary,
  pickMultipleImages,
} from '@/utils/image';
import { IMAGE_CONFIG } from '@/config/constants';

interface PhotoPickerProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function PhotoPicker({
  photos,
  onChange,
  maxPhotos = IMAGE_CONFIG.MAX_PHOTOS_PER_ENTRY,
}: PhotoPickerProps): JSX.Element {
  const canAddMore = photos.length < maxPhotos;
  
  const showPickerOptions = () => {
    Alert.alert('Add Photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: handleCamera,
      },
      {
        text: 'Photo Library',
        onPress: handleLibrary,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };
  
  const handleCamera = async () => {
    const uri = await pickImageFromCamera();
    if (uri) {
      onChange([...photos, uri]);
    }
  };
  
  const handleLibrary = async () => {
    const remaining = maxPhotos - photos.length;
    const uris = await pickMultipleImages(remaining);
    if (uris.length > 0) {
      onChange([...photos, ...uris]);
    }
  };
  
  const handleRemove = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    onChange(newPhotos);
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {photos.map((uri, index) => (
          <View key={uri} style={styles.photoContainer}>
            <Image source={{ uri }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemove(index)}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}
        
        {canAddMore && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={showPickerOptions}
          >
            <Ionicons name="add" size={32} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================
// SINGLE PHOTO PICKER
// ============================================

interface SinglePhotoPickerProps {
  photo: string | null;
  onChange: (photo: string | null) => void;
}

export function SinglePhotoPicker({
  photo,
  onChange,
}: SinglePhotoPickerProps): JSX.Element {
  const showPickerOptions = () => {
    Alert.alert('Add Photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const uri = await pickImageFromCamera();
          if (uri) onChange(uri);
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const uri = await pickImageFromLibrary();
          if (uri) onChange(uri);
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };
  
  if (photo) {
    return (
      <View style={styles.singleContainer}>
        <Image source={{ uri: photo }} style={styles.singlePhoto} />
        <TouchableOpacity
          style={styles.singleRemoveButton}
          onPress={() => onChange(null)}
        >
          <Ionicons name="close-circle" size={28} color="#EF4444" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.singleChangeButton}
          onPress={showPickerOptions}
        >
          <Ionicons name="camera" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <TouchableOpacity style={styles.singleAddButton} onPress={showPickerOptions}>
      <Ionicons name="camera" size={40} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  photoContainer: {
    marginRight: 8,
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Single photo
  singleContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  singlePhoto: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  singleRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  singleChangeButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 8,
  },
  singleAddButton: {
    width: 200,
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
