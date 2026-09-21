import React, { memo } from 'react';
import type { CoordinatorResponse } from '../types';
import { PRIORITY_COLORS, RECOMMENDATION_TYPE_COLORS } from '../../../../packages/config/constants';

const sectionStyle: React.CSSProperties = {
  background: 'var(--color-surface, #1e1e2e)',
  borderRadius: 'var(--radius-lg, 12px)',
  padding: '20px 24px',
  border: '1px solid var(--color-border, #2a2a3e)',
  marginBottom: 24,
};

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 28px',
  fontSize: 15,
  fontWeight: 600,
  color: '#fff',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  border: 'none',
  borderRadius: 'var(--radius-md, 8px)',
  cursor: 'pointer',
  transition: 'opacity 0.15s',
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  borderRadius: 'var(--radius-md, 8px)',
  padding: '16px 20px',
  border: '1px solid var(--color-border, #2a2a3e)',
};

interface CoordinatorSectionProps {
  result: CoordinatorResponse | null;
  loading: boolean;
  error: string | null;
  onRun: () => void;
}

export const CoordinatorSection = memo(function CoordinatorSection({ result, loading, error, onRun }: CoordinatorSectionProps) {
  return (
    <div style={sectionStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--color-text, #eee)',
          }}
        >
          Operations Coordinator
        </h3>

        <button
          style={{
            ...btnStyle,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          disabled={loading}
          onClick={onRun}
        >
          {loading ? (
            <>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
              Running...
            </>
          ) : (
            '▶ Run Coordinator'
          )}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(244,67,54,0.1)',
            borderRadius: 8,
            color: '#f44336',
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div>
          <p
            style={{
              fontSize: 14,
              color: 'var(--color-text-secondary, #aaa)',
              marginBottom: 20,
              lineHeight: 1.5,
            }}
          >
            {result.summary}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {result.recommendations.map((rec, idx) => (
              <div key={idx} style={cardStyle}>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 999,
                      background: `${RECOMMENDATION_TYPE_COLORS[rec.type] || '#666'}22`,
                      color: RECOMMENDATION_TYPE_COLORS[rec.type] || '#666',
                      textTransform: 'capitalize',
                    }}
                  >
                    {rec.type.replace(/_/g, ' ')}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 999,
                      background: `${PRIORITY_COLORS[rec.priority] || '#666'}22`,
                      color: PRIORITY_COLORS[rec.priority] || '#666',
                      textTransform: 'capitalize',
                    }}
                  >
                    {rec.priority}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--color-text, #eee)',
                    marginBottom: 4,
                  }}
                >
                  {rec.summary}
                </div>

                {rec.rationale && (
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--color-text-secondary, #888)',
                      lineHeight: 1.4,
                    }}
                  >
                    {rec.rationale}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !result && !error && (
        <p
          style={{
            fontSize: 14,
            color: 'var(--color-text-secondary, #888)',
            margin: 0,
          }}
        >
          Click "Run Coordinator" to analyze the current board state and generate prioritized recommendations.
        </p>
      )}
    </div>
  );
});
