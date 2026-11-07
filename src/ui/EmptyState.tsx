import React from 'react';
import {View, Pressable} from 'react-native';
import {MapPin} from 'lucide-react-native';
import {useTheme} from '../theme/ThemeProvider';
import {Text} from './Text';

interface EmptyStateProps {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

/**
 * Ekranın boş kaldığı durumlar için (ör. konum seçilmemiş).
 *
 * Boş ekran bırakmak yerine ne olduğunu ve ne yapılacağını söyler.
 */
export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  const {palette, spacing} = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xxxl,
      }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: palette.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xl,
        }}>
        {icon ?? <MapPin size={24} color={palette.accent} />}
      </View>

      <Text variant="title" style={{textAlign: 'center'}}>
        {title}
      </Text>

      <Text
        variant="caption"
        tone="muted"
        style={{textAlign: 'center', marginTop: spacing.sm, maxWidth: 280}}>
        {body}
      </Text>

      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={({pressed}) => ({
            marginTop: spacing.xl,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.xl,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: palette.hairlineStrong,
            backgroundColor: pressed ? palette.accentSoft : 'transparent',
          })}>
          <Text variant="label" tone="accent">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
