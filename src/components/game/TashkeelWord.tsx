export function TashkeelWord({
  letters,
  focus,
  className = "",
}: {
  letters: readonly string[];
  focus: readonly number[];
  className?: string;
}) {
  const marked = new Set(focus);

  return (
    <span lang="ar" dir="rtl" className={className}>
      {letters.map((token, index) => (
        <span key={`${token}-${index}`} className={marked.has(index) ? "text-red-600" : undefined}>
          {token}
        </span>
      ))}
    </span>
  );
}
