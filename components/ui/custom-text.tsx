import { cssInterop } from 'nativewind';
import React from 'react';
import { Text, TextProps } from 'react-native';
import { useSettings } from '../../hooks/use-settings';

// 1. Buat komponen dasar yang HANYA menerima props standar React Native (tanpa className)
const CustomTextBase = ({ style, ...props }: TextProps) => {
  const { fontStyle } = useSettings();

  const getFontFamily = () => {
    switch (fontStyle) {
      case 'serif': return 'serif';
      case 'mono': return 'monospace';
      case 'sans': default: return 'sans-serif';
    }
  };

  return (
    <Text 
      {...props} 
      // Gabungkan font dinamis dengan style hasil kompilasi NativeWind
      style={[{ fontFamily: getFontFamily() }, style]} 
    />
  );
};

// 2. Beritahu NativeWind untuk "MENCEGAT" className, mengonversinya jadi style, 
// lalu mengirimkannya ke CustomTextBase. Dengan begini, Infinite Loop terputus!
cssInterop(CustomTextBase, { className: 'style' });

// 3. Ekspor komponen yang sudah aman untuk dipakai di seluruh aplikasi
export { CustomTextBase as CustomText };
