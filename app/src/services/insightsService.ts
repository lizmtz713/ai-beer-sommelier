import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { EntryDoc, Insights, CityStats, StyleStats } from '@/types';
import { subDays, subWeeks, subMonths } from 'date-fns';

/**
 * Convert Firestore doc to EntryDoc
 */
function docToEntry(doc: any): EntryDoc {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    consumedAt: data.consumedAt?.toDate() || new Date(),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as EntryDoc;
}

/**
 * Get all completed entries for a user (for insights calculation)
 */
async function getAllCompletedEntries(userId: string): Promise<EntryDoc[]> {
  const entriesRef = collection(getFirebaseDb(), 'users', userId, 'entries');
  const q = query(
    entriesRef,
    where('status', '==', 'complete'),
    orderBy('consumedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToEntry);
}

/**
 * Calculate insights for a user
 */
export async function calculateInsights(userId: string): Promise<Insights> {
  const entries = await getAllCompletedEntries(userId);
  
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      totalCities: 0,
      totalStyles: 0,
      avgRating: 0,
      bestByCity: [],
      cheapest4Stars: [],
      mostTriedStyles: [],
      repeatBuyRate: 0,
      wishlistConversionRate: 0,
      recentActivity: {
        lastWeekCount: 0,
        lastMonthCount: 0,
      },
    };
  }
  
  // Basic stats
  const totalEntries = entries.length;
  const avgRating = entries.reduce((sum, e) => sum + e.ratingNum, 0) / totalEntries;
  
  // City stats
  const cityMap = new Map<string, { entries: EntryDoc[]; country: string }>();
  entries.forEach((entry) => {
    const city = entry.location?.city;
    const country = entry.location?.country || '';
    if (city) {
      const existing = cityMap.get(city) || { entries: [], country };
      existing.entries.push(entry);
      cityMap.set(city, existing);
    }
  });
  
  const bestByCity: CityStats[] = Array.from(cityMap.entries())
    .map(([city, { entries: cityEntries, country }]) => {
      const avgCityRating = cityEntries.reduce((sum, e) => sum + e.ratingNum, 0) / cityEntries.length;
      const topBeer = cityEntries.sort((a, b) => b.ratingNum - a.ratingNum)[0];
      return {
        city,
        country,
        count: cityEntries.length,
        avgRating: Math.round(avgCityRating * 10) / 10,
        topBeer: topBeer.name,
      };
    })
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 10);
  
  const totalCities = cityMap.size;
  
  // Style stats
  const styleMap = new Map<string, EntryDoc[]>();
  entries.forEach((entry) => {
    const style = entry.style || 'Unknown';
    const existing = styleMap.get(style) || [];
    existing.push(entry);
    styleMap.set(style, existing);
  });
  
  const mostTriedStyles: StyleStats[] = Array.from(styleMap.entries())
    .map(([style, styleEntries]) => ({
      style,
      count: styleEntries.length,
      avgRating: Math.round(
        (styleEntries.reduce((sum, e) => sum + e.ratingNum, 0) / styleEntries.length) * 10
      ) / 10,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  const totalStyles = styleMap.size;
  
  // Cheapest 4+ stars
  const cheapest4Stars = entries
    .filter((e) => e.ratingNum >= 4 && e.price !== undefined && e.price > 0)
    .sort((a, b) => {
      // Normalize price by volume if available
      const pricePerMlA = a.volume ? (a.price || 0) / a.volume : a.price || 0;
      const pricePerMlB = b.volume ? (b.price || 0) / b.volume : b.price || 0;
      return pricePerMlA - pricePerMlB;
    })
    .slice(0, 10);
  
  // Repeat buy rate
  const repeatBuyCount = entries.filter((e) => e.repeatBuy).length;
  const repeatBuyRate = totalEntries > 0 ? (repeatBuyCount / totalEntries) * 100 : 0;
  
  // Wishlist conversion rate
  const wishlistEntries = entries.filter((e) => e.wishlist);
  const convertedWishlist = wishlistEntries.filter((e) => !e.wishlist && e.ratingNum > 0);
  // This is a simplified calculation - in reality you'd track when items were removed from wishlist
  // For now, we calculate based on entries that were ever wishlisted vs total wishlist
  const wishlistConversionRate = wishlistEntries.length > 0 
    ? ((wishlistEntries.length - wishlistEntries.filter(e => e.wishlist).length) / wishlistEntries.length) * 100
    : 0;
  
  // Recent activity
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);
  
  const lastWeekCount = entries.filter((e) => e.consumedAt >= oneWeekAgo).length;
  const lastMonthCount = entries.filter((e) => e.consumedAt >= oneMonthAgo).length;
  
  return {
    totalEntries,
    totalCities,
    totalStyles,
    avgRating: Math.round(avgRating * 10) / 10,
    bestByCity,
    cheapest4Stars,
    mostTriedStyles,
    repeatBuyRate: Math.round(repeatBuyRate),
    wishlistConversionRate: Math.round(wishlistConversionRate),
    recentActivity: {
      lastWeekCount,
      lastMonthCount,
    },
  };
}

/**
 * Get top beers by rating
 */
export async function getTopBeers(
  userId: string,
  limit_: number = 10
): Promise<EntryDoc[]> {
  const entriesRef = collection(getFirebaseDb(), 'users', userId, 'entries');
  const q = query(
    entriesRef,
    where('status', '==', 'complete'),
    orderBy('ratingNum', 'desc'),
    limit(limit_)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToEntry);
}

/**
 * Get favorite beers
 */
export async function getFavorites(userId: string): Promise<EntryDoc[]> {
  const entriesRef = collection(getFirebaseDb(), 'users', userId, 'entries');
  const q = query(
    entriesRef,
    where('status', '==', 'complete'),
    where('favorite', '==', true),
    orderBy('consumedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToEntry);
}

/**
 * Get repeat-buy beers
 */
export async function getRepeatBuys(userId: string): Promise<EntryDoc[]> {
  const entriesRef = collection(getFirebaseDb(), 'users', userId, 'entries');
  const q = query(
    entriesRef,
    where('status', '==', 'complete'),
    where('repeatBuy', '==', true),
    orderBy('consumedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToEntry);
}

/**
 * Get wishlist beers
 */
export async function getWishlist(userId: string): Promise<EntryDoc[]> {
  const entriesRef = collection(getFirebaseDb(), 'users', userId, 'entries');
  const q = query(
    entriesRef,
    where('status', '==', 'complete'),
    where('wishlist', '==', true),
    orderBy('consumedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToEntry);
}

/**
 * Get entries by style
 */
export async function getEntriesByStyle(
  userId: string,
  style: string
): Promise<EntryDoc[]> {
  const entriesRef = collection(getFirebaseDb(), 'users', userId, 'entries');
  const q = query(
    entriesRef,
    where('status', '==', 'complete'),
    where('style', '==', style),
    orderBy('consumedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToEntry);
}

/**
 * Get entries by city
 */
export async function getEntriesByCity(
  userId: string,
  city: string
): Promise<EntryDoc[]> {
  const entriesRef = collection(getFirebaseDb(), 'users', userId, 'entries');
  const q = query(
    entriesRef,
    where('status', '==', 'complete'),
    where('location.city', '==', city),
    orderBy('consumedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToEntry);
}

/**
 * Get recent entries
 */
export async function getRecentEntries(
  userId: string,
  days: number = 7
): Promise<EntryDoc[]> {
  const cutoff = Timestamp.fromDate(subDays(new Date(), days));
  const entriesRef = collection(getFirebaseDb(), 'users', userId, 'entries');
  const q = query(
    entriesRef,
    where('status', '==', 'complete'),
    where('consumedAt', '>=', cutoff),
    orderBy('consumedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToEntry);
}
