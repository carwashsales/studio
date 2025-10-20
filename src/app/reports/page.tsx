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
} from "recharts";
import { inventoryUsageData, costData, salesByServiceData } from "@/lib/data";

const usageChartConfig = {
  usage: { label: "Usage", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

const costChartConfig = {
  cost: { label: "Cost", color: "hsl(var(--accent))" },
} satisfies ChartConfig;

const salesPieChartConfig = {
  'Basic Wash': { label: 'Basic Wash', color: 'hsl(var(--chart-1))' },
  'Deluxe Wash': { label: 'Deluxe Wash', color: 'hsl(var(--chart-2))' },
  'Premium Detail': { label: 'Premium Detail', color: 'hsl(var(--chart-3))' },
  'Interior Clean': { label: 'Interior Clean', color: 'hsl(var(--chart-4))' },
} satisfies ChartConfig;

export default function ReportsPage() {
  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Inventory Usage</CardTitle>
          <CardDescription>
            Monthly usage of key inventory items.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={usageChartConfig} className="h-[300px] w-full">
            <BarChart data={inventoryUsageData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="usage" fill="var(--color-usage)" radius={8} />
            </BarChart>
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
              <YAxis tickFormatter={(val) => `$${val}`} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="var(--color-cost)"
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
                    nameKey="service"
                    innerRadius={60}
                    strokeWidth={5}
                >
                    {salesByServiceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={salesPieChartConfig[entry.service as keyof typeof salesPieChartConfig]?.color} />
                    ))}
                </Pie>
                </PieChart>
            </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
