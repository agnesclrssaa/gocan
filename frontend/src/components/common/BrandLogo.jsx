export default function BrandLogo({ className = '' }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}GC-logo.png`}
      alt="GoCan"
      className={`object-contain ${className}`}
    />
  );
}
