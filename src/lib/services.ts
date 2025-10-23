'use client';
import { collection, getDocs, writeBatch, Firestore } from 'firebase/firestore';

export const SERVICE_TYPES = {
    'full-wash': {
        name: 'Full Wash',
        needsSize: true,
        hasCoupon: true,
        prices: {
            small: { price: 20, commission: 8, couponCommission: 4 },
            medium: { price: 25, commission: 10, couponCommission: 5 },
            large: { price: 30, commission: 12, couponCommission: 6 },
            big: { price: 35, commission: 14 },
            'long-gmc': { price: 40, commission: 16 },
            microbus: { price: 45, commission: 18 },
            'long-coaster': { price: 50, commission: 20 },
        },
    },
    'outside-only': {
        name: 'Outside Only',
        needsSize: true,
        hasCoupon: false,
        prices: {
            small: { price: 15, commission: 6 },
            medium: { price: 20, commission: 8 },
            large: { price: 25, commission: 10 },
            big: { price: 30, commission: 12 },
            'long-gmc': { price: 35, commission: 14 },
            microbus: { price: 40, commission: 16 },
            'long-coaster': { price: 45, commission: 18 },
        },
    },
    'interior-only': {
        name: 'Interior Only',
        needsSize: false,
        hasCoupon: false,
        prices: {
            default: { price: 15, commission: 7 },
        },
    },
};

// This function will set up the default services in Firestore if they don't exist.
export async function seedDefaultServices(db: Firestore) {
  const servicesCollection = collection(db, 'services');
  const snapshot = await getDocs(servicesCollection);

  if (snapshot.empty) {
    console.log('No services found, seeding default services...');
    const batch = writeBatch(db);
    Object.entries(SERVICE_TYPES).forEach(([id, serviceData]) => {
      const docRef = doc(servicesCollection, id);
      const data = {
        name: serviceData.name,
        needsSize: serviceData.needsSize,
        hasCoupon: serviceData.hasCoupon,
        prices: serviceData.prices,
        order: Object.keys(SERVICE_TYPES).indexOf(id) // Add order for consistent display
      };
      batch.set(docRef, data);
    });
    await batch.commit();
    console.log('Default services have been seeded.');
  }
}
