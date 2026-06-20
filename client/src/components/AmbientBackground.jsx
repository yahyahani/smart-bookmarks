// Deze component tekent een paar grote, vervaagde kleurvlekken (blobs) die
// langzaam bewegen op de achtergrond. Het is precies wat het "glaseffect"
// van de kaarten zichtbaar maakt — puur glas op een vlakke achtergrond
// laat niets zien, maar glas vóór bewegende kleur geeft diepte.
//
// De vierde blob (klein, snel) geeft net dat beetje extra compositorische
// variatie zonder de rust te verstoren — de andere drie blijven traag en groot.
export default function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden="true">
      <div className="ambient-blob ambient-blob-1" />
      <div className="ambient-blob ambient-blob-2" />
      <div className="ambient-blob ambient-blob-3" />
      <div className="ambient-blob ambient-blob-4" />
      <div className="ambient-noise" />
    </div>
  );
}
