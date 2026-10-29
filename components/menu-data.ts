import type { StaticImageData } from "next/image";

/*
 * The whole menu, in one place. The /menu page and the printed menu board
 * both read from here, so a price changes once.
 */

export type Item = {
  name: string;
  body: string;
  /** In US dollars. Left out where the price isn't set yet. */
  price?: number;
  /** One pick the guest makes, e.g. the sauce the tenders are dipped in. */
  choice?: { label: string; options: string[] };
  /** Same dish by the piece, each size with its own price. */
  sizes?: Size[];
  /** How many come in one order, shown as "(4)" on the menu board. */
  count?: number;
  /**
   * The client's own photo, once it's shot. Until then the row shows a
   * placeholder tile, so adding a photo is this one field.
   */
  photo?: { src: StaticImageData; alt: string };
};

export type Size = { pieces: number; price: number; note?: string };

/** Whole dollars stay whole, the rest get cents: 6 -> "$6", 6.5 -> "$6.50". */
export const usd = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

const TENDER_SAUCES = ["BBQ", "Buffalo", "Honey Mustard", "Sweet Chili"];

export const CHICKEN: Item[] = [
  {
    name: "Crunchy Zinger",
    body: "Fried chicken breast, smoked turkey, BBQ, cheddar, cocktail sauce, iceberg, pickles and nachos.",
    price: 6,
  },
  {
    name: "Escalop Burger",
    body: "Chicken, garlic sauce, coleslaw, french fries and pickles.",
    price: 5,
  },
  {
    name: "Sweet Chili Burger",
    body: "Fried chicken breast dipped in sweet chili, ranch, two jalapeño bites, chips and pickles.",
    price: 6.5,
  },
  {
    name: "BBQ Bomb",
    body: "Fried chicken breast dipped in BBQ, a mozzarella patty, chips, iceberg, pickles and special sauce.",
    price: 6.5,
  },
  {
    name: "Fuel Burger",
    body: "Double fried chicken breast, pickles, mighty sauce, mayo pepper sauce, iceberg and cheddar.",
    price: 6.5,
  },
  {
    name: "Octane 95",
    body: "Fried chicken breast dipped in honey mustard, a mozzarella patty, chips, iceberg, pickles and special sauce.",
    price: 7,
  },
  {
    name: "Chicken Mushroom",
    body: "Chicken patty, mushroom sauce, swiss cheese and special sauce.",
    price: 7,
  },
];

export const NASHVILLE: Item[] = [
  {
    name: "Nashville Burger",
    body: "Nashville fried chicken breast, coleslaw, dill pickles, fuel sauce and Nashville sauce.",
    price: 6.5,
  },
  {
    name: "Hot Nashville Burger",
    body: "Nashville fried chicken breast with hot spices, coleslaw, honey, dill pickles, fuel sauce and Nashville sauce.",
    price: 6.5,
  },
];

export const BEEF: Item[] = [
  {
    name: "Lebanese Burger",
    body: "130g beef patty, mayo salad, fries, pickles and ketchup.",
    price: 5,
  },
  {
    name: "Double Smash Burger",
    body: "150g of smashed beef patties, two slices of cheddar, iceberg, smash sauce, caramelized onion and pickles.",
    price: 7,
  },
  {
    name: "Mushroom Burger",
    body: "Beef patty, mushroom sauce, swiss cheese and special sauce.",
    price: 7.5,
  },
  {
    name: "Diesel",
    body: "Beef patty, cheddar, a cheddar patty, bacon, onion rings, fuel sauce, BBQ, lettuce and pickles.",
    price: 8.5,
  },
  {
    name: "Octane 98",
    body: "Three smashed beef patties, sweet jalapeños, bacon, fried onion, smash sauce and three slices of cheddar.",
    price: 8.5,
  },
];

export const LOADED_NOTE =
  "Every Loaded box comes with your choice of dipping sauce.";

export const LOADED: Item[] = [
  {
    name: "Honey Loaded",
    body: "French fries, jalapeños and tenders dipped in honey mustard.",
    price: 5.5,
  },
  {
    name: "BBQ Loaded",
    body: "French fries, jalapeños and tenders dipped in BBQ.",
    price: 5.5,
  },
  {
    name: "Buffalo Loaded",
    body: "French fries, jalapeños and tenders dipped in buffalo.",
    price: 5.5,
  },
  {
    name: "Mac Attack",
    body: "Fries, mac and cheese, Nashville tenders and special sauce.",
    price: 6,
  },
];

export const HOT_DOGS: Item[] = [
  {
    name: "Classic Hot Dog",
    body: "Hot dog, ketchup, mayo and mustard.",
    price: 4,
  },
  {
    name: "Fuel Signature Hot Dog",
    body: "Hot dog, cheddar sauce, BBQ sauce, pickles and chips.",
    price: 5.5,
  },
];

export const CRISPY: Item[] = [
  {
    name: "Crispy",
    body: "Served with french fries, coleslaw, garlic sauce and cocktail sauce.",
    sizes: [
      { pieces: 3, price: 7 },
      { pieces: 5, price: 9 },
      { pieces: 7, price: 12 },
      { pieces: 10, price: 14 },
    ],
  },
];

export const WINGS: Item[] = [
  {
    name: "Wings",
    body: "Tossed in one sauce of your choice.",
    choice: { label: "Pick one sauce", options: TENDER_SAUCES },
    sizes: [
      { pieces: 6, price: 3, note: "Half portion" },
      { pieces: 12, price: 5.5 },
    ],
  },
];

export const APPETIZERS: Item[] = [
  {
    name: "French Fries",
    body: "A pack of fries.",
    price: 2,
  },
  {
    name: "Mega",
    count: 1,
    body: "One piece.",
    price: 2,
  },
  {
    name: "Mozzarella Sticks",
    count: 4,
    body: "Four sticks, served with cocktail sauce.",
    price: 4,
  },
  {
    name: "Jalapeño Bites",
    count: 4,
    body: "Four bites.",
    price: 4,
  },
  {
    name: "Tenders",
    count: 4,
    body: "Four tenders, dipped in one sauce of your choice.",
    price: 5,
    choice: { label: "Pick one sauce", options: TENDER_SAUCES },
  },
  {
    name: "Shrimp",
    count: 10,
    body: "Ten pieces.",
    price: 8.5,
  },
];

export const DIPS = [
  "BBQ",
  "Mighty Sauce",
  "Honey Mustard",
  "Cheddar",
  "Cocktail",
  "Fuel Sauce",
  "Ranch",
  "Sweet Chili",
];
export const DIP_PRICE = 0.35;

export const DRINKS_PRICE = 1;

/** Any extra on any order, one flat price. */
export const EXTRA_PRICE = 0.5;
