export function ICVCLogoHorizontal({ className = "h-12" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Círculo de fondo con corazón */}
      <circle cx="40" cy="40" r="35" fill="#0778AC" />

      {/* Corazón */}
      <path
        d="M40 55c-10-8-16-14-16-20 0-5 3-8 7-8 3 0 6 2 9 5 3-3 6-5 9-5 4 0 7 3 7 8 0 6-6 12-16 20z"
        fill="#CF3438"
      />

      {/* Línea de ECG */}
      <path
        d="M15 40h10l3-6 5 12 4-8 3 6h30"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Texto */}
      <text
        x="90"
        y="32"
        fontSize="16"
        fontWeight="bold"
        fill="#0778AC"
        fontFamily="Arial, sans-serif"
      >
        Instituto Cardiovascular del Cesar
      </text>

      <text
        x="90"
        y="52"
        fontSize="12"
        fill="#CF3438"
        fontFamily="Arial, sans-serif"
        fontWeight="600"
      >
        ICVC - Intranet Corporativa
      </text>
    </svg>
  );
}
