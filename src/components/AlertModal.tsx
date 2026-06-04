import React, {useEffect, useRef} from 'react';
import {Modal, View, Pressable, Animated} from 'react-native';
import {AppText} from './AppText';
import {GlassView} from './GlassView';

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: string;
  buttonText?: string;
  onClose: () => void;
}

export function AlertModal({
  visible,
  title,
  message,
  icon = '📌',
  buttonText = 'Tamam',
  onClose,
}: AlertModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.85);
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
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 32,
        }}>
        <Animated.View
          style={{
            width: '100%',
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          }}>
          <GlassView
            intensity="heavy"
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(0, 212, 255, 0.15)',
              paddingVertical: 32,
              paddingHorizontal: 24,
              alignItems: 'center',
            }}>
            
            {/* Icon circle */}
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(0, 212, 255, 0.2)',
              }}>
              <AppText style={{fontSize: 24}}>{icon}</AppText>
            </View>

            {/* Glow */}
            <View
              style={{
                position: 'absolute',
                top: -40,
                right: -40,
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: 'rgba(0, 212, 255, 0.04)',
              }}
            />

            {/* Title */}
            <AppText
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 8,
              }}>
              {title}
            </AppText>

            {/* Message */}
            <AppText
              style={{
                fontSize: 13,
                color: 'rgba(255, 255, 255, 0.6)',
                textAlign: 'center',
                lineHeight: 20,
                marginBottom: 24,
              }}>
              {message}
            </AppText>

            {/* Button */}
            <Pressable
              onPress={onClose}
              style={({pressed}) => ({
                backgroundColor: pressed
                  ? 'rgba(0, 212, 255, 0.2)'
                  : 'rgba(0, 212, 255, 0.12)',
                paddingHorizontal: 28,
                paddingVertical: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(0, 212, 255, 0.2)',
                width: '100%',
                alignItems: 'center',
                transform: [{scale: pressed ? 0.97 : 1}],
              })}>
              <AppText
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: '#00D4FF',
                }}>
                {buttonText}
              </AppText>
            </Pressable>
          </GlassView>
        </Animated.View>
      </View>
    </Modal>
  );
}
