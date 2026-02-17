import ContentContainer from '../components/ContentContainer';
import PageHeader from '../components/PageHeader';
import SectionReveal from '../components/SectionReveal';
import ContentSection from '../components/ContentSection';
import { useMeta } from '../utils/useMeta';

export default function LegalPage() {
  useMeta({
    title: 'Legal — ur/gd Studios',
    description: 'Legal information for ur/gd Studios LLC.',
  });

  return (
    <ContentContainer narrow>
      <PageHeader title="Legal" />
      <SectionReveal>
        <ContentSection heading="">
          <p>Coming soon.</p>
        </ContentSection>
      </SectionReveal>
    </ContentContainer>
  );
}
