export type Size = 'sm' | 'md' | 'lg' | 'xl';
export type Color = 'blue' | 'yellow' | 'green' | 'indigo' | 'white';
export type Direction = 'row' | 'column';

export const SIZE_CLASSES: Record<Size, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-4',
  lg: 'w-10 h-10 border-4',
  xl: 'w-12 h-12 border-4',
};

export const COLOR_CLASSES: Record<Color, string> = {
  blue: 'border-blue-500 border-t-transparent',
  yellow: 'border-yellow-500 border-t-transparent',
  green: 'border-green-500 border-t-transparent',
  indigo: 'border-indigo-500 border-t-transparent',
  white: 'border-white border-t-transparent',
};

export const TEXT_COLOR_CLASSES: Record<Color, string> = {
  blue: 'text-gray-500',
  yellow: 'text-gray-500',
  green: 'text-gray-500',
  indigo: 'text-gray-500',
  white: 'text-white',
};
