import ContentContainer from '../components/ContentContainer';
import PageHeader from '../components/PageHeader';
import SectionReveal from '../components/SectionReveal';
import ContentSection from '../components/ContentSection';
import { useMeta } from '../utils/useMeta';

export default function TermsPage() {
  useMeta({
    title: 'Terms of Service — ur/gd Studios',
    description: 'Terms of service for ur/gd Studios and its applications.',
    ogUrl: 'https://urgdstudios.com/terms/',
  });

  return (
    <ContentContainer narrow>
      <PageHeader title="Terms of Service" />
      <SectionReveal>
        <ContentSection heading="">
          <p>Coming soon.</p>
        </ContentSection>
      </SectionReveal>
    </ContentContainer>
  );
}
