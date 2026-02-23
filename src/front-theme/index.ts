import { extendTheme, type ThemeConfig } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";
import colors from "./colors.js";
import components from "./components.js";

const breakpoints = {
  xs: "26rem",
  sm: "30rem",
  md: "48rem",
  lg: "62rem",
  xl: "80rem",
  "2xl": "96rem",
};

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const theme = extendTheme({
  colors,
  breakpoints,
  config,
  shadows: { outline: "0 !important" },
  fonts: { logo: "Dosis" },
  styles: {
    global: (props: any) => ({
      body: {
        bg: mode("bg.200", "bg.900")(props),
        color: "bg.100",
      },
      a: {
        color: mode("violet.700", "violet.300")(props),
      },
    }),
  },
  components,
});

export default theme;
