// screens-misc.jsx — app preview, settings, design tokens board

const PREVIEW_APPS = [
  { name: 'storefront', port: 3000, sub: 'storefront-3000.sawadev.io', on: true },
  { name: 'api-docs', port: 8080, sub: 'storefront-8080.sawadev.io', on: true },
  { name: 'storybook', port: 6006, sub: 'storefront-6006.sawadev.io', on: false },
];

function ScreenPreviewMobile() {
  return (
    <PhoneScreen>
      <div style={{ padding: '4px 18px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="back" size={20} c={WF.ink2} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: WF.sans, fontSize: 19, fontWeight: 700 }}>Running apps</div>
          <div style={{ fontFamily: WF.sans, fontSize: 12, color: WF.ink3, marginTop: 1 }}>auto subdomains · storefront-api</div>
        </div>
        <Icon name="refresh" size={19} c={WF.ink2} />
      </div>
      <div style={{ flex: 1, padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {PREVIEW_APPS.map((a, i) => (
          <div key={i} style={{ border: `1px solid ${WF.line}`, borderRadius: 14, background: WF.paper, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: WF.fill, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="globe" size={18} c={WF.ink2} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: WF.mono, fontSize: 14, fontWeight: 600 }}>{a.name}<span style={{ color: WF.ink3, fontWeight: 400 }}> :{a.port}</span></div>
                <StatusBadge on={a.on} label={a.on ? 'live' : 'stopped'} style={{ marginTop: 3 }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, borderRadius: 9, background: WF.fill, padding: '0 11px' }}>
              <Icon name="lock" size={12} c={WF.ink3} />
              <span style={{ fontFamily: WF.mono, fontSize: 11, color: WF.ink2, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{a.sub}</span>
              <Icon name="copy" size={14} c={WF.ink3} />
            </div>
            <Btn kind={a.on ? 'primary' : 'default'} sm full icon="external" style={{ opacity: a.on ? 1 : 0.6 }}>Open in browser</Btn>
          </div>
        ))}
      </div>
      <Anno style={{ position: 'absolute', bottom: 70, right: 14, width: 110, transform: 'rotate(3deg)' }}>mobile opens apps externally</Anno>
    </PhoneScreen>
  );
}

function ScreenPreviewDesktop() {
  return (
    <BrowserChrome url="storefront-api.sawadev.io/ports">
      <div style={{ height: '100%', display: 'flex' }}>
        <RailNav active="globe" />
        {/* app list */}
        <div style={{ width: 300, flexShrink: 0, borderRight: `1px solid ${WF.line}`, background: WF.paper, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 18px 14px' }}>
            <div style={{ fontFamily: WF.sans, fontSize: 18, fontWeight: 700 }}>Running apps</div>
            <div style={{ fontFamily: WF.sans, fontSize: 12, color: WF.ink3, marginTop: 2 }}>auto subdomains</div>
          </div>
          <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PREVIEW_APPS.map((a, i) => (
              <div key={i} style={{ padding: 12, borderRadius: 11, border: `1px solid ${i === 0 ? WF.accentLine : WF.line}`, background: i === 0 ? WF.accentSoft : WF.paper, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="globe" size={15} c={WF.ink2} />
                  <span style={{ fontFamily: WF.mono, fontSize: 13, fontWeight: 600 }}>{a.name}</span>
                  <span style={{ fontFamily: WF.mono, fontSize: 11, color: WF.ink3 }}>:{a.port}</span>
                  <div style={{ flex: 1 }} /><StatusBadge on={a.on} label="" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: WF.mono, fontSize: 10, color: WF.ink2, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{a.sub}</span>
                  <Icon name="copy" size={12} c={WF.ink3} /><Icon name="external" size={12} c={WF.ink3} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* in-app preview frame */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: WF.screen }}>
          <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', borderBottom: `1px solid ${WF.line}` }}>
            <div style={{ flex: 1, maxWidth: 380, height: 28, borderRadius: 8, background: WF.paper, border: `1px solid ${WF.line}`, display: 'flex', alignItems: 'center', gap: 7, padding: '0 10px' }}>
              <Icon name="lock" size={11} c={WF.ink3} /><span style={{ fontFamily: WF.mono, fontSize: 11, color: WF.ink2 }}>storefront-3000.sawadev.io</span>
            </div>
            <Icon name="refresh" size={16} c={WF.ink3} />
            <div style={{ flex: 1 }} />
            <Seg items={[{ icon: 'globe', label: '' }, { icon: 'dock', label: '' }]} active={0} sm />
            <Btn kind="default" sm icon="external">Open</Btn>
          </div>
          <div style={{ flex: 1, padding: 24, display: 'flex' }}>
            <div style={{ flex: 1, borderRadius: 12, border: `1px solid ${WF.line}`, background: WF.paper, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 52, borderBottom: `1px solid ${WF.line}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px' }}>
                <Bar w={90} h={12} /><div style={{ flex: 1 }} /><Bar w={50} h={10} /><Bar w={50} h={10} /><Bar w={70} h={24} c={WF.fill2} r={6} />
              </div>
              <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <Bar w="50%" h={26} /><Lines n={2} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 8 }}>
                  {[0, 1, 2].map((i) => <StripePh key={i} h={130} label="rendered app" />)}
                </div>
              </div>
            </div>
          </div>
          <Anno style={{ position: 'absolute', bottom: 40, right: 50, width: 130, transform: 'rotate(-2deg)' }}>desktop previews inline in a frame</Anno>
        </div>
      </div>
    </BrowserChrome>
  );
}

// ── Settings ─────────────────────────────────────────────────────
const SETTINGS_SECTIONS = [
  { icon: 'sparkle', n: 'AI agents & API keys', d: 'Bring-your-own keys' },
  { icon: 'lock', n: 'Security', d: 'Password, passkeys, sessions' },
  { icon: 'globe', n: 'Domain & DNS', d: 'Subdomain routing' },
  { icon: 'sun', n: 'Appearance', d: 'Theme & density' },
];

function ScreenSettingsMobile() {
  return (
    <PhoneScreen>
      <div style={{ padding: '4px 18px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon name="back" size={20} c={WF.ink2} />
        <div style={{ fontFamily: WF.sans, fontSize: 21, fontWeight: 700 }}>Settings</div>
      </div>
      <div style={{ flex: 1, padding: '0 18px' }}>
        <div style={{ border: `1px solid ${WF.line}`, borderRadius: 14, background: WF.paper, overflow: 'hidden' }}>
          {SETTINGS_SECTIONS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 14px', borderBottom: i < SETTINGS_SECTIONS.length - 1 ? `1px solid ${WF.line}` : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: WF.fill, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.icon} size={18} c={WF.ink2} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: WF.sans, fontSize: 15, fontWeight: 600 }}>{s.n}</div>
                <div style={{ fontFamily: WF.sans, fontSize: 12, color: WF.ink3, marginTop: 1 }}>{s.d}</div>
              </div>
              <Icon name="chevR" size={17} c={WF.ink3} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, padding: '0 4px' }}>
          <div style={{ fontFamily: WF.sans, fontSize: 12.5, fontWeight: 700, color: WF.ink3, marginBottom: 12 }}>APPEARANCE</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[{ i: 'moon', l: 'Dark', on: true }, { i: 'sun', l: 'Light', on: false }].map((t, k) => (
              <div key={k} style={{ flex: 1, borderRadius: 12, border: `1.5px solid ${t.on ? WF.accent : WF.line2}`, background: t.on ? WF.accentSoft : WF.paper, padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Icon name={t.i} size={20} c={t.on ? WF.accent : WF.ink2} />
                <span style={{ fontFamily: WF.sans, fontSize: 13, fontWeight: 600, color: t.on ? WF.ink : WF.ink2 }}>{t.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneScreen>
  );
}

function KeyRow({ name, masked, set }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: `1px solid ${WF.line}` }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: WF.fill, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="sparkle" size={16} c={WF.ink2} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: WF.sans, fontSize: 14, fontWeight: 600 }}>{name}</div>
        <div style={{ fontFamily: WF.mono, fontSize: 11.5, color: set ? WF.ink2 : WF.ink3, marginTop: 2 }}>{set ? masked : 'no key set'}</div>
      </div>
      {set ? <StatusBadge on label="connected" /> : <Btn kind="default" sm icon="key">Add key</Btn>}
    </div>
  );
}

function ScreenSettingsDesktop() {
  return (
    <BrowserChrome url="app.sawadev.io/settings">
      <div style={{ height: '100%', display: 'flex' }}>
        <RailNav active="gear" />
        {/* section nav */}
        <div style={{ width: 250, flexShrink: 0, borderRight: `1px solid ${WF.line}`, background: WF.screen, padding: '24px 14px' }}>
          <div style={{ fontFamily: WF.sans, fontSize: 18, fontWeight: 700, padding: '0 10px 16px' }}>Settings</div>
          {SETTINGS_SECTIONS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 10px', borderRadius: 9, background: i === 0 ? WF.paper : 'transparent', boxShadow: i === 0 ? '0 1px 2px rgba(0,0,0,.06)' : 'none', marginBottom: 2 }}>
              <Icon name={s.icon} size={17} c={i === 0 ? WF.accent : WF.ink2} />
              <span style={{ fontFamily: WF.sans, fontSize: 13.5, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? WF.ink : WF.ink2 }}>{s.n}</span>
            </div>
          ))}
        </div>
        {/* content */}
        <div style={{ flex: 1, minWidth: 0, padding: '36px 48px', overflow: 'hidden' }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{ fontFamily: WF.sans, fontSize: 24, fontWeight: 700, letterSpacing: -0.4 }}>AI agents & API keys</div>
            <div style={{ fontFamily: WF.sans, fontSize: 14.5, color: WF.ink2, marginTop: 6, lineHeight: 1.5 }}>Bring your own keys. sawadev stores them encrypted on your server and never proxies your traffic.</div>
            <div style={{ marginTop: 28 }}>
              <KeyRow name="Anthropic · Claude Code" masked="sk-ant-•••••••••••••4f2a" set />
              <KeyRow name="OpenAI · Codex CLI" masked="sk-•••••••••••••9c10" set />
              <KeyRow name="Cursor" />
            </div>
            <div style={{ marginTop: 28, padding: 18, borderRadius: 12, border: `1.5px dashed ${WF.line2}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name="plus" size={18} c={WF.ink3} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: WF.sans, fontSize: 14, fontWeight: 600 }}>Add another agent</div>
                <div style={{ fontFamily: WF.sans, fontSize: 12.5, color: WF.ink3, marginTop: 1 }}>Any CLI agent that reads an API key from env</div>
              </div>
              <Btn kind="default" sm>Configure</Btn>
            </div>
          </div>
          <Anno style={{ position: 'absolute', bottom: 50, right: 60, width: 150, transform: 'rotate(-2deg)' }}>sections: agents/keys · security · domain · appearance</Anno>
        </div>
      </div>
    </BrowserChrome>
  );
}

// ── Mini design-system board ─────────────────────────────────────
function Swatch({ hex, label, dark, w = 78 }) {
  return (
    <div style={{ width: w }}>
      <div style={{ height: 52, borderRadius: 9, background: hex, border: `1px solid ${dark ? 'rgba(255,255,255,.12)' : WF.line}` }} />
      <div style={{ fontFamily: WF.sans, fontSize: 11.5, fontWeight: 600, color: WF.ink, marginTop: 6 }}>{label}</div>
      <div style={{ fontFamily: WF.mono, fontSize: 10.5, color: WF.ink3 }}>{hex}</div>
    </div>
  );
}
function TokGroup({ title, children }) {
  return (
    <div>
      <div style={{ fontFamily: WF.sans, fontSize: 12, fontWeight: 700, color: WF.ink3, letterSpacing: 0.5, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}
function ScreenTokens() {
  return (
    <div style={{ width: '100%', height: '100%', background: WF.paper, fontFamily: WF.sans, padding: 40, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Wordmark size={24} />
        <div style={{ fontFamily: WF.sans, fontSize: 14, color: WF.ink3 }}>· mini design system</div>
        <div style={{ flex: 1 }} />
        <Chip icon="moon">dark default</Chip><Chip icon="sun">light</Chip>
      </div>

      <div style={{ display: 'flex', gap: 48 }}>
        <TokGroup title="DARK THEME (DEFAULT)">
          <div style={{ display: 'flex', gap: 12 }}>
            <Swatch hex="#0E0E11" label="bg" dark /><Swatch hex="#1A1A1F" label="surface" dark /><Swatch hex="#26262C" label="elevated" dark /><Swatch hex="#33333A" label="border" dark /><Swatch hex="#ECECEF" label="text" /><Swatch hex="#92929C" label="muted" />
          </div>
        </TokGroup>
      </div>
      <div style={{ display: 'flex', gap: 48 }}>
        <TokGroup title="LIGHT THEME">
          <div style={{ display: 'flex', gap: 12 }}>
            <Swatch hex="#FBFBFA" label="bg" /><Swatch hex="#FFFFFF" label="surface" /><Swatch hex="#F1F0EC" label="elevated" /><Swatch hex="#E4E3DE" label="border" /><Swatch hex="#2B2B29" label="text" /><Swatch hex="#75756F" label="muted" />
          </div>
        </TokGroup>
        <TokGroup title="ACCENT · AI + PRIMARY">
          <div style={{ display: 'flex', gap: 12 }}>
            <Swatch hex="#7C5CF6" label="accent" /><Swatch hex="#9B82F8" label="accent-hover" /><Swatch hex="#EEEAFD" label="accent-soft" />
          </div>
        </TokGroup>
      </div>

      <div style={{ display: 'flex', gap: 48, flex: 1, minHeight: 0 }}>
        <TokGroup title="TYPE · HANKEN GROTESK + JETBRAINS MONO">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6 }}>Display 28/700</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Title 20/700</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Heading 15/600</div>
            <div style={{ fontSize: 14, color: WF.ink2 }}>Body 14/400 — clean sans for all UI</div>
            <div style={{ fontFamily: WF.mono, fontSize: 13, color: WF.ink }}>const code = "JetBrains Mono 13"</div>
          </div>
        </TokGroup>
        <TokGroup title="RADIUS & SPACING">
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {[7, 10, 14, 18].map((r) => (
              <div key={r} style={{ textAlign: 'center' }}>
                <div style={{ width: 46, height: 46, borderRadius: r, background: WF.fill, border: `1px solid ${WF.line2}` }} />
                <div style={{ fontFamily: WF.mono, fontSize: 10.5, color: WF.ink3, marginTop: 5 }}>{r}px</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            {[4, 8, 12, 16, 24, 32].map((s) => (
              <div key={s} style={{ textAlign: 'center' }}>
                <div style={{ width: s, height: s, background: WF.accent, borderRadius: 2, margin: '0 auto' }} />
                <div style={{ fontFamily: WF.mono, fontSize: 9.5, color: WF.ink3, marginTop: 5 }}>{s}</div>
              </div>
            ))}
          </div>
        </TokGroup>
        <TokGroup title="COMPONENTS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Btn kind="primary" sm>Primary</Btn><Btn kind="default" sm>Default</Btn><Btn kind="soft" sm icon="play"> </Btn>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Chip icon="branch" sm>main</Chip><StatusBadge on /><StatusBadge label="stopped" />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Avatar size={28} ai /><AgentSwitcher sm />
            </div>
            <div style={{ width: 220 }}><Field placeholder="Input field" icon="search" h={34} /></div>
          </div>
        </TokGroup>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenPreviewMobile, ScreenPreviewDesktop, ScreenSettingsMobile, ScreenSettingsDesktop, ScreenTokens });
