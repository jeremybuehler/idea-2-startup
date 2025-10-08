/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ['app', 'components', 'lib', 'types'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  env: {
    APP_NAME: 'Launchloom',
    APP_VERSION: process.env.npm_package_version,
  },
}

module.exports = nextConfig
