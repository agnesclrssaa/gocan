import { api } from '../../lib/api';

const PLACEHOLDER_IMAGE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320"><rect width="400" height="320" fill="#e2e8f0"/><rect x="120" y="80" width="160" height="160" rx="24" fill="#cbd5e1"/><circle cx="200" cy="160" r="52" fill="#e2e8f0"/><circle cx="200" cy="160" r="32" fill="#cbd5e1"/></svg>'
)}`;

const AssetImage = ({ src, alt = '', ...imageProps }) => {
  const imageSrc = typeof src === 'string' && src.trim()
    ? api.assetUrl(src.trim())
    : PLACEHOLDER_IMAGE;

  return (
    <img
      {...imageProps}
      src={imageSrc}
      alt={alt}
      onError={(event) => {
        if (event.currentTarget.src !== PLACEHOLDER_IMAGE) {
          event.currentTarget.src = PLACEHOLDER_IMAGE;
        }
      }}
    />
  );
};

export default AssetImage;
