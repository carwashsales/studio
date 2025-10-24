
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  Legend,
} from "recharts";
import * as React from "react";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import type { InventoryItem, Order, CarWashSale } from "@/types";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(207, 70%, 80%)",
  "hsl(145, 63%, 70%)",
  "hsl(43, 74%, 80%)",
];

const costChartConfig = {
  total: { label: "Cost", color: "hsl(var(--accent))" },
} satisfies ChartConfig;

const salesPieChartConfig = {
  "Full Wash": { label: "Full Wash", color: "hsl(var(--chart-1))" },
  "Outside Only": { label: "Outside Only", color: "hsl(var(--chart-2))" },
  "Interior Only": { label: "Interior Only", color: "hsl(var(--chart-3))" },
  "Water Only": { label: "Water Only", color: "hsl(var(--chart-4))" },
  "Engine Wash Only": { label: "Engine Wash Only", color: "hsl(var(--chart-5))" },
  "Mirrors Only": { label: "Mirrors Only", color: "hsl(207, 70%, 80%)" },
  "Carpets Covering": { label: "Carpets Covering", color: "hsl(145, 63%, 70%)" },
  "Carpet Cleaning": { label: "Carpet Cleaning", color: "hsl(43, 74%, 80%)" },
  "Air Conditioner Wash": { label: "Air Conditioner Wash", color: "hsl(27, 87%, 80%)" },
  "Wax Add-on": { label: "Wax Add-on", color: "hsl(340, 75%, 80%)" },
  "Other": { label: "Other", color: "hsl(var(--muted))" },
} satisfies ChartConfig;

export default function ReportsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  
  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const inventoryCollection = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, "inventory") : null),
    [firestore, user]
  );
  const ordersCollection = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, "orders") : null),
    [firestore, user]
  );
  const salesCollection = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, "sales") : null),
    [firestore, user]
  );

  const { data: inventoryItems } = useCollection<InventoryItem>(inventoryCollection);
  const { data: orders } = useCollection<Order>(ordersCollection);
  const { data: sales } = useCollection<CarWashSale>(salesCollection);

  const costData = React.useMemo(() => {
    if (!orders) return [];
    const monthlyCosts: { [key: string]: number } = {};
    orders.forEach((order) => {
      const month = format(new Date(order.date), "MMM");
      monthlyCosts[month] = (monthlyCosts[month] || 0) + order.total;
    });
    return Object.entries(monthlyCosts).map(([month, total]) => ({ month, total }));
  }, [orders]);

  const salesByServiceData = React.useMemo(() => {
    if (!sales) return [];
    const serviceSales: { [key: string]: number } = {};
    sales.forEach((sale) => {
      const serviceName = sale.service;
      const mappedService = salesPieChartConfig[serviceName as keyof typeof salesPieChartConfig] 
        ? serviceName 
        : "Other";
      serviceSales[mappedService] = (serviceSales[mappedService] || 0) + sale.amount;
    });
    return Object.entries(serviceSales).map(([service, sales]) => ({
      name: service,
      sales,
      fill: salesPieChartConfig[service as keyof typeof salesPieChartConfig]?.color || 'hsl(var(--muted))'
    }));
  }, [sales]);
  
  const inventoryChartData = React.useMemo(() => {
    if (!inventoryItems) return [];
    return inventoryItems.map((item, index) => ({
        name: item.name,
        quantity: item.quantity,
        fill: COLORS[index % COLORS.length]
    }));
  }, [inventoryItems]);

  const inventoryChartConfig = React.useMemo(() => {
    if (!inventoryItems) return {};
    const config: ChartConfig = {};
    inventoryItems.forEach((item, index) => {
        config[item.name] = {
            label: item.name,
            color: COLORS[index % COLORS.length]
        }
    });
    return config;
  }, [inventoryItems]);


  if (isUserLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Inventory Composition</CardTitle>
          <CardDescription>
            Proportional breakdown of items in your inventory.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ChartContainer config={inventoryChartConfig} className="mx-auto aspect-square h-[300px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
              <Pie data={inventoryChartData} dataKey="quantity" nameKey="name" innerRadius={50} strokeWidth={5}>
                 {inventoryChartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
              </Pie>
              <Legend />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Supply Costs</CardTitle>
          <CardDescription>Monthly supply costs over time.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={costChartConfig} className="h-[300px] w-full">
            <LineChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(val) => `${val}`} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="var(--color-total)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-headline">Sales by Service</CardTitle>
          <CardDescription>
            Breakdown of sales revenue by service type.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
            <ChartContainer config={salesPieChartConfig} className="mx-auto aspect-square h-[350px]">
                <PieChart>
                  <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                      data={salesByServiceData}
                      dataKey="sales"
                      nameKey="name"
                      innerRadius={60}
                      strokeWidth={5}
                  >
                    {salesByServiceData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
            </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

