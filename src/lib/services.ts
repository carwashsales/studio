export const SERVICE_TYPES = {
    'full-wash': {
        name: 'Full Wash',
        needsSize: true,
        hasCoupon: true,
        prices: {
            small: { price: 20, commission: 8, couponCommission: 6 },
            medium: { price: 25, commission: 10, couponCommission: 7 },
            large: { price: 30, commission: 12, couponCommission: 8 },
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
