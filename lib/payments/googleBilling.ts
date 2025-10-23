import { Platform } from 'react-native';
import { userPrefStore } from '../../app/userpref';

// Configure your Google Play product ID here
export const CLOUD_BACKUP_PRODUCT_ID = 'cloud_backup_lifetime';

export type PurchaseResult = {
  success: boolean;
  message?: string;
};

type RNIapModule = typeof import('react-native-iap');

async function loadIap(): Promise<RNIapModule> {
  if (Platform.OS !== 'android') {
    throw new Error('Google billing only supported on Android');
  }
  const iap = await import('react-native-iap');
  return iap as unknown as RNIapModule;
}

export async function initBilling(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const IAP = await loadIap();
  try {
    await IAP.initConnection();
  } catch {}
}

export async function fetchProducts(productIds: string[] = [CLOUD_BACKUP_PRODUCT_ID]) {
  const IAP = await loadIap();
  const products = await IAP.getProducts({ skus: productIds });
  return products;
}

export async function restorePurchases(): Promise<PurchaseResult> {
  try {
    const IAP = await loadIap();
    await initBilling();
    const purchases = await IAP.getAvailablePurchases();
    const existing = purchases?.find((p: any) => p.productId === CLOUD_BACKUP_PRODUCT_ID);
    if (existing) {
      (userPrefStore.getState() as any).setEntitlements({
        cloudBackup: true,
        purchase: {
          productId: existing.productId,
          purchaseToken: (existing as any).purchaseToken ?? (existing as any).transactionId,
          platform: 'android',
          acknowledged: true,
          purchaseTime: Number((existing as any).transactionDate ?? Date.now()),
        },
      });
      return { success: true };
    }
    return { success: false, message: 'No purchases to restore' };
  } catch (e: any) {
    return { success: false, message: e?.message ?? 'Failed to restore' };
  }
}

export async function purchaseCloudBackup(): Promise<PurchaseResult> {
  try {
    const IAP = await loadIap();
    await initBilling();
    await fetchProducts();

    const purchaseUpdated = IAP.purchaseUpdatedListener(async (purchase: import('react-native-iap').Purchase) => {
      try {
        const { productId } = purchase;
        if (productId !== CLOUD_BACKUP_PRODUCT_ID) return;
        if ((purchase as any).purchaseToken || purchase.transactionDate) {
          try {
            await IAP.finishTransaction({ purchase, isConsumable: false });
          } catch {}

          (userPrefStore.getState() as any).setEntitlements({
            cloudBackup: true,
            purchase: {
              productId,
              purchaseToken: (purchase as any).purchaseToken ?? (purchase as any).transactionId,
              platform: 'android',
              acknowledged: true,
              purchaseTime: Number((purchase as any).transactionDate ?? Date.now()),
            },
          });
        }
      } finally {
        purchaseUpdated.remove();
      }
    });

    const purchaseError = IAP.purchaseErrorListener((_error: import('react-native-iap').PurchaseError) => {
      purchaseError.remove();
    });

    await IAP.requestPurchase({ sku: CLOUD_BACKUP_PRODUCT_ID });
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e?.message ?? 'Purchase failed' };
  }
}
