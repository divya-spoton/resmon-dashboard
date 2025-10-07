const generateMockData = () => {
    const data = [];
    const devices = ['2C:CF:67:B6:DA:16', '2C:CF:67:D1:B9:FE'];

    for (let i = 0; i < 50; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        data.push({
            id: `doc_${i}`,
            device_id: devices[Math.floor(Math.random() * devices.length)],
            device_name: `Pico ${devices[Math.floor(Math.random() * devices.length)]}`,
            data_battery_percentage: 100 - Math.floor(Math.random() * 20),
            data_check_element_resistance: 80,
            data_corrosion_rate: (Math.random() * 2 + 0.5).toFixed(3),
            data_metal_loss: (Math.random() * 0.015).toFixed(6),
            data_probe_resistance: 160 + Math.random() * 30,
            data_probe_status: Math.random() > 0.3 ? 1 : 0,
            data_reference_resistance: 80,
            data_timestamp: date,
            timestamp_upload: new Date(date.getTime() + 60000)
        });
    }

    return data.sort((a, b) => b.data_timestamp - a.data_timestamp);
};

export default generateMockData;