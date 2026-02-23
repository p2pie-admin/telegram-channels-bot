import { Box, Button, Text, useColorModeValue } from "@chakra-ui/react";
import type { ReactNode } from "react";
import type { ITextVariant, IVariant } from "./types.js";

export const RegularBox = ({
  children,
  variant = "extra_contrast",
  color,
  ...chakraProps
}: {
  children: ReactNode;
  variant?: IVariant;
  color?: string;
  [key: string]: unknown;
}) => {
  const bgVariants = {
    no_contrast: useColorModeValue("bg.100", "bg.700"),
    contrast: useColorModeValue("bg.50", "bg.800"),
    extra_contrast: useColorModeValue("bg.10", "bg.900"),
    primary: useColorModeValue("violet.300", "peach.500"),
  };
  const defaultColor = useColorModeValue("bg.700", "bg.100");
  return (
    <Box
      borderRadius="2xl"
      position="relative"
      bgColor={bgVariants[variant]}
      color={color || defaultColor}
      {...(chakraProps as any)}
    >
      {children}
    </Box>
  );
};

export const Box3D = ({ children, ...props }: { children: ReactNode; [key: string]: unknown }) => (
  <RegularBox
    border="none"
    boxShadow={`
      inset 0 0 0 1px rgba(200,200,200,0.1),
      inset -2px -2px 5px rgba(200,200,200,0.05),
      inset 2px 2px 5px rgba(0,0,0,0.15),
      3px 3px 10px -5px rgba(0,0,0,0.5),
      -3px -3px 10px -5px rgba(200,200,200,0.2)
    `}
    {...(props as any)}
  >
    {children}
  </RegularBox>
);

export const CustomBox3D = ({ children, ...props }: { children: ReactNode; [key: string]: unknown }) => (
  <Box3D w="100%" py="4" px="2" {...(props as any)}>
    {children}
  </Box3D>
);

export const ResponsiveText = ({
  children,
  size = "md",
  variant,
  ...props
}: {
  children: ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  variant?: ITextVariant;
  [key: string]: unknown;
}) => {
  const sizes = {
    xs: ["0.65rem", "0.65rem", "xs", "sm"],
    sm: ["xs", "xs", "sm", "md"],
    md: ["sm", "sm", "md", "lg"],
    lg: ["md", "md", "lg", "xl"],
    xl: ["lg", "lg", "xl", "2xl"],
    "2xl": ["xl", "xl", "2xl", "3xl"],
    "3xl": ["2xl", "2xl", "3xl", "4xl"],
  } as const;
  const defaultVariants = {
    xs: "no_contrast",
    sm: "contrast",
    md: "contrast",
    lg: "extra_contrast",
    xl: "extra_contrast",
    "2xl": "extra_contrast",
    "3xl": "extra_contrast",
  } as const;

  return (
    <Text
      whiteSpace="nowrap"
      fontSize={sizes[size]}
      fontFamily={/\d/.test(size) ? `"Montserrat Alternates", sans-serif` : "unset"}
      variant={(variant || defaultVariants[size]) as any}
      {...(props as any)}
    >
      {children}
    </Text>
  );
};

export const ResponsiveButton = ({ children, ...props }: { children: ReactNode; [key: string]: unknown }) => (
  <Button whiteSpace="nowrap" size={["xs", "sm", "md", "lg"]} px={["0.5", "1", "2"]} py={["0", "0.5", "1"]} {...(props as any)}>
    {children}
  </Button>
);
