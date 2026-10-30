export default function BrandLogo({ className = '' }) {
  return (
    <img
      src="/gocan-logo.jpeg"
      alt="GoCan"
      className={`object-contain ${className}`}
    />
  );
}
