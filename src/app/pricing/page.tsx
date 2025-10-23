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
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import type { Price as ServicePrice } from '@/types';
import { collection, doc, orderBy, query } from 'firebase/firestore';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { seedDefaultServices } from '@/lib/services';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';


const EditableCell = ({ value, onSave, isEditable = true }: { value: number; onSave: (newValue: number) => void, isEditable?: boolean }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [currentValue, setCurrentValue] = React.useState(value);

  React.useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(currentValue);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <Input
          type="number"
          value={currentValue}
          onChange={(e) => setCurrentValue(Number(e.target.value))}
          className="h-8 w-24"
        />
        <Button size="icon" className="h-8 w-8" onClick={handleSave}><Check className="h-4 w-4" /></Button>
        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setIsEditing(false)}><X className="h-4 w-4" /></Button>
      </div>
    );
  }

  return (
    <div onClick={() => isEditable && setIsEditing(true)} className={cn("flex items-center justify-end", {"cursor-pointer": isEditable})}>
      {value.toFixed(2)} <Image src="/sar.png" alt="SAR" width={16} height={16} className="ml-1" />
    </div>
  );
};


export default function PricingPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const servicesQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'services'), orderBy('order')) : null),
    [firestore, user]
  );
  const { data: services, isLoading } = useCollection<ServicePrice>(servicesQuery);

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  React.useEffect(() => {
    if (firestore && user && !isLoading && (!services || services.length === 0)) {
        seedDefaultServices(firestore);
    }
  }, [firestore, user, isLoading, services]);
  
  const handleUpdate = (serviceId: string, updatedData: Partial<ServicePrice>) => {
    if (!firestore) return;
    const serviceRef = doc(firestore, 'services', serviceId);
    setDocumentNonBlocking(serviceRef, updatedData, { merge: true });
    toast({
      title: 'Service Updated',
      description: 'The service details have been successfully updated.',
    });
  };

  if (isUserLoading || !user || isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="font-headline">Service Pricing</CardTitle>
          <CardDescription>
            A breakdown of car wash services and their pricing structure. Click on a value to edit it.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {services?.map((service) => (
            <div key={service.id}>
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold font-headline">{service.name}</h3>
                  <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`coupon-switch-${service.id}`}>Has Coupon</Label>
                        <Switch
                          id={`coupon-switch-${service.id}`}
                          checked={service.hasCoupon}
                          onCheckedChange={(checked) => handleUpdate(service.id, { hasCoupon: checked })}
                        />
                      </div>
                  </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{service.needsSize ? 'Car Size' : 'Service'}</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Coupon Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(service.prices).sort(([, a], [, b]) => (a.price || 0) - (b.price || 0)).map(([size, details]) => (
                    <TableRow key={size}>
                      <TableCell className="font-medium capitalize">{size === 'default' ? service.name : size.replace('-', ' ')}</TableCell>
                      <TableCell className="text-right">
                         <EditableCell 
                            value={details.price} 
                            onSave={(newValue) => handleUpdate(service.id, { prices: { ...service.prices, [size]: { ...details, price: newValue } } })}
                         />
                      </TableCell>
                       <TableCell className="text-right">
                         <EditableCell 
                            value={details.commission} 
                            onSave={(newValue) => handleUpdate(service.id, { prices: { ...service.prices, [size]: { ...details, commission: newValue } } })}
                         />
                      </TableCell>
                      <TableCell className="text-right">
                        <EditableCell 
                          value={details.couponCommission ?? 0}
                          isEditable={service.hasCoupon && details.couponCommission !== undefined}
                          onSave={(newValue) => handleUpdate(service.id, { prices: { ...service.prices, [size]: { ...details, couponCommission: newValue } } })}
                        />
                        {!service.hasCoupon || details.couponCommission === undefined ? <Badge variant="outline" className="ml-2">N/A</Badge> : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
