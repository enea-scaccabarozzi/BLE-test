import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  ListRenderItemInfo,
} from "react-native";
import DeviceModal from "@/DeviceConnectionModal";
import useBLE from "@/useBLE";
import { Characteristic, Service } from "react-native-ble-plx";

type ServiceWithCharacteristics = {
  service: Service;
  characteristics: Characteristic[];
};

const App: React.FC = () => {
  const {
    allDevices,
    connectedDevice,
    servicesWithCharacteristics, // Updated to get services and characteristics
    connectToDevice,
    requestPermissions,
    scanForPeripherals,
    statusMessage,
  } = useBLE();

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const scanForDevices = async () => {
    const isPermissionsEnabled = await requestPermissions();
    if (isPermissionsEnabled) {
      scanForPeripherals();
    }
  };

  const hideModal = () => {
    setIsModalVisible(false);
  };

  const openModal = async () => {
    await scanForDevices();
    setIsModalVisible(true);
  };

  // Updated with correct types for characteristics
  const renderCharacteristicItem = (characteristic: Characteristic) => (
    <View style={styles.characteristicItem} key={characteristic.uuid}>
      <Text>Characteristic UUID: {characteristic.uuid}</Text>
      <Text>Is Readable: {characteristic.isReadable ? "Yes" : "No"}</Text>
      <Text>
        Is Writable: {characteristic.isWritableWithResponse ? "Yes" : "No"}
      </Text>
    </View>
  );

  // Updated with correct types for services and added index to ensure unique keys
  const renderServiceWithCharacteristics = ({
    item,
    index,
  }: ListRenderItemInfo<ServiceWithCharacteristics>) => (
    <View key={`${item.service.uuid}-${index}`} style={styles.serviceItem}>
      <Text style={styles.serviceTitle}>Service UUID: {item.service.uuid}</Text>
      {item.characteristics.map((char) => renderCharacteristicItem(char))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.connectionWrapper}>
        {connectedDevice ? (
          <>
            <Text style={styles.connectedText}>
              Connected to {connectedDevice.name}
            </Text>
            <Text style={styles.statusText}>{statusMessage}</Text>

            {/* Display Services and Characteristics Grouped */}
            <Text style={styles.sectionTitle}>
              Services and Characteristics
            </Text>
            <FlatList
              data={servicesWithCharacteristics}
              keyExtractor={(item, index) => `${item.service.uuid}-${index}`}
              renderItem={renderServiceWithCharacteristics}
            />
          </>
        ) : (
          <Text style={styles.disconnectedText}>
            No device connected. Please connect to a device.
          </Text>
        )}
      </View>

      <TouchableOpacity onPress={openModal} style={styles.ctaButton}>
        <Text style={styles.ctaButtonText}>
          {connectedDevice ? "Change Device" : "Connect"}
        </Text>
      </TouchableOpacity>

      <DeviceModal
        closeModal={hideModal}
        visible={isModalVisible}
        connectToPeripheral={connectToDevice}
        devices={allDevices}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  connectionWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
  },
  connectedText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "green",
  },
  disconnectedText: {
    fontSize: 18,
    marginBottom: 20,
    color: "red",
  },
  ctaButton: {
    backgroundColor: "#FF6060",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  statusText: {
    fontSize: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
  },
  serviceItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  characteristicItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
});

export default App;
