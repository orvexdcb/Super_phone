import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  transpilePackages: ['@super-phone/shared'],
  outputFileTracingIncludes: {
    '/founder/architecture/map': ['./private/founder/floorplan-map.html'],
  },
};
export default nextConfig;
