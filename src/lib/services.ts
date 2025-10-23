'use client';
import { collection, doc, getDocs, writeBatch, Firestore } from 'firebase/firestore';

export const SERVICE_TYPES = {
    'full-wash': {
        name: 'Full Wash',
        needsSize: true,
        hasCoupon: true,
        order: 1,
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
        order: 2,
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
        order: 3,
        prices: {
            default: { price: 15, commission: 7 },
        },
    },
    'water-only': {
        name: 'Water Only',
        needsSize: false,
        hasCoupon: false,
        order: 4,
        prices: {
            default: { price: 10, commission: 4 },
        },
    },
    'engine-wash-only': {
        name: 'Engine Wash Only',
        needsSize: false,
        hasCoupon: false,
        order: 5,
        prices: {
            default: { price: 25, commission: 10 },
        },
    },
    'mirrors-only': {
        name: 'Mirrors Only',
        needsSize: false,
        hasCoupon: false,
        order: 6,
        prices: {
            default: { price: 5, commission: 2 },
        },
    },
    'carpets-covering': {
        name: 'Carpets Covering',
        needsSize: false,
        hasCoupon: false,
        order: 7,
        prices: {
            default: { price: 5, commission: 2 },
        },
    },
    'carpet-cleaning': {
        name: 'Carpet Cleaning',
        needsSize: false,
        hasCoupon: false,
        order: 8,
        prices: {
            default: { price: 20, commission: 8 },
        },
    },
    'air-conditioner-wash': {
        name: 'Air Conditioner Wash',
        needsSize: false,
        hasCoupon: false,
        order: 9,
        prices: {
            default: { price: 30, commission: 12 },
        },
    },
    'wax-add-on': {
        name: 'Wax Add-on',
        needsSize: false,
        hasCoupon: false,
        order: 10,
        prices: {
            default: { price: 5, commission: 2 },
        }
    }
};

// This function will set up the default services in Firestore if they don't exist.
export async function seedDefaultServices(db: Firestore) {
  const servicesCollection = collection(db, 'services');
  const snapshot = await getDocs(servicesCollection);
  const existingServiceIds = snapshot.docs.map(doc => doc.id);
  const defaultServiceIds = Object.keys(SERVICE_TYPES);

  const missingServiceIds = defaultServiceIds.filter(id => !existingServiceIds.includes(id));

  if (missingServiceIds.length > 0) {
    console.log('Missing services found, seeding them now...');
    const batch = writeBatch(db);
    missingServiceIds.forEach((id) => {
      const serviceData = (SERVICE_TYPES as any)[id];
      if (serviceData) {
        const docRef = doc(servicesCollection, id);
        batch.set(docRef, serviceData);
      }
    });
    await batch.commit();
    console.log('Missing default services have been seeded.');
  } else {
    console.log('All default services already exist in Firestore.');
  }
}
