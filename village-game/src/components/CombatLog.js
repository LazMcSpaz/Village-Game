import React, { useRef, useEffect } from 'react';

function HpBar({ hp, maxHp, side }) {
  const pct = Math.max(0, hp / maxHp) * 100;
  const color = side === 'soldier' ? '#4a9eff' : '#ff5555';
  const bgColor = side === 'soldier' ? 'rgba(74, 158, 255, 0.15)' : 'rgba(255, 85, 85, 0.15)';
  return (
    <div style={{ width: 40, height: 5, background: bgColor, borderRadius: 3, flexShrink: 0 }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: 3,
        background: pct > 50 ? color : pct > 25 ? '#ffa500' : '#ff3333',
        transition: 'width 0.3s',
      }} />
    </div>
  );
}

function UnitTag({ side, id }) {
  const isSoldier = side === 'soldier';
  return (
    <span style={{
      color: isSoldier ? '#6ab0ff' : '#ff7b7b',
      fontWeight: 600,
      fontSize: '11px',
    }}>
      {isSoldier ? `S${id}` : `E${id}`}
    </span>
  );
}

function DuelEntry({ entry }) {
  const { soldiers, enemies, soldierRoll, enemyRoll, soldiersWin, ties, hits } = entry;

  return (
    <div style={entryStyles.duel}>
      <div style={entryStyles.duelMatchup}>
        <div style={entryStyles.duelSide}>
          {soldiers.map(id => <UnitTag key={id} side="soldier" id={id} />)}
        </div>
        <div style={entryStyles.duelDice}>
          <span style={{
            ...entryStyles.roll,
            color: soldiersWin ? '#66ff66' : '#ff6b6b',
          }}>{soldierRoll}</span>
          <span style={entryStyles.vs}>vs</span>
          <span style={{
            ...entryStyles.roll,
            color: !soldiersWin ? '#66ff66' : '#ff6b6b',
          }}>{enemyRoll}</span>
        </div>
        <div style={entryStyles.duelSide}>
          {enemies.map(id => <UnitTag key={id} side="enemy" id={id} />)}
        </div>
      </div>
      <div style={entryStyles.duelResult}>
        {ties > 0 && (
          <span style={entryStyles.tieNote}>{ties}x tie </span>
        )}
        {hits.map((hit, i) => (
          <span key={i} style={entryStyles.hitInfo}>
            <UnitTag side={hit.side} id={hit.id} />
            <span style={{ color: '#ff6b6b', fontSize: '10px', margin: '0 3px' }}>-1</span>
            <HpBar hp={hit.hp} maxHp={hit.maxHp} side={hit.side} />
          </span>
        ))}
      </div>
    </div>
  );
}

function LogEntry({ entry }) {
  if (typeof entry === 'string') {
    // Legacy string fallback
    return <div style={{ color: '#aaa', fontSize: '11px', padding: '2px 0' }}>{entry}</div>;
  }

  switch (entry.type) {
    case 'raid':
      return (
        <div style={entryStyles.raid}>
          <span style={entryStyles.raidIcon}>&#9876;</span>
          <span>{entry.count} enemies attack!</span>
        </div>
      );

    case 'round':
      return (
        <div style={entryStyles.round}>
          <div style={entryStyles.roundLine} />
          <span style={entryStyles.roundLabel}>Round {entry.num}</span>
          <div style={entryStyles.roundLine} />
        </div>
      );

    case 'duel':
      return <DuelEntry entry={entry} />;

    case 'death':
      return (
        <div style={entryStyles.event}>
          <span style={{ fontSize: '11px' }}>{entry.side === 'soldier' ? '\u2620' : '\u2714'}</span>
          <UnitTag side={entry.side} id={entry.id} />
          <span style={{
            color: entry.side === 'soldier' ? '#ff6b6b' : '#51cf66',
            fontSize: '11px',
          }}>
            {entry.side === 'soldier' ? 'fallen' : 'defeated'}
          </span>
        </div>
      );

    case 'retreat':
      return (
        <div style={entryStyles.event}>
          <span style={{ fontSize: '11px' }}>{'\u{1F3C3}'}</span>
          <UnitTag side={entry.side} id={entry.id} />
          <span style={{ color: '#ffd43b', fontSize: '11px' }}>
            retreats ({entry.hp} HP)
          </span>
        </div>
      );

    case 'outcome':
      return (
        <div style={{
          ...entryStyles.outcome,
          background: entry.result === 'victory'
            ? 'rgba(81, 207, 102, 0.15)' : 'rgba(255, 85, 85, 0.15)',
          borderColor: entry.result === 'victory'
            ? 'rgba(81, 207, 102, 0.4)' : 'rgba(255, 85, 85, 0.4)',
          color: entry.result === 'victory' ? '#51cf66' : '#ff6b6b',
        }}>
          {entry.result === 'victory' ? 'VICTORY' : 'DEFEAT'}
        </div>
      );

    case 'breakthrough':
      return (
        <div style={entryStyles.event}>
          <span style={{ color: '#ff6b6b', fontSize: '11px', fontWeight: 600 }}>
            {entry.count} broke through! Morale -{entry.moraleLoss}
          </span>
        </div>
      );

    case 'loot':
      return (
        <div style={entryStyles.lootRow}>
          {entry.gold > 0 && <span style={entryStyles.lootItem}>+{entry.gold} gold</span>}
          {entry.morale > 0 && <span style={{ ...entryStyles.lootItem, color: '#66ff66' }}>+{entry.morale} morale</span>}
        </div>
      );

    default:
      return null;
  }
}

export default function CombatLog({ logs, combatActive, soldiers, enemies, onClose }) {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  if (!combatActive && logs.length === 0) return null;

  const aliveS = soldiers.filter(s => s.hp > 0).length;
  const aliveE = enemies.filter(e => e.hp > 0).length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>&#9876;</span>
          <span>Combat</span>
        </div>
        <div style={styles.headerRight}>
          {combatActive && (
            <div style={styles.counts}>
              <span style={styles.countBlue}>{aliveS}</span>
              <span style={styles.countVs}>vs</span>
              <span style={styles.countRed}>{aliveE}</span>
            </div>
          )}
          <button style={styles.closeBtn} onClick={onClose}>{'\u2715'}</button>
        </div>
      </div>
      <div ref={logRef} style={styles.log}>
        {logs.map((entry, i) => (
          <LogEntry key={i} entry={entry} />
        ))}
      </div>
    </div>
  );
}

const entryStyles = {
  raid: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 8px',
    background: 'rgba(255, 85, 85, 0.1)',
    border: '1px solid rgba(255, 85, 85, 0.3)',
    borderRadius: '4px',
    color: '#ff7b7b',
    fontWeight: 600,
    fontSize: '12px',
    marginBottom: '4px',
  },
  raidIcon: {
    fontSize: '14px',
  },
  round: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '6px 0 4px',
  },
  roundLine: {
    flex: 1,
    height: 1,
    background: 'rgba(139, 105, 20, 0.3)',
  },
  roundLabel: {
    fontSize: '10px',
    color: '#8a7a60',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  duel: {
    padding: '4px 6px',
    margin: '2px 0',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '4px',
    borderLeft: '2px solid rgba(139, 105, 20, 0.3)',
  },
  duelMatchup: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '4px',
  },
  duelSide: {
    display: 'flex',
    gap: '3px',
    minWidth: 0,
    flexShrink: 1,
  },
  duelDice: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
  },
  roll: {
    fontFamily: '"SF Mono", "Fira Code", monospace',
    fontWeight: 'bold',
    fontSize: '12px',
    minWidth: '16px',
    textAlign: 'center',
  },
  vs: {
    color: '#555',
    fontSize: '9px',
  },
  duelResult: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '2px',
    flexWrap: 'wrap',
  },
  tieNote: {
    fontSize: '9px',
    color: '#777',
    fontStyle: 'italic',
  },
  hitInfo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
  },
  event: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '2px 0',
  },
  outcome: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    letterSpacing: '2px',
    padding: '8px',
    margin: '6px 0',
    border: '1px solid',
    borderRadius: '4px',
  },
  lootRow: {
    display: 'flex',
    gap: '8px',
    padding: '3px 0',
  },
  lootItem: {
    fontSize: '11px',
    color: '#ffd700',
    fontWeight: 600,
  },
};

const styles = {
  container: {
    position: 'absolute',
    right: '10px',
    top: '10px',
    width: '280px',
    maxHeight: 'calc(100dvh - 130px)',
    background: 'rgba(10, 6, 2, 0.92)',
    border: '1px solid rgba(139, 105, 20, 0.4)',
    borderRadius: '8px',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    backdropFilter: 'blur(4px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    borderBottom: '1px solid rgba(139, 105, 20, 0.3)',
    color: '#e8d5a0',
    fontWeight: '600',
    fontSize: '13px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  headerIcon: {
    fontSize: '14px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  counts: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  countBlue: {
    color: '#6699ff',
  },
  countVs: {
    color: '#666',
    fontSize: '10px',
    fontWeight: 'normal',
  },
  countRed: {
    color: '#ff5555',
  },
  closeBtn: {
    background: 'none',
    border: '1px solid rgba(139, 105, 20, 0.3)',
    borderRadius: '4px',
    color: '#8a7a60',
    width: 22,
    height: 22,
    cursor: 'pointer',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    padding: 0,
  },
  log: {
    padding: '6px 8px',
    overflowY: 'auto',
    maxHeight: '350px',
    lineHeight: 1.4,
  },
};
