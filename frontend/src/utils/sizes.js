// Typical size runs per category. Cosmetic/selection UI only — the cart
// model (see CartProvider) doesn't track variants, so size selection isn't
// sent with the line item, matching how the rest of this demo works.
const SIZES_BY_CATEGORY = {
  men: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  women: ['XS', 'S', 'M', 'L', 'XL'],
  kids: ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y'],
  shoes: ['6', '7', '8', '9', '10', '11', '12'],
};

export const getSizesForCategory = (category) => SIZES_BY_CATEGORY[category] || null;
