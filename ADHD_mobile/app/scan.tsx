import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { dataService } from '@/services/dataService';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  
  // Form State for adding to inventory
  const [quantityCount, setQuantityCount] = useState(1);
  const [notes, setNotes] = useState('');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, []);

  const fetchProductInfo = async (barcode: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
      );
      const data = await response.json();
      
      if (data.status === 1) {
        setProductData(data.product);
        // Pre-fill notes with brand if available
        if (data.product.brands) {
            setNotes(`Brand: ${data.product.brands}`);
        }
      } else {
        Alert.alert("Not Found", "Product not found in database.");
        setScanned(false);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch product data.");
      setScanned(false);
    }
    setLoading(false);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scanned) {
      setScanned(true);
      fetchProductInfo(data);
    }
  };

  const handleAddToInventory = async () => {
    if (!productData) return;

    setLoading(true);

    // Format the "Amount" string (e.g., "2 x 500g")
    const productSize = productData.quantity || '1 unit';
    const finalAmount = `${quantityCount} x ${productSize}`;

    // Default expiry to 14 days from now (since API usually doesn't provide specific batch expiry)
    const today = new Date();
    const futureDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    const newItem = {
      name: productData.product_name || 'Scanned Item',
      amount: finalAmount,
      boughtDate: today.toISOString().split('T')[0],
      expiryDate: futureDate.toISOString().split('T')[0],
      notes: notes
    };

    const result = await dataService.addInventoryItem(newItem);

    setLoading(false);

    if (result.success) {
      Alert.alert("Success", "Item added to inventory!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } else {
      Alert.alert("Error", "Could not save to inventory. Please try again.");
    }
  };

  if (!permission) return <View />;
  
  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: textColor, marginBottom: 20 }}>Camera permission is required</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render Result View (Quantity Selection)
  if (scanned && productData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <ScrollView contentContainerStyle={styles.resultContent}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Item Found!</Text>
          
          {productData.image_url && (
            <Image
              source={{ uri: productData.image_url }}
              style={styles.productImage}
            />
          )}

          <Text style={[styles.productName, { color: textColor }]}>
            {productData.product_name || 'Unknown Product'}
          </Text>
          
          <View style={styles.infoCard}>
             <Text style={styles.infoLabel}>Nutriscore: {productData.nutriscore_grade?.toUpperCase() || 'N/A'}</Text>
             <Text style={styles.infoLabel}>Size: {productData.quantity || 'N/A'}</Text>
          </View>

          {/* Quantity Selector */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>How many to add?</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => setQuantityCount(Math.max(1, quantityCount - 1))}
              >
                <Ionicons name="remove" size={24} color="white" />
              </TouchableOpacity>
              
              <Text style={[styles.quantityText, { color: textColor }]}>{quantityCount}</Text>
              
              <TouchableOpacity 
                style={[styles.quantityButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => setQuantityCount(quantityCount + 1)}
              >
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notes Input */}
          <View style={styles.section}>
             <Text style={[styles.sectionTitle, { color: textColor }]}>Notes</Text>
             <TextInput
                style={[styles.input, { color: textColor, borderColor: '#E0E0E0', backgroundColor: '#F5F5F5' }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes (e.g., brand, flavor)"
                placeholderTextColor="#999"
              />
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                    setScanned(false);
                    setProductData(null);
                    setQuantityCount(1);
                }}
            >
                <Text style={[styles.actionButtonText, { color: '#666' }]}>Scan Again</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.actionButton, styles.confirmButton]}
                onPress={handleAddToInventory}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.actionButtonText}>Add to Inventory</Text>
                )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render Camera View
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <SafeAreaView style={styles.overlay}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="close-circle" size={40} color="white" />
          </TouchableOpacity>
          
          <View style={styles.guideContainer}>
             <View style={styles.scanFrame} />
             <Text style={styles.instructions}>Point camera at barcode</Text>
          </View>
          
          {loading && (
             <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={{ color: 'white', marginTop: 10 }}>Fetching Product...</Text>
             </View>
          )}
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: 20,
    alignSelf: 'flex-end',
  },
  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  instructions: {
    fontSize: 16,
    color: 'white',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden', // iOS fix for borderRadius on Text
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Result Styles
  resultContent: {
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  productImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  productName: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 30,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  section: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  quantityButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 32,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});