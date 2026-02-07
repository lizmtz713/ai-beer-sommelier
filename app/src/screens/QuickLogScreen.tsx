import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Header } from '@/components/common/Header';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Rating } from '@/components/common/Rating';
import { Card, CardSection } from '@/components/common/Card';
import { useQuickLog } from '@/hooks/useEntries';

export function QuickLogScreen(): JSX.Element {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  
  const quickLog = useQuickLog();
  
  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a beer name');
      return;
    }
    
    try {
      const result = await quickLog.mutateAsync({ name: name.trim(), ratingNum: rating });
      
      if (result.success) {
        navigation.goBack();
      } else {
        Alert.alert('Error', result.error || 'Failed to save entry');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save entry');
    }
  };
  
  const isValid = name.trim().length > 0;
  
  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header
        title="Quick Log"
        subtitle="Minimal entry"
        leftIcon="close"
        onLeftPress={() => navigation.goBack()}
      />
      
      <View style={styles.content}>
        <Card style={styles.card}>
          <CardSection>
            <Input
              label="Beer Name *"
              value={name}
              onChangeText={setName}
              placeholder="What are you drinking?"
              autoFocus
            />
          </CardSection>
          
          <CardSection>
            <View style={styles.ratingContainer}>
              <Rating
                value={rating}
                onChange={setRating}
                size="large"
                showValue
              />
            </View>
          </CardSection>
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Log Beer"
            onPress={handleSubmit}
            disabled={!isValid}
            loading={quickLog.isPending}
            size="large"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 24,
  },
  ratingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingBottom: 16,
  },
});
