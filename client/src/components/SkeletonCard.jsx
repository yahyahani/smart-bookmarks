// Toont de vorm van een bookmark-kaart terwijl de echte data nog laadt.
// Dit voelt sneller aan dan platte "laden..."-tekst, omdat de gebruiker
// meteen de structuur van wat komt kan herkennen.
export default function SkeletonCard({ animationDelay = 0 }) {
  return (
    <div className="bm-skeleton" style={{ animationDelay: `${animationDelay}ms` }} aria-hidden="true">
      <div className="bm-skeleton-image" />
      <div className="bm-skeleton-body">
        <div className="bm-skeleton-line bm-skeleton-line-source" />
        <div className="bm-skeleton-line bm-skeleton-line-title" />
        <div className="bm-skeleton-line bm-skeleton-line-text" />
        <div className="bm-skeleton-line bm-skeleton-line-text-short" />
      </div>
    </div>
  );
}
