export function BrandMark({ small = false }) {
  return (
    <span className={`brand-mark${small ? ' small' : ''}`} aria-hidden="true">
      <img src="/meditoktok-mark.png" alt="" />
    </span>
  );
}
