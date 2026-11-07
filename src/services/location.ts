import Geolocation from '@react-native-community/geolocation';
import {District, nearestDistrict} from '../data/districts';
import {Platform} from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  Permission,
} from 'react-native-permissions';

Geolocation.setRNConfiguration({
  skipPermissionRequests: true,
  authorizationLevel: 'whenInUse',
  locationProvider: 'auto',
});

export type LocationResult =
  | {success: true; latitude: number; longitude: number}
  | {success: false; error: string};

function getLocationPermission(): Permission {
  if (Platform.OS === 'ios') {
    return PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
  }
  return PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
}

export async function checkLocationPermission(): Promise<boolean> {
  try {
    const status = await check(getLocationPermission());
    return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
  } catch {
    return false;
  }
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const status = await request(getLocationPermission());
    return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
  } catch {
    return false;
  }
}

function getPosition(options: {
  enableHighAccuracy: boolean;
  timeout: number;
}): Promise<{latitude: number; longitude: number}> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      error => reject(error),
      {
        ...options,
        maximumAge: 300000, // 5 minutes cache
      },
    );
  });
}

/**
 * Birden çok konum isteğinden **ilk başarılı** olanı döndürür.
 *
 * Sırayla denemek yanlış: ağ tabanlı konum kapalıysa (uçak modu, ağ konumu
 * izni yok) ilk deneme zaman aşımına kadar boş bekliyor. Paralel yarışta
 * hangi yöntem önce cevap verirse o kullanılır; ikisi de başarısız olursa
 * hata döner.
 */
function firstFulfilled<T>(attempts: Array<Promise<T>>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let pending = attempts.length;
    for (const attempt of attempts) {
      attempt.then(resolve, () => {
        pending -= 1;
        if (pending === 0) {
          reject(new Error('konum alınamadı'));
        }
      });
    }
  });
}

export async function getCurrentLocation(): Promise<LocationResult> {
  const hasPermission = await checkLocationPermission();
  if (!hasPermission) {
    const granted = await requestLocationPermission();
    if (!granted) {
      return {success: false, error: 'Konum izni reddedildi'};
    }
  }

  try {
    // Kaba (ağ/istasyon) ve hassas (GPS) istekler aynı anda başlar. İlçe
    // eşleştirmesi için sokak hassasiyeti gerekmiyor — ilçeler kilometrelerle
    // ayrılı, 100 m'lik sapma sonucu değiştirmiyor. Bu yüzden ilk cevap iyi.
    const result = await firstFulfilled([
      getPosition({enableHighAccuracy: false, timeout: 6000}),
      getPosition({enableHighAccuracy: true, timeout: 15000}),
    ]);
    return {success: true, ...result};
  } catch {
    return {
      success: false,
      error: 'Konum alınamadı. GPS sinyali zayıf veya kapalı olabilir.',
    };
  }
}


export type DistrictDetection =
  | {success: true; district: District}
  | {success: false; error: string};

/**
 * GPS'ten en yakın ilçeyi bulur.
 *
 * Koordinat hiçbir sunucuya gönderilmez: eşleştirme cihazdaki ilçe listesiyle
 * yapılır. GPS yalnızca öneri üretir — vakitler her zaman seçilen ilçenin
 * Diyanet referans noktasından hesaplanır.
 */
export async function detectDistrict(): Promise<DistrictDetection> {
  const position = await getCurrentLocation();
  if (!position.success) {
    return position;
  }

  const district = nearestDistrict(position.latitude, position.longitude);
  if (!district) {
    return {success: false, error: 'Yakınınızda bir ilçe bulunamadı'};
  }

  return {success: true, district};
}
