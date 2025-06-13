import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TicketsScreen() {
  const [activeTab, setActiveTab] = useState<'browse' | 'selling'>('browse');

  const sampleTickets = [
    {
      id: 1,
      eventName: 'Spring Concert 2024',
      date: 'March 15, 2024',
      price: 45,
      originalPrice: 60,
      location: 'Campus Auditorium',
      isUrgent: true,
    },
    {
      id: 2,
      eventName: 'Basketball Game vs Rivals',
      date: 'March 20, 2024',
      price: 25,
      originalPrice: 30,
      location: 'Sports Arena',
      isUrgent: false,
    },
  ];

  const TabButton = ({ title, isActive, onPress }: {
    title: string;
    isActive: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const TicketCard = ({ ticket }: { ticket: any }) => (
    <TouchableOpacity style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <Text style={styles.eventName}>{ticket.eventName}</Text>
          <View style={styles.ticketDetails}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.ticketDate}>{ticket.date}</Text>
          </View>
          <View style={styles.ticketDetails}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.ticketLocation}>{ticket.location}</Text>
          </View>
        </View>
        {ticket.isUrgent && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentText}>URGENT</Text>
          </View>
        )}
      </View>
      
      <View style={styles.ticketFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>${ticket.price}</Text>
          <Text style={styles.originalPrice}>${ticket.originalPrice}</Text>
        </View>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="chatbubble" size={16} color="#FFFFFF" />
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Ticket Marketplace</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TabButton
          title="Browse Tickets"
          isActive={activeTab === 'browse'}
          onPress={() => setActiveTab('browse')}
        />
        <TabButton
          title="My Listings"
          isActive={activeTab === 'selling'}
          onPress={() => setActiveTab('selling')}
        />
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'browse' ? (
          <View style={styles.section}>
            {/* Search and Filters */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <Text style={styles.searchPlaceholder}>Search events...</Text>
              </View>
              <TouchableOpacity style={styles.filterButton}>
                <Ionicons name="options" size={20} color="#4F46E5" />
              </TouchableOpacity>
            </View>

            {/* Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
              {['All', 'Concerts', 'Sports', 'Theater', 'Conferences'].map((category) => (
                <TouchableOpacity key={category} style={styles.categoryChip}>
                  <Text style={styles.categoryText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Tickets List */}
            <View style={styles.ticketsContainer}>
              {sampleTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </View>

            {/* Empty State for more tickets */}
            <View style={styles.emptyState}>
              <Ionicons name="ticket-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>More tickets coming soon!</Text>
              <Text style={styles.emptyStateText}>
                Students will be able to buy and sell event tickets safely here.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            {/* My Listings */}
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No listings yet</Text>
              <Text style={styles.emptyStateText}>
                Tap the + button to sell your first ticket
              </Text>
              <TouchableOpacity style={styles.sellButton}>
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.sellButtonText}>Sell a Ticket</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#4F46E5',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  searchPlaceholder: {
    marginLeft: 8,
    fontSize: 16,
    color: '#9CA3AF',
  },
  filterButton: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  ticketsContainer: {
    marginBottom: 20,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ticketInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  ticketDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  ticketDate: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  ticketLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  urgentBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  sellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sellButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 