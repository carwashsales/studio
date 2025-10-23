'use client';
import * as React from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { CarWashSale, Staff } from '@/types';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SERVICE_TYPES } from '@/lib/services';
import { useToast } from '@/hooks/use-toast';

type PaymentType = 'coupon' | 'cash' | 'machine' | 'not-paid';

export default function SalesPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Form State
  const [serviceType, setServiceType] = React.useState('');
  const [carSize, setCarSize] = React.useState('');
  const [staffId, setStaffId] = React.useState('');
  const [price, setPrice] = React.useState<number | string>('');
  const [commission, setCommission] = React.useState<number | string>('');
  const [paymentType, setPaymentType] = React.useState<PaymentType | undefined>(undefined);
  const [waxAddOn, setWaxAddOn] = React.useState(false);
  const [errors, setErrors] = React.useState<{ [key: string]: boolean }>({});

  // Firestore Collections
  const salesCollection = useMemoFirebase(() => (firestore && user ? collection(firestore, 'sales') : null), [firestore, user]);
  const staffCollection = useMemoFirebase(() => (firestore && user ? collection(firestore, 'staff') : null), [firestore, user]);
  
  const { data: sales, isLoading: salesLoading } = useCollection<CarWashSale>(salesCollection);
  const { data: staff, isLoading: staffLoading } = useCollection<Staff>(staffCollection);

  const noStaff = !staff || staff.length === 0;
  const serviceConfig = serviceType ? SERVICE_TYPES[serviceType as keyof typeof SERVICE_TYPES] : null;
  const showWaxOption = serviceType === 'full-wash' || serviceType === 'outside-only';

  const resetForm = React.useCallback(() => {
    setServiceType('');
    setCarSize('');
    setStaffId('');
    setPrice('');
    setCommission('');
    setPaymentType(undefined);
    setWaxAddOn(false);
    setErrors({});
  }, []);

  React.useEffect(() => {
    if (!serviceConfig) {
      setPrice(''); setCommission(''); setCarSize(''); setPaymentType(undefined); setWaxAddOn(false);
      return;
    }

    if (!serviceConfig.needsSize) setCarSize('');
    if (!serviceConfig.hasCoupon && paymentType === 'coupon') setPaymentType(undefined);
    if (!showWaxOption) setWaxAddOn(false);

    const priceKey = serviceConfig.needsSize ? carSize : 'default';
    if (!priceKey) {
      setPrice(''); setCommission('');
      return;
    }

    const priceObj = serviceConfig.prices[priceKey];
    if (priceObj) {
      let currentPrice = 0;
      let currentCommission = 0;

      if (paymentType === 'coupon' && serviceConfig.hasCoupon && priceObj.couponCommission !== undefined) {
        currentPrice = 0;
        currentCommission = priceObj.couponCommission;
      } else {
        currentPrice = priceObj.price;
        currentCommission = priceObj.commission;
      }

      if (waxAddOn && showWaxOption) {
        currentPrice += 5; // WAX_PRICE
        currentCommission += 2; // WAX_COMMISSION
      }
      
      setPrice(currentPrice);
      setCommission(currentCommission);
    } else {
      setPrice('');
      setCommission('');
    }
   }, [serviceType, carSize, paymentType, serviceConfig, waxAddOn, showWaxOption]);

  const validateForm = () => {
    const newErrors: { [key: string]: boolean } = {};
    if (!serviceType) newErrors.serviceType = true;
    if (serviceConfig?.needsSize && !carSize) newErrors.carSize = true;
    if (!staffId) newErrors.staffId = true;
    if (!paymentType) newErrors.paymentType = true;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentTypeChange = (method: PaymentType) => {
    setPaymentType(prev => (prev === method ? undefined : method));
    setErrors(prev => ({...prev, paymentType: false}));
  };

  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (noStaff || !validateForm() || !salesCollection || !user) {
      toast({
        title: 'Please fix the errors',
        description: 'Fill out all required fields before submitting.',
        variant: 'destructive',
      });
      return;
    }

    const selectedStaff = staff?.find(s => s.id === staffId);
    if (!selectedStaff) return;
     
    const isPaid = paymentType !== 'not-paid';
    
    const newSale: Omit<CarWashSale, 'id'> = {
      service: serviceConfig?.name || 'Unknown Service',
      staffName: selectedStaff.name,
      carSize: carSize || undefined,
      date: new Date().toISOString(),
      amount: isPaid ? Number(price) : 0,
      commission: Number(commission),
      hasCoupon: paymentType === 'coupon',
      paymentMethod: paymentType,
      waxAddOn,
      isPaid,
    };
    
    addDocumentNonBlocking(salesCollection, newSale);
    resetForm();
    toast({
      title: 'Sale Recorded',
      description: 'The new sale has been successfully added.',
    });
  };

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Record a Sale</CardTitle>
            <CardDescription>Add a new car wash sales transaction.</CardDescription>
          </CardHeader>
          <CardContent>
            {noStaff && (
              <Alert variant="destructive" className="mb-4">
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Please add staff members on the Staff page before recording a sale.
                </AlertDescription>
              </Alert>
            )}
            <form className="space-y-4" onSubmit={handleAddSale}>
              <div className="grid gap-2">
                <Label htmlFor="service-type">Service Type</Label>
                <Select value={serviceType} onValueChange={(v) => { setServiceType(v); setErrors(p => ({...p, serviceType: false}))}} disabled={noStaff}>
                  <SelectTrigger id="service-type" data-invalid={errors.serviceType}>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SERVICE_TYPES).map(([key, srv]) => (
                      <SelectItem key={key} value={key}>{srv.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {serviceConfig?.needsSize && (
                <div className="grid gap-2">
                  <Label htmlFor="car-size">Car Size</Label>
                  <Select value={carSize} onValueChange={(v) => { setCarSize(v); setErrors(p => ({...p, carSize: false}))}} disabled={noStaff}>
                    <SelectTrigger id="car-size" data-invalid={errors.carSize}><SelectValue placeholder="Select car size" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="staff-member">Staff Member</Label>
                <Select value={staffId} onValueChange={(v) => { setStaffId(v); setErrors(p => ({...p, staffId: false}))}} disabled={noStaff}>
                  <SelectTrigger id="staff-member" data-invalid={errors.staffId}>
                    <SelectValue placeholder={staffLoading ? "Loading..." : "Select staff"} />
                  </SelectTrigger>
                  <SelectContent>
                    {staff?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between gap-4">
                <div className="grid gap-2 w-1/2">
                  <Label htmlFor="price">Price</Label>
                  <div className="relative"><Input id="price" value={paymentType === 'not-paid' ? '0.00' : price} readOnly className="pl-8" /><Image src="/sar.png" alt="SAR" width={16} height={16} className="absolute left-2 top-1/2 -translate-y-1/2" /></div>
                </div>
                <div className="grid gap-2 w-1/2">
                  <Label htmlFor="commission">Commission</Label>
                  <div className="relative"><Input id="commission" value={commission} readOnly className="pl-8" /><Image src="/sar.png" alt="SAR" width={16} height={16} className="absolute left-2 top-1/2 -translate-y-1/2" /></div>
                </div>
              </div>

              {showWaxOption && (
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id="wax-add-on" checked={waxAddOn} onCheckedChange={(c) => setWaxAddOn(!!c)} disabled={noStaff} />
                  <Label htmlFor="wax-add-on" className="cursor-pointer flex items-center">Wax Add-on (+5.00 <Image src="/sar.png" alt="SAR" width={12} height={12} className="mx-1" />)</Label>
                </div>
              )}

              <div className="grid gap-3 pt-2 border-t" data-invalid={errors.paymentType}>
                <Label className="font-semibold">Payment Method</Label>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {serviceConfig?.hasCoupon && (
                    <div className="flex items-center gap-2"><Checkbox id="payment-coupon" checked={paymentType === 'coupon'} onCheckedChange={() => handlePaymentTypeChange('coupon')} disabled={noStaff || paymentType === 'not-paid'} /><Label htmlFor="payment-coupon" className="cursor-pointer">Coupon</Label></div>
                  )}
                  <div className="flex items-center gap-2"><Checkbox id="payment-cash" checked={paymentType === 'cash'} onCheckedChange={() => handlePaymentTypeChange('cash')} disabled={noStaff || paymentType === 'coupon'} /><Label htmlFor="payment-cash" className="cursor-pointer">Cash</Label></div>
                  <div className="flex items-center gap-2"><Checkbox id="payment-machine" checked={paymentType === 'machine'} onCheckedChange={() => handlePaymentTypeChange('machine')} disabled={noStaff || paymentType === 'coupon'} /><Label htmlFor="payment-machine" className="cursor-pointer">Machine</Label></div>
                  <div className="flex items-center gap-2"><Checkbox id="payment-not-paid" checked={paymentType === 'not-paid'} onCheckedChange={() => handlePaymentTypeChange('not-paid')} disabled={noStaff} /><Label htmlFor="payment-not-paid" className="cursor-pointer">Not Paid</Label></div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm} disabled={noStaff}>Clear</Button>
                  <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={noStaff}>Add Sale</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Sales</CardTitle>
            <CardDescription>A history of your most recent sales transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead className="hidden sm:table-cell">Staff</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesLoading && <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>}
                {sales?.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.service}</TableCell>
                    <TableCell className="hidden sm:table-cell">{sale.staffName}</TableCell>
                    <TableCell className="hidden md:table-cell">{format(new Date(sale.date), 'PPP')}</TableCell>
                    <TableCell className="text-right flex justify-end items-center">
                      {sale.amount.toFixed(2)} <Image src="/sar.png" alt="SAR" width={16} height={16} className="ml-1" />
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
