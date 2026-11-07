/* Shared components. The same pieces serve the expert card, the desk and the ledger (section 8a). */
import { type ReactNode } from 'react'
import { AlertCircle, Check, Copy, Inbox } from 'lucide-react'
import { useState } from 'react'
import type { Bucket, Spread } from './api'

export const ICON = { size: 16, strokeWidth: 1.5 } as const

export function Loading({ lines = 3, label = 'Loading' }: { lines?: number; label?: string }) {
  return (
    <div className="stack-tight" role="status" aria-live="polite" aria-busy="true">
      <span className="label">{label}</span>
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className="skeleton" style={{ width: `${100 - index * 12}%` }} />
      ))}
    </div>
  )
}

export function ErrorState({ error, retry }: { error: string; retry?: () => void }) {
  return (
    <div className="state state-error" style={{ padding: 16 }}>
      <div className="row" style={{ gap: 8, marginBottom: 4 }}>
        <AlertCircle {...ICON} color="var(--critical)" aria-hidden />
        <h3 style={{ margin: 0 }}>That did not work</h3>
      </div>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-2)' }}>{error}</p>
      {retry && (
        <button className="btn" style={{ marginTop: 12 }} onClick={retry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="state">
      <Inbox {...ICON} size={22} color="var(--ink-3)" aria-hidden />
      <h3>{title}</h3>
      {children && <p className="hint" style={{ margin: '0 auto' }}>{children}</p>}
    </div>
  )
}

export function Stat({
  label,
  value,
  sub,
  large,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  large?: boolean
}) {
  return (
    <div className="stat">
      <span className="label">{label}</span>
      <span className={`value num ${large ? 'value-lg' : ''}`}>{value}</span>
      {sub && <span className="hint">{sub}</span>}
    </div>
  )
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      className="btn"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setDone(true)
          window.setTimeout(() => setDone(false), 1500)
        })
      }}
    >
      {done ? <Check {...ICON} aria-hidden /> : <Copy {...ICON} aria-hidden />}
      {done ? 'Copied' : label}
    </button>
  )
}

/* The distribution chart. One scale, labelled axes, the ACAPS rating as a reference line, the panel as
   points, the group mean marked. Chart text uses the page's own type and colours. No second palette. */
export function DistributionChart({
  distribution,
  mean,
  spread,
  acapsNumber,
  acapsLabel,
  spHighlight,
}: {
  distribution: Bucket[]
  mean: number | null
  spread: Spread | null
  acapsNumber: number | null
  acapsLabel: string | null
  spHighlight?: 'yes' | 'no' | null
}) {
  const width = 640
  const height = 240
  const padding = { top: 26, right: 16, bottom: 62, left: 36 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const maxCount = Math.max(1, ...distribution.map((bucket) => bucket.count))
  const x = (probability: number) => padding.left + probability * plotWidth
  const barWidth = plotWidth / distribution.length

  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label={`Panel distribution across probability buckets. Group mean ${mean ?? 'not available'}. ACAPS rating ${acapsLabel ?? 'unrated'}.`}
        style={{ display: 'block', fontFamily: 'var(--font)' }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <g key={tick}>
            <line
              x1={x(tick)}
              x2={x(tick)}
              y1={padding.top}
              y2={padding.top + plotHeight}
              stroke="var(--line)"
              strokeWidth="1"
            />
            <text
              x={x(tick)}
              y={padding.top + plotHeight + 17}
              fontSize="11"
              fill="var(--ink-3)"
              textAnchor="middle"
              className="num"
            >
              {tick.toFixed(2)}
            </text>
          </g>
        ))}

        {distribution.map((bucket, index) => {
          const barHeight = (bucket.count / maxCount) * plotHeight
          // The surprisingly-popular side, not the tallest bar: the elicitation asks what share of
          // the panel will put the probability above 0.5, so the highlight is that side of the scale.
          const above = index >= distribution.length / 2
          const highlighted =
            spHighlight === 'yes' ? above : spHighlight === 'no' ? !above : false
          return (
            <g key={bucket.bucket}>
              <rect
                x={padding.left + index * barWidth + 3}
                y={padding.top + plotHeight - barHeight}
                width={barWidth - 6}
                height={barHeight}
                fill={highlighted ? 'var(--accent)' : 'var(--accent-weak)'}
                stroke={highlighted ? 'var(--accent)' : 'var(--line-strong)'}
              />
              {bucket.count > 0 && (
                <text
                  x={padding.left + index * barWidth + barWidth / 2}
                  y={padding.top + plotHeight - barHeight - 5}
                  fontSize="11"
                  fill={highlighted ? '#fff' : 'var(--ink-2)'}
                  textAnchor="middle"
                  className="num"
                  dy={highlighted ? 16 : 0}
                >
                  {bucket.count}
                </text>
              )}
            </g>
          )
        })}

        {spread && (
          <line
            x1={x(spread.min)}
            x2={x(spread.max)}
            y1={padding.top + plotHeight + 32}
            y2={padding.top + plotHeight + 32}
            stroke="var(--ink-3)"
            strokeWidth="1.5"
          />
        )}
        {spread &&
          [spread.min, spread.max].map((end) => (
            <line
              key={end}
              x1={x(end)}
              x2={x(end)}
              y1={padding.top + plotHeight + 28}
              y2={padding.top + plotHeight + 36}
              stroke="var(--ink-3)"
              strokeWidth="1.5"
            />
          ))}

        {acapsNumber !== null && (
          <g>
            <line
              x1={x(acapsNumber)}
              x2={x(acapsNumber)}
              y1={padding.top - 6}
              y2={padding.top + plotHeight}
              stroke="var(--ink-2)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <text x={x(acapsNumber) + 5} y={padding.top - 10} fontSize="11" fill="var(--ink-2)">
              ACAPS {acapsLabel}
            </text>
          </g>
        )}

        {mean !== null && (
          <g>
            <circle cx={x(mean)} cy={padding.top + plotHeight} r="5" fill="var(--accent)" />
            <text
              x={x(mean)}
              y={padding.top + plotHeight + 50}
              fontSize="11"
              fill="var(--accent-text)"
              textAnchor="middle"
              className="num"
              fontWeight="600"
            >
              panel mean {mean.toFixed(2)}
            </text>
          </g>
        )}
      </svg>
      <figcaption className="hint" style={{ marginTop: 8 }}>
        Probability that the risk materialises within the horizon. Bars count panel answers per band;
        the whisker is the full spread; the dashed line is the ACAPS rating placed at this build's assumed
        number for its band
        {spHighlight
          ? `; the filled side is where the panel's own answers beat its prediction of itself (surprisingly-popular: ${spHighlight}, experimental)`
          : ''}
        .
      </figcaption>
    </figure>
  )
}

export function VerdictChip({ verdict }: { verdict: string }) {
  const supported = verdict === 'supported'
  return (
    <span className={`chip ${supported ? 'chip-good' : 'chip-warn'}`}>
      {supported ? 'supported' : 'not supported'}
    </span>
  )
}

export function CorroborationChip({ status }: { status: string }) {
  const tone =
    status === 'corroborated' ? 'chip-good' : status === 'not checked' ? 'chip' : 'chip-warn'
  return <span className={`chip ${tone}`}>{status}</span>
}

export function SyntheticFooter({ extra }: { extra?: ReactNode }) {
  return (
    <footer className="foot">
      <span>Synthetic experts. Their answers are not evidence about any country.</span>
      <span>ACAPS Risk Radar data under ACAPS terms of use.</span>
      <span>
        Sealing proves timing and consistency, not confidentiality from the operator of this service.
      </span>
      {extra}
    </footer>
  )
}
