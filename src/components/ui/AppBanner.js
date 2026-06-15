import { Box, Image } from '@chakra-ui/react';
import { tokens } from '../../theme/tokens';

export const APP_NAME = '개발 6팀 Report';
export const APP_LOGO_SRC = `${process.env.PUBLIC_URL || ''}/favicon.png`;
export const APP_BANNER_SRC = `${process.env.PUBLIC_URL || ''}/images/dev6-banner.png`;

export default function AppBanner({ height = { base: '128px', md: '156px', lg: '172px' } }) {
  return (
    <Box
      mb={5}
      borderRadius={tokens.radius.xl}
      overflow="hidden"
      border="1px solid"
      borderColor={tokens.borderStrong}
      boxShadow="0 10px 36px rgba(0, 0, 0, 0.4)"
    >
      <Image
        src={APP_BANNER_SRC}
        alt={APP_NAME}
        w="100%"
        h={height}
        objectFit="cover"
        objectPosition="left center"
        display="block"
      />
    </Box>
  );
}
