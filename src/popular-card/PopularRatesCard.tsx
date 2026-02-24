import {
  Box,
  Grid,
  HStack,
  Text,
  VStack,
  useToken,
  useColorModeValue,
} from "@chakra-ui/react";
import { Box3D, ResponsiveText } from "../front-theme/custom.js";
import type { City } from "../types/city.js";
import type {
  PopularBanksRow,
  PopularBanksSection,
} from "../loadPopularBanksText.js";

type PopularRatesCardProps = {
  sections: PopularBanksSection[];
  generatedAt: string;
  city?: City | null;
};

const resolveColorToken = (value?: string | null) => {
  if (!value) return "gray.400";
  if (value.includes(".")) return value;
  const normalized = value.toLowerCase();
  if (normalized.startsWith("dark_"))
    return `${normalized.replace("dark_", "")}.500`;
  if (normalized.startsWith("light_"))
    return `${normalized.replace("light_", "")}.200`;
  return `${normalized}.300`;
};

const resolveCmsMediaBase = (): string => {
  if (process.env.CMS_MEDIA_BASE_URL)
    return process.env.CMS_MEDIA_BASE_URL.replace(/\/$/, "");
  if (process.env.CMS_GRAPHQL_URL) {
    try {
      return new URL(process.env.CMS_GRAPHQL_URL).origin;
    } catch {
      // noop
    }
  }
  if (process.env.INTERNAL_CMS_URL)
    return process.env.INTERNAL_CMS_URL.replace(/\/$/, "");
  const base = process.env.NEXT_PUBLIC_BASE || "p2pie.com";
  const index =
    process.env.NEXT_PUBLIC_INDEX === "0"
      ? ""
      : process.env.NEXT_PUBLIC_INDEX || "";
  return `https://cms${index}.${base}`;
};

const CircularIcon = ({
  color,
  icon,
  iconAlt,
}: {
  color?: string;
  icon?: {
    url?: string;
    alternativeText?: string | null;
    formats?: { thumbnail?: { url?: string }; small?: { url?: string } };
  } | null;
  iconAlt?: string;
}) => {
  const [resolvedColor] = useToken("colors", [resolveColorToken(color)]);
  const colorHEX = resolvedColor || "#aaa";
  const filter = useColorModeValue(
    "hue-rotate(70deg) brightness(0.3) opacity(0.8)",
    "hue-rotate(-140deg) brightness(0.1)",
  );
  const base = resolveCmsMediaBase();
  const imgUrl =
    icon?.formats?.thumbnail?.url ||
    icon?.formats?.small?.url ||
    icon?.url ||
    "";
  const src = !imgUrl
    ? ""
    : /^https?:\/\//i.test(imgUrl)
      ? imgUrl
      : `${base}${imgUrl.startsWith("/") ? "" : "/"}${imgUrl}`;

  return (
    <Box
      as="span"
      position="relative"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      w={{ base: "1.8rem", md: "1.4rem" }}
      h={{ base: "1.8rem", md: "1.4rem" }}
      minW={{ base: "1.8rem", md: "1.4rem" }}
      minH={{ base: "1.8rem", md: "1.4rem" }}
      borderRadius="50%"
      overflow="hidden"
      flexShrink={0}
      bg={colorHEX}
      boxShadow={`0 0 5px 0px ${colorHEX}`}
    >
      {src ? (
        <Box
          as="img"
          src={src}
          alt={icon?.alternativeText || iconAlt || ""}
          width="100%"
          height="100%"
          style={{ objectFit: "cover", objectPosition: "center", filter }}
          display="block"
        />
      ) : null}
    </Box>
  );
};

const RateCell = ({ side, label }: { side: "buy" | "sell"; label: string }) => {
  const green = useColorModeValue("green.700", "green.200");
  const pink = useColorModeValue("pink.700", "pink.200");
  const bgColor = useColorModeValue("bg.10", "bg.800");

  return (
    <HStack
      px="1"
      borderRadius="md"
      bgColor={bgColor}
      my="0.5"
      w="100%"
      justifyContent="space-between"
      filter="opacity(0.8)"
    >
      <Text color="bg.500" fontSize="sm">
        {side === "buy" ? "от" : "до"}
      </Text>
      <ResponsiveText color={side === "buy" ? pink : green} textAlign="end">
        {label}
      </ResponsiveText>
    </HStack>
  );
};

const CryptoPmHeader = ({ section }: { section: PopularBanksSection }) => {
  const code =
    section.pm?.subgroup_name?.toUpperCase() ||
    section.cryptoCode.toUpperCase();
  return (
    <CircularIcon
      iconAlt={section.pm?.en_name || section.cryptoCode}
      color={section.pm?.color}
      icon={section.pm?.icon}
    />
  );
};

const CryptoRatesGrid = ({ section }: { section: PopularBanksSection }) => {
  const visibleRows = section.rows.slice(0, 4);
  return (
    <>
      <Box>
        {visibleRows.map((row, index) => (
          <ResponsiveText
            key={`${section.cryptoCode}-bank-${index}`}
            size="sm"
            my="1"
          >
            {row.bank}
          </ResponsiveText>
        ))}
      </Box>
      <Box>
        {visibleRows.map((row, index) => (
          <RateCell
            key={`${section.cryptoCode}-buy-${index}`}
            side="buy"
            label={row.buyLabel}
          />
        ))}
      </Box>
      <Box>
        {visibleRows.map((row, index) => (
          <RateCell
            key={`${section.cryptoCode}-sell-${index}`}
            side="sell"
            label={row.sellLabel}
          />
        ))}
      </Box>
    </>
  );
};

const PopularTile = ({ section }: { section: PopularBanksSection }) => {
  const cryptoCode = section.cryptoCode.slice(0, 4);
  return (
    <Box3D
      variant="extra_contrast"
      p="2"
      pb="0"
      position="relative"
      w="380px"
      minH="180px"
    >
      <Grid
        gridTemplateColumns="auto 1fr 1fr"
        gridGap="2"
        alignItems="center"
        color="bg.200"
        pl="1"
      >
        <CryptoPmHeader section={section} />
        <ResponsiveText size="sm" fontWeight="bold">
          {`Купить ${cryptoCode}`}
        </ResponsiveText>
        <ResponsiveText size="sm" fontWeight="bold">
          {`Продать ${cryptoCode}`}
        </ResponsiveText>
        <CryptoRatesGrid section={section} />
      </Grid>
    </Box3D>
  );
};

const Greeting = ({ cityLabel }: { cityLabel: string }) => {
  const [peripheryColor, centerColor] = useToken(
    "colors",
    useColorModeValue(["bg.500", "violet.700"], ["bg.200", "peach.300"]),
  );
  const greetingSrc = "https://p2pie.com/greetings.png";

  return (
    <VStack
      gap={{ base: "4", lg: "-20" }}
      my={{ base: "4", lg: "10" }}
      zIndex="1"
    >
      <Box
        as="img"
        alt={`${process.env.NEXT_PUBLIC_NAME || "p2pie"} greetings`}
        src={greetingSrc}
        width="250px"
        loading="eager"
      />
      <Box
        mt="-20"
        mb="0"
        zIndex="1"
        bgGradient={`radial-gradient(circle at 50% -10%, ${centerColor} 10%, ${peripheryColor} 70%)`}
        bgClip="text"
        w="100%"
        textAlign="center"
      >
        <Text
          fontWeight="semibold"
          fontFamily="Montserrat, sans-serif"
          color="inherit"
          fontSize={cityLabel.length > 8 ? "lg" : "xl"}
        >
          {`Лучшие курсы обмена в ${cityLabel}`}
        </Text>
        <Text
          as="p"
          fontSize={{ base: "md", lg: "xl" }}
          mt={2}
          color="bg.400"
          fontWeight="light"
          fontFamily="Montserrat, sans-serif"
        >
          {`Поиск курсов среди ${Math.floor(Math.random() * (267 - 208 + 1)) + 208} обменников`}
        </Text>
      </Box>
    </VStack>
  );
};

export const PopularRatesCard = ({
  sections,
  generatedAt,
  city,
}: PopularRatesCardProps) => {
  const cityLabel = city?.preposition
    ? city.preposition
    : city?.ru_name
      ? `в ${city.ru_name}`
      : city?.en_name
        ? `в ${city.en_name}`
        : "в городе";
  return (
    <Box position="relative" overflowX="hidden">
      <VStack align="stretch" spacing="3">
        <Greeting cityLabel={cityLabel} />

        <Grid templateColumns="380px" gap="2" justifyContent="start">
          {sections.map((section) => (
            <PopularTile key={section.cryptoCode} section={section} />
          ))}
        </Grid>
      </VStack>
    </Box>
  );
};
