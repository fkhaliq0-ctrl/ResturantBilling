import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function InvoicePrintTemplate({ restaurant, order }) {
  return (
    <View style={styles.container}>
      {restaurant.logoBase64 ? (
        <Image 
          source={{ uri: restaurant.logoBase64 }} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      ) : null}

      <Text style={styles.restaurantName}>{restaurant.name}</Text>
      <Text style={styles.addressText}>{restaurant.address}</Text>
      <Text style={styles.addressText}>Phone: {restaurant.phone}</Text>
      
      <Text style={styles.separator}>------------------------------------------------</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Invoice: #{order.id}</Text>
        <Text style={styles.metaText}>{order.timestamp}</Text>
      </View>
      <Text style={styles.metaText}>Terminal ID: {order.terminalId ?? 'POS-01'}</Text>

      <Text style={styles.separator}>------------------------------------------------</Text>

      <View style={styles.tableHeader}>
        <Text style={[styles.columnText, { flex: 2 }]}>Item</Text>
        <Text style={[styles.columnText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
        <Text style={[styles.columnText, { flex: 1, textAlign: 'right' }]}>Price</Text>
      </View>

      {order.items.map((item, index) => (
        <View key={index} style={styles.itemRow}>
          <Text style={[styles.itemText, { flex: 2 }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.itemText, { flex: 1, textAlign: 'center' }]}>{item.quantity}</Text>
          <Text style={[styles.itemText, { flex: 1, textAlign: 'right' }]}></Text>
        </View>
      ))}

      <Text style={styles.separator}>------------------------------------------------</Text>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Subtotal:</Text>
        <Text style={styles.totalValue}></Text>
      </View>
      {order.tax > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax / GST:</Text>
          <Text style={styles.totalValue}></Text>
        </View>
      )}
      <View style={styles.totalRow}>
        <Text style={styles.grandTotalLabel}>TOTAL:</Text>
        <Text style={styles.grandTotalValue}></Text>
      </View>

      <Text style={styles.separator}>------------------------------------------------</Text>
      
      <Text style={styles.footerText}>Thank you for your visit!</Text>
      <Text style={styles.footerSubText}>Powered by Mehfil-E-Nihari Terminal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', backgroundColor: '#ffffff', padding: 12 },
  logo: { width: 64, height: 64, alignSelf: 'center', marginBottom: 8 },
  restaurantName: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: '#000' },
  addressText: { fontSize: 11, textAlign: 'center', color: '#333', marginVertical: 1 },
  separator: { textAlign: 'center', fontSize: 10, color: '#666', marginVertical: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: 11, color: '#333' },
  tableHeader: { flexDirection: 'row', paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  columnText: { fontSize: 11, fontWeight: 'bold', color: '#000' },
  itemRow: { flexDirection: 'row', marginVertical: 3 },
  itemText: { fontSize: 11, color: '#333' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
  totalLabel: { fontSize: 11, color: '#333' },
  totalValue: { fontSize: 11, color: '#333' },
  grandTotalLabel: { fontSize: 13, fontWeight: 'bold', color: '#000' },
  grandTotalValue: { fontSize: 13, fontWeight: 'bold', color: '#000' },
  footerText: { fontSize: 12, textAlign: 'center', fontWeight: 'bold', marginTop: 6, color: '#000' },
  footerSubText: { fontSize: 9, textAlign: 'center', color: '#666', marginTop: 2 }
});
