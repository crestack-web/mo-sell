import React from 'react';
import type { ThemeComponents, ThemeProductCardProps, ThemeCollectionCardProps, ThemeHeroProps, ThemeProductPageProps } from '../types';
import { ProductCardWithTheme } from './ProductCard';
import { CollectionCardWithTheme } from './CollectionCard';
import { HeroWithTheme } from './Hero';
import { ProductPageWithTheme } from './ProductPage';

export function makeTheme(id: string): ThemeComponents {
  return {
    ProductCard: (props: ThemeProductCardProps) => <ProductCardWithTheme themeId={id} {...props} />,
    CollectionCard: (props: ThemeCollectionCardProps) => <CollectionCardWithTheme themeId={id} {...props} />,
    Hero: (props: ThemeHeroProps) => <HeroWithTheme themeId={id} {...props} />,
    ProductPage: (props: ThemeProductPageProps) => <ProductPageWithTheme themeId={id} {...props} />,
    cssClass: `theme-${id}`,
  };
}
