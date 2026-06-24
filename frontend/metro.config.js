const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// WebView에서 로컬 HTML 파일을 불러올 수 있도록 html 확장자 추가
if (!config.resolver.assetExts.includes('html')) {
  config.resolver.assetExts.push('html');
}

module.exports = config;
