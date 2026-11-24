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
  pinkBg: "#FCE7F3",
  amberBg: "#FEF3C7",
  navy: "#081526",
};
const FONT_DISPLAY = "'Clash Display','Plus Jakarta Sans',sans-serif";
const FONT_BODY = "'Plus Jakarta Sans',system-ui,sans-serif";

const CREATOR_SLIDES = [
  "https://res.cloudinary.com/dzjoqbg2u/image/upload/v1787412934/Life_of_majnun_-_1_s4qbgs.png",
  "https://res.cloudinary.com/dzjoqbg2u/image/upload/v1787412931/Life_of_majnun_-_2_aenzh3.png",
  "https://res.cloudinary.com/dzjoqbg2u/image/upload/v1787412933/Life_of_majnun_-_3_rlt0dp.png",
  "https://res.cloudinary.com/dzjoqbg2u/image/upload/v1787641326/Life_of_majnun_-_4_vqmwmf.png",
];

function Container({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", ...style }}>{children}</div>;
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 15px",
      borderRadius: 999, background: "rgba(99,102,241,.10)", color: C.accent,
      fontSize: 12, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase",
    }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: C.accent, boxShadow: "0 0 0 4px rgba(99,102,241,.15)" }} />
      {children}
    </span>
  );
}

function Btn({ href, children, ghost = false, light = false }: { href: string; children: React.ReactNode; ghost?: boolean; light?: boolean }) {
  const style: React.CSSProperties = ghost
    ? { color: C.text1, background: C.surface, border: `1.5px solid ${C.border}` }
    : light
      ? { color: C.primaryDk, background: "#fff", border: "1px solid #fff", boxShadow: "0 12px 30px rgba(0,0,0,.14)" }
      : { color: "#fff", background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`, border: "1px solid transparent", boxShadow: "0 12px 30px rgba(14,165,233,.28)" };
  return (
    <a href={href} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9,
      padding: "15px 26px", borderRadius: 14, fontWeight: 800, fontSize: 15,
      textDecoration: "none", fontFamily: FONT_BODY,
      transition: "transform .2s ease, box-shadow .2s ease", ...style,
    }}>{children}</a>
  );
}

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SectionHead({ pill, title, body }: { pill: string; title: React.ReactNode; body?: string }) {
  return (
    <div style={{ textAlign: "center", maxWidth: 790, margin: "0 auto 44px" }}>
      <Pill>{pill}</Pill>
      <h2 style={{
        fontFamily: FONT_DISPLAY, fontSize: "clamp(2rem,4vw,3.1rem)",
        lineHeight: 1.1, letterSpacing: "-.035em", margin: "16px 0 0", color: C.text1,
      }}>{title}</h2>
      {body ? <p style={{ margin: "16px auto 0", fontSize: 17, lineHeight: 1.7, color: C.text2, maxWidth: 680 }}>{body}</p> : null}
    </div>
  );
}

function TopNav() {
  const [open, setOpen] = useState(false);
  const link: React.CSSProperties = { color: C.text2, textDecoration: "none", fontSize: 14, fontWeight: 700 };
  const links = [["#how", "How it works"], ["#briefs", "Briefs"], ["#loop", "The loop"], ["#storefront", "Link in bio"], ["#faq", "FAQ"], ["/ugc-creators", "Find work"]];
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 60, background: "rgba(240,249,255,.88)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${C.border}` }}>
      <Container style={{ height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <a href="/welcome" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="" style={{ height: 38, width: "auto" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mo-sell-wordmark.png" alt="MO Sell" style={{ height: 23, width: "auto" }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: C.accent, letterSpacing: ".07em", textTransform: "uppercase", borderLeft: `1px solid ${C.border}`, paddingLeft: 10, marginLeft: 2 }}>Creators</span>
        </a>
        <div className="cw-nav" style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {links.map(([href, label]) => <a key={href} href={href} style={link}>{label}</a>)}
          <a href="/dashboard/ugc" style={{ ...link, color: C.text1 }}>My profile</a>
          <Btn href="/signup">Join free</Btn>
        </div>
        <button className="cw-menu-btn" aria-label="Open menu" onClick={() => setOpen(!open)} style={{ display: "none", background: "none", border: 0, padding: 8, cursor: "pointer" }}>
          <div style={{ width: 24, height: 2, background: C.text1, marginBottom: 5 }} />
          <div style={{ width: 24, height: 2, background: C.text1, marginBottom: 5 }} />
          <div style={{ width: 24, height: 2, background: C.text1 }} />
        </button>
      </Container>
      {open && (
        <div className="cw-mobile" style={{ padding: "16px 24px 24px", borderTop: `1px solid ${C.border}`, background: C.surface, display: "grid", gap: 14 }}>
          {[...links, ["/dashboard/ugc", "My profile"]].map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} style={{ ...link, fontSize: 15 }}>{label}</a>
          ))}
          <Btn href="/signup">Join free</Btn>
        </div>
      )}
      <style>{`@media(max-width:960px){.cw-nav{display:none!important}.cw-menu-btn{display:block!important}}@media(min-width:961px){.cw-mobile{display:none!important}}`}</style>
    </nav>
  );
}

function Hero() {
  return (
    <section style={{
      position: "relative", overflow: "hidden", padding: "76px 0 88px",
      background: "radial-gradient(circle at 10% 18%,rgba(99,102,241,.14),transparent 34%),radial-gradient(circle at 90% 16%,rgba(236,72,153,.12),transparent 34%),linear-gradient(180deg,#F0F9FF 0%,#FFFFFF 100%)",
    }}>
      <div style={{ position: "absolute", width: 340, height: 340, borderRadius: "50%", background: "#FBCFE8", filter: "blur(90px)", opacity: .35, top: -100, right: "-5%", pointerEvents: "none" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/floating/creator-float-sage.jpg" alt="" aria-hidden="true" className="cw-float cw-float--one" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/floating/creator-float-dark.jpg" alt="" aria-hidden="true" className="cw-float cw-float--two" />
      <style>{`
        .cw-float{position:absolute;z-index:0;pointer-events:none;object-fit:cover;opacity:.82;border:1px solid rgba(255,255,255,.78);box-shadow:0 24px 60px -24px rgba(15,23,42,.32)}
        .cw-float--one{width:158px;height:158px;left:1.5%;bottom:76px;border-radius:44% 30% 40% 26%;transform:rotate(-8deg)}
        .cw-float--two{width:146px;height:146px;right:1.5%;top:104px;border-radius:34px;transform:rotate(9deg)}
        @media(max-width:1100px){
          .cw-float--one{width:108px;height:108px;left:8px;bottom:48px;border-radius:30px 22px 28px 20px;opacity:.55}
          .cw-float--two{width:100px;height:100px;right:8px;top:8px;border-radius:24px;opacity:.5}
        }
        @media(max-width:640px){
          .cw-float--one{width:74px;height:74px;left:-12px;bottom:18px;border-radius:22px 16px 20px 14px;opacity:.42;box-shadow:0 12px 26px -12px rgba(15,23,42,.24)}
          .cw-float--two{width:70px;height:70px;right:-12px;top:8px;border-radius:18px;opacity:.4;box-shadow:0 12px 26px -12px rgba(15,23,42,.24)}
        }
      `}</style>
      <Container style={{ position: "relative", zIndex: 1 }}>
        <div className="cw-hero-grid">
          <div>
            <Pill>MO Sell for UGC creators</Pill>
            <h1 style={{
              fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "clamp(2.5rem,5.6vw,4.5rem)",
              lineHeight: 1.03, letterSpacing: "-.045em", margin: "22px 0 18px", color: C.text1,
            }}>
              Make videos.<br />Get briefs.<br />
              <span style={{ background: `linear-gradient(100deg,${C.primary} 0%,${C.accent} 55%,#EC4899 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Get paid.</span>
            </h1>
            <p style={{ maxWidth: 580, margin: 0, color: C.text2, fontSize: 18, lineHeight: 1.75 }}>
              Turn the content you already make into a real business. Build a free creator profile, receive brand briefs, upload your videos, and track every payment — all inside MO Sell.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 30 }}>
              <Btn href="/signup">Create my creator profile</Btn>
              <Btn href="#how" ghost>See how it works</Btn>
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 24, fontSize: 13, color: C.text3, fontWeight: 700 }}>
              <span>✓ Free to join</span><span>✓ You set your rates</span><span>✓ 50% deposit upfront</span>
            </div>
          </div>

          <div className="cw-hero-art">
            <MotionFrame
              src="/motion/mo-sell-hero.html"
              title="MO Sell creator motion — storefront, link in bio and earnings"
              ratio="900 / 640"
              loading="eager"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

function Benefits() {
  const items = [
    { icon: "🪪", title: "A profile that sells you", body: "Show niches, sample videos, social stats, prices and delivery time. Brands see the real you before they reach out.", bg: C.bgSoft },
    { icon: "💸", title: "You name your price", body: "Set your own 30s and 60s rates. Brands can accept or send an offer — you always decide what a job is worth.", bg: C.purpleBg },
    { icon: "📥", title: "Briefs come to you", body: "No cold DMs. Brands send structured briefs with product, deliverables, deadline and budget already spelled out.", bg: C.pinkBg },
    { icon: "🛡️", title: "Payments with guardrails", body: "A 50% deposit is held when a brief is accepted, and the balance is released once the brand approves your video.", bg: C.greenBg },
  ];
  return (
    <section style={{ padding: "84px 0", background: C.surface }}>
      <Container>
        <SectionHead pill="Why creators join" title={<>Built around the way <span style={{ color: C.accent }}>creators actually work.</span></>} body="No more chasing invoices, guessing rates, or wondering if a brand is serious. MO Sell puts the business side on autopilot so you can focus on making great content." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 18 }}>
          {items.map((x) => (
            <div key={x.title} style={{ background: x.bg, borderRadius: 22, padding: 26 }}>
              <div style={{ fontSize: 30, marginBottom: 14 }}>{x.icon}</div>
              <h3 style={{ margin: "0 0 10px", fontFamily: FONT_DISPLAY, fontSize: 20, color: C.text1 }}>{x.title}</h3>
              <p style={{ margin: 0, color: C.text2, lineHeight: 1.7, fontSize: 14 }}>{x.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function CreatorLoop() {
  const steps = [
    { n: "01", t: "Create your profile", d: "Add niches, your best sample videos, socials, your rates, and how fast you deliver.", color: C.primary },
    { n: "02", t: "Briefs start landing", d: "Brands find you in the marketplace and send a brief with product, budget and deadline.", color: C.accent },
    { n: "03", t: "Accept & add your video", d: "Use AI content ideas, record your clip, and upload the draft straight to the order.", color: "#DB2777" },
    { n: "04", t: "You and the brand interact", d: "They review, you adjust if needed, and the loop keeps going until both sides are happy.", color: "#D97706" },
    { n: "05", t: "Get paid, repeat", d: "Deposit was held upfront. On approval the balance is released and your earnings update.", color: C.green },
  ];
  return (
    <section id="how" style={{ padding: "88px 0", background: C.bg }}>
      <Container>
        <SectionHead pill="Your journey" title={<>One profile. A clear path <span style={{ color: C.primary }}>from brief to bank.</span></>} body="Every step is tracked, so you always know what a brand wants and exactly where your money is." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16 }}>
          {steps.map((s) => (
            <div key={s.n} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 22, padding: 26, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 14, right: 18, fontFamily: FONT_DISPLAY, fontSize: 44, fontWeight: 800, color: "rgba(14,165,233,.10)", lineHeight: 1 }}>{s.n}</div>
              <div style={{ width: 40, height: 5, borderRadius: 99, background: s.color, marginBottom: 18 }} />
              <h3 style={{ margin: "0 0 10px", fontFamily: FONT_DISPLAY, fontSize: 19, color: C.text1 }}>{s.t}</h3>
              <p style={{ margin: 0, color: C.text2, lineHeight: 1.7, fontSize: 14 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function BriefSection() {
  return (
    <section id="briefs" style={{ padding: "88px 0", background: C.surface }}>
      <Container style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 46, alignItems: "center" }}>
        <div>
          <Pill>Real briefs, not vague DMs</Pill>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(1.9rem,3.5vw,2.9rem)", lineHeight: 1.12, letterSpacing: "-.035em", margin: "18px 0 14px", color: C.text1 }}>
            A brief lands. <span style={{ color: C.primary }}>You already know what to do.</span>
          </h2>
          <p style={{ color: C.text2, lineHeight: 1.75, margin: "0 0 20px" }}>
            Every request arrives with the product, the exact deliverables, the deadline, the budget, and the brief itself. Accept it, reject it, or ask MO for content ideas before you start.
          </p>
          <div style={{ display: "grid", gap: 11 }}>
            {["Product name and link, including their MO-hosted store", "Deliverables spelled out — 30s, 60s, or raw footage", "Deadline and a clear budget with deposit details"].map((b) => (
              <div key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, fontWeight: 700, color: C.text1 }}><Check /><span>{b}</span></div>
            ))}
          </div>
          <div style={{ marginTop: 26 }}><Btn href="/dashboard/ugc">Open my creator studio</Btn></div>
        </div>
        <MotionFrame
          src="/motion/mo-sell-ugc-offers-briefs.html"
          title="MO Sell UGC offers and briefs motion"
          ratio="900 / 640"
        />
      </Container>
    </section>
  );
}

function InteractionLoop() {
  const brand = [
    "Post a brief and fund the deposit",
    "Review the creator's draft video",
    "Ask for changes until it's right",
    "Approve, release the balance, publish",
  ];
  const creator = [
    "Accept the brief that fits your style",
    "Record and upload your video",
    "Adjust the draft from brand feedback",
    "Get paid and keep creating",
  ];
  return (
    <section id="loop" style={{ padding: "88px 0", background: C.bg }}>
      <Container>
        <SectionHead pill="The interaction" title={<>Brands and creators, <span style={{ color: C.accent }}>finally in sync.</span></>} body="MO Sell keeps both sides moving through the same order. Nobody is left guessing who owes what — the brief, the video, the feedback and the payment all live in one place." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20 }}>
          {[
            { title: "Brand side", icon: "🏷️", bg: C.bgSoft, items: brand },
            { title: "Creator side", icon: "🎥", bg: C.pinkBg, items: creator },
          ].map((col) => (
            <div key={col.title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span style={{ width: 42, height: 42, borderRadius: 13, background: col.bg, display: "grid", placeItems: "center", fontSize: 20 }}>{col.icon}</span>
                <h3 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 21, color: C.text1 }}>{col.title}</h3>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {col.items.map((t, i) => (
                  <div key={t} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: col.bg, color: C.primaryDk, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                    <span style={{ color: C.text2, fontSize: 14, lineHeight: 1.6, paddingTop: 2 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 22, textAlign: "center", fontSize: 14, color: C.text2, fontWeight: 700 }}>
          Both sides move together — until the video is live and the payment is complete. ✨
        </div>
      </Container>
    </section>
  );
}

function EcommerceBridge() {
  return (
    <section style={{ padding: "88px 0", background: C.surface }}>
      <Container>
        <SectionHead pill="It doesn't stop at the video" title={<>Every brand here also has <span style={{ color: C.primary }}>a store we host.</span></>} body="That's the difference between a marketplace and an ecosystem. The brands you create for run their ecommerce on MO Sell — so your video doesn't just get views, it has somewhere real to send customers." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18 }}>
          {[
            { icon: "🛒", t: "Stores for every business", d: "Physical products, digital downloads, bookings, or memberships — MO builds and hosts the storefront.", href: "/welcome", cta: "Explore stores" },
            { icon: "🔗", t: "Content with a destination", d: "Your video links straight to a brand's MO-hosted store, so attention turns into an actual order.", href: "/brands", cta: "See the brand side" },
            { icon: "🚀", t: "You can sell too", d: "Creators get their own store as well. Sell your own products, presets, or memberships alongside UGC work.", href: "/signup", cta: "Start free" },
          ].map((x) => (
            <div key={x.t} style={{ border: `1px solid ${C.border}`, borderRadius: 22, padding: 26, background: C.bg, display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{x.icon}</div>
              <h3 style={{ margin: "0 0 10px", fontFamily: FONT_DISPLAY, fontSize: 19, color: C.text1 }}>{x.t}</h3>
              <p style={{ margin: "0 0 20px", color: C.text2, lineHeight: 1.7, fontSize: 14, flex: 1 }}>{x.d}</p>
              <a href={x.href} style={{ color: C.primaryDk, fontWeight: 800, fontSize: 13, textDecoration: "none" }}>{x.cta} →</a>
            </div>
          ))}
        </div>
        <MotionFrame
          src="/motion/mo-sell-hero-2.html"
          title="MO Sell store types motion — fashion, food and beauty stores"
          ratio="900 / 640"
          style={{ maxWidth: 900, margin: "28px auto 0" }}
        />
      </Container>
    </section>
  );
}

function CreatorStorefront() {
  return (
    <section id="storefront" style={{ padding: "88px 0", background: C.bg }}>
      <Container>
        <SectionHead
          pill="Your link in bio, built by MO"
          title={<>Turn your profile into <span style={{ color: C.primary }}>a page that sells.</span></>}
          body="Add a header, a featured product, your links and an Instagram feed in one MO page. Creators use the same hosted ecommerce as brands, so your audience can buy without leaving your bio."
        />
        <MotionFrame
          src="/motion/mo-sell-link-in-bio.html"
          title="MO Sell link in bio builder motion"
          ratio="900 / 660"
          style={{ marginTop: 28 }}
        />
      </Container>
    </section>
  );
}

function ProofSlider() {
  return (
    <section style={{ padding: "60px 0", background: C.bgSoft, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
      <Container>
        <div style={{ textAlign: "center", fontSize: 12, color: C.text3, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 22 }}>
          Creators and sellers already building on MO Sell
        </div>
        <div style={{ overflow: "hidden", borderRadius: 20, background: C.surface, border: `1px solid ${C.border}`, padding: "16px 0" }}>
          <div className="cw-slider" style={{ display: "flex", gap: 10, width: "max-content" }}>
            {[...CREATOR_SLIDES, ...CREATOR_SLIDES].map((src, i) => (
              <div key={`${src}-${i}`} style={{ width: "min(420px,80vw)", height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="Creator on MO Sell" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 12 }} />
              </div>
            ))}
          </div>
        </div>
        <style>{`@keyframes cwSlide{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.cw-slider{animation:cwSlide 24s linear infinite}.cw-slider:hover{animation-play-state:paused}`}</style>
      </Container>
    </section>
  );
}

function Toolkit() {
  const items = [
    "UGC creator profile", "Sample video portfolio", "Set your own rates", "Niche & social stats",
    "Incoming brand briefs", "Accept / reject requests", "AI content ideas", "Video draft upload",
    "Brand review & feedback", "Approval workflow", "Dispute support", "Earnings dashboard",
    "Brand wallet-backed payments", "Pay-per-video purchase", "Your own MO store", "Support chat",
  ];
  return (
    <section style={{ padding: "88px 0", background: C.surface }}>
      <Container>
        <SectionHead pill="Everything included" title={<>The whole creator business, <span style={{ color: C.accent }}>in one toolkit.</span></>} body="Start with a profile and a few sample clips. Add more as you go — the platform grows with you." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12 }}>
          {items.map((x) => <div key={x} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 14, background: C.bg, color: C.text1, fontWeight: 700, fontSize: 14 }}><Check /><span>{x}</span></div>)}
        </div>
      </Container>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "Do I need a huge following to get briefs?", a: "No. Brands on MO Sell care about authentic, useful content. Your niches, sample videos, and the quality of your work matter far more than follower count. You can still connect your Instagram, TikTok, YouTube, or X accounts so brands see the full picture." },
    { q: "How much can I charge for a video?", a: "You set your own price for a 30-second and a 60-second video, plus your delivery time. A brand can accept your rate or send an offer you can choose to accept or decline." },
    { q: "When do I actually get paid?", a: "When a brand accepts your brief, a 50% deposit is held upfront. Once the brand approves your final video, the remaining balance is released. Your creator dashboard shows requests, active orders, and total earnings." },
    { q: "What if the brand wants changes?", a: "That's part of the flow. You submit a draft video, the brand reviews it, and you can adjust it until both sides are happy. If something can't be resolved, MO Sell has a dispute process so nobody is stuck." },
    { q: "Do I need to open a store to be a creator?", a: "No — your creator profile is separate from store features. But every MO Sell user can also launch a hosted store to sell their own products, digital goods, bookings, or memberships, so you can earn in more than one way." },
    { q: "How do I get started?", a: "Create a free MO Sell account, then open the UGC Creator section of your dashboard to build your profile. Add niches, prices, sample videos, and socials — then brands can start sending briefs." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" style={{ padding: "90px 0", background: C.bg }}>
      <Container style={{ maxWidth: 920 }}>
        <SectionHead pill="FAQ" title={<>Questions, <span style={{ color: C.primary }}>answered.</span></>} body="The basics before you open your creator studio." />
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
    <section style={{ padding: "96px 0", background: `linear-gradient(120deg,${C.primary} 0%,${C.accent} 58%,#7C3AED 100%)`, color: "#fff", textAlign: "center" }}>
      <Container style={{ maxWidth: 780 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(2.2rem,4.8vw,3.8rem)", lineHeight: 1.08, letterSpacing: "-.035em", margin: 0 }}>
          Your next brief is waiting.
        </h2>
        <p style={{ margin: "18px auto 30px", fontSize: 18, lineHeight: 1.7, opacity: .93, maxWidth: 580 }}>
          Set up your free creator profile today and start turning the videos you already make into a business that pays.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn href="/signup" light>Create my creator profile</Btn>
          <a href="/dashboard/ugc" style={{ display: "inline-flex", padding: "15px 26px", borderRadius: 14, border: "1px solid rgba(255,255,255,.5)", color: "#fff", fontWeight: 800, textDecoration: "none" }}>I already have an account</a>
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
          <span style={{ fontSize: 13 }}>for creators</span>
        </div>
        <div style={{ display: "flex", gap: 18, fontSize: 13, flexWrap: "wrap" }}>
          <a href="/welcome" style={{ color: "inherit", textDecoration: "none" }}>Stores</a>
          <a href="/brands" style={{ color: "inherit", textDecoration: "none" }}>For brands</a>
          <a href="/ugc-creators" style={{ color: "inherit", textDecoration: "none" }}>Find work</a>
          <a href="/pricing" style={{ color: "inherit", textDecoration: "none" }}>Pricing</a>
        </div>
        <div style={{ fontSize: 12, opacity: .7 }}>© {new Date().getFullYear()} MO Sell by Busmo.</div>
      </Container>
    </footer>
  );
}

export default function CreatorWelcomeClient() {
  return (
    <div style={{ fontFamily: FONT_BODY, background: C.bg, color: C.text1, lineHeight: 1.6 }}>
      <TopNav />
      <main>
        <Hero />
        <Benefits />
        <CreatorLoop />
        <BriefSection />
        <InteractionLoop />
        <EcommerceBridge />
        <CreatorStorefront />
        <ProofSlider />
        <Toolkit />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <SupportChatWidget />
    </div>
  );
}
