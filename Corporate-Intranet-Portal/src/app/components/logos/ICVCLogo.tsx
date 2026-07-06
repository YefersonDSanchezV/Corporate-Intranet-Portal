export function ICVCLogo({ className = "w-32 h-32" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Círculo de fondo */}
      <circle cx="100" cy="100" r="95" fill="#0778AC" />

      {/* Corazón estilizado */}
      <path
        d="M100 140c-25-20-40-35-40-50 0-12 8-20 18-20 7 0 14 4 22 12 8-8 15-12 22-12 10 0 18 8 18 20 0 15-15 30-40 50z"
        fill="#CF3438"
      />

      {/* Línea de ECG */}
      <path
        d="M30 100h25l8-15 12 30 10-20 8 15h77"
        stroke="white"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Texto ICVC */}
      <text
        x="100"
        y="175"
        fontSize="24"
        fontWeight="bold"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
      >
        ICVC
      </text>
    </svg>
  );
}
