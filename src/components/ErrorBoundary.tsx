import React, {Component, ReactNode, ErrorInfo} from 'react';
import {View, Pressable, Text} from 'react-native';
import {lightPalette} from '../theme/palette';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Yakalayıcı, ThemeProvider'ın dışında durur: uygulama çöktüğünde tema
 * bağlamı da çökmüş olabilir. Bu yüzden burada açık palet sabit kullanılır.
 */
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
      const palette = lightPalette;

      return (
        <View
          style={{
            flex: 1,
            backgroundColor: palette.background,
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}>
          <Text style={{fontFamily: 'Alegreya-Bold', fontSize: 24, color: palette.ink}}>
            Beklenmeyen bir hata oluştu
          </Text>

          <Text
            style={{
              fontSize: 15,
              lineHeight: 22,
              color: palette.inkMuted,
              marginTop: 10,
            }}>
            Uygulamayı yeniden başlatmayı deneyebilir veya aşağıdaki butonla
            tekrar deneyebilirsiniz.
          </Text>

          <View
            style={{
              backgroundColor: palette.surfaceMuted,
              borderRadius: 12,
              padding: 14,
              marginTop: 24,
            }}>
            <Text
              style={{fontSize: 11, color: palette.inkSubtle, lineHeight: 16}}
              numberOfLines={4}>
              {this.state.error?.message || 'Bilinmeyen hata'}
            </Text>
          </View>

          <Pressable
            onPress={this.handleReset}
            style={({pressed}) => ({
              backgroundColor: palette.accent,
              opacity: pressed ? 0.85 : 1,
              paddingVertical: 14,
              borderRadius: 12,
              marginTop: 24,
              alignItems: 'center',
            })}>
            <Text style={{fontSize: 15, color: palette.background}}>Tekrar dene</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
