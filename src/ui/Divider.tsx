import React from 'react';
import {View, ViewProps} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';

/** Saç teli ayırıcı. Kart yığını yerine bölümleri bu ayırıyor. */
export function Divider({
  inset = 0,
  strong = false,
  style,
  ...rest
}: ViewProps & {inset?: number; strong?: boolean}) {
  const {palette} = useTheme();

  return (
    <View
      {...rest}
      style={[
        {
          height: 1,
          marginLeft: inset,
          backgroundColor: strong ? palette.hairlineStrong : palette.hairline,
        },
        style,
      ]}
    />
  );
}
