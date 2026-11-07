import React, {useEffect, useRef} from 'react';
import {Modal, View, Pressable, Animated} from 'react-native';
import {AlertTriangle} from 'lucide-react-native';
import {useTheme} from '../theme/ThemeProvider';
import {Text} from '../ui/Text';

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: React.ReactNode;
  buttonText?: string;
  onClose: () => void;
}

export function AlertModal({
  visible,
  title,
  message,
  icon,
  buttonText = 'Tamam',
  onClose,
}: AlertModalProps) {
  const {palette, radius, spacing} = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 9,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.96);
    }
  }, [visible, fadeAnim, scaleAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: palette.overlay,
          justifyContent: 'center',
          paddingHorizontal: spacing.xxl,
        }}>
        <Animated.View
          style={{opacity: fadeAnim, transform: [{scale: scaleAnim}]}}>
          <View
            style={{
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: palette.hairlineStrong,
              paddingVertical: spacing.xxl,
              paddingHorizontal: spacing.xl,
              alignItems: 'center',
              backgroundColor: palette.surface,
            }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: palette.accentSoft,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.lg,
              }}>
              {icon || (
                <AlertTriangle size={22} color={palette.accent} strokeWidth={2} />
              )}
            </View>

            <Text variant="title" style={{textAlign: 'center'}}>
              {title}
            </Text>

            <Text
              variant="caption"
              tone="muted"
              style={{textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl}}>
              {message}
            </Text>

            <Pressable
              onPress={onClose}
              style={({pressed}) => ({
                backgroundColor: pressed ? palette.accentSoft : 'transparent',
                paddingVertical: spacing.md,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: palette.hairlineStrong,
                width: '100%',
                alignItems: 'center',
              })}>
              <Text variant="label" tone="accent">
                {buttonText}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
