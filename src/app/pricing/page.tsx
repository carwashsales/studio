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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { seedDefaultServices } from '@/lib/services';
import { useSettings } from '@/context/settings-context';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import SidebarNav from "@/components/sidebar-nav";
import Header from "@/components/header";


const EditableCell = ({ value, onSave, isEditable = true }: { value: number; onSave: (newValue: number) => void, isEditable?: boolean }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [currentValue, setCurrentValue] = React.useState(value);
  const { currencySymbol } = useSettings();

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
      {value.toFixed(2)} <span className="ml-1 font-semibold">{currencySymbol}</span>
    </div>
  );
};


function PricingPageContent() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = React.useState(false);

  const servicesQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'users', user.uid, 'services'), orderBy('order')) : null),
    [firestore, user]
  );
  const { data: services, isLoading } = useCollection<ServicePrice>(servicesQuery);

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  React.useEffect(() => {
    const handleSeeding = async () => {
        if (firestore && user && !isLoading && services && services.length === 0 && !isSeeding) {
            setIsSeeding(true);
            toast({
                title: 'Setting up your services...',
                description: 'Please wait while we create the default service prices for your account.',
            });
            await seedDefaultServices(firestore, user.uid);
            // Data will be re-fetched by useCollection automatically.
            setIsSeeding(false);
        }
    };
    handleSeeding();
  }, [firestore, user, services, isLoading, isSeeding, toast]);
  
  const handleUpdate = (serviceId: string, updatedData: Partial<ServicePrice>) => {
    if (!firestore || !user) return;
    const serviceRef = doc(firestore, 'users', user.uid, 'services', serviceId);
    setDocumentNonBlocking(serviceRef, updatedData, { merge: true });
    toast({
      title: 'Service Updated',
      description: 'The service details have been successfully updated.',
    });
  };

  if (isUserLoading || !user || isLoading || isSeeding) {
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
                        {service.hasCoupon ? (
                           <EditableCell 
                              value={details.couponCommission ?? 0}
                              onSave={(newValue) => handleUpdate(service.id, { prices: { ...service.prices, [size]: { ...details, couponCommission: newValue } } })}
                           />
                        ) : (
                          <Badge variant="outline" className="ml-2">N/A</Badge>
                        )}
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


export default function PricingPage() {
    return (
        <SidebarProvider>
            <SidebarNav />
            <SidebarInset>
                <Header />
                <main className="p-4 sm:p-6 lg:p-8">
                    <PricingPageContent />
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
