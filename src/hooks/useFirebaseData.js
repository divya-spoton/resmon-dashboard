import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useBluetoothData = (deviceId = null, limitCount = 500) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                let q = query(
                    collection(db, 'bluetooth_data'),
                    orderBy('data_timestamp', 'desc'),
                    limit(limitCount)
                );

                if (deviceId) {
                    q = query(
                        collection(db, 'bluetooth_data'),
                        where('device_id', '==', deviceId),
                        orderBy('data_timestamp', 'desc'),
                        limit(limitCount)
                    );
                }

                const querySnapshot = await getDocs(q);
                const fetchedData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    data_timestamp: doc.data().data_timestamp?.toDate(),
                    timestamp: doc.data().timestamp?.toDate(),
                    timestamp_upload: doc.data().timestamp_upload?.toDate()
                }));

                setData(fetchedData);
                setError(null);
            } catch (err) {
                setError(err.message);
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [deviceId, limitCount]);

    return { data, loading, error };
};

export const useDeviceConfig = () => {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'ble_config'));
                const fetchedConfigs = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate()
                }));
                setConfigs(fetchedConfigs);
            } catch (err) {
                console.error('Error fetching configs:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchConfigs();
    }, []);

    return { configs, loading };
};