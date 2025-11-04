const States = ({ loading, error, data, colors }) => {
    if (loading) {
        return (
            <div className={`min-h-screen ${colors.bg} flex items-center justify-center`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                    <div className={`${colors.text}`}>Loading dashboard data...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen ${colors.bg} flex items-center justify-center`}>
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <div className="text-red-400 mb-2">Error loading data</div>
                    <div className="text-sm text-gray-500">{error}</div>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className={`min-h-screen ${colors.bg}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className={`${colors.cardBg} rounded-xl p-12 text-center border ${colors.cardBorder}`}>
                        <Droplets className={`w-16 h-16 ${colors.textTertiary} mx-auto mb-4`} />
                        <h3 className={`text-xl font-semibold ${colors.text} mb-2`}>No Data Available</h3>
                        <p className={`${colors.textTertiary}`}>There are no readings from any devices yet.</p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

export default States;