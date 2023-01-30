/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    trailingSlash: true,
    basePath: process.env.NODE_ENV === 'production' ? '/sakai-react' : '',
    publicRuntimeConfig: {
        apiPath: process.env.NODE_ENV === 'production' ? 'https://gobench.vn' : 'http://localhost:8080/api',
        contextPath: process.env.NODE_ENV === 'production' ? '/sakai-react' : '',
        uploadPath: process.env.NODE_ENV === 'production' ? '/sakai-react/upload.php' : '/api/upload'
    }
};

module.exports = nextConfig;
