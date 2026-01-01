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

export interface QuickGenerationResponse {
  outfit: {
    id: string;
    name: string;
    primaryColor: string;
    secondaryColor: string | null;
    images: {
      id: string;
      url: string;
    }[];
  }[];
  explanation: string;
  occasion: string;
  itemCount: number;
  generatedAt: Date;
}

export interface GenerationSession {
  userId: string;
  occasion: string;
  previousOutfits: {
    itemIds: string[];
    generatedAt: Date;
  }[];
  createdAt: Date;
}
