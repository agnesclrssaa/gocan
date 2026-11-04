export default function BrandLogo({ className = '' }) {
  return (
    <img
      src="/GC-logo.png"
      alt="GoCan"
      className={`object-contain ${className}`}
    />
  );
}
