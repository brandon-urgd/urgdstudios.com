import { Link } from 'react-router';
import GlassPanel from '../components/GlassPanel';
import SectionReveal from '../components/SectionReveal';
import { useMeta } from '../utils/useMeta';
import styles from './HomePage.module.css';

export default function HomePage() {
  useMeta({
    title: 'ur/gd Studios',
    description:
      'ur/gd Studios is a creative technology studio building tools for people who need them most. Calm, respectful, quietly powerful.',
    ogUrl: 'https://urgdstudios.com/',
  });

  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero} aria-labelledby="hero-heading">
        <img
          src="/assets/logo-studios.png"
          alt="ur/gd Studios"
          className={styles.heroLogo}
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          draggable={false}
        />
        <p id="hero-heading" className={styles.intro}>
          We build the tools we wish we had. Calm, respectful software for
          people navigating complexity. No noise, no dark patterns — just tools
          that carry weight without adding to it.
        </p>
      </section>

      {/* Studios Section */}
      <SectionReveal>
        <section
          className={styles.section}
          aria-labelledby="studios-heading"
        >
          <GlassPanel interactive className={styles.studiosContainer}>
            <h1 id="studios-heading" className={styles.quietlyPowerful}>Quietly Powerful</h1>
            <p className={styles.sectionIntro}>
              You're Good (ur/gd) operates with three studios, each with a distinct purpose.
            </p>

            <div className={styles.studiosGrid}>
              {/* Vault */}
              <GlassPanel className={styles.studioCard}>
                <h3 className={styles.studioName}>Vault</h3>
                <p className={styles.studioDescription}>
                  Vault is where we build the infrastructure that makes everything
                  else possible.
                </p>
              </GlassPanel>

              {/* Station */}
              <GlassPanel className={styles.studioCard}>
                <h3 className={styles.studioName}>Station</h3>
                <p className={styles.studioDescription}>
                  Station is where we partner with clients to build tools tailored
                  to their needs.
                </p>
              </GlassPanel>

              {/* Orbit */}
              <GlassPanel className={styles.studioCard}>
                <h3 className={styles.studioName}>Orbit</h3>
                <p className={styles.studioDescription}>
                  Orbit is where we build our own applications — Pulse,
                  Gather, Stitch, and more.
                </p>
              </GlassPanel>
            </div>
          </GlassPanel>
        </section>
      </SectionReveal>

      {/* Principles Section */}
      <SectionReveal>
        <section
          className={styles.section}
          aria-labelledby="principles-heading"
        >
          <h2 id="principles-heading" className={styles.sectionHeading}>
            Guiding Principles
          </h2>

          <div className={styles.principlesList}>
            {/* Stability */}
            <div className={styles.principle}>
              <h3 className={styles.principleName}>Stability</h3>
              <p className={styles.principleDescription}>
                Reliability and trust in our tools. Systems stay up, data stays
                safe, and features work as expected. We don't ship fast and
                break things — we ship when it's ready.
              </p>
            </div>

            {/* Compassion */}
            <div className={styles.principle}>
              <h3 className={styles.principleName}>Compassion</h3>
              <p className={styles.principleDescription}>
                Empathy for the user's context and needs. We design for people
                who are overwhelmed, not people with infinite time. The
                interface doesn't add stress — it reduces it.
              </p>
            </div>

            {/* Connection */}
            <div className={styles.principle}>
              <h3 className={styles.principleName}>Connection</h3>
              <p className={styles.principleDescription}>
                Helping people feel grounded and linked. Whether connecting a
                community through SMS, preserving a memory through a photo, or
                linking a digital design to a physical creation — our tools
                create bridges, not walls.
              </p>
            </div>

            {/* Growth */}
            <div className={styles.principle}>
              <h3 className={styles.principleName}>Growth</h3>
              <p className={styles.principleDescription}>
                Personal, technical, and community advancement. We build systems
                that grow with you — they adapt, they improve, and they don't
                lock you into patterns that stop working when your needs change.
              </p>
            </div>

            {/* Warmth */}
            <div className={styles.principle}>
              <h3 className={styles.principleName}>Warmth</h3>
              <p className={styles.principleDescription}>
                Experiences that feel human, not mechanical. Tone matters.
                Design matters. The way a button responds, the language in a
                confirmation message, the spacing around text — warmth is in the
                details.
              </p>
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* Applications Teaser */}
      <SectionReveal>
        <section
          className={styles.section}
          aria-labelledby="apps-teaser-heading"
        >
          <Link to="/applications/" className={styles.teaserLink}>
            <GlassPanel interactive>
              <h2 id="apps-teaser-heading" className={styles.teaserHeading}>
                See what we're building
              </h2>
              <p className={styles.teaserText}>
                Tools built under one promise: your data, your privacy, your
                experience. You're good.
              </p>
              <p className={styles.appHighlights}>
                <span className={styles.appName}>
                  Stitch
                  <span className={styles.badgeLive}>Live</span>
                </span>
                <span className={styles.appName}>
                  Pulse
                  <span className={styles.badgeSoon}>Coming Soon</span>
                </span>
                <span className={styles.appName}>
                  Gather
                  <span className={styles.badgeSoon}>Coming Soon</span>
                </span>
              </p>
            </GlassPanel>
          </Link>
        </section>
      </SectionReveal>

      {/* Contact Teaser */}
      <SectionReveal>
        <section
          className={styles.section}
          aria-labelledby="contact-teaser-heading"
        >
          <Link to="/contact/" className={styles.teaserLink}>
            <GlassPanel interactive>
              <h2 id="contact-teaser-heading" className={styles.teaserHeading}>
                Get in touch
              </h2>
              <p className={styles.teaserText}>
                Have a question, an idea, or something to report? We'd like to
                hear from you.
              </p>
            </GlassPanel>
          </Link>
        </section>
      </SectionReveal>
    </div>
  );
}
