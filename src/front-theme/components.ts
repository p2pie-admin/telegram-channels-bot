import type { StyleConfig } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";
import { colors3D } from "./colors.js";
import type { ITone } from "./types.js";

const colorNameToHex = (theme: any, colorFullName: string) => {
  const [colorName, colorNumber] = colorFullName.split(".");
  return theme.colors?.[colorName]?.[colorNumber] || "#fcb597";
};

const createGradient = (theme: any, tone: ITone, glowing = false) => {
  const [bgFrom, bgTo, borderFrom, borderTo, whiteAlpha, shadeTo] = colors3D[tone];
  const bgFromHEX = colorNameToHex(theme, bgFrom);
  const bgToHEX = colorNameToHex(theme, bgTo);
  const borderFromHEX = colorNameToHex(theme, borderFrom);
  const borderToHEX = colorNameToHex(theme, borderTo);
  const shadeFromHEX = colorNameToHex(theme, whiteAlpha);
  const shadeToHEX = colorNameToHex(theme, shadeTo);
  const shadow = glowing
    ? `-2px -2px 15px -8px ${shadeFromHEX}, 2px 2px 15px -8px ${shadeToHEX}`
    : `-2px -2px 5px ${shadeFromHEX}, 2px 2px 5px ${shadeToHEX}`;

  return {
    color: glowing ? "bg.800" : "bg.100",
    border: "1px solid",
    borderColor: "transparent",
    boxShadow: shadow,
    background: `linear-gradient(150deg, ${bgFromHEX}, ${bgToHEX}) padding-box, linear-gradient(150deg, ${borderFromHEX}, ${borderToHEX}) border-box`,
  };
};

const components: Record<string, StyleConfig> = {
  Text: {
    variants: {
      no_contrast: (props: any) => ({ color: mode("bg.600", "bg.400")(props) }),
      contrast: (props: any) => ({ color: mode("bg.800", "bg.200")(props) }),
      extra_contrast: (props: any) => ({ color: mode("bg.1000", "bg.50")(props) }),
      primary: (props: any) => ({ color: mode("violet.700", "peach.300")(props) }),
      shaded: (props: any) => ({ color: mode("bg.500", "bg.500")(props) }),
      red: (props: any) => ({ color: mode("red.700", "red.300")(props) }),
      green: (props: any) => ({ color: mode("green.700", "green.300")(props) }),
    },
  },
  Button: {
    baseStyle: {
      filter: "none",
      minH: "10",
      borderRadius: "xl",
      transition: "0.2s filter ease-in",
      _hover: { filter: "brightness(1.2)" },
      _active: { filter: "brightness(0.9)" },
    },
    variants: {
      primary: ({ theme, colorMode }: any) =>
        colorMode === "light" ? createGradient(theme, "violet", true) : createGradient(theme, "peach", true),
      no_contrast: ({ theme, colorMode }: any) =>
        colorMode === "light" ? createGradient(theme, "gray", true) : createGradient(theme, "shaded"),
      contrast: ({ theme, colorMode }: any) =>
        colorMode === "light" ? createGradient(theme, "light", true) : createGradient(theme, "dark"),
      extra_contrast: ({ theme, colorMode }: any) =>
        colorMode === "light" ? createGradient(theme, "white", true) : createGradient(theme, "black"),
      shaded: ({ theme }: any) => createGradient(theme, "shaded"),
      dark: ({ theme }: any) => createGradient(theme, "dark"),
      black: ({ theme }: any) => createGradient(theme, "black"),
      gray: ({ theme }: any) => createGradient(theme, "gray", true),
      light: ({ theme }: any) => createGradient(theme, "light", true),
      white: ({ theme }: any) => createGradient(theme, "white", true),
      error: ({ theme }: any) => createGradient(theme, "error", true),
      default: () => ({}),
    },
  },
};

export default components;
