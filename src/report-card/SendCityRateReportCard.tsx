import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Box3D, ResponsiveText } from "../front-theme/custom.js";

export type ReportRow = {
  label: string;
  value: number;
};

export type SendCityRateReportCardProps = {
  title: string;
  subtitle: string;
  generatedAt: string;
  rows: ReportRow[];
};

export const SendCityRateReportCard = ({
  title,
  subtitle,
  generatedAt,
  rows,
}: SendCityRateReportCardProps) => {
  return (
    <Box3D
      width="600px"
      minH="220px"
      variant="no_contrast"
      color="bg.200"
      p="24px"
    >
      <VStack align="stretch" spacing="18px">
        <Flex justify="space-between" align="start" gap="12px">
          <VStack align="start" spacing="4px">
            <Heading fontSize="26px" fontWeight="800" lineHeight="1.1">
              {title}
            </Heading>
            <Text fontSize="13px" variant="no_contrast">
              {subtitle}
            </Text>
          </VStack>
          <Badge
            bg="peach.900"
            color="peach.100"
            borderRadius="999px"
            px="10px"
            py="6px"
          >
            LIVE
          </Badge>
        </Flex>

        <VStack align="stretch" spacing="10px">
          {rows.map((row, idx) => (
            <Box3D
              key={`${row.label}-${idx}`}
              as={HStack}
              justify="space-between"
              variant="extra_contrast"
              borderRadius="14px"
              px="14px"
              py="10px"
            >
              <Text fontWeight="700" fontSize="15px" noOfLines={1} pr="10px">
                {row.label}
              </Text>
              <ResponsiveText size="lg" fontWeight="800" color="violet.300">
                {row.value}
              </ResponsiveText>
            </Box3D>
          ))}
        </VStack>

        <Text fontSize="12px" variant="shaded">
          Generated: {generatedAt}
        </Text>
      </VStack>
    </Box3D>
  );
};
