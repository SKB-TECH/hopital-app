export type ReportTransaction = {
    id: string;
    name: string;
    email: string;
    ticketType: string;
    purchaseDate: string;
    status: string;
    amount: number;
};

export type SalesMetrics = {
    totalRevenue: number;
    ticketsSold: number;
    refundedAmount: number;
    payoutsIssued: number;
};
