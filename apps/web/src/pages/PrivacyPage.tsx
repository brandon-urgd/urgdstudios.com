import ContentContainer from '../components/ContentContainer';
import PageHeader from '../components/PageHeader';
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
      <ContentSection heading="">
        <p>Coming soon.</p>
      </ContentSection>
    </ContentContainer>
  );
}
