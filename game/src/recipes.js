// recipes.js — the pantry and the menu: every ingredient, every cooking process and all 26
// recipes of The Copper Ladle. A recipe is a list of components; each component names an
// ingredient and the process the ticket demands for it (the same salmon is grilled for the
// grill plate and served raw on the sushi platter). Data only — no game logic lives here.

/** The ways an ingredient can be prepared. `none` goes straight onto the plate. */
export const PROCESSES = {
  none: { name: 'as is', time: 0 },
  chop: { name: 'chopped', time: 2.2, station: 'board' },
  grill: { name: 'grilled', time: 4.2, station: 'grill' },
  fry: { name: 'fried', time: 3.6, station: 'fryer' },
  boil: { name: 'boiled', time: 5.0, station: 'stove' },
  bake: { name: 'baked', time: 6.0, station: 'oven' },
};

/** Every ingredient in the pantry, by id. The pantry shelf shows the ones unlocked recipes use. */
export const INGREDIENTS = {
  lettuce: { name: 'Lettuce', emoji: '🥬' },
  tomato: { name: 'Tomato', emoji: '🍅' },
  cucumber: { name: 'Cucumber', emoji: '🥒' },
  carrot: { name: 'Carrot', emoji: '🥕' },
  pepper: { name: 'Pepper', emoji: '🫑' },
  onion: { name: 'Onion', emoji: '🧅' },
  garlic: { name: 'Garlic', emoji: '🧄' },
  basil: { name: 'Basil', emoji: '🌿' },
  mushroom: { name: 'Mushroom', emoji: '🍄' },
  potato: { name: 'Potato', emoji: '🥔' },
  egg: { name: 'Egg', emoji: '🥚' },
  bread: { name: 'Bread', emoji: '🍞' },
  bun: { name: 'Burger Bun', emoji: '🥯' },
  dough: { name: 'Dough', emoji: '🫓' },
  cheese: { name: 'Cheese', emoji: '🧀' },
  dressing: { name: 'Dressing', emoji: '🫙' },
  beef: { name: 'Beef', emoji: '🥩' },
  chicken: { name: 'Chicken', emoji: '🍗' },
  ribs: { name: 'Ribs', emoji: '🍖' },
  salmon: { name: 'Salmon', emoji: '🐟' },
  shrimp: { name: 'Shrimp', emoji: '🍤' },
  lobster: { name: 'Lobster', emoji: '🦞' },
  duck: { name: 'Duck', emoji: '🦆' },
  skewer: { name: 'Skewer', emoji: '🍢' },
  pasta: { name: 'Pasta', emoji: '🍝' },
  rice: { name: 'Rice', emoji: '🍚' },
  noodles: { name: 'Noodles', emoji: '🍜' },
  lemon: { name: 'Lemon', emoji: '🍋' },
  batter: { name: 'Batter', emoji: '🥣' },
};

/** A recipe: price in coins, the day it joins the menu, and its components in plating order. */
export const RECIPES = [
  { id: 'garden-salad', name: 'Garden Salad', emoji: '🥗', price: 14, day: 1, components: [['lettuce', 'chop'], ['tomato', 'chop'], ['cucumber', 'chop'], ['dressing', 'none']] },
  { id: 'tomato-soup', name: 'Tomato Soup', emoji: '🍲', price: 16, day: 1, components: [['tomato', 'boil'], ['onion', 'chop'], ['garlic', 'chop']] },
  { id: 'garlic-bread', name: 'Garlic Bread', emoji: '🍞', price: 12, day: 1, components: [['bread', 'bake'], ['garlic', 'chop']] },
  { id: 'eggs-toast', name: 'Fried Eggs & Toast', emoji: '🍳', price: 18, day: 2, components: [['egg', 'fry'], ['bread', 'bake'], ['tomato', 'chop']] },
  { id: 'stir-fry', name: 'Veggie Stir-Fry', emoji: '🥘', price: 22, day: 2, components: [['pepper', 'chop'], ['carrot', 'chop'], ['mushroom', 'fry'], ['onion', 'chop']] },
  { id: 'classic-burger', name: 'Classic Burger', emoji: '🍔', price: 26, day: 3, components: [['bun', 'none'], ['beef', 'grill'], ['cheese', 'none'], ['lettuce', 'chop'], ['tomato', 'chop']] },
  { id: 'french-fries', name: 'French Fries', emoji: '🍟', price: 14, day: 3, components: [['potato', 'fry']] },
  { id: 'mushroom-soup', name: 'Mushroom Soup', emoji: '🍄', price: 20, day: 3, components: [['mushroom', 'boil'], ['onion', 'chop'], ['potato', 'boil']] },
  { id: 'margherita', name: 'Margherita Pizza', emoji: '🍕', price: 30, day: 4, components: [['dough', 'bake'], ['tomato', 'chop'], ['cheese', 'none'], ['basil', 'chop']] },
  { id: 'mushroom-pasta', name: 'Mushroom Pasta', emoji: '🍝', price: 28, day: 4, components: [['pasta', 'boil'], ['mushroom', 'fry'], ['garlic', 'chop'], ['cheese', 'none']] },
  { id: 'grilled-salmon', name: 'Grilled Salmon', emoji: '🐟', price: 36, day: 5, components: [['salmon', 'grill'], ['lemon', 'none'], ['lettuce', 'chop']] },
  { id: 'caesar-salad', name: 'Caesar Salad', emoji: '🥗', price: 24, day: 5, components: [['lettuce', 'chop'], ['chicken', 'grill'], ['bread', 'bake'], ['cheese', 'none']] },
  { id: 'chicken-curry', name: 'Chicken Curry', emoji: '🍛', price: 34, day: 6, components: [['chicken', 'fry'], ['rice', 'boil'], ['pepper', 'chop'], ['onion', 'chop']] },
  { id: 'cheese-omelette', name: 'Cheese Omelette', emoji: '🧀', price: 24, day: 6, components: [['egg', 'fry'], ['cheese', 'none'], ['mushroom', 'chop'], ['pepper', 'chop']] },
  { id: 'beef-steak', name: 'Beef Steak', emoji: '🥩', price: 44, day: 7, components: [['beef', 'grill'], ['potato', 'fry'], ['mushroom', 'fry'], ['pepper', 'chop']] },
  { id: 'sushi-platter', name: 'Sushi Platter', emoji: '🍣', price: 46, day: 7, components: [['rice', 'boil'], ['salmon', 'none'], ['cucumber', 'chop'], ['egg', 'boil']] },
  { id: 'shrimp-pasta', name: 'Shrimp Pasta', emoji: '🍤', price: 40, day: 8, components: [['pasta', 'boil'], ['shrimp', 'fry'], ['garlic', 'chop'], ['tomato', 'chop']] },
  { id: 'bbq-ribs', name: 'BBQ Ribs', emoji: '🍖', price: 48, day: 8, components: [['ribs', 'grill'], ['potato', 'bake'], ['carrot', 'chop']] },
  { id: 'lobster-bisque', name: 'Lobster Bisque', emoji: '🦞', price: 54, day: 9, components: [['lobster', 'boil'], ['onion', 'chop'], ['carrot', 'boil'], ['garlic', 'chop']] },
  { id: 'deluxe-burger', name: 'Deluxe Burger', emoji: '🍔', price: 50, day: 9, components: [['bun', 'none'], ['beef', 'grill'], ['cheese', 'none'], ['mushroom', 'fry'], ['egg', 'fry'], ['lettuce', 'chop']] },
  { id: 'dragon-ramen', name: 'Dragon Ramen', emoji: '🍜', price: 52, day: 10, components: [['noodles', 'boil'], ['egg', 'boil'], ['chicken', 'grill'], ['pepper', 'chop'], ['mushroom', 'chop']] },
  { id: 'roast-duck', name: 'Roast Duck', emoji: '🦆', price: 60, day: 10, components: [['duck', 'bake'], ['rice', 'boil'], ['cucumber', 'chop'], ['pepper', 'chop']] },
  { id: 'wagyu-platter', name: 'Wagyu Platter', emoji: '🥩', price: 72, day: 11, components: [['beef', 'grill'], ['mushroom', 'grill'], ['potato', 'bake'], ['carrot', 'chop']] },
  { id: 'golden-souffle', name: 'Golden Soufflé', emoji: '🍮', price: 56, day: 11, components: [['batter', 'bake'], ['cheese', 'none'], ['lemon', 'none']] },
  { id: 'phoenix-skewers', name: 'Phoenix Skewers', emoji: '🍢', price: 66, day: 12, components: [['skewer', 'grill'], ['pepper', 'chop'], ['onion', 'chop'], ['mushroom', 'grill']] },
  { id: 'royal-feast', name: 'The Royal Feast', emoji: '👑', price: 95, day: 12, components: [['duck', 'bake'], ['lobster', 'boil'], ['beef', 'grill'], ['rice', 'boil'], ['mushroom', 'fry'], ['lemon', 'none']] },
];

/** Recipes available on a given campaign day. */
export function recipesUpTo(day) {
  return RECIPES.filter((recipe) => recipe.day <= day);
}

/** Recipes that join the menu exactly on a given day. */
export function recipesUnlockedOn(day) {
  return RECIPES.filter((recipe) => recipe.day === day);
}

/** The ingredient ids the pantry must stock once these recipes are on the menu. */
export function pantryFor(day) {
  const ids = [];
  for (const recipe of recipesUpTo(day)) {
    for (const [ingredient] of recipe.components) {
      if (!ids.includes(ingredient)) ids.push(ingredient);
    }
  }
  return ids;
}

/**
 * Does a plate hold exactly a recipe's components? `plate` is a list of {ingredient, process}
 * in the order they were plated; a match needs the same multiset, order-free, and no extras.
 */
export function plateMatches(plate, recipe) {
  if (plate.length !== recipe.components.length) return false;
  const needed = recipe.components.map(([ing, proc]) => `${ing}:${proc}`).sort();
  const held = plate.map((part) => `${part.ingredient}:${part.process}`).sort();
  return needed.every((key, index) => key === held[index]);
}
