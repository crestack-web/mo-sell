"use client";

import React, { useState } from "react";
import { SupportChatWidget } from "@/components/SupportChatWidget";
import { MotionFrame } from "@/components/MotionFrame";

const C = {
  primary: "#0EA5E9",
  primaryDk: "#0369A1",
  accent: "#6366F1",
  bg: "#F0F9FF",
  bgSoft: "#E0F2FE",
  surface: "#FFFFFF",
  border: "#E0EFFA",
  text1: "#0C1A2E",
  text2: "#3D5A7A",
  text3: "#8AAABF",
  green: "#16A34A",
  greenBg: "#DCFCE7",
  purpleBg: "#EDE9FE",
  amberBg: "#FEF3C7",
  roseBg: "#FFF1F2",
  navy: "#081526",
};
const FONT_DISPLAY = "'Clash Display','Plus Jakarta Sans',sans-serif";
const FONT_BODY = "'Plus Jakarta Sans',system-ui,sans-serif";

function Container({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", ...style }}>{children}</div>;
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "8px 14px", borderRadius: 999,
      background: "rgba(14,165,233,0.10)", color: C.primaryDk,
      fontSize: 12, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase",
    }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: C.primary, boxShadow: "0 0 0 4px rgba(14,165,233,0.15)" }} />
      {children}
    </span>
  );
}

function Btn({ href, children, ghost = false, light = false }: { href: string; children: React.ReactNode; ghost?: boolean; light?: boolean }) {
  const style: React.CSSProperties = ghost
    ? { color: C.text1, background: C.surface, border: `1px solid ${C.border}` }
    : light
      ? { color: C.primaryDk, background: "#fff", border: "1px solid #fff" }
      : { color: "#fff", background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`, border: "1px solid transparent", boxShadow: "0 12px 30px rgba(14,165,233,0.28)" };
  return (
    <a href={href} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      gap: 8, padding: "14px 24px", borderRadius: 14,
      fontWeight: 800, fontSize: 15, textDecoration: "none",
      fontFamily: FONT_BODY, transition: "transform .2s ease, box-shadow .2s ease",
      ...style,
    }}>{children}</a>
  );
}

function SectionHead({ pill, title, body, center = true }: { pill: string; title: React.ReactNode; body?: string; center?: boolean }) {
  return (
    <div style={{ maxWidth: center ? 780 : 660, margin: center ? "0 auto 42px" : "0 0 32px", textAlign: center ? "center" : "left" }}>
      <Pill>{pill}</Pill>
      <h2 style={{
        fontFamily: FONT_DISPLAY, fontSize: "clamp(2rem,4vw,3.15rem)",
        lineHeight: 1.08, letterSpacing: "-0.035em", margin: "16px 0 0", color: C.text1,
      }}>{title}</h2>
      {body ? <p style={{ margin: "16px 0 0", fontSize: 17, lineHeight: 1.7, color: C.text2 }}>{body}</p> : null}
    </div>
  );
}

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TopNav() {
  const [open, setOpen] = useState(false);
  const link: React.CSSProperties = { color: C.text2, textDecoration: "none", fontSize: 14, fontWeight: 700 };
  const items = [["#why","Why MO Sell"],["#features","Features"],["#commerce","Ecommerce"],["#creators","Creators"],["/creators","For creators"],["#faq","FAQ"],["/pricing","Pricing"]];
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 60,
      background: "rgba(245,251,255,0.86)", backdropFilter: "blur(14px)",
      borderBottom: `1px solid rgba(220,236,248,0.9)`,
    }}>
      <Container style={{ height: 74, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
        <a href="/welcome" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="" style={{ height: 38, width: "auto" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mo-sell-wordmark.png" alt="MO Sell" style={{ height: 24, width: "auto" }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: C.accent, letterSpacing: ".06em", textTransform: "uppercase", borderLeft: `1px solid ${C.border}`, paddingLeft: 12, marginLeft: 4 }}>For brands</span>
        </a>
        <div className="mb-nav" style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {items.map(([href, label]) => <a key={href} href={href} style={link}>{label}</a>)}
          <a href="/brand-auth/login" style={{ ...link, color: C.text1 }}>Brand login</a>
          <Btn href="/brand-auth/register">Get started</Btn>
        </div>
        <button className="mb-menu-btn" onClick={() => setOpen(!open)} aria-label="Open menu" style={{ display: "none", background: "none", border: 0, padding: 8, cursor: "pointer" }}>
          <div style={{ width: 24, height: 2, background: C.text1, marginBottom: 5 }} />
          <div style={{ width: 24, height: 2, background: C.text1, marginBottom: 5 }} />
          <div style={{ width: 24, height: 2, background: C.text1 }} />
        </button>
      </Container>
      {open ? (
        <div className="mb-mobile" style={{ padding: "16px 24px 24px", borderTop: `1px solid ${C.border}`, background: C.surface, display: "grid", gap: 14 }}>
          {items.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)} style={{ ...link, fontSize: 15 }}>{label}</a>)}
          <a href="/brand-auth/login" onClick={() => setOpen(false)} style={{ ...link, fontSize: 15 }}>Brand login</a>
          <Btn href="/brand-auth/register">Get started</Btn>
        </div>
      ) : null}
      <style>{`@media(max-width:960px){.mb-nav{display:none!important}.mb-menu-btn{display:block!important}}@media(min-width:961px){.mb-mobile{display:none!important}}`}</style>
    </nav>
  );
}

function Hero() {
  return (
    <section style={{
      position: "relative", overflow: "hidden", padding: "72px 0 80px",
      background: "radial-gradient(circle at 12% 20%, rgba(99,102,241,.14), transparent 34%), radial-gradient(circle at 88% 18%, rgba(14,165,233,.16), transparent 34%), linear-gradient(180deg, #F5FBFF 0%, #FFFFFF 100%)",
    }}>
      <div style={{ position: "absolute", inset: 0, opacity: .035, pointerEvents: "none", backgroundImage: "radial-gradient(circle at 20% 30%, #16A34A 2px, transparent 2px), radial-gradient(circle at 80% 70%, #7C3AED 2px, transparent 2px)", backgroundSize: "62px 62px" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/floating/brand-float-warm.jpg" alt="" aria-hidden="true" className="bf-float bf-float--one" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/floating/brand-float-cream.jpg" alt="" aria-hidden="true" className="bf-float bf-float--two" />
      <style>{`
        .bf-float{position:absolute;z-index:0;pointer-events:none;object-fit:cover;opacity:.88;border:1px solid rgba(255,255,255,.8);box-shadow:0 24px 60px -24px rgba(15,23,42,.3)}
        .bf-float--one{width:172px;height:166px;left:1.5%;top:112px;border-radius:32px;transform:rotate(-9deg)}
        .bf-float--two{width:148px;height:148px;right:1.5%;bottom:74px;border-radius:46% 32% 42% 28%;transform:rotate(8deg)}
        @media(max-width:1100px){
          .bf-float--one{width:112px;height:108px;left:8px;top:8px;border-radius:24px;opacity:.55}
          .bf-float--two{width:96px;height:96px;right:8px;bottom:48px;opacity:.5}
        }
        @media(max-width:640px){
          .bf-float--one{width:78px;height:76px;left:-12px;top:8px;border-radius:18px;opacity:.45;box-shadow:0 12px 26px -12px rgba(15,23,42,.24)}
          .bf-float--two{width:70px;height:70px;right:-12px;bottom:24px;opacity:.4;box-shadow:0 12px 26px -12px rgba(15,23,42,.24)}
        }
      `}</style>
      <Container style={{ position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", maxWidth: 920, margin: "0 auto" }}>
          <Pill>MO Sell for brands</Pill>
          <h1 style={{
            fontFamily: FONT_DISPLAY, fontWeight: 800,
            fontSize: "clamp(2.4rem,5.7vw,4.6rem)", lineHeight: 1.03,
            letterSpacing: "-0.045em", margin: "20px 0 18px", color: C.text1,
          }}>
            Find creators who can <span style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>actually move your product.</span>
          </h1>
          <p style={{ maxWidth: 720, margin: "0 auto", color: C.text2, fontSize: 18, lineHeight: 1.75 }}>
            MO Sell brings creator discovery, campaign briefs, video purchasing, and performance tracking into one brand workspace. Go from “we need content” to a creator cohort you can actually work with — in minutes, not weeks.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 30 }}>
            <Btn href="/brand-auth/register">Create brand account</Btn>
            <Btn href="#how" ghost>See how it works</Btn>
          </div>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginTop: 22, fontSize: 13, color: C.text3, fontWeight: 700 }}>
            <span>✓ Creator discovery</span><span>✓ Pay per video</span><span>✓ Wallet-funded campaigns</span>
          </div>
        </div>

        <MotionFrame
          src="/motion/mo-sell-brand-storefront.html"
          title="MO Sell brand storefront setup motion"
          ratio="900 / 640"
          style={{ marginTop: 54 }}
        />
      </Container>
    </section>
  );
}

function TrustStrip() {
  const labels = ["Skincare", "Fashion", "Food & drinks", "Home goods", "Tech", "Agencies"];
  return (
    <section style={{ padding: "34px 0", background: C.surface, borderBottom: `1px solid ${C.border}` }}>
      <Container>
        <div style={{ textAlign: "center", fontSize: 12, color: C.text3, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 20 }}>
          Built for brands across categories
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {labels.map(x => <span key={x} style={{ padding: "10px 18px", borderRadius: 999, border: `1px solid ${C.border}`, background: C.bgSoft, color: C.text2, fontSize: 13, fontWeight: 800 }}>{x}</span>)}
        </div>
      </Container>
    </section>
  );
}

function Problem() {
  const items = [
    { icon: "⏳", title: "Finding creators takes forever", body: "You scroll for hours, save a few names, then spend more time chasing DMs and rates." },
    { icon: "🧾", title: "Every campaign starts from scratch", body: "Briefs, shortlists, approvals, and follow-ups get rebuilt for every launch." },
    { icon: "🔍", title: "You can’t connect spend to results", body: "Content goes live, but the link between a creator, a video, and a sale stays fuzzy." },
  ];
  return (
    <section id="why" style={{ padding: "90px 0", background: C.bg }}>
      <Container>
        <SectionHead pill="The problem" title={<>Creator marketing works. <span style={{ color: C.primary }}>So why does it feel this hard?</span></>} body="MO Sell gives brand teams one place to find creators, fund content, and see what actually happened." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
          {items.map(x => (
            <div key={x.title} style={{ background: C.surface, borderRadius: 20, padding: 28, border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(14,88,140,.05)" }}>
              <div style={{ fontSize: 34, marginBottom: 14 }}>{x.icon}</div>
              <h3 style={{ margin: "0 0 10px", fontFamily: FONT_DISPLAY, fontSize: 20, color: C.text1 }}>{x.title}</h3>
              <p style={{ margin: 0, color: C.text2, lineHeight: 1.7 }}>{x.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Write one brief", d: "Tell MO Sell what you're launching, who it's for, and the kind of content you need." },
    { n: "02", t: "Shortlist creators", d: "Browse creator profiles, content samples, and audience fit — then pick who you want to work with." },
    { n: "03", t: "Fund and track", d: "Top up your brand wallet, purchase videos, and review everything in one campaign view." },
  ];
  return (
    <section id="how" style={{ padding: "90px 0", background: C.surface }}>
      <Container>
        <SectionHead pill="How it works" title={<>From brief to content in <span style={{ color: C.accent }}>three clear steps.</span></>} body="Less back-and-forth, more time for the work only your team can do." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
          {steps.map(s => (
            <div key={s.n} style={{ borderRadius: 22, padding: 30, background: C.bgSoft, border: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 48, fontWeight: 800, color: "rgba(14,165,233,.18)", lineHeight: 1 }}>{s.n}</div>
              <h3 style={{ margin: "12px 0 10px", fontFamily: FONT_DISPLAY, fontSize: 22, color: C.text1 }}>{s.t}</h3>
              <p style={{ margin: 0, color: C.text2, lineHeight: 1.7 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function FeatureBlock({ reverse, eyebrow, title, body, bullets, visual }: { reverse?: boolean; eyebrow: string; title: React.ReactNode; body: string; bullets: string[]; visual: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 42, alignItems: "center", marginBottom: 76 }}>
      <div style={{ order: reverse ? 2 : 1 }}>
        <Pill>{eyebrow}</Pill>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(1.8rem,3.2vw,2.7rem)", lineHeight: 1.12, letterSpacing: "-0.03em", margin: "18px 0 14px", color: C.text1 }}>{title}</h3>
        <p style={{ margin: "0 0 20px", color: C.text2, fontSize: 16, lineHeight: 1.75, maxWidth: 560 }}>{body}</p>
        <div style={{ display: "grid", gap: 10 }}>
          {bullets.map(b => <div key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start", color: C.text1, fontSize: 14, fontWeight: 700 }}><Check /><span>{b}</span></div>)}
        </div>
      </div>
      <div style={{ order: reverse ? 1 : 2 }}>{visual}</div>
    </div>
  );
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, boxShadow: "0 18px 50px rgba(14,88,140,.10)", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, background: "#F8FCFF", fontSize: 12, fontWeight: 800, color: C.text3, letterSpacing: ".08em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ padding: 22 }}>{children}</div>
    </div>
  );
}

function Features() {
  return (
    <section id="features" style={{ padding: "92px 0 20px", background: C.bg }}>
      <Container>
        <SectionHead pill="Platform" title={<>Everything a brand needs to <span style={{ color: C.primary }}>run creator campaigns.</span></>} body="One workspace for discovery, content purchasing, and measurement — designed for the way African brands actually market." />

        <FeatureBlock
          eyebrow="Creator discovery"
          title={<>Find the right people, <span style={{ color: C.primary }}>not just the loudest.</span></>}
          body="Browse a creator marketplace built around real content and audience fit. Shortlist people who make the kind of videos your customers actually watch."
          bullets={["Creator profiles with content samples", "Filter by niche, platform, and content style", "Save shortlists into a campaign workspace"]}
          visual={<Panel label="Creator shortlist">
            <div style={{ display: "grid", gap: 12 }}>
              {[["Ada · Skincare", "12.4k", "TikTok"], ["Tomi · Food", "8.9k", "Instagram"], ["Jide · Tech", "21k", "YouTube"]].map(([n, f, p], i) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, background: i === 0 ? C.bgSoft : C.surface, border: `1px solid ${C.border}` }}>
                  <div style={{ width: 38, height: 38, borderRadius: 999, background: ["#DCFCE7", "#FEF3C7", "#EDE9FE"][i], display: "grid", placeItems: "center", fontWeight: 800, color: C.text1 }}>{n[0]}</div>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 800, color: C.text1, fontSize: 14 }}>{n}</div><div style={{ fontSize: 12, color: C.text3 }}>{p} · {f} viewers</div></div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.green }}>Shortlisted</div>
                </div>
              ))}
            </div>
          </Panel>}
        />

        <FeatureBlock
          reverse
          eyebrow="Campaign workspace"
          title={<>One brief. <span style={{ color: C.accent }}>One place to run it.</span></>}
          body="Keep the brief, creator list, purchased videos, and campaign notes together. No more scattered spreadsheets, DMs, or forgotten approvals."
          bullets={["Campaign brief and creator cohort in one view", "Track which videos you've purchased", "Notes and status for every creator"]}
          visual={<Panel label="Campaign · Spring drop">
            <div style={{ display: "grid", gap: 12 }}>
              {[["Brief", "Approved"], ["Creators", "12 shortlisted"], ["Videos", "8 purchased"], ["Review", "In progress"]].map(([k, v], i) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 12, background: i === 0 ? "#F0FDF4" : C.bgSoft, fontSize: 14 }}>
                  <span style={{ fontWeight: 800, color: C.text1 }}>{k}</span>
                  <span style={{ color: i === 0 ? C.green : C.text2, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
          </Panel>}
        />

        <FeatureBlock
          eyebrow="Wallet & purchasing"
          title={<>Fund once. <span style={{ color: C.green }}>Buy videos as you go.</span></>}
          body="Top up your brand wallet, then purchase creator videos when you find the right fit. No repeated bank transfers or awkward rate negotiations for every single asset."
          bullets={["Brand wallet for campaign funds", "Pay-per-video purchasing flow", "Purchase history tied to your campaigns"]}
          visual={<Panel label="Brand wallet">
            <div style={{ textAlign: "center", padding: "12px 0 18px" }}>
              <div style={{ fontSize: 13, color: C.text3, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Available balance</div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 40, fontWeight: 800, color: C.text1, marginTop: 6 }}>₦250,000</div>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: C.text2 }}><span>Video · @ada_skin</span><span>− ₦25,000</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: C.text2 }}><span>Video · @tomi_eats</span><span>− ₦18,000</span></div>
              <div style={{ height: 1, background: C.border }} />
              <div style={{ textAlign: "center", fontSize: 13, fontWeight: 800, color: C.primaryDk }}>Top up wallet</div>
            </div>
          </Panel>}
        />

        <FeatureBlock
          reverse
          eyebrow="Measurement"
          title={<>See what your creator <span style={{ color: C.accent }}>content actually did.</span></>}
          body="Connect campaigns, videos, and store activity so the next brief starts with evidence instead of guesswork."
          bullets={["Campaign-level performance view", "Creator and video history", "Insights you can bring to the next planning meeting"]}
          visual={<Panel label="Performance view">
            <div style={{ display: "grid", gap: 14 }}>
              {[["Views", "184k", C.primary], ["Engagement", "12.6%", C.green], ["Videos live", "8", C.accent]].map(([k, v, color]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 14, background: C.bgSoft }}>
                  <span style={{ color: C.text2, fontWeight: 700 }}>{k}</span>
                  <span style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: color as string }}>{v}</span>
                </div>
              ))}
              <div style={{ fontSize: 12, color: C.text3, textAlign: "center" }}>Illustrative campaign view</div>
            </div>
          </Panel>}
        />
      </Container>
    </section>
  );
}

function CreatorCommunity() {
  return (
    <section id="creators" style={{ padding: "88px 0", background: C.surface }}>
      <Container>
        <SectionHead pill="Creator network" title={<>Work with creators who are <span style={{ color: C.primary }}>already creating.</span></>} body="MO Sell creators aren't just names in a database. They are active on their own storefronts and content channels, producing the kind of work your audience actually engages with." />
        <MotionFrame
          src="/motion/mo-sell-ugc-offers-briefs.html"
          title="MO Sell UGC offers and briefs motion"
          ratio="900 / 640"
          style={{ maxWidth: 900, margin: "28px auto 0" }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginTop: 28 }}>
          {[["Real content", "See samples before you shortlist."], ["Multiple platforms", "Instagram, TikTok, YouTube and more."], ["Creator-owned stores", "Creators already using MO Sell to run their business."]].map(([t, d]) => (
            <div key={t} style={{ padding: 20, borderRadius: 16, background: C.greenBg }}>
              <div style={{ fontWeight: 800, color: C.text1, marginBottom: 6 }}>{t}</div>
              <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.6 }}>{d}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Service() {
  return (
    <section style={{ padding: "88px 0", background: C.bg }}>
      <Container style={{ maxWidth: 900 }}>
        <SectionHead pill="More than software" title={<>Tools are useful. <span style={{ color: C.primary }}>Execution is everything.</span></>} body="MO Sell gives your team the platform and the structure to run creator marketing like a repeatable channel — not a one-off experiment." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 18 }}>
          {[
            ["Discovery", "Find creators with the right content and audience fit."],
            ["Briefing", "Turn a campaign idea into a clear creator brief."],
            ["Purchasing", "Fund and buy videos without repetitive admin."],
            ["Measurement", "Review what worked before the next campaign."],
          ].map(([t, d], i) => (
            <div key={t} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", background: i % 2 ? C.purpleBg : C.greenBg, color: C.text1, fontWeight: 800, marginBottom: 14 }}>{i + 1}</div>
              <h3 style={{ margin: "0 0 8px", fontFamily: FONT_DISPLAY, fontSize: 18, color: C.text1 }}>{t}</h3>
              <p style={{ margin: 0, color: C.text2, lineHeight: 1.65, fontSize: 14 }}>{d}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Checklist() {
  const items = [
    "Creator discovery", "Campaign briefs", "Creator shortlists", "Content samples",
    "Pay-per-video purchasing", "Brand wallet", "Campaign workspace", "Video history",
    "Performance view", "Brand login & roles", "Creator marketplace", "Store-linked insights",
  ];
  return (
    <section style={{ padding: "88px 0", background: C.surface }}>
      <Container>
        <SectionHead pill="Built in" title={<>One platform for the <span style={{ color: C.accent }}>whole creator workflow.</span></>} body="No need to stitch together a spreadsheet, a DM thread, a payment app, and a reporting doc." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
          {items.map(x => <div key={x} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 14, background: C.bgSoft, color: C.text1, fontWeight: 700, fontSize: 14 }}><Check />{x}</div>)}
        </div>
      </Container>
    </section>
  );
}

function HostedCommerce() {
  const types = [
    ["🛍️", "Physical products", "Clothes, skincare, food, home goods — with delivery rules built in."],
    ["📥", "Digital products", "Ebooks, templates, presets and files delivered instantly after payment."],
    ["📅", "Bookings & services", "Sessions, appointments and paid consultations with slot management."],
    ["🎟️", "Memberships", "Communities, classes and recurring access for your audience."],
  ];
  return (
    <section id="commerce" style={{ padding: "88px 0", background: C.bg }}>
      <Container>
        <SectionHead pill="Your store, hosted by us" title={<>Creator content is only half the story. <span style={{ color: C.primary }}>We host the other half.</span></>} body="Every brand on MO Sell gets a real, hosted storefront. The videos you buy from creators send customers somewhere that actually converts — and you manage the whole thing from the same workspace." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18, marginBottom: 26 }}>
          {types.map(([icon, t, d]) => (
            <div key={t} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24 }}>
              <div style={{ fontSize: 27, marginBottom: 12 }}>{icon}</div>
              <h3 style={{ margin: "0 0 8px", fontFamily: FONT_DISPLAY, fontSize: 18, color: C.text1 }}>{t}</h3>
              <p style={{ margin: 0, color: C.text2, lineHeight: 1.65, fontSize: 14 }}>{d}</p>
            </div>
          ))}
        </div>
        <MotionFrame
          src="/motion/mo-sell-hero-2.html"
          title="MO Sell store types motion — fashion, food and beauty stores"
          ratio="900 / 640"
          style={{ maxWidth: 900, margin: "0 auto 26px" }}
        />
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 22, padding: 28, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 24, alignItems: "center" }}>
          <div>
            <Pill>The full loop</Pill>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 23, lineHeight: 1.2, margin: "14px 0 10px", color: C.text1 }}>Brief → Video → Store → Sale</h3>
            <p style={{ margin: 0, color: C.text2, lineHeight: 1.7, fontSize: 15 }}>Post a brief, get creator videos, publish them to your channels, and link customers straight to your MO-hosted store. Creators get paid, you get orders, and the next campaign starts with proof.</p>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {[
              ["🏪", "Store built and hosted by MO Sell", "/welcome"],
              ["🎬", "Creators ready to make your content", "/creators"],
              ["🔍", "Browse the creator marketplace", "/ugc-creators"],
              ["💳", "See how plans and pricing work", "/pricing"],
            ].map(([icon, label, href]) => (
              <a key={label} href={href} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", borderRadius: 13, background: C.bg, textDecoration: "none", color: C.text1, fontWeight: 700, fontSize: 14 }}>
                <span style={{ fontSize: 18 }}>{icon}</span><span style={{ flex: 1 }}>{label}</span><span style={{ color: C.primaryDk }}>→</span>
              </a>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "What is MO Sell for brands?", a: "It is a brand workspace for discovering creators, building campaign shortlists, funding video purchases, and tracking creator content in one place." },
    { q: "How do I pay creators?", a: "You top up your brand wallet, then purchase creator videos from the marketplace. Your purchase history stays tied to your campaign view." },
    { q: "Can I see content before choosing a creator?", a: "Yes. Creator profiles include content samples and audience context so your team can shortlist with evidence, not guesswork." },
    { q: "Is this only for big brands?", a: "No. If you have a product to promote and need creator content, the workflow is built to be usable by small teams as well as larger marketing departments." },
    { q: "Can creators also sell on MO Sell?", a: "Yes. Creators can run their own MO Sell storefronts, which makes the network more active and commercially minded than a static contact list." },
    { q: "How do I get started?", a: "Create a brand account, open your brand dashboard, and start by exploring the creator marketplace or setting up your first campaign." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" style={{ padding: "90px 0", background: C.bg }}>
      <Container style={{ maxWidth: 920 }}>
        <SectionHead pill="FAQ" title={<>Questions, <span style={{ color: C.primary }}>answered.</span></>} body="The basics before you open your brand workspace." />
        <div style={{ display: "grid", gap: 12 }}>
          {faqs.map((f, i) => {
            const active = open === i;
            return (
              <div key={f.q} style={{ border: `1px solid ${C.border}`, borderRadius: 16, background: active ? C.bgSoft : C.surface, overflow: "hidden" }}>
                <button onClick={() => setOpen(active ? null : i)} style={{ width: "100%", textAlign: "left", padding: "20px 22px", background: "none", border: 0, cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", fontFamily: FONT_BODY, fontSize: 16, fontWeight: 800, color: C.text1 }}>
                  <span>{f.q}</span><span style={{ color: C.primary, fontSize: 22, lineHeight: 1 }}>{active ? "−" : "+"}</span>
                </button>
                {active ? <div style={{ padding: "0 22px 20px", color: C.text2, lineHeight: 1.7, fontSize: 15 }}>{f.a}</div> : null}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function FinalCTA() {
  return (
    <section style={{ padding: "96px 0", background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`, color: "#fff", textAlign: "center" }}>
      <Container style={{ maxWidth: 760 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(2.2rem,4.8vw,3.8rem)", lineHeight: 1.08, letterSpacing: "-0.03em", margin: 0 }}>
          Your next campaign needs creators.<br />Let’s find them.
        </h2>
        <p style={{ margin: "18px auto 30px", fontSize: 18, lineHeight: 1.7, opacity: .92, maxWidth: 580 }}>
          Open your MO Sell brand workspace, write the brief, and start building a creator cohort today.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn href="/brand-auth/register" light>Create brand account</Btn>
          <a href="/pricing" style={{ display: "inline-flex", padding: "14px 24px", borderRadius: 14, border: "1px solid rgba(255,255,255,.5)", color: "#fff", fontWeight: 800, textDecoration: "none" }}>View pricing</a>
        </div>
      </Container>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ padding: "36px 0", background: C.navy, color: "rgba(255,255,255,.72)" }}>
      <Container style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="MO Sell" style={{ height: 30, width: "auto" }} />
          <span style={{ fontWeight: 800, color: "#fff", fontFamily: FONT_DISPLAY }}>MO Sell</span>
          <span style={{ fontSize: 13 }}>for brands</span>
        </div>
        <div style={{ display: "flex", gap: 18, fontSize: 13, flexWrap: "wrap" }}>
          <a href="/welcome" style={{ color: "inherit", textDecoration: "none" }}>For sellers</a>
          <a href="/creators" style={{ color: "inherit", textDecoration: "none" }}>For creators</a>
          <a href="/ugc-creators" style={{ color: "inherit", textDecoration: "none" }}>Creator marketplace</a>
          <a href="/brand-auth/login" style={{ color: "inherit", textDecoration: "none" }}>Brand login</a>
          <a href="/pricing" style={{ color: "inherit", textDecoration: "none" }}>Pricing</a>
        </div>
        <div style={{ fontSize: 12, opacity: .7 }}>© {new Date().getFullYear()} MO Sell by Busmo. Built for African brands.</div>
      </Container>
    </footer>
  );
}

export default function BrandWelcomePage() {
  return (
    <div style={{ fontFamily: FONT_BODY, background: C.bg, color: C.text1, lineHeight: 1.6 }}>
      <TopNav />
      <main>
        <Hero />
        <TrustStrip />
        <Problem />
        <HowItWorks />
        <Features />
        <HostedCommerce />
        <CreatorCommunity />
        <Service />
        <Checklist />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <SupportChatWidget />
    </div>
  );
}
