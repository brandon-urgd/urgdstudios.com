import ContentContainer from '../components/ContentContainer';
import PageHeader from '../components/PageHeader';
import SectionReveal from '../components/SectionReveal';
import GlassPanel from '../components/GlassPanel';
import StatusBadge from '../components/StatusBadge';
import { useMeta } from '../utils/useMeta';
import { useAuth } from '../hooks/useAuth';
import styles from './ApplicationsPage.module.css';

interface Application {
  name: string;
  description: string;
  status: 'Active' | 'In Development' | 'Coming Soon' | 'Sunset';
  url?: string;
}

const APPLICATIONS: Application[] = [
  {
    name: 'Broadcast',
    description: 'SMS and MMS broadcasting for communities and organizations.',
    status: 'In Development',
  },
  {
    name: 'Stitch',
    description: 'Turn SVG designs into embroidery files.',
    status: 'Active',
    url: 'https://stitch.urgdstudios.com',
  },
];

export default function ApplicationsPage() {
  const { isAuthenticated } = useAuth();

  useMeta({
    title: 'Applications — ur/gd Studios',
    description:
      'Applications built by ur/gd Studios. Tools we wish we had — some live, some on the way.',
    ogUrl: 'https://urgdstudios.com/applications/',
  });

  const commandCenterApp: Application | null = isAuthenticated
    ? {
        name: 'Command Center',
        description:
          'Admin dashboard for urgdstudios.com. Manage contact form submissions, update status, and reply via email.',
        status: 'Active',
        url: '/command/dashboard',
      }
    : null;

  const allApps = commandCenterApp
    ? [commandCenterApp, ...APPLICATIONS]
    : APPLICATIONS;

  return (
    <ContentContainer>
      <PageHeader title="Applications" subtitle="What we're building" />

      <SectionReveal>
        <div className={styles.grid}>
          {allApps.map((app) => {
            const isActive = app.status === 'Active' && !!app.url;
            const isExternal = app.url?.startsWith('http');

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
              return (
                <a
                  key={app.name}
                  href={app.url}
                  {...(isExternal
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                  aria-label={`${app.name} — ${app.description}${isExternal ? '. Opens in a new tab.' : ''}`}
                  className={styles.cardLink}
                >
                  {cardContent}
                </a>
              );
            }

            return <div key={app.name}>{cardContent}</div>;
          })}
        </div>
      </SectionReveal>
    </ContentContainer>
  );
}
