'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Package,
  AlertTriangle,
  ShoppingCart,
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import type { InventoryItem, CarWashSale, Order } from '@/types';
import { format, subMonths, getMonth, getYear } from 'date-fns';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';

const chartConfig = {
  sales: {
    label: 'Sales',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

async function seedSampleData(firestore: any, userId: string) {
  const collections = {
    inventory: [
      { name: 'Car Shampoo', category: 'Soaps', quantity: 50 },
      { name: 'Tire Shine', category: 'Chemicals', quantity: 8 },
      { name: 'Microfiber Towels', category: 'Tools', quantity: 150 },
      { name: 'Wax Polish', category: 'Chemicals', quantity: 20 },
      { name: 'Wheel Cleaner', category: 'Chemicals', quantity: 0 },
    ],
    orders: [
        { supplier: 'ChemCo', date: new Date(2023, 10, 15).toISOString(), status: 'Received', total: 450.00 },
        { supplier: 'SupplyPro', date: new Date(2023, 11, 1).toISOString(), status: 'Shipped', total: 200.50 },
        { supplier: 'AutoGoods', date: new Date().toISOString(), status: 'Pending', total: 120.00 },
        { supplier: 'CleanAll', date: new Date(2023, 9, 20).toISOString(), status: 'Cancelled', total: 300.00 },
    ],
    sales: [
        { service: 'Full Wash', staffName: 'Ahmed', carSize: 'medium', date: new Date().toISOString(), amount: 25, commission: 10, hasCoupon: false, paymentMethod: 'cash', waxAddOn: false, isPaid: true },
        { service: 'Outside Only', staffName: 'Mohammed', carSize: 'large', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), amount: 25, commission: 10, hasCoupon: false, paymentMethod: 'machine', waxAddOn: true, isPaid: true },
        { service: 'Interior Only', staffName: 'Fatima', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), amount: 15, commission: 7, hasCoupon: false, paymentMethod: 'cash', waxAddOn: false, isPaid: true },
        { service: 'Full Wash', staffName: 'Yusuf', carSize: 'small', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), amount: 0, commission: 4, hasCoupon: true, paymentMethod: 'coupon', waxAddOn: false, isPaid: true },
    ],
    staff: [
        { name: 'Ahmed' },
        { name: 'Mohammed' },
        { name: 'Fatima' },
        { name: 'Yusuf' },
    ]
  };

  const staffCheckRef = collection(firestore, 'users', userId, 'staff');
  const staffSnapshot = await getDocs(query(staffCheckRef, limit(1)));

  if (staffSnapshot.empty) {
      console.log('User has no staff, seeding all sample data...');
      for (const [colName, data] of Object.entries(collections)) {
          const colRef = collection(firestore, 'users', userId, colName);
          for (const item of data) {
              addDocumentNonBlocking(colRef, item);
          }
      }
      return true; // Indicates that data was seeded
  } else {
      console.log('User already has staff, skipping seed.');
      return false; // Indicates that data was not seeded
  }
}


export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);
  
  // Seed sample data for demonstration
  useEffect(() => {
    if (firestore && user) {
        seedSampleData(firestore, user.uid).then(wasSeeded => {
            if (wasSeeded) {
                toast({
                    title: 'Sample Data Loaded',
                    description: 'We have added some sample data to get you started.',
                });
            }
        });
    }
  }, [firestore, user, toast]);

  const inventoryQuery = useMemoFirebase(() =>
    firestore && user ? collection(firestore, 'users', user.uid, 'inventory') : null
  , [firestore, user]);
  const lowStockQuery = useMemoFirebase(() =>
    firestore && user ? query(collection(firestore, 'users', user.uid, 'inventory'), where('quantity', '<', 10)) : null
  , [firestore, user]);
  const salesQuery = useMemoFirebase(() =>
    firestore && user ? collection(firestore, 'users', user.uid, 'sales') : null
  , [firestore, user]);
  const pendingOrdersQuery = useMemoFirebase(() =>
    firestore && user ? query(collection(firestore, 'users', user.uid, 'orders'), where('status', '==', 'Pending')) : null
  , [firestore, user]);
  const recentSalesQuery = useMemoFirebase(() =>
    firestore && user ? query(collection(firestore, 'users', user.uid, 'sales'), limit(5)) : null
  , [firestore, user]);

  const { data: inventoryItems } = useCollection<InventoryItem>(inventoryQuery);
  const { data: lowStockItems } = useCollection<InventoryItem>(lowStockQuery);
  const { data: salesData } = useCollection<CarWashSale>(salesQuery);
  const { data: pendingOrders } = useCollection<Order>(pendingOrdersQuery);
  const { data: recentSales } = useCollection<CarWashSale>(recentSalesQuery);

  const totalInventoryItems = React.useMemo(() => {
    return inventoryItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  }, [inventoryItems]);

  const monthlySales = React.useMemo(() => {
    if (!salesData) return [];
    
    // 1. Create a template for the last 6 months
    const monthTemplate: { [key: string]: { month: string; sales: number; sortKey: number } } = {};
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const date = subMonths(today, i);
        const monthName = format(date, 'MMM');
        const year = getYear(date);
        const month = getMonth(date);
        const sortKey = year * 100 + month; // e.g., 202407 for July 2024
        monthTemplate[`${year}-${month}`] = { month: monthName, sales: 0, sortKey };
    }

    // 2. Populate sales data into the template
    salesData.forEach(sale => {
      const saleDate = new Date(sale.date);
      const year = getYear(saleDate);
      const month = getMonth(saleDate);
      const key = `${year}-${month}`;
      if (monthTemplate[key]) {
        monthTemplate[key].sales += sale.amount;
      }
    });

    // 3. Convert to array and sort chronologically
    return Object.values(monthTemplate).sort((a, b) => a.sortKey - b.sortKey);
  }, [salesData]);
  
  if (isUserLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid gap-4 md:gap-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalInventoryItems}</div>
          <p className="text-xs text-muted-foreground">
            Total items across all inventory
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Unique Products
          </CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inventoryItems?.length || 0}</div>
          <p className="text-xs text-muted-foreground">
            Total unique items in stock
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lowStockItems?.length || 0}</div>
          <p className="text-xs text-muted-foreground">Items need reordering</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingOrders?.length || 0}</div>
          <p className="text-xs text-muted-foreground">New supply orders</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:col-span-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Sales Overview</CardTitle>
            <CardDescription>
              A summary of car wash sales over the past months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart
                accessibilityLayer
                data={monthlySales}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Sales</CardTitle>
            <CardDescription>
              An overview of the latest sales activities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales?.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">
                      {activity.service}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {format(new Date(activity.date), 'PPP')}
                    </TableCell>
                    <TableCell className="text-right flex justify-end items-center">
                      {activity.amount.toFixed(2)} <Image src="/sar.png" alt="SAR" width={16} height={16} className="ml-1" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    