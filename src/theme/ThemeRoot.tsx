import React, {useEffect, useState, ReactNode} from 'react';
import {useAppContext} from '../context/AppContext';
import {ThemeProvider} from './ThemeProvider';
import {SunTimes, isNightAt} from './sun';

/** Güneş durumunu dakikada bir yeniden değerlendirir. */
function useNight(sunTimes: SunTimes | null): boolean {
  const [isNight, setIsNight] = useState(() => isNightAt(sunTimes, new Date()));

  useEffect(() => {
    const update = () => setIsNight(isNightAt(sunTimes, new Date()));
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, [sunTimes]);

  return isNight;
}

/**
 * Temayı uygulama durumuna bağlar: vakitler hesaplandığında gün doğumu/batımı
 * bilinir, tema ona göre seçilir.
 */
export function ThemeRoot({children}: {children: ReactNode}) {
  const {sunTimes} = useAppContext();
  const isNight = useNight(sunTimes);

  return <ThemeProvider isDark={isNight}>{children}</ThemeProvider>;
}
