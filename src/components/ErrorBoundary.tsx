import React, {Component, ReactNode, ErrorInfo} from 'react';
import {View, Pressable} from 'react-native';
import {AppText} from './AppText';

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
        <View style={{flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32}}>
          {/* Icon */}
          <View style={{width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,107,53,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24}}>
            <AppText style={{fontSize: 36}}>⚠️</AppText>
          </View>

          {/* Title */}
          <AppText style={{fontSize: 22, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 8}}>
            Beklenmeyen Bir Hata Oluştu
          </AppText>

          {/* Description */}
          <AppText style={{fontSize: 14, color: '#B0B0B0', textAlign: 'center', lineHeight: 20, marginBottom: 32}}>
            Üzgünüz, bir şeyler ters gitti. Uygulamayı yeniden başlatmayı deneyebilir veya aşağıdaki butona tıklayarak tekrar deneyebilirsiniz.
          </AppText>

          {/* Error detail (collapsible) */}
          <View style={{backgroundColor: '#1C1D21', borderRadius: 12, padding: 16, width: '100%', marginBottom: 24, borderWidth: 1, borderColor: '#2A2A2A'}}>
            <AppText style={{fontSize: 11, color: '#6B6B6B', fontFamily: 'monospace', lineHeight: 16}} numberOfLines={4}>
              {this.state.error?.message || 'Bilinmeyen hata'}
            </AppText>
          </View>

          {/* Retry button */}
          <Pressable
            onPress={this.handleReset}
            style={{
              backgroundColor: '#00FF66',
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 16,
              width: '100%',
              alignItems: 'center',
            }}>
            <AppText style={{fontSize: 16, fontWeight: '700', color: '#000000'}}>
              Tekrar Dene
            </AppText>
          </Pressable>

          {/* Restart hint */}
          <AppText style={{fontSize: 12, color: '#6B6B6B', textAlign: 'center', marginTop: 20}}>
            Hata devam ederse uygulamayı kapatıp tekrar açın
          </AppText>
        </View>
      );
    }

    return this.props.children;
  }
}
