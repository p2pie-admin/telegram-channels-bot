import type { ITone } from "./types.js";

export const colors3D: Record<ITone, string[]> = {
  shaded: ["bg.700", "bg.600", "bg.600", "bg.800", "whiteAlpha.200", "blackAlpha.200"],
  dark: ["bg.800", "bg.700", "bg.700", "bg.900", "whiteAlpha.100", "blackAlpha.100"],
  black: ["bg.900", "bg.800", "bg.800", "bg.1000", "whiteAlpha.50", "blackAlpha.50"],
  error: ["red.500", "red.400", "red.400", "red.600", "whiteAlpha.300", "blackAlpha.300"],
  peach: ["pink.300", "orange.300", "orange.400", "pink.400", "pink.500", "orange.500"],
  violet: ["purple.300", "blue.300", "blue.400", "purple.400", "purple.500", "blue.500"],
  gray: ["bg.200", "bg.100", "bg.100", "bg.300", "whiteAlpha.200", "blackAlpha.200"],
  light: ["bg.100", "bg.50", "bg.50", "bg.200", "whiteAlpha.200", "blackAlpha.200"],
  white: ["bg.50", "bg.10", "bg.10", "bg.100", "whiteAlpha.200", "blackAlpha.200"],
};

const colors = {
  bg: {
    "10": "#ffffff",
    "50": "#f5f3f2",
    "100": "#e8e5e3",
    "200": "#d6d1ce",
    "300": "#bab3ae",
    "400": "#958b85",
    "500": "#524c4c",
    "600": "#3f3b3b",
    "700": "#2c2a2a",
    "800": "#242323",
    "900": "#1b1818",
    "1000": "#141313",
  },
  peach: {
    "10": "#fdf6f3",
    "50": "#faddde",
    "100": "#f7dace",
    "200": "#f1c4b5",
    "300": "#efbaa3",
    "400": "#dfa694",
    "500": "#cd9b85",
    "600": "#b78a77",
    "700": "#9a7564",
    "800": "#684f44",
    "900": "#584339",
    "1000": "#3f3029",
  },
  violet: {
    "50": "#f7f7fd",
    "100": "#e0ddf8",
    "200": "#c6c0f2",
    "300": "#a59deb",
    "400": "#9388e7",
    "500": "#7a6de1",
    "600": "#6354dc",
    "700": "#4c3cc8",
    "800": "#4033a9",
    "900": "#2f257b",
  },
};

export default colors;
