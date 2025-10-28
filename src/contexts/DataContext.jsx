import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within DataProvider');
    }
    return context;
};

export const DataProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [bluetoothData, setBluetoothData] = useState([]);
    const [bleConfig, setBleConfig] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!currentUser) {
            setBluetoothData([]);
            setBleConfig([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // Subscribe to bluetooth_data collection
        const bluetoothQuery = query(
            collection(db, 'bluetooth_data'),
            orderBy('data_timestamp', 'desc')
        );

        // Subscribe to ble_config collection
        const configQuery = query(collection(db, 'ble_config'));

        const unsubscribeBluetoothData = onSnapshot(
            bluetoothQuery,
            (snapshot) => {
                const data = snapshot.docs.map(doc => {
                    const docData = doc.data();
                    return {
                        id: doc.id,
                        ...docData,
                        // Safely convert Firestore timestamps to Date objects
                        data_timestamp: docData.data_timestamp?.toDate ? docData.data_timestamp.toDate() :
                            docData.data_timestamp ? new Date(docData.data_timestamp) : null,
                        timestamp: docData.timestamp?.toDate ? docData.timestamp.toDate() :
                            docData.timestamp ? new Date(docData.timestamp) : null,
                        timestamp_upload: docData.timestamp_upload?.toDate ? docData.timestamp_upload.toDate() :
                            docData.timestamp_upload ? new Date(docData.timestamp_upload) : null,
                    };
                });
                setBluetoothData(data);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching bluetooth data:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        const unsubscribeConfig = onSnapshot(
            configQuery,
            (snapshot) => {
                const data = snapshot.docs.map(doc => {
                    const docData = doc.data();
                    return {
                        id: doc.id,
                        ...docData,
                        // Safely convert timestamp
                        timestamp: docData.timestamp?.toDate ? docData.timestamp.toDate() :
                            docData.timestamp ? new Date(docData.timestamp) : null,
                    };
                });
                setBleConfig(data);
            },
            (err) => {
                console.error('Error fetching BLE config:', err);
                setError(err.message);
            }
        );

        return () => {
            unsubscribeBluetoothData();
            unsubscribeConfig();
        };
    }, [currentUser]);

    // Memoized computed values
    const deviceList = useMemo(() => {
        const devices = new Map();
        bluetoothData.forEach(entry => {
            if (entry.device_id) {
                devices.set(entry.device_id, {
                    id: entry.device_id,
                    name: entry.device_name || entry.device_id,
                    lastReading: entry.data_timestamp,
                    batteryPercentage: entry.data_battery_percentage
                });
            }
        });
        return Array.from(devices.values());
    }, [bluetoothData]);

    const value = useMemo(() => ({
        bluetoothData,
        bleConfig,
        deviceList,
        loading,
        error,
        refetch: () => {
            // Optionally implement manual refetch if needed
        }
    }), [bluetoothData, bleConfig, deviceList, loading, error]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};