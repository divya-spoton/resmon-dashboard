import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Droplets, AlertTriangle, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import StatsCards from '../components/dashboard/StatsCards';
import Heading from '../components/dashboard/Heading';
import { parseNumberSafe, formatCorrosion, formatMetalLoss, tooltipFormatter } from '../utils/formatters';
import States from '../components/dashboard/States';
import useDashboardData from '../hooks/useDashboardData';
import Filters from '../components/dashboard/Filters';
import AdvancedControls from '../components/dashboard/AdvancedControls';
import CorrosionChart from '../components/dashboard/CorrosionChart';
import ResistanceChart from '../components/dashboard/ResistanceChart';
import OutliersTable from '../components/dashboard/OutliersTable';
import ReadingsTable from '../components/dashboard/ReadingsTable';

const OUTLIERS_PER_PAGE = 50;
const READINGS_PER_PAGE = 20;

const Dashboard = ({ data: propData }) => {
    const { bluetoothData: fetchedData, deviceList = [], loading, error } = useData();
    const data = propData || fetchedData;

    const [selectedDevice, setSelectedDevice] = useState('');
    const { isDark, colors } = useTheme();
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [maxPoints, setMaxPoints] = useState(100);
    const [corrosionThreshold, setCorrosionThreshold] = useState('');
    const [metalLossThreshold, setMetalLossThreshold] = useState('');
    const [resistanceThresholdMin, setResistanceThresholdMin] = useState('');
    const [resistanceThresholdMax, setResistanceThresholdMax] = useState('');
    const [outlierPage, setOutlierPage] = useState(1);
    const [tablePage, setTablePage] = useState(1);
    const [controlsOpen, setControlsOpen] = useState(true);

    const devices = useMemo(() => (deviceList || []).map(d => d.id), [deviceList]);

    useEffect(() => {
        if (devices.length > 0 && !selectedDevice) setSelectedDevice(devices[0]);
    }, [devices, selectedDevice]);

    useEffect(() => {
        setTablePage(1);
    }, [selectedDevice, dateFrom, dateTo]);
    useEffect(() => {
        setOutlierPage(1);
    }, [corrosionThreshold, metalLossThreshold, resistanceThresholdMin, resistanceThresholdMax]);

    const resetControls = () => {
        setCorrosionThreshold(''); setMetalLossThreshold(''); setResistanceThresholdMin(''); setResistanceThresholdMax('');
        setMaxPoints(100);
    };

    const {
        filtered, sortedAsc, sortedDesc, tableData, chartData, outlierData, stats
    } = useDashboardData({
        data,
        selectedDevice,
        dateFrom,
        dateTo,
        maxPoints,
        corrosionThreshold,
        metalLossThreshold,
        resistanceThresholdMin,
        resistanceThresholdMax,
        tablePage,
        readingsPerPage: READINGS_PER_PAGE,
        outliersPerPage: OUTLIERS_PER_PAGE
    });


    if (loading || error || !data || (Array.isArray(data) && data.length === 0)) {
        return <States loading={loading} error={error} data={data} colors={colors} />;
    }

    return (
        <div className={`min-h-screen ${colors.bg}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Heading colors={colors} />

                <Filters
                    devices={devices}
                    selectedDevice={selectedDevice}
                    setSelectedDevice={setSelectedDevice}
                    dateFrom={dateFrom} setDateFrom={setDateFrom}
                    dateTo={dateTo} setDateTo={setDateTo}
                    colors={colors}
                    setControlsOpen={setControlsOpen}
                    controlsOpen={controlsOpen}
                />

                {/* Advanced Controls (collapsible) */}
                <AdvancedControls
                    colors={colors}
                    controlsOpen={controlsOpen}
                    setControlsOpen={setControlsOpen}
                    resetControls={resetControls}
                    maxPoints={maxPoints}
                    setMaxPoints={setMaxPoints}
                    corrosionThreshold={corrosionThreshold}
                    setCorrosionThreshold={setCorrosionThreshold}
                    metalLossThreshold={metalLossThreshold}
                    setMetalLossThreshold={setMetalLossThreshold}
                    resistanceThresholdMin={resistanceThresholdMin}
                    setResistanceThresholdMin={setResistanceThresholdMin}
                    resistanceThresholdMax={resistanceThresholdMax}
                    setResistanceThresholdMax={setResistanceThresholdMax}
                    outlierCount={outlierData.length}
                />

                {stats && (<StatsCards stats={stats} />)}

                {/* Charts */}
                {!(dateFrom && dateTo) ? (
                    <div className={`mb-8 p-6 rounded-xl border ${colors.cardBorder} ${colors.cardBg} text-center`}>
                        <p className={`${colors.textTertiary}`}>Select a date range to view charts.</p>
                    </div>
                ) : chartData.length === 0 ? (
                    <div className={`h-full p-12 flex items-center justify-center ${colors.cardBg} rounded-xl border ${colors.cardBorder}`}>
                        <p className={`${colors.textTertiary}`}>No data available for the selected filters.</p>
                    </div>
                ) : (
                    <div className="mb-8 grid grid-cols-1 gap-6">
                        <CorrosionChart chartData={chartData} corrosionThreshold={corrosionThreshold} colors={colors} isDark={isDark} />
                        <ResistanceChart chartData={chartData} resistanceThresholdMin={resistanceThresholdMin} resistanceThresholdMax={resistanceThresholdMax} colors={colors} isDark={isDark} />
                        <OutliersTable
                            outlierData={outlierData}
                            colors={colors}
                            corrosionThreshold={corrosionThreshold}
                            metalLossThreshold={metalLossThreshold}
                            resistanceThresholdMin={resistanceThresholdMin}
                            resistanceThresholdMax={resistanceThresholdMax}
                            outlierPage={outlierPage}
                            setOutlierPage={setOutlierPage}
                            OUTLIERS_PER_PAGE={OUTLIERS_PER_PAGE}
                        />
                    </div>
                )}

                {/* Data Table */}
                <ReadingsTable
                    tableData={tableData}
                    filteredLength={filtered.length}
                    tablePage={tablePage}
                    setTablePage={setTablePage}
                    readingsPerPage={READINGS_PER_PAGE}
                    colors={colors}
                />

            </div>
        </div>
    );
};

export default Dashboard;
