import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Header } from '@/components/common/Header';
import { Card } from '@/components/common/Card';

const { width } = Dimensions.get('window');

// ============================================
// MOCK DATA (would come from entries)
// ============================================

const WEEKLY_DATA = [
  { day: 'Mon', drinks: 0, calories: 0 },
  { day: 'Tue', drinks: 2, calories: 340 },
  { day: 'Wed', drinks: 0, calories: 0 },
  { day: 'Thu', drinks: 1, calories: 180 },
  { day: 'Fri', drinks: 3, calories: 510 },
  { day: 'Sat', drinks: 4, calories: 720 },
  { day: 'Sun', drinks: 1, calories: 170 },
];

const MONTHLY_SPENDING = [
  { week: 'Week 1', amount: 45 },
  { week: 'Week 2', amount: 62 },
  { week: 'Week 3', amount: 38 },
  { week: 'Week 4', amount: 55 },
];

// ============================================
// BAR CHART
// ============================================

interface BarChartProps {
  data: { day: string; drinks: number }[];
  maxValue: number;
  color: string;
}

function BarChart({ data, maxValue, color }: BarChartProps): JSX.Element {
  const barWidth = (width - 80) / data.length - 8;
  
  return (
    <View style={styles.chart}>
      <View style={styles.chartBars}>
        {data.map((item, index) => (
          <View key={index} style={styles.barContainer}>
            <View style={[styles.bar, { width: barWidth }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    height: `${maxValue > 0 ? (item.drinks / maxValue) * 100 : 0}%`,
                    backgroundColor: item.drinks > 0 ? color : '#E5E7EB',
                  },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{item.day}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================
// STAT CARD
// ============================================

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ icon, label, value, subValue, color, trend }: StatCardProps): JSX.Element {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={styles.statValueRow}>
          <Text style={styles.statValue}>{value}</Text>
          {trend && (
            <Ionicons
              name={trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'remove'}
              size={16}
              color={trend === 'down' ? '#10B981' : trend === 'up' ? '#EF4444' : '#6B7280'}
            />
          )}
        </View>
        {subValue && <Text style={styles.statSubValue}>{subValue}</Text>}
      </View>
    </View>
  );
}

// ============================================
// DRY DAYS CALENDAR
// ============================================

function DryDaysCalendar(): JSX.Element {
  // Mock: last 14 days
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    return {
      date: date.getDate(),
      hadDrink: [1, 4, 5, 8, 9, 12].includes(i), // Mock pattern
    };
  });
  
  const dryDays = days.filter(d => !d.hadDrink).length;
  
  return (
    <View style={styles.calendarSection}>
      <View style={styles.calendarHeader}>
        <Text style={styles.calendarTitle}>Last 14 Days</Text>
        <View style={styles.dryDaysBadge}>
          <Text style={styles.dryDaysCount}>{dryDays}</Text>
          <Text style={styles.dryDaysLabel}>dry days</Text>
        </View>
      </View>
      <View style={styles.calendarGrid}>
        {days.map((day, i) => (
          <View
            key={i}
            style={[
              styles.calendarDay,
              !day.hadDrink && styles.calendarDayDry,
            ]}
          >
            <Text style={[
              styles.calendarDayText,
              !day.hadDrink && styles.calendarDayTextDry,
            ]}>
              {day.date}
            </Text>
            {!day.hadDrink && (
              <View style={styles.checkMark}>
                <Ionicons name="checkmark" size={10} color="#10B981" />
              </View>
            )}
          </View>
        ))}
      </View>
      <View style={styles.calendarLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#E5E7EB' }]} />
          <Text style={styles.legendText}>Had drinks</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#D1FAE5' }]} />
          <Text style={styles.legendText}>Dry day ✓</Text>
        </View>
      </View>
    </View>
  );
}

// ============================================
// INSIGHTS CARD
// ============================================

interface InsightProps {
  emoji: string;
  title: string;
  description: string;
  type: 'positive' | 'neutral' | 'warning';
}

function Insight({ emoji, title, description, type }: InsightProps): JSX.Element {
  const bgColor = type === 'positive' ? '#D1FAE5' : type === 'warning' ? '#FEE2E2' : '#F3F4F6';
  const textColor = type === 'positive' ? '#065F46' : type === 'warning' ? '#991B1B' : '#374151';
  
  return (
    <View style={[styles.insight, { backgroundColor: bgColor }]}>
      <Text style={styles.insightEmoji}>{emoji}</Text>
      <View style={styles.insightText}>
        <Text style={[styles.insightTitle, { color: textColor }]}>{title}</Text>
        <Text style={styles.insightDesc}>{description}</Text>
      </View>
    </View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function DrinkingStatsScreen(): JSX.Element {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  
  // Calculate stats
  const totalDrinks = WEEKLY_DATA.reduce((sum, d) => sum + d.drinks, 0);
  const totalCalories = WEEKLY_DATA.reduce((sum, d) => sum + d.calories, 0);
  const avgAbv = 5.2; // Mock average
  const totalUnits = totalDrinks * (avgAbv / 10) * 1.5; // Rough calculation
  const totalSpending = MONTHLY_SPENDING.reduce((sum, w) => sum + w.amount, 0);
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Drinking Stats"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />
      
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Toggle */}
        <View style={styles.periodToggle}>
          {(['week', 'month'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.periodButtonActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setPeriod(p);
              }}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Summary Cards */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="beer-outline"
            label="Drinks"
            value={totalDrinks}
            subValue="this week"
            color="#F59E0B"
            trend={totalDrinks > 10 ? 'up' : 'down'}
          />
          <StatCard
            icon="flame-outline"
            label="Calories"
            value={totalCalories.toLocaleString()}
            subValue="from beer"
            color="#EF4444"
          />
          <StatCard
            icon="water-outline"
            label="Units"
            value={totalUnits.toFixed(1)}
            subValue="of alcohol"
            color="#3B82F6"
            trend="neutral"
          />
          <StatCard
            icon="wallet-outline"
            label="Spent"
            value={`$${totalSpending}`}
            subValue="this month"
            color="#10B981"
          />
        </View>
        
        {/* Weekly Chart */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Drinks This Week</Text>
          <BarChart
            data={WEEKLY_DATA}
            maxValue={Math.max(...WEEKLY_DATA.map(d => d.drinks), 1)}
            color="#F59E0B"
          />
        </Card>
        
        {/* Dry Days */}
        <Card style={styles.card}>
          <DryDaysCalendar />
        </Card>
        
        {/* Health Guidelines */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>📊 How You're Doing</Text>
          
          {totalUnits <= 14 ? (
            <Insight
              emoji="✅"
              title="Within guidelines"
              description="The CDC recommends max 14 units/week. You're at {totalUnits.toFixed(1)} units."
              type="positive"
            />
          ) : (
            <Insight
              emoji="⚠️"
              title="Above recommended"
              description="Consider cutting back. The CDC recommends max 14 units/week."
              type="warning"
            />
          )}
          
          <Insight
            emoji="💪"
            title="8 dry days this month"
            description="Taking breaks helps your body recover. Keep it up!"
            type="positive"
          />
          
          <Insight
            emoji="📈"
            title="Most drinks on Saturdays"
            description="You tend to drink more on weekends. That's pretty normal!"
            type="neutral"
          />
        </Card>
        
        {/* Goals Section */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Your Goals</Text>
          
          <View style={styles.goalItem}>
            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle}>Weekly drink limit</Text>
              <Text style={styles.goalProgress}>{totalDrinks} / 10 drinks</Text>
            </View>
            <View style={styles.goalBar}>
              <View 
                style={[
                  styles.goalBarFill,
                  { 
                    width: `${Math.min((totalDrinks / 10) * 100, 100)}%`,
                    backgroundColor: totalDrinks <= 10 ? '#10B981' : '#EF4444',
                  },
                ]} 
              />
            </View>
          </View>
          
          <View style={styles.goalItem}>
            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle}>Monthly budget</Text>
              <Text style={styles.goalProgress}>${totalSpending} / $200</Text>
            </View>
            <View style={styles.goalBar}>
              <View 
                style={[
                  styles.goalBarFill,
                  { 
                    width: `${Math.min((totalSpending / 200) * 100, 100)}%`,
                    backgroundColor: totalSpending <= 200 ? '#10B981' : '#EF4444',
                  },
                ]} 
              />
            </View>
          </View>
          
          <View style={styles.goalItem}>
            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle}>Dry days this week</Text>
              <Text style={styles.goalProgress}>3 / 3 days ✓</Text>
            </View>
            <View style={styles.goalBar}>
              <View 
                style={[styles.goalBarFill, { width: '100%', backgroundColor: '#10B981' }]} 
              />
            </View>
          </View>
          
          <TouchableOpacity style={styles.editGoalsButton}>
            <Ionicons name="settings-outline" size={18} color="#6B7280" />
            <Text style={styles.editGoalsText}>Edit Goals</Text>
          </TouchableOpacity>
        </Card>
        
        {/* Resources */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>📚 Resources</Text>
          <TouchableOpacity style={styles.resourceLink}>
            <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
            <Text style={styles.resourceText}>Understanding alcohol units</Text>
            <Ionicons name="open-outline" size={16} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.resourceLink}>
            <Ionicons name="heart-outline" size={20} color="#EF4444" />
            <Text style={styles.resourceText}>CDC alcohol guidelines</Text>
            <Ionicons name="open-outline" size={16} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.resourceLink}>
            <Ionicons name="call-outline" size={20} color="#10B981" />
            <Text style={styles.resourceText}>SAMHSA helpline</Text>
            <Ionicons name="open-outline" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </Card>
      </ScrollView>
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
  periodToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  periodButtonActive: {
    backgroundColor: '#FEF3C7',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  periodTextActive: {
    color: '#D97706',
    fontWeight: '600',
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 40) / 2,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  statSubValue: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  
  // Cards
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  
  // Chart
  chart: {
    marginTop: 8,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barContainer: {
    alignItems: 'center',
  },
  bar: {
    height: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  
  // Calendar
  calendarSection: {},
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  dryDaysBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dryDaysCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065F46',
  },
  dryDaysLabel: {
    fontSize: 12,
    color: '#065F46',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarDay: {
    width: (width - 80) / 7 - 8,
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calendarDayDry: {
    backgroundColor: '#D1FAE5',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  calendarDayTextDry: {
    color: '#065F46',
  },
  checkMark: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Insights
  insight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  insightEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  insightText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  insightDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  
  // Goals
  goalItem: {
    marginBottom: 16,
  },
  goalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 14,
    color: '#374151',
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  goalBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  goalBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  editGoalsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    marginTop: 8,
  },
  editGoalsText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Resources
  resourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  resourceText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
});
