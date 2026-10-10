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
    <span lang="ar" dir="rtl" className={`arabic-run ${className}`}>
      {letters.map((token, index) => (
        <span key={`${index}-${token}`} className={marked.has(index) ? "arabic-focus" : undefined}>
          {token}
        </span>
      ))}
    </span>
  );
}
