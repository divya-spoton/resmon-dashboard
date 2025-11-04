const Heading = ({ colors }) => {

    return (
        <div className="mb-6 flex items-start justify-between gap-4">
            <div>
                <h1 className={`text-3xl font-bold ${colors.text} mb-1`}>Dashboard</h1>
                <p className={`${colors.textSecondary}`}>Overview of corrosion, metal loss and probe resistance across devices</p>
            </div>
        </div>
    )
}

export default Heading;