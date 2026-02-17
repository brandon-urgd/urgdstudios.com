import ContentContainer from '../components/ContentContainer';
import PageHeader from '../components/PageHeader';
import SectionReveal from '../components/SectionReveal';
import ContentSection from '../components/ContentSection';
import { useMeta } from '../utils/useMeta';

export default function PrivacyPage() {
  useMeta({
    title: 'Privacy — ur/gd Studios',
    description: 'Privacy policy for ur/gd Studios and its applications.',
  });

  return (
    <ContentContainer narrow>
      <PageHeader title="Privacy Policy" />
      <SectionReveal>
        <ContentSection heading="">
          <p>Coming soon.</p>
        </ContentSection>
      </SectionReveal>
    </ContentContainer>
  );
}
