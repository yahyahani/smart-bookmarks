import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../i18n/LanguageContext';

// Klein popover-menu met een checkbox per collectie, om een bookmark
// aan meerdere collecties tegelijk toe te kunnen wijzen (many-to-many).
//
// Gerenderd via een portal naar document.body, omdat de bookmark-kaart
// `overflow: hidden` heeft (nodig voor de afbeelding met afgeronde hoeken)
// — zonder portal zou dit menu aan de randen van de kaart afgesneden worden.
// `anchorRef` geeft de knop waar het menu bij moet aansluiten; we berekenen
// de schermpositie daarvan bij het openen.
export default function CollectionPicker({ collections, selectedIds, onToggle, onClose, anchorRef }) {
  const { t } = useLanguage();
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const popoverWidth = 200; // moet overeenkomen met .collection-picker min-width + wat marge
      const margin = 12;

      // Let op: dit gebruikt altijd de fysieke linkerkant van de knop,
      // ook in RTL-modus (Arabisch). Het popover blijft daardoor altijd
      // zichtbaar en bruikbaar, maar spiegelt niet automatisch mee zoals
      // de rest van de interface. Voor een toekomstige verbetering zou
      // je hier document.documentElement.dir kunnen checken en de
      // berekening aanpassen naar rect.right - popoverWidth voor RTL.
      let left = rect.left;
      // Op een smal scherm (telefoon) kan de knop dicht bij de rechterrand
      // staan — zonder deze correctie zou het popover daar voorbij steken
      // en gedeeltelijk onbereikbaar worden.
      const maxLeft = window.innerWidth - popoverWidth - margin;
      if (left > maxLeft) left = Math.max(margin, maxLeft);

      setPosition({ top: rect.bottom + 6, left });
    }
  }, [anchorRef]);

  if (!position) return null;

  return createPortal(
    <div className="collection-picker-overlay" onClick={onClose}>
      <div
        className="collection-picker"
        style={{ top: position.top, left: position.left }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="collection-picker-title">{t('addToCollectionLabel')}</p>
        {collections.length === 0 ? (
          <p className="collections-empty">{t('noCollectionsYet')}</p>
        ) : (
          collections.map((collection) => (
            <label key={collection.id} className="collection-picker-item">
              <input
                type="checkbox"
                checked={selectedIds.includes(collection.id)}
                onChange={() => onToggle(collection.id)}
              />
              <span
                className="collection-dot"
                style={{ background: collection.color }}
                aria-hidden="true"
              />
              {collection.name}
            </label>
          ))
        )}
      </div>
    </div>,
    document.body
  );
}
