const STORAGE_KEY = 'gocan-delivery-location';

export const DELIVERY_LOCATION_EVENT =
  'gocan:delivery-location-updated';

const EMPTY_LOCATION = {
  building: '',
  meetingPoint: '',
  classInfo: '',
  additionalNote: '',
};

const sanitizeLocation = (value) => {
  const source =
    value && typeof value === 'object' ? value : {};

  return Object.fromEntries(
    Object.keys(EMPTY_LOCATION).map((key) => [
      key,
      typeof source[key] === 'string'
        ? source[key].trim().slice(0, 500)
        : '',
    ])
  );
};

export function readDeliveryLocation() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return { ...EMPTY_LOCATION };

    try {
      const parsed = JSON.parse(saved);

      if (typeof parsed === 'string') {
        return sanitizeLocation({ building: parsed });
      }

      return sanitizeLocation(parsed);
    } catch {
      // Mendukung lokasi lama yang disimpan sebagai teks biasa.
      return sanitizeLocation({ building: saved });
    }
  } catch {
    return { ...EMPTY_LOCATION };
  }
}

export function saveDeliveryLocation(location) {
  const nextLocation = sanitizeLocation(location);

  if (!nextLocation.building) {
    throw new Error('Isi gedung atau lokasi tujuan terlebih dahulu.');
  }

  // Jika penyimpanan gagal, error diteruskan ke tampilan pemanggil.
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(nextLocation)
  );

  window.dispatchEvent(
    new CustomEvent(DELIVERY_LOCATION_EVENT, {
      detail: nextLocation,
    })
  );

  return nextLocation;
}

export function subscribeDeliveryLocation(onChange) {
  const handleChange = () => {
    onChange(readDeliveryLocation());
  };

  const handleStorage = (event) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      handleChange();
    }
  };

  window.addEventListener(
    DELIVERY_LOCATION_EVENT,
    handleChange
  );
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(
      DELIVERY_LOCATION_EVENT,
      handleChange
    );
    window.removeEventListener('storage', handleStorage);
  };
}