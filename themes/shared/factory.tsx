import React from 'react';
import type { ThemeComponents, ThemeProductCardProps, ThemeCollectionCardProps, ThemeHeroProps, ThemeProductPageProps, ThemeSearchBarProps, ThemeCollectionPageProps } from '../types';
import { ProductCardWithTheme } from './ProductCard';
import { CollectionCardWithTheme } from './CollectionCard';
import { HeroWithTheme } from './Hero';
import { ProductPageWithTheme } from './ProductPage';
import { SearchBarWithTheme } from './SearchBar';
import { CollectionPageWithTheme } from './CollectionPage';

export function makeTheme(id: string): ThemeComponents {
  return {
    ProductCard: (props: ThemeProductCardProps) => <ProductCardWithTheme themeId={id} {...props} />,
    CollectionCard: (props: ThemeCollectionCardProps) => <CollectionCardWithTheme themeId={id} {...props} />,
    Hero: (props: ThemeHeroProps) => <HeroWithTheme themeId={id} {...props} />,
    ProductPage: (props: ThemeProductPageProps) => <ProductPageWithTheme themeId={id} {...props} />,
    SearchBar: (props: ThemeSearchBarProps) => <SearchBarWithTheme themeId={id} {...props} />,
    CollectionPage: (props: ThemeCollectionPageProps) => <CollectionPageWithTheme themeId={id} {...props} />,
    cssClass: `theme-${id}`,
  };
}
