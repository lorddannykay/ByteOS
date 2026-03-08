/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size limit for SCORM package uploads (default is 4MB)
  experimental: {
    serverActionsBodySizeLimit: '100mb',
  },
};

export default nextConfig;
