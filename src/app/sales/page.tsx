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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as React from 'react';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { CarWashSale, Price } from '@/types';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { SarIcon } from '@/components/ui/sar-icon';

export default function SalesPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  
  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const salesCollection = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'sales') : null),
    [firestore, user]
  );
  const servicesCollection = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'services') : null),
    [firestore, user]
  );

  const { data: sales, isLoading: salesLoading } = useCollection<CarWashSale>(salesCollection);
  const { data: services, isLoading: servicesLoading } = useCollection<Price>(servicesCollection);

  const [selectedService, setSelectedService] = React.useState('');
  const [quantity, setQuantity] = React.useState(1);
  const [totalPrice, setTotalPrice] = React.useState('');

  React.useEffect(() => {
    if (selectedService && services) {
      const service = services.find(s => s.name === selectedService);
      if (service) {
        setTotalPrice((service.price * quantity).toFixed(2));
      }
    }
  }, [selectedService, quantity, services]);

  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesCollection || !selectedService || !totalPrice) return;

    const newSale: Omit<CarWashSale, 'id'> = {
      service: selectedService,
      date: new Date().toISOString(),
      amount: parseFloat(totalPrice),
    };

    addDocumentNonBlocking(salesCollection, newSale);
    
    // Reset form
    setSelectedService('');
    setQuantity(1);
    setTotalPrice('');
  };

  if (isUserLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Record a Sale</CardTitle>
            <CardDescription>
              Add a new car wash sales transaction.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleAddSale}>
              <div className="grid gap-2">
                <Label htmlFor="service">Service Type</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicesLoading && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                    {services && services.map((service) => (
                      <SelectItem key={service.id} value={service.name}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Total Price</Label>
                <div className="relative">
                  <Input id="price" type="number" placeholder="0.00" value={totalPrice} readOnly className="pl-7" />
                  <SarIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                Add Sale
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Sales</CardTitle>
            <CardDescription>
              A history of your most recent sales transactions.
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
                {salesLoading && <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow>}
                {sales && sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.service}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {format(new Date(sale.date), 'PPP')}
                    </TableCell>
                    <TableCell className="text-right flex justify-end items-center">
                      {sale.amount.toFixed(2)} <SarIcon className="h-4 w-4 ml-1" />
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
