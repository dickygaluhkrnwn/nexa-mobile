import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { CustomText } from './custom-text';

interface MarkdownTextProps {
  children: string;
  style?: StyleProp<TextStyle>;
  className?: string;
}

export function MarkdownText({ children, style, className }: MarkdownTextProps) {
  if (!children) return null;

  // Regex sederhana untuk memecah teks berdasarkan pola **tebal** atau *miring*
  const parts = children.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  return (
    <CustomText style={style} className={className}>
      {parts.map((part, index) => {
        // Render Teks Tebal (Bold)
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <CustomText key={index} style={[style, { fontWeight: 'bold' }]} className={className}>
              {part.slice(2, -2)}
            </CustomText>
          );
        }
        // Render Teks Miring (Italic)
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return (
            <CustomText key={index} style={[style, { fontStyle: 'italic' }]} className={className}>
              {part.slice(1, -1)}
            </CustomText>
          );
        }
        // Render Teks Biasa
        return (
          <CustomText key={index} style={style} className={className}>
            {part}
          </CustomText>
        );
      })}
    </CustomText>
  );
}