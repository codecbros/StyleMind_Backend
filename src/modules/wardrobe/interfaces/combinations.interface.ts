export interface ClothingItem {
  id: string;
  name: string;
  description: string;
  season: string;
  primaryColor: string;
  secondaryColor?: string;
  style: string;
  material: string;
  size: string;
  categories: { id: string }[];
}

export interface Category {
  id: string;
  name: string;
}
