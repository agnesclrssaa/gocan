import { useLocation } from 'react-router-dom';

const CUSTOMER_PREVIEW_BASE = '/customer-preview';

export function getCustomerRoute(path, preview = false) {
  if (!preview) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return normalizedPath === '/'
    ? CUSTOMER_PREVIEW_BASE
    : `${CUSTOMER_PREVIEW_BASE}${normalizedPath}`;
}

export function useCustomerPreview() {
  const { pathname } = useLocation();
  return pathname === CUSTOMER_PREVIEW_BASE || pathname.startsWith(`${CUSTOMER_PREVIEW_BASE}/`);
}
