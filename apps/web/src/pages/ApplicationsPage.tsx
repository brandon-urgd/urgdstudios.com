import { Link } from 'react-router-dom';
import ContentContainer from '../components/ContentContainer';
import PageHeader from '../components/PageHeader';
import SectionReveal from '../components/SectionReveal';
import GlassPanel from '../components/GlassPanel';
import StatusBadge from '../components/StatusBadge';
import { useMeta } from '../utils/useMeta';
import styles from './ApplicationsPage.module.css';

interface Application {
  name: string;
  description: string;
  status: 'Active' | 'In Development' | 'Coming Soon' | 'Sunset';
  url?: string;
  isExternal?: boolean;
}

const APPLICATIONS: Application[] = [
  {
    name: 'Away',
    description: 'Trip planning and group travel coordination.',
    status: 'In Development',
  },
  {
    name: 'Broadcast',
    description: 'Our internal tool that consolidates SMS efforts across apps.',
    status: 'In Development',
  },
  {
    name: 'Command Center',
    description: 'Admin dashboard for urgdstudios.com.',
    status: 'Active',
    url: '/command/dashboard',
  },
  {
    name: 'Gather',
    description: 'Private forms and order collection for small businesses.',
    status: 'In Development',
  },
  {
    name: 'Pulse',
    description: 'Structured feedback and peer review for creative work.',
    status: 'In Development',
  },
  {
    name: 'Stitch',
    description: 'Turn SVG designs into embroidery files.',
    status: 'Active',
    url: 'https://stitch.urgdstudios.com',
    isExternal: true,
  },
];

export default function ApplicationsPage() {
  useMeta({
    title: 'Applications — ur/gd Studios',
    description:
      'Applications built by ur/gd Studios. Tools we wish we had — some live, some on the way.',
    ogUrl: 'https://urgdstudios.com/applications/',
  });

  return (
    <ContentContainer>
      <PageHeader title="Applications" subtitle="What we're building" />

      <SectionReveal>
        <div className={styles.grid}>
          {APPLICATIONS.map((app) => {
            const isActive = app.status === 'Active' && !!app.url;

            const cardContent = (
              <GlassPanel interactive={isActive}>
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.appName}>{app.name}</span>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className={styles.description}>{app.description}</p>
                </div>
              </GlassPanel>
            );

            if (isActive && app.url) {
              if (app.isExternal) {
                return (
                  <a
                    key={app.name}
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${app.name} — ${app.description}. Opens in a new tab.`}
                    className={styles.cardLink}
                  >
                    {cardContent}
                  </a>
                );
              }

              return (
                <Link
                  key={app.name}
                  to={app.url}
                  aria-label={`${app.name} — ${app.description}`}
                  className={styles.cardLink}
                >
                  {cardContent}
                </Link>
              );
            }

            return <div key={app.name}>{cardContent}</div>;
          })}
        </div>
      </SectionReveal>
    </ContentContainer>
  );
}
