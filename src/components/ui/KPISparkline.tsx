interface Props {
  values: number[];
}

export default function KPISparkline({ values }: Props) {
  if (values.length < 2) return null;

  const width = 80;
  const height = 24;

  const step = width / (values.length - 1);

  const points = values
    .map((v, i) => `${i * step},${height - (v / 100) * height}`)
    .join(" ");

  return (
    <svg width={width} height={height}>
      <polyline
        points={points}
        fill="none"
        stroke="#00b4ff"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

