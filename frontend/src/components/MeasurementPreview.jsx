import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, Sparkles, Check, ChevronRight, Scissors } from 'lucide-react';

const MEASUREMENT_POINTS = [
  {
    id: 'chest',
    name: 'Chest',
    defaultVal: '42 in',
    simpleDesc: 'Measured around the widest part of your chest. This ensures your Agbada, Senator top, or shirt does not feel tight when you sit or raise your arms.',
    outfits: 'Agbada top, Senator top, Kaftan',
  },
  {
    id: 'shoulder',
    name: 'Shoulder',
    defaultVal: '19.5 in',
    simpleDesc: 'Measured from one shoulder bone across your back to the other. This makes your clothes hang cleanly and look sharp on your frame.',
    outfits: 'All native shirts, suits, and Kaftans',
  },
  {
    id: 'sleeve',
    name: 'Sleeve Length',
    defaultVal: '26 in',
    simpleDesc: 'Measured from your shoulder down to your wrist bone. This keeps your cuff at the perfect spot so it does not swallow your hands or stop too short.',
    outfits: 'Long-sleeve Senator, Agbada inner shirt',
  },
  {
    id: 'waist',
    name: 'Trouser Waist',
    defaultVal: '34 in',
    simpleDesc: 'Measured right where you wear your trouser belt. This keeps your trousers sitting comfortably all day without sagging or pinching your stomach.',
    outfits: 'Senator trousers, Baggy native pants',
  },
  {
    id: 'length',
    name: 'Shirt or Robe Length',
    defaultVal: '44 in',
    simpleDesc: 'Measured from your collar bone down to your knee or ankle. You choose whether you like your top short, knee-length, or floor-length for a royal look.',
    outfits: 'Full-length Agbada, Modern Kaftan',
  },
];

export default function MeasurementPreview({ onOrderWithMeasurements }) {
  const [selectedPoint, setSelectedPoint] = useState(MEASUREMENT_POINTS[0]);
  const [unit, setUnit] = useState('in'); // 'in' or 'cm'

  function getDisplayVal(valStr) {
    const num = parseFloat(valStr);
    if (unit === 'cm') {
      return `${Math.round(num * 2.54)} cm`;
    }
    return `${num} in`;
  }

  return (
    <section className="meas-preview-section">
      <div className="section-header">
        <span className="eyebrow">
          <Sparkles size={13} /> How We Get Your Size Right
        </span>
        <h2 className="section-title">No Size Guesswork. Just a Great Fit.</h2>
        <p className="section-sub">
          Tap on any body part below to see how your tailor uses each measurement to make your outfit look and feel just right.
        </p>
      </div>

      <div className="meas-interactive-panel glass-strong">
        {/* Left Column: Interactive Selector List */}
        <div className="meas-points-list">
          <div className="meas-points-header">
            <span className="meas-points-title">
              <Ruler size={16} /> Tap a Measurement Point
            </span>
            <div className="unit-toggle">
              <button
                className={`unit-btn ${unit === 'in' ? 'unit-btn--active' : ''}`}
                onClick={() => setUnit('in')}
              >
                Inches (in)
              </button>
              <button
                className={`unit-btn ${unit === 'cm' ? 'unit-btn--active' : ''}`}
                onClick={() => setUnit('cm')}
              >
                Centimeters (cm)
              </button>
            </div>
          </div>

          <div className="meas-points-scroll">
            {MEASUREMENT_POINTS.map((pt) => {
              const isSelected = selectedPoint.id === pt.id;
              return (
                <button
                  key={pt.id}
                  className={`meas-point-row ${isSelected ? 'meas-point-row--active' : ''}`}
                  onClick={() => setSelectedPoint(pt)}
                >
                  <div className="meas-point-row__left">
                    <span className="meas-point-bullet" />
                    <div>
                      <strong>{pt.name}</strong>
                      <span className="meas-point-sub">{pt.outfits}</span>
                    </div>
                  </div>
                  <div className="meas-point-row__val">
                    <span>{getDisplayVal(pt.defaultVal)}</span>
                    <ChevronRight size={14} opacity={isSelected ? 1 : 0.4} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dynamic Deep Dive Card */}
        <div className="meas-preview-card glass">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedPoint.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="meas-preview-card__inner"
            >
              <div className="meas-card-badge">
                <Scissors size={13} /> {selectedPoint.name} Guide
              </div>

              <div className="meas-card-headline">
                <span className="meas-hero-val">{getDisplayVal(selectedPoint.defaultVal)}</span>
                <span className="meas-standard-tag">Example Measurement</span>
              </div>

              <p className="meas-card-desc">{selectedPoint.simpleDesc}</p>

              <div className="meas-card-impact">
                <span className="impact-label">Used For:</span>
                <p className="impact-val">{selectedPoint.outfits}</p>
              </div>

              <div className="meas-card-footer">
                <div className="fit-security-note">
                  <Check size={14} className="text-gold" />
                  <span>Saved on your tailor's dashboard so you only measure once</span>
                </div>
                <button
                  className="btn btn--gold btn--small"
                  onClick={() =>
                    onOrderWithMeasurements &&
                    onOrderWithMeasurements(`I want an outfit sewn with custom ${selectedPoint.name} measurements`)
                  }
                >
                  Start My Order &rarr;
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
