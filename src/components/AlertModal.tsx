import React, {useEffect, useRef} from 'react';
import {Modal, View, Pressable, Animated} from 'react-native';
import {AppText} from './AppText';
import {GlassView} from './GlassView';
import {colors, radius, shadows} from '../theme/tokens';

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: string;
  buttonText?: string;
  onClose: () => void;
}

export function AlertModal({visible, title, message, icon = '📌', buttonText = 'Tamam', onClose}: AlertModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {toValue: 1, duration: 200, useNativeDriver: true}),
        Animated.spring(scaleAnim, {toValue: 1, friction: 8, tension: 100, useNativeDriver: true}),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.85);
    }
  }, [visible, fadeAnim, scaleAnim]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{flex: 1, backgroundColor: colors.blackOverlay, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32}}>
        <Animated.View style={{width: '100%', opacity: fadeAnim, transform: [{scale: scaleAnim}]}}>
          <GlassView
            intensity="heavy"
            style={{
              borderRadius: radius.xl,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.borderStrong,
              paddingVertical: 32,
              paddingHorizontal: 24,
              alignItems: 'center',
              ...shadows.card,
            }}>
            <View
              style={{
                position: 'absolute',
                top: -54,
                right: -54,
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: colors.accentSoft,
              }}
            />

            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: colors.accentSoft,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.borderStrong,
              }}>
              <AppText style={{fontSize: 25}}>{icon}</AppText>
            </View>

            <AppText style={{fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8}}>
              {title}
            </AppText>

            <AppText style={{fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21, marginBottom: 24}}>
              {message}
            </AppText>

            <Pressable
              onPress={onClose}
              style={({pressed}) => ({
                backgroundColor: pressed ? 'rgba(214, 180, 106, 0.18)' : colors.accentSoft,
                paddingHorizontal: 28,
                paddingVertical: 12,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                width: '100%',
                alignItems: 'center',
                transform: [{scale: pressed ? 0.98 : 1}],
              })}>
              <AppText style={{fontSize: 15, fontWeight: '700', color: colors.accent}}>
                {buttonText}
              </AppText>
            </Pressable>
          </GlassView>
        </Animated.View>
      </View>
    </Modal>
  );
}
