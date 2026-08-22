export const OversightHeader = () => {
    return (
        <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Transaction Oversight</h2>
                <p className="text-sm text-muted-foreground">
                    Monitor imports and exports by vessel while keeping transaction-level control over status, remarks, and encoder ownership.
                </p>
            </div>
        </div>
    );
};
