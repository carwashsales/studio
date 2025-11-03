
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
  } from '@/components/ui/table';
import { DonutChart } from "@tremor/react";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { CarWashSale, InventoryItem, Order } from "@/types";
import { format, startOfDay, endOfDay } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { List, ListItem } from "@/components/ui/list";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CurrencySymbol } from '@/components/currency-symbol';

type ReportType = 
    | "sales-by-date"
    | "sales-by-service"
    | "sales-by-staff"
    | "profit-loss"
    | "purchases-by-date"
    | "inventory";

const reportsList: { id: ReportType; title: string; description: string, requiresDate: boolean }[] = [
    { id: "sales-by-date", title: "Sales by Date", description: "Detailed list of sales transactions.", requiresDate: true },
    { id: "sales-by-service", title: "Sales by Service", description: "Breakdown of revenue by service type.", requiresDate: true },
    { id: "sales-by-staff", title: "Sales by Staff", description: "Summary of sales performance per staff member.", requiresDate: true },
    { id: "profit-loss", title: "Profit and Loss", description: "Calculate profit after expenses from sales and received orders.", requiresDate: true },
    { id: "purchases-by-date", title: "Purchases by Date", description: "Detailed list of supply orders received and their costs.", requiresDate: true },
    { id: "inventory", title: "Inventory Report", description: "Current stock levels for all items.", requiresDate: false },
];


export default function ReportsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const [activeReport, setActiveReport] = React.useState<ReportType | null>(null);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: startOfDay(new Date(new Date().setDate(1))),
    to: endOfDay(new Date()),
  });
  
  const valueFormatter = (number: number) => {
    return new Intl.NumberFormat("us").format(number).toString();
  };


  const salesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !dateRange?.from || !dateRange?.to) return null;
    return query(
        collection(firestore, "users", user.uid, "sales"),
        where("date", ">=", dateRange.from.toISOString()),
        where("date", "<=", dateRange.to.toISOString())
    );
  }, [firestore, user, dateRange]);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user || !dateRange?.from || !dateRange?.to) return null;
    return query(
        collection(firestore, "users", user.uid, "orders"),
        where("date", ">=", dateRange.from.toISOString()),
        where("date", "<=", dateRange.to.toISOString())
    );
  }, [firestore, user, dateRange]);

  const inventoryQuery = useMemoFirebase(() => 
    (firestore && user ? collection(firestore, 'users', user.uid, "inventory") : null),
    [firestore, user]
  );
  
  const { data: sales, isLoading: salesLoading } = useCollection<CarWashSale>(salesQuery);
  const { data: orders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);
  const { data: inventoryItems, isLoading: inventoryLoading } = useCollection<InventoryItem>(inventoryQuery);

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const renderReportContent = () => {
    if (!activeReport) return null;

    const reportData = reportsList.find(r => r.id === activeReport);
    if (!reportData) return null;

    const showDatePicker = reportData.requiresDate;
    const isLoading = (salesLoading || ordersLoading) && showDatePicker || inventoryLoading && !showDatePicker;

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <Button variant="ghost" onClick={() => setActiveReport(null)} className="mb-2">
                            &larr; Back to Reports
                        </Button>
                        <CardTitle className="font-headline">{reportData.title}</CardTitle>
                        <CardDescription>{reportData.description}</CardDescription>
                    </div>
                    {showDatePicker && <DateRangePicker date={dateRange} onDateChange={setDateRange} />}
                </div>
            </CardHeader>
            <CardContent>
                {isLoading && <p>Loading report data...</p>}
                {!isLoading && renderReportDetails()}
            </CardContent>
        </Card>
    );
  }

  const renderReportDetails = () => {
    switch (activeReport) {
        case "sales-by-date":
            return <SalesByDateTable sales={sales} />;
        case "sales-by-service":
            return <SalesByServiceChart sales={sales} />;
        case "sales-by-staff":
            return <SalesByStaffChart sales={sales} />;
        case "profit-loss":
            return <ProfitLossReport sales={sales} orders={orders} />;
        case "purchases-by-date":
            return <PurchasesByDateTable orders={orders} />;
        case "inventory":
            return <InventoryTable inventory={inventoryItems} />;
        default:
            return <p>Select a report to view.</p>;
    }
  };

  const renderReportList = () => (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline">Reports</CardTitle>
            <CardDescription>Select a report to view detailed information.</CardDescription>
        </CardHeader>
        <CardContent>
            <List>
                {reportsList.map(report => (
                    <ListItem key={report.id} onClick={() => setActiveReport(report.id)} className="cursor-pointer">
                        <div className="flex-1">
                            <p className="font-medium">{report.title}</p>
                            <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </ListItem>
                ))}
            </List>
        </CardContent>
    </Card>
  )

  if (isUserLoading || !user) {
    return <div>Loading...</div>;
  }

  return activeReport ? renderReportContent() : renderReportList();
}


// -- Report Components --

function SalesByDateTable({ sales }: { sales: CarWashSale[] | null }) {
    if (!sales || sales.length === 0) return <p>No sales data for this period.</p>;
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sales.map(sale => (
                    <TableRow key={sale.id}>
                        <TableCell>{format(new Date(sale.date), 'Pp')}</TableCell>
                        <TableCell>{sale.service}</TableCell>
                        <TableCell>{sale.staffName}</TableCell>
                        <TableCell className="capitalize">{sale.paymentMethod?.replace('-',' ')}</TableCell>
                        <TableCell className="text-right flex justify-end items-center gap-1">{sale.amount.toFixed(2)} <CurrencySymbol /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function SalesByServiceChart({ sales }: { sales: CarWashSale[] | null }) {
    const chartData = React.useMemo(() => {
        if (!sales) return [];
        const serviceSales: { [key: string]: number } = {};
        sales.forEach(sale => {
            serviceSales[sale.service] = (serviceSales[sale.service] || 0) + sale.amount;
        });
        return Object.entries(serviceSales).map(([name, value]) => ({ name, value }));
    }, [sales]);

    if (chartData.length === 0) return <p>No sales data for this period.</p>;
    
    const totalAmount = chartData.reduce((acc, item) => acc + item.value, 0);

    const valueFormatter = (number: number) => `${new Intl.NumberFormat("us").format(number).toString()}`;
    
    const renderCustomLabel = () => {
        return (
            <div className="flex flex-col items-center justify-center">
                <span className="font-bold text-2xl flex items-center gap-1">
                    {valueFormatter(totalAmount)}
                    <CurrencySymbol />
                </span>
                <span className="text-muted-foreground text-sm">Total Sales</span>
            </div>
        )
    };


    return (
        <div className="flex flex-col items-center">
            <DonutChart
                data={chartData}
                category="value"
                index="name"
                valueFormatter={valueFormatter}
                label={renderCustomLabel()}
                showLabel={true}
                colors={["cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose", "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal"]}
                className="h-[350px]"
                customTooltip={({ payload, active }) => {
                    if (!active || !payload) return null;
                     const categoryPayload = payload?.[0];
                    if (!categoryPayload) return null;
                    return (
                      <div className="w-56 rounded-tremor-default border border-tremor-border bg-tremor-background p-2 text-tremor-default shadow-tremor-dropdown">
                        <div className="flex flex-1 space-x-2.5">
                          <div style={{ backgroundColor: categoryPayload.color }} className="w-1.5 flex flex-col rounded" />
                          <div className="w-full">
                            <div className="flex items-center justify-between space-x-8">
                              <p className="whitespace-nowrap text-tremor-content">
                                {categoryPayload.name}
                              </p>
                              <p className="whitespace-nowrap font-medium text-tremor-content-strong flex items-center gap-1">
                                {valueFormatter(categoryPayload.value as number)}
                                <CurrencySymbol />
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
            />
             <ul className="mt-4 space-y-2 text-sm text-muted-foreground w-full max-w-md">
                {chartData.map(item => (
                    <li key={item.name} className="flex justify-between items-center">
                        <span>{item.name}</span>
                        <span className="font-medium text-foreground flex items-center gap-1">
                            {((item.value / totalAmount) * 100).toFixed(1)}% 
                            ({valueFormatter(item.value)} <CurrencySymbol />)
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function SalesByStaffChart({ sales }: { sales: CarWashSale[] | null }) {
    const chartData = React.useMemo(() => {
        if (!sales) return [];
        const staffSales: { [key: string]: { sales: number; commission: number } } = {};
        sales.forEach(sale => {
            if (!staffSales[sale.staffName]) {
                staffSales[sale.staffName] = { sales: 0, commission: 0 };
            }
            staffSales[sale.staffName].sales += sale.amount;
            staffSales[sale.staffName].commission += sale.commission;
        });
        return Object.entries(staffSales).map(([name, data]) => ({ name, ...data }));
    }, [sales]);

    if (chartData.length === 0) return <p>No sales data for this period.</p>;
    
    const valueFormatter = (number: number) => `${new Intl.NumberFormat("us").format(number).toString()}`;


    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                    <TableHead className="text-right">Total Commission</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {chartData.map(item => (
                    <TableRow key={item.name}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right flex justify-end items-center gap-1">{valueFormatter(item.sales)}<CurrencySymbol /></TableCell>
                        <TableCell className="text-right flex justify-end items-center gap-1">{valueFormatter(item.commission)}<CurrencySymbol /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function ProfitLossReport({ sales, orders }: { sales: CarWashSale[] | null, orders: Order[] | null }) {
    const reportData = React.useMemo(() => {
        const totalRevenue = sales?.reduce((acc, sale) => acc + sale.amount, 0) || 0;
        const totalCommission = sales?.reduce((acc, sale) => acc + sale.commission, 0) || 0;
        const totalOrderCost = orders?.filter(o => o.status === 'Received').reduce((acc, order) => acc + order.total, 0) || 0;
        const totalExpenses = totalCommission + totalOrderCost;
        const netProfit = totalRevenue - totalExpenses;
        return { totalRevenue, totalCommission, totalOrderCost, totalExpenses, netProfit };
    }, [sales, orders]);

    const valueFormatter = (number: number) => `${new Intl.NumberFormat("us").format(number).toString()}`;


    return (
        <div className="space-y-4">
             <Card>
                <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold flex items-center justify-center gap-1">{valueFormatter(reportData.totalRevenue)}<CurrencySymbol /></p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Total Expenses</p>
                        <p className="text-2xl font-bold text-destructive flex items-center justify-center gap-1">{valueFormatter(reportData.totalExpenses)}<CurrencySymbol /></p>
                    </div>
                     <div>
                        <p className="text-muted-foreground">Commissions Paid</p>
                        <p className="text-lg font-bold flex items-center justify-center gap-1">{valueFormatter(reportData.totalCommission)}<CurrencySymbol /></p>
                    </div>
                     <div>
                        <p className="text-muted-foreground">Net Profit</p>
                        <p className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">{valueFormatter(reportData.netProfit)}<CurrencySymbol /></p>
                    </div>
                </CardContent>
            </Card>
            <SalesByDateTable sales={sales} />
        </div>
    );
}

function PurchasesByDateTable({ orders }: { orders: Order[] | null }) {
    const receivedOrders = React.useMemo(() => orders?.filter(o => o.status === 'Received') || [], [orders]);
    if (receivedOrders.length === 0) return <p>No received orders for this period.</p>;

    const totalCost = receivedOrders.reduce((acc, order) => acc + order.total, 0);
    const valueFormatter = (number: number) => `${new Intl.NumberFormat("us").format(number).toString()}`;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date Received</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {receivedOrders.map(order => (
                    <TableRow key={order.id}>
                        <TableCell>{format(new Date(order.date), 'Pp')}</TableCell>
                        <TableCell>{order.supplier}</TableCell>
                        <TableCell className="text-right flex justify-end items-center gap-1">{valueFormatter(order.total)}<CurrencySymbol /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={2} className="text-right font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold flex justify-end items-center gap-1">{valueFormatter(totalCost)}<CurrencySymbol /></TableCell>
                </TableRow>
            </TableFooter>
        </Table>
    );
}


function InventoryTable({ inventory }: { inventory: InventoryItem[] | null }) {
    if (!inventory) return <p>No inventory data available.</p>;

    const getStatusBadge = (quantity: number) => {
        if (quantity === 0) return <Badge variant="destructive">Out of Stock</Badge>;
        if (quantity < 10) return <Badge className="bg-orange-500 text-white hover:bg-orange-600">Low Stock</Badge>;
        return <Badge className="bg-accent text-accent-foreground">In Stock</Badge>;
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {inventory.map(item => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{getStatusBadge(item.quantity)}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
