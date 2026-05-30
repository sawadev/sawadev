// screens-auth.jsx — Login + First-run setup (mobile + desktop)

function ScreenLoginMobile() {
  return (
    <PhoneScreen>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px', gap: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 40 }}>
          <Wordmark size={26} />
          <div style={{ fontFamily: WF.sans, fontSize: 15, color: WF.ink2, textAlign: 'center' }}>your dev machine, in the cloud</div>
        </div>

        <div style={{ fontFamily: WF.sans, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Welcome back</div>
        <div style={{ fontFamily: WF.sans, fontSize: 14, color: WF.ink2, marginBottom: 28 }}>Sign in to your sawadev server</div>

        {/* passkey primary */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: WF.accentSoft, border: `1.5px solid ${WF.accentLine}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="finger" size={30} c={WF.accent} sw={1.6} />
          </div>
          <Btn kind="primary" full icon="finger" style={{ height: 50, fontSize: 15 }}>Sign in with passkey</Btn>
          <div style={{ fontFamily: WF.sans, fontSize: 12.5, color: WF.ink3 }}>Face ID · Touch ID · security key</div>
        </div>

        {/* divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '26px 0 20px' }}>
          <div style={{ flex: 1, height: 1, background: WF.line }} />
          <span style={{ fontFamily: WF.sans, fontSize: 12, color: WF.ink3 }}>or use password</span>
          <div style={{ flex: 1, height: 1, background: WF.line }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field placeholder="Password" icon="lock" />
          <Btn kind="default" full>Continue</Btn>
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '0 0 14px', fontFamily: WF.sans, fontSize: 12, color: WF.ink3 }}>self-hosted · v2.4.0</div>

      <Anno style={{ position: 'absolute', top: 250, right: 8, width: 92, transform: 'rotate(3deg)' }}>passkey is the hero — biometric, one tap</Anno>
    </PhoneScreen>
  );
}

function ScreenLoginDesktop() {
  return (
    <BrowserChrome url="app.sawadev.io/login">
      <div style={{ height: '100%', display: 'flex' }}>
        {/* brand panel */}
        <div style={{ width: 520, background: WF.fill, borderRight: `1px solid ${WF.line}`, padding: 56, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Wordmark size={26} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontFamily: WF.sans, fontSize: 34, fontWeight: 700, lineHeight: 1.1, letterSpacing: -0.8, maxWidth: 360 }}>Your dev machine lives in the cloud.</div>
            <div style={{ fontFamily: WF.sans, fontSize: 16, color: WF.ink2, maxWidth: 360, lineHeight: 1.45 }}>Code from a phone, tablet, or any browser. Your device is just a screen.</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <Chip icon="terminal">live terminal</Chip>
              <Chip icon="sparkle">AI agents</Chip>
              <Chip icon="cpu">docker workspaces</Chip>
            </div>
          </div>
          <div style={{ fontFamily: WF.sans, fontSize: 12.5, color: WF.ink3 }}>self-hosted on your VPS</div>
        </div>

        {/* form */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ width: 380, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: WF.sans, fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Welcome back</div>
            <div style={{ fontFamily: WF.sans, fontSize: 15, color: WF.ink2, marginBottom: 32 }}>Sign in to your sawadev server</div>

            <Btn kind="primary" full icon="finger" style={{ height: 52, fontSize: 15.5 }}>Sign in with passkey</Btn>
            <div style={{ textAlign: 'center', fontFamily: WF.sans, fontSize: 12.5, color: WF.ink3, marginTop: 12 }}>Face ID · Touch ID · security key</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0 22px' }}>
              <div style={{ flex: 1, height: 1, background: WF.line }} />
              <span style={{ fontFamily: WF.sans, fontSize: 12.5, color: WF.ink3 }}>or use password</span>
              <div style={{ flex: 1, height: 1, background: WF.line }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Password" placeholder="••••••••••" icon="lock" />
              <Btn kind="default" full>Continue</Btn>
            </div>
          </div>
          <Anno style={{ position: 'absolute', bottom: 70, right: 60, width: 150, transform: 'rotate(-2deg)' }}>centered, branded — passkey first, password as fallback</Anno>
        </div>
      </div>
    </BrowserChrome>
  );
}

// ── First-run setup ──────────────────────────────────────────────
const SETUP_STEPS = [
  { n: 1, icon: 'lock', label: 'Admin password' },
  { n: 2, icon: 'finger', label: 'Register passkey' },
  { n: 3, icon: 'globe', label: 'Configure domain' },
];

function StepDot({ step, active, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 15, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? WF.accent : active ? WF.accentSoft : WF.fill,
        border: active ? `1.5px solid ${WF.accent}` : `1.5px solid ${done ? WF.accent : WF.line2}`,
        color: done ? '#fff' : active ? WF.accent : WF.ink3, fontFamily: WF.sans, fontSize: 13, fontWeight: 700,
      }}>
        {done ? <Icon name="check" size={15} c="#fff" /> : step.n}
      </div>
      <div style={{ fontFamily: WF.sans, fontSize: 13.5, fontWeight: active ? 700 : 500, color: active ? WF.ink : WF.ink2 }}>{step.label}</div>
    </div>
  );
}

function ScreenSetupMobile() {
  return (
    <PhoneScreen>
      <div style={{ padding: '6px 22px 0', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <Wordmark size={20} style={{ marginBottom: 20 }} />
        {/* progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          {SETUP_STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i === 0 ? WF.accent : WF.fill2 }} />
          ))}
        </div>
        <div style={{ fontFamily: WF.sans, fontSize: 12, color: WF.ink3, marginBottom: 26 }}>Step 1 of 3 · First-run setup</div>

        <div style={{ fontFamily: WF.sans, fontSize: 23, fontWeight: 700, marginBottom: 6 }}>Set an admin password</div>
        <div style={{ fontFamily: WF.sans, fontSize: 14, color: WF.ink2, lineHeight: 1.45, marginBottom: 26 }}>This protects your server's root account. You'll add a passkey next.</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="New password" placeholder="At least 12 characters" icon="lock" accent />
          <div>
            <Field label="Confirm password" placeholder="Re-enter password" icon="lock" />
            <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
              {[1, 1, 1, 0].map((on, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: on ? WF.accent : WF.fill2 }} />)}
            </div>
            <div style={{ fontFamily: WF.sans, fontSize: 11.5, color: WF.ink3, marginTop: 6 }}>Strong password</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 16 }}>
          <Btn kind="primary" full iconR="chevR" style={{ height: 48 }}>Continue</Btn>
          <Anno style={{ textAlign: 'center' }} c={WF.ink3} size={16}>wizard · one step per screen</Anno>
        </div>
      </div>
    </PhoneScreen>
  );
}

function ScreenSetupDesktop() {
  return (
    <BrowserChrome url="app.sawadev.io/setup">
      <div style={{ height: '100%', display: 'flex' }}>
        {/* step rail */}
        <div style={{ width: 340, background: WF.fill, borderRight: `1px solid ${WF.line}`, padding: '48px 40px', display: 'flex', flexDirection: 'column', gap: 30 }}>
          <Wordmark size={22} />
          <div>
            <div style={{ fontFamily: WF.sans, fontSize: 13, fontWeight: 700, color: WF.ink2, marginBottom: 4 }}>First-run setup</div>
            <div style={{ fontFamily: WF.sans, fontSize: 12.5, color: WF.ink3 }}>One-time configuration</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 15, top: 24, bottom: 24, width: 1.5, background: WF.line }} />
            <StepDot step={SETUP_STEPS[0]} active />
            <StepDot step={SETUP_STEPS[1]} />
            <StepDot step={SETUP_STEPS[2]} />
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: WF.sans, fontSize: 12, color: WF.ink3 }}>You can change all of this later in Settings.</div>
        </div>

        {/* content */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ width: 440 }}>
            <div style={{ fontFamily: WF.sans, fontSize: 13, fontWeight: 600, color: WF.accent, marginBottom: 10 }}>STEP 1 · SECURITY</div>
            <div style={{ fontFamily: WF.sans, fontSize: 30, fontWeight: 700, letterSpacing: -0.6, marginBottom: 8 }}>Set an admin password</div>
            <div style={{ fontFamily: WF.sans, fontSize: 15.5, color: WF.ink2, lineHeight: 1.5, marginBottom: 34 }}>This protects your server's root account. You'll register a passkey for daily sign-in on the next step.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Field label="New password" placeholder="At least 12 characters" icon="lock" accent />
              <Field label="Confirm password" placeholder="Re-enter password" icon="lock" />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
              <Btn kind="ghost">Back</Btn>
              <div style={{ flex: 1 }} />
              <Btn kind="primary" iconR="chevR" style={{ padding: '0 28px' }}>Continue</Btn>
            </div>
          </div>
          <Anno style={{ position: 'absolute', top: 60, right: 56, width: 140, transform: 'rotate(2deg)' }}>stepper rail persists on desktop; full-screen steps on mobile</Anno>
        </div>
      </div>
    </BrowserChrome>
  );
}

Object.assign(window, { ScreenLoginMobile, ScreenLoginDesktop, ScreenSetupMobile, ScreenSetupDesktop });
