import { Category } from '../models';

export const CATEGORY_META: Record<Category, { icon: string; color: string }> = {
  hydro: { icon: 'water-outline', color: '#1e88e5' },
  geology: { icon: 'diamond-outline', color: '#8d6e63' },
  geotech: { icon: 'layers-outline', color: '#6d4c41' },
  env: { icon: 'leaf-outline', color: '#43a047' },
  safety: { icon: 'shield-checkmark-outline', color: '#e53935' },
  ops: { icon: 'construct-outline', color: '#f57c00' },
  custom: { icon: 'document-text-outline', color: '#607d8b' },
};
