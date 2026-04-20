import { useEffect } from 'react';
import { useMeta } from '../utils/useMeta';
import styles from './PulsePage.module.css';

/* ----------------------------------------------------------------
   PulsePage — Pulse marketing / deck page
   Standalone page (no Layout shell). Converts pulse-deck-v2.html.
   ---------------------------------------------------------------- */

export default function PulsePage() {
  useMeta({
    title: 'Pulse — Feedback That Tells You Something | ur/gd Studios',
    description:
      'Stop guessing what people think about your work. Pulse gives you structured, AI-guided feedback that helps you make decisions.',
    ogUrl: 'https://urgdstudios.com/pulse',
    favicon: '/assets/pulse-icon.svg',
  });

  /* Scroll-reveal IntersectionObserver */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <main className={styles.page}>
      {/* Background canvas */}
      <div className={styles.bgCanvas} />

      {/* ===== SECTION 1: HERO ===== */}
      <section className={`${styles.section} ${styles.hero}`}>
        <div className={`${styles.pulseIconWrap} ${styles.reveal}`} data-reveal>
          <img src="/assets/pulse-icon.svg" alt="Pulse" width={120} height={120} />
        </div>
        <h1 className={`${styles.heroWordmark} ${styles.reveal} ${styles.d1}`} data-reveal>
          pulse
        </h1>
        <p className={`${styles.subtitle} ${styles.reveal} ${styles.d2}`} data-reveal>
          Stop guessing what people think about your work. Start a conversation that actually tells you.
        </p>
      </section>

      {/* ===== SECTION 2: THE PROBLEM + HOW IT WORKS ===== */}
      <section className={styles.section}>
        <div className={styles.twoCol}>
          <div className={styles.col}>
            <div className={`${styles.glass} ${styles.problemGlass}`}>
              <h2 className={`${styles.sectionTitle} ${styles.problemTitle} ${styles.reveal}`} data-reveal>
                You share your work. People say{' '}
                <span className={styles.accentGradient}>&ldquo;looks good.&rdquo;</span>
              </h2>
              <p className={`${styles.sectionSub} ${styles.problemSub} ${styles.reveal} ${styles.d1}`} data-reveal>
                That&rsquo;s not feedback. That&rsquo;s politeness. You need to know what landed, what didn&rsquo;t, and what to change.
              </p>
              <div className={`${styles.problemDivider} ${styles.reveal} ${styles.d2}`} data-reveal />
              <p className={`${styles.sectionSub} ${styles.problemExplainer} ${styles.reveal} ${styles.d3}`} data-reveal>
                Pulse is a feedback tool. You upload something you&rsquo;re working on — a document, a design, an early idea — and invite the people you trust to review it. Each reviewer has a short AI-guided conversation that draws out what they actually think. When everyone&rsquo;s done, Pulse pulls it together into one clear view called a Pulse Check.
              </p>
            </div>
          </div>

          {/* iPhone chat mockup */}
          <div className={`${styles.col} ${styles.reveal} ${styles.d2}`} data-reveal>
            <div className={styles.deviceWrap}>
              <div className={styles.deviceGlow} />
              <div className={styles.deviceFrame}>
                <div className={styles.deviceNotch} />
                <div className={styles.deviceScreen}>
                  {/* Top bar */}
                  <div className={styles.scrNav}>
                    <span className={styles.scrNavWm}>pulse</span>
                    <span className={styles.scrNavMeta}>Section 2 of 5</span>
                  </div>
                  {/* Progress line */}
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} />
                  </div>
                  {/* Chat area — auto-scrolling */}
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
                  {/* Input bar */}
                  <div className={styles.inputBar}>
                    <div className={styles.inputField}>Type your response...</div>
                    <div className={styles.inputSend} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: THE PRODUCT ===== */}
      <section className={`${styles.section} ${styles.productSection}`}>
        <h2 className={`${styles.sectionTitle} ${styles.productTitle} ${styles.reveal}`} data-reveal>
          Every reviewer gets a <span className={styles.accentGradient}>thoughtful interviewer</span>
        </h2>

        <ul className={`${styles.diffList} ${styles.reveal} ${styles.d1}`} data-reveal>
          <li>Focused questions tailored to your document</li>
          <li>Section-by-section coverage so nothing gets skipped</li>
          <li>Natural conversation — reviewers talk, they don&rsquo;t fill out forms</li>
          <li>Paced sessions that wrap up when the time you set runs out</li>
          <li>Everything consolidates into a Pulse Check — one clear view of what landed, what didn&rsquo;t, and what to change</li>
        </ul>

        <div className={`${styles.pulseDivider} ${styles.productDivider} ${styles.reveal} ${styles.d2}`} data-reveal />

        {/* iPad mockup — Pulse Check */}
        <div className={`${styles.ipadWrap} ${styles.reveal} ${styles.d3}`} data-reveal>
          <div className={styles.ipadGlow} />
          <div className={styles.ipadFrame}>
            <div className={styles.ipadCamera} />
            <div className={styles.ipadScreen}>
              {/* Top bar */}
              <div className={styles.ipadTopBar}>
                <span className={styles.ipadTopBarWm}>pulse</span>
                <span className={styles.ipadTopBarTitle}>The Next Frontier — Pulse Check</span>
              </div>
              {/* Pulse Check content — auto-scrolling */}
              <div className={styles.pcScrollContainer}>
                <div className={styles.pcFadeTop} />
                <div className={styles.pcFadeBottom} />
                <div className={styles.pcScrollContent}>
                  {/* Verdict block */}
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

                  {/* Section coverage */}
                  <div style={{ marginBottom: 10 }}>
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

                  {/* What Surfaced */}
                  <p className={styles.pcSurfacedTitle}>What Surfaced</p>

                  {/* Conviction: Yearning */}
                  <div className={styles.signalItem}>
                    <div className={styles.signalHeader}>
                      <span className={`${styles.signalBadge} ${styles.signalBadgeConviction}`}>Conviction</span>
                      <span className={styles.signalName}>Yearning as the essay&rsquo;s emotional engine</span>
                    </div>
                    <div className={styles.signalQuote}>
                      yearning for a place we&rsquo;ve never been — sounds almost romantic but profound
                    </div>
                  </div>

                  {/* Conviction: Family metaphor */}
                  <div className={styles.signalItem}>
                    <div className={styles.signalHeader}>
                      <span className={`${styles.signalBadge} ${styles.signalBadgeConviction}`}>Conviction</span>
                      <span className={styles.signalName}>Family metaphor reframes the Fermi paradox as personal loss</span>
                    </div>
                    <div className={styles.signalQuote}>
                      the family metaphor reframes the Fermi paradox as a personal loss you didn&rsquo;t know you were carrying
                    </div>
                  </div>

                  {/* Tension: The Silence */}
                  <div className={styles.signalItem}>
                    <div className={styles.signalHeader}>
                      <span className={`${styles.signalBadge} ${styles.signalBadgeTension}`}>Tension</span>
                      <span className={styles.signalName}>&lsquo;The Silence&rsquo; section arrives too early</span>
                    </div>
                    <div className={styles.signalQuote}>
                      the silence section feels abstract before the reader has settled into the essay&rsquo;s emotional register
                    </div>
                  </div>

                  {/* Uncertainty: Roughness */}
                  <div className={styles.signalItem}>
                    <div className={styles.signalHeader}>
                      <span className={`${styles.signalBadge} ${styles.signalBadgeUncertainty}`}>Uncertainty</span>
                      <span className={styles.signalName}>Silence section&rsquo;s roughness — structural or just pacing</span>
                    </div>
                    <div className={styles.signalQuote}>
                      couldn&rsquo;t fully assess whether the silence section&rsquo;s roughness was a structural problem or just a pacing issue
                    </div>
                  </div>

                  {/* Open Questions */}
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

                  {/* Proposed Revisions */}
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
            </div>
          </div>
        </div>

        <p className={`${styles.privacyLine} ${styles.reveal}`} data-reveal>
          Your work stays yours. Confidentiality gate before every session. Transcripts auto-deleted after 30 days. Your content never trains AI models.
        </p>
      </section>

      {/* ===== SECTION 4: CTA ===== */}
      <section className={`${styles.section} ${styles.cta}`}>
        <h2 className={`${styles.ctaHeading} ${styles.reveal}`} data-reveal>
          Ready to get a <span className={styles.ctaPulse}>pulse</span> on your work?
        </h2>
        <p className={`${styles.subtitle} ${styles.reveal} ${styles.d1}`} data-reveal>
          Upload something you care about. Invite people you trust to review it. See what surfaces.
        </p>
        <div className={`${styles.ctaBtnWrap} ${styles.reveal} ${styles.d2}`} data-reveal>
          <a href="/beta/pulse" className={styles.ctaBtn}>Coming Soon</a>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className={styles.footer}>
        <div className={styles.footerDivider} />
        <p>
          pulse — Quietly Powerful, by{' '}
          <a href="https://urgdstudios.com" className={styles.footerStudioLink}>ur/gd Studios</a>
        </p>
        <p>Seattle, WA</p>
        <p className={styles.footerLegal}>
          <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a>
        </p>
      </footer>
    </main>
  );
}
