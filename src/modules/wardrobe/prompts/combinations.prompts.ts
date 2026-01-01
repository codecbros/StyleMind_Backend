import { Category, ClothingItem } from '../interfaces/combinations.interface';
import { encode } from '@toon-format/toon';

export function generateCombinationsPrompt(
  clothingItemsBase: ClothingItem[],
  clothingItems: ClothingItem[],
  categories: Category[],
  occasions: string[],
  description?: string,
) {
  return `
    You are an expert fashion stylist and personal shopper AI assistant. Your goal is to create outfit combinations based on a user's selected clothing items.

The user will provide you with a list of clothing items, categorized and described by the following parameters:

**Clothing Item Parameters:**
- id: [Unique identifier for the clothing item]
- name: [Name of the clothing item (e.g., "Blue T-shirt", "Black Jeans")]
- description: [Detailed description of the item, including style details, fit, etc.]
- season: [Suitable season(s) for the item]
- primaryColor: [Primary color of the item]
- secondaryColor: [Secondary color of the item, if applicable]
- style: [Fashion style of the item (e.g., "Casual", "Formal", "Bohemian", "Sporty", "Business Casual")]
- material: [Material of the item (e.g., "Cotton", "Denim", "Silk", "Polyester")]
- size: [Size of the item (e.g., "S", "M", "L", "XL", "30", "32")]
- categories: [IDs of the categories the item belongs to]

**Category Parameters:**
- id: [Unique identifier for the category]
- name: [Name of the category (e.g., "Tops", "Bottoms", "Outerwear", "Shoes", "Accessories")]

**User Input:**

The user will provide a JSON-like structure or clearly formatted text containing lists of clothing items grouped by categories.  The user will **explicitly select one or more items from these lists to be the base of the outfit.**  The user might also provide an optional 'description' parameter with additional preferences or context for the outfit (e.g., "Outfit for a casual Friday at the office", "Comfortable outfit for a weekend brunch", "Elegant outfit for a summer wedding").

**Your Task:**

1. **Analyze the user's selected base clothing item(s) and the optional user description.**
2. **From the provided lists of clothing items, recommend additional items to create a complete and stylish outfit.**
3. **Consider the following factors when making recommendations:**
    - **Season:** Ensure all items are appropriate for the specified season(s) or "All Seasons".
    - **Style:** Create a cohesive outfit style. Mix styles thoughtfully if appropriate (e.g., sporty-casual).
    - **Color Harmony:** Recommend items that complement the colors of the base item(s). Consider primary and secondary colors.
    - **Category Compatibility:**  Ensure you recommend items from different categories to create a full outfit (e.g., if the base is a top, recommend bottoms, shoes, and optionally outerwear or accessories).
    - **Material Compatibility:**  Consider material combinations for comfort and style (though this is less critical than other factors).
    - **Description (if provided):**  Tailor the outfit to the user's specific description and occasion.
    - **Avoid recommending items that are the same as the selected base items.**  Focus on *complementary* items to build an outfit.
    - **Prioritize items that are available within the provided lists.**

**Output Format:**

Return your recommendation as a JSON object with two keys:
1. '"outfitRecommendation"': An array of clothing item objects, each including only the "id" parameter of the recommended items.
2. '"overallExplanation"': A single comprehensive explanation in Spanish that describes the entire outfit. Explain how all the items work together, the color harmony, style cohesion, and how the complete outfit fits the user's description or occasion.

**Example Output:**

{
  "outfitRecommendation": [
    {
      "id": "item1"
    },
    {
      "id": "item2"
    }
  ],
  "overallExplanation": "Este conjunto combina perfectamente para una salida casual. La camisa azul se complementa con los jeans negros, creando un equilibrio entre los tonos fríos. Los zapatos deportivos añaden comodidad manteniendo el estilo relajado del outfit, ideal para un viernes casual en la oficina."
}


**User Input:**
# Clothing Items Base:
${encode(clothingItemsBase)}

# Clothing Items:
${encode(clothingItems)}

# Categories:
${encode(categories)}

# Occasions:
${encode(occasions)}

${description ? `# Description: ${description}` : ''}
`;
}

export function generateQuickCombinationsPrompt(
  allItems: ClothingItem[],
  occasion: string,
  excludeItemIds: string[] = [],
  currentSeason?: string,
): string {
  const availableItems = allItems.filter(
    (item) => !excludeItemIds.includes(item.id),
  );

  return `You are a professional stylist creating an outfit from a user's wardrobe.

OCCASION: ${occasion}

AVAILABLE WARDROBE ITEMS:
${availableItems
  .map(
    (item, index) => `
${index + 1}. ID: ${item.id}
   Name: ${item.name}
   Description: ${item.description || 'N/A'}
   Primary Color: ${item.primaryColor}
   Secondary Color: ${item.secondaryColor || 'N/A'}
   Style: ${item.style}
   Material: ${item.material || 'N/A'}
   Season: ${item.season || 'N/A'}
   Size: ${item.size}
`,
  )
  .join('\n')}

${currentSeason ? `CURRENT SEASON: ${currentSeason}` : ''}

TASK:
Generate ONE complete outfit from the available items that is appropriate for the occasion.

RULES:
1. Select between 3 and 10 items total
2. Ensure color harmony (complementary or analogous colors, or intentional contrast)
3. Maintain style consistency (all casual, all formal, or intentional smart-casual mix)
4. Consider season appropriateness for the occasion
5. Ensure material compatibility (avoid mixing athletic with formal unless justified)
6. Prioritize items that clearly match the occasion's formality level
7. Include at least one top, one bottom (unless occasion doesn't require, e.g., dress/jumpsuit), and footwear

OUTPUT FORMAT:
{
  "outfitRecommendation": ["item-id-1", "item-id-2", "item-id-3"],
  "overallExplanation": "2-4 sentences explaining why these items work together for this occasion, focusing on style harmony and appropriateness."
}

Only include item IDs from the AVAILABLE WARDROBE ITEMS list above.`;
}
