import React, {Component, ReactNode, ErrorInfo} from 'react';
import {View, Pressable} from 'react-native';
import {AppText} from './AppText';
import {colors, radius} from '../theme/tokens';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error: Error): State {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({hasError: false, error: null});
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32}}>
          {/* Icon */}
          <View style={{width: 72, height: 72, borderRadius: 36, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 24}}>
            <AppText style={{fontSize: 36}}>⚠️</AppText>
          </View>

          {/* Title */}
          <AppText style={{fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8}}>
            Beklenmeyen Bir Hata Oluştu
          </AppText>

          {/* Description */}
          <AppText style={{fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 32}}>
            Üzgünüz, bir şeyler ters gitti. Uygulamayı yeniden başlatmayı deneyebilir veya aşağıdaki butona tıklayarak tekrar deneyebilirsiniz.
          </AppText>

          {/* Error detail */}
          <View style={{backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, width: '100%', marginBottom: 24, borderWidth: 1, borderColor: colors.border}}>
            <AppText style={{fontSize: 11, color: colors.textSubtle, fontFamily: 'monospace', lineHeight: 16}} numberOfLines={4}>
              {this.state.error?.message || 'Bilinmeyen hata'}
            </AppText>
          </View>

          {/* Retry button */}
          <Pressable
            onPress={this.handleReset}
            style={({pressed}) => ({
              backgroundColor: colors.accent,
              opacity: pressed ? 0.8 : 1,
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: radius.md,
              width: '100%',
              alignItems: 'center',
            })}>
            <AppText style={{fontSize: 16, fontWeight: '700', color: colors.background}}>
              Tekrar Dene
            </AppText>
          </Pressable>

          {/* Restart hint */}
          <AppText style={{fontSize: 12, color: colors.textSubtle, textAlign: 'center', marginTop: 20}}>
            Hata devam ederse uygulamayı kapatıp tekrar açın
          </AppText>
        </View>
      );
    }

    return this.props.children;
  }
}
