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

export async function getCurrentLocation(): Promise<LocationResult> {
  const hasPermission = await checkLocationPermission();
  if (!hasPermission) {
    const granted = await requestLocationPermission();
    if (!granted) {
      return {success: false, error: 'Konum izni reddedildi'};
    }
  }

  try {
    // Önce yüksek hassasiyet dene (15sn)
    const result = await getPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    });
    return {success: true, ...result};
  } catch {
    // Yüksek hassasiyet başarısız → düşük hassasiyet dene (30sn)
    try {
      const result = await getPosition({
        enableHighAccuracy: false,
        timeout: 30000,
      });
      return {success: true, ...result};
    } catch {
      return {success: false, error: 'Konum alınamadı. GPS sinyali zayıf veya kapalı olabilir.'};
    }
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
