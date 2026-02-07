import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

import { Header } from '@/components/common/Header';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';

// ============================================
// TYPES
// ============================================

export interface WishlistItem {
  id: string;
  beerName: string;
  brewery?: string;
  style?: string;
  reason?: string; // Why they want to try it
  source?: string; // Where they heard about it
  priority: 'low' | 'medium' | 'high';
  addedAt: number;
  completedAt?: number;
  entryId?: string; // Link to diary entry when completed
}

// ============================================
// MOCK DATA (would come from Firebase)
// ============================================

const MOCK_WISHLIST: WishlistItem[] = [
  {
    id: '1',
    beerName: 'Pliny the Elder',
    brewery: 'Russian River',
    style: 'Double IPA',
    reason: 'Everyone says it\'s the GOAT',
    priority: 'high',
    addedAt: Date.now() - 86400000 * 30,
  },
  {
    id: '2',
    beerName: 'Heady Topper',
    brewery: 'The Alchemist',
    style: 'Double IPA',
    reason: 'Bucket list beer',
    priority: 'high',
    addedAt: Date.now() - 86400000 * 14,
  },
  {
    id: '3',
    beerName: 'Westvleteren 12',
    brewery: 'Westvleteren Brewery',
    style: 'Belgian Quad',
    reason: 'Supposedly the best beer in the world',
    source: 'RateBeer top 100',
    priority: 'high',
    addedAt: Date.now() - 86400000 * 60,
  },
];

// ============================================
// WISHLIST ITEM CARD
// ============================================

interface WishlistCardProps {
  item: WishlistItem;
  onComplete: (item: WishlistItem) => void;
  onDelete: (item: WishlistItem) => void;
  onEdit: (item: WishlistItem) => void;
}

function WishlistCard({ item, onComplete, onDelete, onEdit }: WishlistCardProps): JSX.Element {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };
  
  const getPriorityColor = (priority: WishlistItem['priority']) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#6B7280';
    }
  };
  
  const getPriorityLabel = (priority: WishlistItem['priority']) => {
    switch (priority) {
      case 'high': return 'Must try!';
      case 'medium': return 'Want to try';
      case 'low': return 'Someday';
    }
  };
  
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.wishlistCard}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onEdit(item)}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Alert.alert(
            item.beerName,
            'What would you like to do?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'I Tried It! ✅', 
                onPress: () => onComplete(item),
              },
              { 
                text: 'Delete', 
                style: 'destructive',
                onPress: () => onDelete(item),
              },
            ]
          );
        }}
        activeOpacity={0.9}
      >
        {/* Priority Indicator */}
        <View style={[styles.priorityBar, { backgroundColor: getPriorityColor(item.priority) }]} />
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleSection}>
              <Text style={styles.beerName}>{item.beerName}</Text>
              {item.brewery && <Text style={styles.brewery}>{item.brewery}</Text>}
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                {getPriorityLabel(item.priority)}
              </Text>
            </View>
          </View>
          
          {item.style && (
            <View style={styles.styleTag}>
              <Ionicons name="beer-outline" size={12} color="#6B7280" />
              <Text style={styles.styleText}>{item.style}</Text>
            </View>
          )}
          
          {item.reason && (
            <Text style={styles.reason}>"{item.reason}"</Text>
          )}
          
          <View style={styles.cardFooter}>
            <Text style={styles.addedDate}>
              Added {format(item.addedAt, 'MMM d, yyyy')}
            </Text>
            <TouchableOpacity 
              style={styles.triedButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onComplete(item);
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
              <Text style={styles.triedText}>I tried it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================
// ADD WISHLIST MODAL
// ============================================

interface AddWishlistModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: Omit<WishlistItem, 'id' | 'addedAt'>) => void;
}

function AddWishlistForm({ onAdd, onClose }: { onAdd: AddWishlistModalProps['onAdd']; onClose: () => void }): JSX.Element {
  const [beerName, setBeerName] = useState('');
  const [brewery, setBrewery] = useState('');
  const [style, setStyle] = useState('');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<WishlistItem['priority']>('medium');
  
  const handleSubmit = () => {
    if (!beerName.trim()) {
      Alert.alert('Oops', 'Please enter a beer name');
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    onAdd({
      beerName: beerName.trim(),
      brewery: brewery.trim() || undefined,
      style: style.trim() || undefined,
      reason: reason.trim() || undefined,
      priority,
    });
    
    // Reset form
    setBeerName('');
    setBrewery('');
    setStyle('');
    setReason('');
    setPriority('medium');
    onClose();
  };
  
  return (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>Add to Wishlist</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Beer Name *</Text>
        <TextInput
          style={styles.input}
          value={beerName}
          onChangeText={setBeerName}
          placeholder="e.g., Pliny the Elder"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Brewery</Text>
        <TextInput
          style={styles.input}
          value={brewery}
          onChangeText={setBrewery}
          placeholder="e.g., Russian River"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Style</Text>
        <TextInput
          style={styles.input}
          value={style}
          onChangeText={setStyle}
          placeholder="e.g., Double IPA"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Why do you want to try it?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={reason}
          onChangeText={setReason}
          placeholder="e.g., Heard it's amazing from a friend"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={2}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Priority</Text>
        <View style={styles.prioritySelector}>
          {(['low', 'medium', 'high'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.priorityOption,
                priority === p && styles.priorityOptionActive,
                priority === p && { borderColor: p === 'high' ? '#EF4444' : p === 'medium' ? '#F59E0B' : '#6B7280' },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setPriority(p);
              }}
            >
              <Text style={[
                styles.priorityOptionText,
                priority === p && { color: p === 'high' ? '#EF4444' : p === 'medium' ? '#F59E0B' : '#6B7280' },
              ]}>
                {p === 'high' ? '🔥 Must Try' : p === 'medium' ? '👍 Want' : '📝 Someday'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          style={styles.addButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Add to Wishlist</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function WishlistScreen(): JSX.Element {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [wishlist, setWishlist] = useState<WishlistItem[]>(MOCK_WISHLIST);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  
  const filteredList = filter === 'all' 
    ? wishlist 
    : wishlist.filter(item => item.priority === filter);
  
  const handleAdd = (newItem: Omit<WishlistItem, 'id' | 'addedAt'>) => {
    const item: WishlistItem = {
      ...newItem,
      id: Date.now().toString(),
      addedAt: Date.now(),
    };
    setWishlist(prev => [item, ...prev]);
  };
  
  const handleComplete = (item: WishlistItem) => {
    Alert.alert(
      '🎉 Nice!',
      `You tried ${item.beerName}! Want to log it now?`,
      [
        { text: 'Later', style: 'cancel', onPress: () => {
          // Just remove from wishlist
          setWishlist(prev => prev.filter(i => i.id !== item.id));
        }},
        { 
          text: 'Log It', 
          onPress: () => {
            setWishlist(prev => prev.filter(i => i.id !== item.id));
            // Navigate to add entry with prefilled data
            navigation.navigate('AddEntry' as never, {
              prefill: {
                name: item.beerName,
                brewery: item.brewery,
                style: item.style,
              },
            } as never);
          },
        },
      ]
    );
  };
  
  const handleDelete = (item: WishlistItem) => {
    Alert.alert(
      'Remove from wishlist?',
      `Remove "${item.beerName}" from your wishlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setWishlist(prev => prev.filter(i => i.id !== item.id));
          },
        },
      ]
    );
  };
  
  const handleEdit = (item: WishlistItem) => {
    // For now, just show details. Could expand to full edit
    Alert.alert(
      item.beerName,
      `${item.brewery || 'Unknown brewery'}\n${item.style || 'Unknown style'}\n\n${item.reason || 'No notes'}`,
      [{ text: 'OK' }]
    );
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Wishlist"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity onPress={() => setShowAddForm(true)}>
            <Ionicons name="add-circle" size={28} color="#F59E0B" />
          </TouchableOpacity>
        }
      />
      
      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'high', 'medium', 'low'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setFilter(f);
            }}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f === 'all' ? `All (${wishlist.length})` : 
               f === 'high' ? '🔥 Must Try' :
               f === 'medium' ? '👍 Want' : '📝 Someday'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Add Form */}
      {showAddForm && (
        <Card style={styles.addFormCard}>
          <AddWishlistForm onAdd={handleAdd} onClose={() => setShowAddForm(false)} />
        </Card>
      )}
      
      {/* Wishlist */}
      {filteredList.length === 0 ? (
        <EmptyState
          icon="list-outline"
          title={filter === 'all' ? "Your wishlist is empty" : `No ${filter} priority beers`}
          message={filter === 'all' 
            ? "Add beers you want to try! Tap the + button above."
            : "Try a different filter or add more beers."
          }
          action={filter === 'all' ? {
            label: 'Add First Beer',
            onPress: () => setShowAddForm(true),
          } : undefined}
        />
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WishlistCard
              item={item}
              onComplete={handleComplete}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Floating Add Button */}
      {!showAddForm && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 80 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowAddForm(true);
          }}
        >
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#FEF3C7',
  },
  filterTabText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#D97706',
    fontWeight: '600',
  },
  wishlistCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  priorityBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  beerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  brewery: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  styleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  styleText: {
    fontSize: 13,
    color: '#6B7280',
  },
  reason: {
    fontSize: 14,
    color: '#4B5563',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  triedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  triedText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  
  // Add Form
  addFormCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  formContainer: {
    padding: 16,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  priorityOptionActive: {
    backgroundColor: '#FFFBEB',
  },
  priorityOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  addButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  
  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
