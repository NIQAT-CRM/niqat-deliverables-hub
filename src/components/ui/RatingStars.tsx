export function RatingStars({
  value,
  className = "",
  size = 16,
}: {
  value: number;
  className?: string;
  size?: number;
}) {
  const v = Math.max(0, Math.min(3, value || 0));
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${v} of 3`}>
      {[1, 2, 3].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width={size}
          height={size}
          stroke="currentColor"
          strokeWidth="1.5"
          className={i <= v ? "fill-niqat text-niqat" : "fill-none text-line"}
        >
          <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01z" />
        </svg>
      ))}
    </span>
  );
}
