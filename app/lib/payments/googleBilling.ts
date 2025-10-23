// Temporary shim to avoid expo-router warning by providing a default export
// while re-exporting the actual implementation from the root lib folder.
export { CLOUD_BACKUP_PRODUCT_ID, initBilling, fetchProducts, restorePurchases, purchaseCloudBackup } from '../../../lib/payments/googleBilling';

// Expo Router treats any file under app/ as a potential route. Provide a noop default export
// to silence warnings. This component is never used in navigation.
export default function __NonRoute() { return null; }
