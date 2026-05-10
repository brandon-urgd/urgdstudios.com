import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, useInView } from 'framer-motion';
import { useMeta } from '../utils/useMeta';
import AuroraBackground from '../components/pulse/AuroraBackground';
import SignalRings from '../components/pulse/SignalRings';
import PulseWordmark from '../components/pulse/PulseWordmark';
import PhoneMockup from '../components/pulse/PhoneMockup';
import TabletMockup from '../components/pulse/TabletMockup';
import styles from './PulsePage.module.css';

/* ----------------------------------------------------------------
   PulsePage — reimagined cinematic product page
   Standalone page (no Layout shell).
   Sage accent. Dark canvas. Framer Motion for reveals and parallax.
   ---------------------------------------------------------------- */

const SPRING_CONFIG = { stiffness: 50, damping: 20, mass: 0.5 };

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/** Scroll-triggered reveal wrapper. Reduced-motion passes content through. */
function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

export default function PulsePage() {
  useMeta({
    title: 'Pulse — Feedback That Tells You Something | ur/gd Studios',
    description:
      'Stop guessing what people think about your work. Pulse gives you structured, AI-guided feedback that helps you make decisions.',
    ogUrl: 'https://urgdstudios.com/pulse',
    favicon: '/assets/pulse-icon.svg',
  });

  const heroRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, SPRING_CONFIG);
  const springY = useSpring(mouseY, SPRING_CONFIG);

  const bgX = useTransform(springX, [-0.5, 0.5], [20, -20]);
  const bgY = useTransform(springY, [-0.5, 0.5], [20, -20]);
  const midX = useTransform(springX, [-0.5, 0.5], [12, -12]);
  const midY = useTransform(springY, [-0.5, 0.5], [12, -12]);
  const fgX = useTransform(springX, [-0.5, 0.5], [6, -6]);
  const fgY = useTransform(springY, [-0.5, 0.5], [6, -6]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (shouldReduceMotion || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  return (
    <main className={styles.page}>
      {/* ===== HERO ===== */}
      <section
        ref={heroRef}
        className={styles.hero}
        onMouseMove={handleMouseMove}
      >
        <motion.div
          className={styles.layer}
          style={shouldReduceMotion ? undefined : { x: bgX, y: bgY }}
        >
          <AuroraBackground />
        </motion.div>

        <motion.div
          className={styles.layer}
          style={shouldReduceMotion ? undefined : { x: midX, y: midY }}
        >
          <SignalRings />
        </motion.div>

        <div className={styles.heroContent}>
          <motion.div
            className={styles.iconWrap}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <img src="/assets/pulse-icon.svg" alt="Pulse" width={80} height={80} />
          </motion.div>

          <motion.div
            className={styles.tagline}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            QUIETLY POWERFUL
          </motion.div>

          <motion.div
            style={shouldReduceMotion ? undefined : { x: fgX, y: fgY }}
          >
            <PulseWordmark />
          </motion.div>

          <motion.h2
            className={styles.headline}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            Your work deserves an honest answer.
          </motion.h2>

          <motion.p
            className={styles.subhead}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            Pulse gathers thoughtful feedback through brief AI-guided conversations
            and consolidates everything into one clear, actionable view.
          </motion.p>
        </div>
      </section>

      {/* ===== PROBLEM + HOW IT WORKS ===== */}
      <Reveal>
        <section className={styles.section}>
          <div className={styles.twoCol}>
            <div className={styles.textCol}>
              <h2 className={styles.problemTitle}>
                You share your work. People say{' '}
                <span className={styles.accentGradient}>&ldquo;looks good.&rdquo;</span>
              </h2>
              <p className={styles.problemSub}>
                That&rsquo;s not feedback. That&rsquo;s politeness. You need to know what landed, what didn&rsquo;t, and what to change.
              </p>
              <div className={styles.problemDivider} />
              <p className={styles.problemExplainer}>
                Pulse is a feedback tool. You upload something you&rsquo;re working on — a document, a design, an early idea — and invite the people you trust to review it. Each reviewer has a short AI-guided conversation that draws out what they actually think. When everyone&rsquo;s done, Pulse pulls it together into one clear view called a Pulse Check.
              </p>
            </div>

            <div className={styles.mockupCol}>
              <PhoneMockup>
                <div className={styles.scrNav}>
                  <span className={styles.scrNavWm}>pulse</span>
                  <span className={styles.scrNavMeta}>Section 2 of 5</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} />
                </div>
                <div className={styles.chatScrollContainer}>
                  <div className={styles.chatFadeTop} />
                  <div className={styles.chatFadeBottom} />
                  <div className={styles.chatScrollContent}>
                    <div className={`${styles.cb} ${styles.cbAssistant}`}>
                      I&rsquo;ve read through your essay. The opening section — &ldquo;The Oldest Question&rdquo; — sets a big frame. What were you trying to make the reader feel in those first few paragraphs?
                    </div>
                    <div className={styles.cbUserWrap}>
                      <div className={`${styles.cb} ${styles.cbUser}`}>
                        Smallness, but not in a sad way. More like awe. I wanted them to look up and feel something before I started asking harder questions.
                      </div>
                    </div>
                    <div className={`${styles.cb} ${styles.cbAssistant}`}>
                      That comes through. The line about yearning for a place we&rsquo;ve never been landed — it sounds almost romantic but it carries real weight. Let&rsquo;s talk about &ldquo;The Silence.&rdquo; That section shifts tone pretty sharply. Was that intentional?
                    </div>
                    <div className={styles.cbUserWrap}>
                      <div className={`${styles.cb} ${styles.cbUser}`}>
                        Sort of. I wanted to introduce the Fermi paradox but I wasn&rsquo;t sure how to bridge from the personal tone to something more abstract.
                      </div>
                    </div>
                    <div className={`${styles.cb} ${styles.cbAssistant}`}>
                      That tension is worth noting. The reader has just settled into something emotional and then the register changes. It might not be the content — it might be the placement. What about &ldquo;The Weight of Going&rdquo;? That section felt very grounded.
                    </div>
                    <div className={styles.cbUserWrap}>
                      <div className={`${styles.cb} ${styles.cbUser}`}>
                        That one came easiest. The family metaphor just kind of wrote itself. Leaving home but on a cosmic scale.
                      </div>
                    </div>
                    <div className={`${styles.cb} ${styles.cbAssistant}`}>
                      It shows. The family metaphor reframes the whole Fermi paradox as something personal — a loss you didn&rsquo;t know you were carrying. That&rsquo;s the emotional core of the essay. The closing section, &ldquo;Still Looking&rdquo; — did you feel like you landed it?
                    </div>
                    <div className={styles.cbUserWrap}>
                      <div className={`${styles.cb} ${styles.cbUser}`}>
                        Honestly, no. I knew I wanted to end on hope but I think I rushed it. It doesn&rsquo;t have the same weight as the middle sections.
                      </div>
                    </div>
                    <div className={`${styles.cb} ${styles.cbAssistant}`}>
                      That&rsquo;s really helpful to know. The honesty about what felt rushed versus what came naturally — that&rsquo;s exactly the kind of thing that makes this feedback useful. I&rsquo;ll note all of this in the summary.
                    </div>
                  </div>
                </div>
                <div className={styles.inputBar}>
                  <div className={styles.inputField}>Type your response...</div>
                  <div className={styles.inputSend} />
                </div>
              </PhoneMockup>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ===== PRODUCT / DIFFERENTIATORS ===== */}
      <Reveal>
        <section className={styles.section}>
          <h2 className={styles.productTitle}>
            Every reviewer gets a <span className={styles.accentGradient}>thoughtful interviewer</span>
          </h2>

          <ul className={styles.diffList}>
            <li>Focused questions tailored to your document</li>
            <li>Section-by-section coverage so nothing gets skipped</li>
            <li>Natural conversation — reviewers talk, they don&rsquo;t fill out forms</li>
            <li>Paced sessions that wrap up when the time you set runs out</li>
            <li>Everything consolidates into a Pulse Check — one clear view of what landed, what didn&rsquo;t, and what to change</li>
          </ul>

          <div className={styles.pulseDivider} />
        </section>
      </Reveal>

      {/* ===== iPad PULSE CHECK MOCKUP ===== */}
      <Reveal delay={0.15}>
        <section className={styles.section}>
          <TabletMockup>
            <div className={styles.ipadTopBar}>
              <span className={styles.ipadTopBarWm}>pulse</span>
              <span className={styles.ipadTopBarTitle}>The Next Frontier — Pulse Check</span>
            </div>
            <div className={styles.pcScrollContainer}>
              <div className={styles.pcFadeTop} />
              <div className={styles.pcFadeBottom} />
              <div className={styles.pcScrollContent}>
                <div className={styles.verdict}>
                  <div className={styles.verdictLabel}>Verdict</div>
                  <div className={styles.verdictTitle}>
                    Emotionally resonant core with one tonal transition worth revisiting
                  </div>
                  <p className={styles.verdictBody}>
                    This essay lands its emotional ambition — the yearning framing and family metaphor genuinely recast the Fermi paradox as something personal and felt. The one area worth revisiting is &lsquo;The Silence&rsquo; section, which arrives before the reader has fully settled in. The question isn&rsquo;t whether it belongs, but where and how it should be paced.
                  </p>
                  <div className={styles.verdictEnergy}>
                    <span className={styles.verdictEnergyLabel}>Overall energy</span>
                    <span className={styles.verdictEnergyBadge}>Engaged</span>
                  </div>
                  <p className={styles.verdictMeta}>Based on 1 reviewer · Solo</p>
                </div>

                <div className={styles.pcSectionsBlock}>
                  <p className={styles.pcSectionLabel}>Sections you asked reviewers to cover</p>
                  <p className={styles.pcSectionDesc}>Reviewers touched on every section you requested.</p>
                  <div className={styles.pcSectionList}>
                    <div className={styles.pcSectionRow}>
                      <span className={styles.pcSectionRowName}>The Oldest Question</span>
                      <span className={styles.pcSectionRowDepth}>skim <span className={styles.pcCheck}>✓</span></span>
                    </div>
                    <div className={styles.pcSectionRow}>
                      <span className={styles.pcSectionRowName}>The Longing</span>
                      <span className={styles.pcSectionRowDepth}>skim <span className={styles.pcCheck}>✓</span></span>
                    </div>
                    <div className={styles.pcSectionRow}>
                      <span className={styles.pcSectionRowName}>The Silence</span>
                      <span className={styles.pcSectionRowDepth}>explore <span className={styles.pcCheck}>✓</span></span>
                    </div>
                    <div className={styles.pcSectionRow}>
                      <span className={styles.pcSectionRowName}>The Weight of Going</span>
                      <span className={styles.pcSectionRowDepth}>deep <span className={styles.pcCheck}>✓</span></span>
                    </div>
                    <div className={styles.pcSectionRow}>
                      <span className={styles.pcSectionRowName}>Still Looking</span>
                      <span className={styles.pcSectionRowDepth}>skim <span className={styles.pcCheck}>✓</span></span>
                    </div>
                  </div>
                </div>

                <div className={styles.pcDivider} />

                <p className={styles.pcSurfacedTitle}>What Surfaced</p>

                <div className={styles.signalItem}>
                  <div className={styles.signalHeader}>
                    <span className={`${styles.signalBadge} ${styles.signalBadgeConviction}`}>Conviction</span>
                    <span className={styles.signalName}>Yearning as the essay&rsquo;s emotional engine</span>
                  </div>
                  <div className={styles.signalQuote}>
                    yearning for a place we&rsquo;ve never been — sounds almost romantic but profound
                  </div>
                </div>

                <div className={styles.signalItem}>
                  <div className={styles.signalHeader}>
                    <span className={`${styles.signalBadge} ${styles.signalBadgeConviction}`}>Conviction</span>
                    <span className={styles.signalName}>Family metaphor reframes the Fermi paradox as personal loss</span>
                  </div>
                  <div className={styles.signalQuote}>
                    the family metaphor reframes the Fermi paradox as a personal loss you didn&rsquo;t know you were carrying
                  </div>
                </div>

                <div className={styles.signalItem}>
                  <div className={styles.signalHeader}>
                    <span className={`${styles.signalBadge} ${styles.signalBadgeTension}`}>Tension</span>
                    <span className={styles.signalName}>&lsquo;The Silence&rsquo; section arrives too early</span>
                  </div>
                  <div className={styles.signalQuote}>
                    the silence section feels abstract before the reader has settled into the essay&rsquo;s emotional register
                  </div>
                </div>

                <div className={styles.signalItem}>
                  <div className={styles.signalHeader}>
                    <span className={`${styles.signalBadge} ${styles.signalBadgeUncertainty}`}>Uncertainty</span>
                    <span className={styles.signalName}>Silence section&rsquo;s roughness — structural or just pacing</span>
                  </div>
                  <div className={styles.signalQuote}>
                    couldn&rsquo;t fully assess whether the silence section&rsquo;s roughness was a structural problem or just a pacing issue
                  </div>
                </div>

                <div className={styles.signalItem}>
                  <div className={styles.signalHeader}>
                    <span className={`${styles.signalBadge} ${styles.signalBadgeUncertainty}`}>Uncertainty</span>
                    <span className={styles.signalName}>Open Questions</span>
                  </div>
                  <div className={styles.signalQuestion}>
                    Is &lsquo;The Silence&rsquo; in the wrong position structurally, or does it just need more grounding?
                  </div>
                  <div className={styles.signalQuestionExtra}>
                    Should the family metaphor arrive earlier to give readers an emotional handhold?
                  </div>
                </div>

                <div className={styles.pcDivider} />

                <p className={styles.pcRevisionsTitle}>Proposed Revisions</p>
                <p className={styles.pcRevisionsDesc}>
                  Mark each proposal — decisions are saved and used when you generate a revision.
                </p>
                <p className={styles.pcRevisionsCategoryLabel}>Structural</p>

                <div className={styles.revisionCard}>
                  <p className={styles.revisionCardTitle}>
                    Move &lsquo;The Silence&rsquo; section later in the essay, after the family metaphor and &lsquo;The Weight of Going&rsquo; have done their grounding work.
                  </p>
                  <p className={styles.revisionCardMeta}>1 reviewer flagged this</p>
                  <p className={styles.revisionCardBody}>
                    The reviewer flagged the silence section as arriving before the reader had settled in — the tonal shift felt jarring.
                  </p>
                  <div className={styles.revisionActions}>
                    <span className={styles.revisionActionAccept}>Accept</span>
                    <span className={styles.revisionActionSecondary}>Adjust</span>
                    <span className={styles.revisionActionSecondary}>Dismiss</span>
                  </div>
                </div>

                <div className={styles.revisionCard}>
                  <p className={styles.revisionCardTitle}>
                    Consider introducing the family metaphor before or at the start of &lsquo;The Silence&rsquo; so readers have the Fermi-as-personal-loss frame.
                  </p>
                  <p className={styles.revisionCardMeta}>1 reviewer flagged this</p>
                  <p className={styles.revisionCardBody}>
                    The family metaphor was identified as a reframing device — placing it earlier would give the silence section a more legible emotional context.
                  </p>
                  <div className={styles.revisionActions}>
                    <span className={styles.revisionActionAccept}>Accept</span>
                    <span className={styles.revisionActionSecondary}>Adjust</span>
                    <span className={styles.revisionActionSecondary}>Dismiss</span>
                  </div>
                </div>
              </div>
            </div>
          </TabletMockup>
        </section>
      </Reveal>

      {/* ===== PRIVACY BEAT ===== */}
      <Reveal>
        <section className={styles.section}>
          <p className={styles.privacyLine}>
            Your work stays yours. Confidentiality gate before every session. Transcripts auto-deleted after 30 days. Your content never trains AI models.
          </p>
        </section>
      </Reveal>

      {/* ===== CTA ===== */}
      <Reveal>
        <section className={`${styles.section} ${styles.cta}`}>
          <h2 className={styles.ctaHeading}>
            Ready to get a <span className={styles.ctaPulse}>pulse</span> on your work?
          </h2>
          <p className={styles.ctaSub}>
            Upload something you care about. Invite people you trust to review it. See what surfaces.
          </p>
          <div className={styles.ctaBtnWrap}>
            <a href="/beta/pulse" className={styles.ctaBtn}>Coming Soon</a>
          </div>
        </section>
      </Reveal>

      {/* ===== FOOTER ===== */}
      <footer className={styles.footer}>
        <div className={styles.footerDivider} />
        <p>
          pulse — Quietly Powerful, by{' '}
          <a href="https://urgdstudios.com/" className={styles.footerStudioLink}>ur/gd Studios</a>
        </p>
        <p>Seattle, WA</p>
        <p className={styles.footerLegal}>
          <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a>
        </p>
      </footer>
    </main>
  );
}
