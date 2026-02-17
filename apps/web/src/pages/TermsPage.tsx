import ContentContainer from '../components/ContentContainer';
import PageHeader from '../components/PageHeader';
import ContentSection from '../components/ContentSection';
import { useMeta } from '../utils/useMeta';

export default function TermsPage() {
  useMeta({
    title: 'Terms of Service — ur/gd Studios',
    description: 'Terms of service for ur/gd Studios and its applications.',
  });

  return (
    <ContentContainer narrow>
      <PageHeader title="Terms of Service" />
      <ContentSection heading="">
        <p>Coming soon.</p>
      </ContentSection>
    </ContentContainer>
  );
}
