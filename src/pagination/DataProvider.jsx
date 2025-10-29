import { collection, query, orderBy, onSnapshot, limit, startAfter, getDocs } from 'firebase/firestore';

/**
 * 
 * </div>
 Update Dashboard.js - Add Load More Button
Add this after the data table

{
    hasMore && (
        <div className="mt-6 text-center">
            <button
                onClick={loadMore}
                disabled={loading}
                className={`px-6 py-3 ${colors.cardBg} border ${colors.cardBorder} ${colors.text} rounded-lg hover:bg-cyan-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-500"></div>
                        Loading...
                    </span>
                ) : (
                    `Load More Data (${totalFetched} loaded)`
                )}
            </button>
        </div>
    )
}
            </div >
        </div >
    );
};

3. Add Data Info Display

<div className={`mb-4 px-4 py-3 ${colors.cardBg} border ${colors.cardBorder} rounded-lg flex items-center justify-between`}>
                    <div className="flex items-center gap-4">
                        <span className={`text-sm ${colors.textTertiary}`}>
                            📊 Fetched: <span className="font-semibold">{data?.length || 0}</span> documents
                        </span>
                        <span className={`text-sm ${colors.textTertiary}`}>
                            📈 Filtered: <span className="font-semibold">{filteredData?.length || 0}</span> documents
                        </span>
                        <span className={`text-sm ${colors.textTertiary}`}>
                            📉 Chart: <span className="font-semibold">{chartData?.length || 0}</span> points
                        </span>
                        <span className={`text-sm ${colors.textTertiary}`}>
                            📋 Table: <span className="font-semibold">{tableData?.length || 0}</span> rows
                        </span>
                    </div>
                </div>
 * 
 */

export const DataProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [bluetoothData, setBluetoothData] = useState([]);
    const [bleConfig, setBleConfig] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState(null);

    // Pagination: limit initial fetch
    const INITIAL_LIMIT = 500; // Fetch 500 documents initially
    const LOAD_MORE_LIMIT = 200; // Load 200 more on "Load More"

    useEffect(() => {
        if (!currentUser) {
            setBluetoothData([]);
            setBleConfig([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // Subscribe to bluetooth_data collection with LIMIT
        const bluetoothQuery = query(
            collection(db, 'bluetooth_data'),
            orderBy('data_timestamp', 'desc'),
            limit(INITIAL_LIMIT) // 🔥 CRITICAL: Limit initial fetch
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
                        data_timestamp: docData.data_timestamp?.toDate ? docData.data_timestamp.toDate() :
                            docData.data_timestamp ? new Date(docData.data_timestamp) : null,
                        timestamp: docData.timestamp?.toDate ? docData.timestamp.toDate() :
                            docData.timestamp ? new Date(docData.timestamp) : null,
                        timestamp_upload: docData.timestamp_upload?.toDate ? docData.timestamp_upload.toDate() :
                            docData.timestamp_upload ? new Date(docData.timestamp_upload) : null,
                    };
                });

                setBluetoothData(data);
                setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
                setHasMore(snapshot.docs.length === INITIAL_LIMIT);
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

    // Load more data function
    const loadMore = async () => {
        if (!lastDoc || !hasMore || loading) return;

        setLoading(true);
        try {
            const moreQuery = query(
                collection(db, 'bluetooth_data'),
                orderBy('data_timestamp', 'desc'),
                startAfter(lastDoc),
                limit(LOAD_MORE_LIMIT)
            );

            const snapshot = await getDocs(moreQuery);
            const newData = snapshot.docs.map(doc => {
                const docData = doc.data();
                return {
                    id: doc.id,
                    ...docData,
                    data_timestamp: docData.data_timestamp?.toDate ? docData.data_timestamp.toDate() :
                        docData.data_timestamp ? new Date(docData.data_timestamp) : null,
                    timestamp: docData.timestamp?.toDate ? docData.timestamp.toDate() :
                        docData.timestamp ? new Date(docData.timestamp) : null,
                    timestamp_upload: docData.timestamp_upload?.toDate ? docData.timestamp_upload.toDate() :
                        docData.timestamp_upload ? new Date(docData.timestamp_upload) : null,
                };
            });

            setBluetoothData(prev => [...prev, ...newData]);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
            setHasMore(snapshot.docs.length === LOAD_MORE_LIMIT);
        } catch (err) {
            console.error('Error loading more data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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
        hasMore,
        loadMore,
        totalFetched: bluetoothData.length,
        refetch: () => {
            // Optionally implement manual refetch if needed
        }
    }), [bluetoothData, bleConfig, deviceList, loading, error, hasMore]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};