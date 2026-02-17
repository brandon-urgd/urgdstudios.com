/**
 * urgdstudios.com — Guidance Box Component
 *
 * Contextual help panel for specific inquiry types (bug report, abuse, privacy).
 * Appears below the Type dropdown with smooth reveal.
 */

import { Link } from 'react-router';
import styles from './GuidanceBox.module.css';

interface GuidanceBoxProps {
  type: string;
}

const GUIDANCE_CONTENT: Record<
  string,
  { text: string; linkText?: string; linkTo?: string }
> = {
  'bug-report': {
    text: 'Include steps to reproduce the issue, what you expected to happen, and what actually happened. If the issue involves a specific feature or data, include details.',
  },
  'report-abuse': {
    text: 'Urgent reports are prioritized. Include as much detail as possible — links, usernames, timestamps, and a description of the issue.',
  },
  'privacy-question': {
    text: 'See our Privacy policy for details on how we handle your data. For data export or deletion requests, include your account email.',
    linkText: 'Privacy policy',
    linkTo: '/privacy/',
  },
};

export default function GuidanceBox({ type }: GuidanceBoxProps) {
  const guidance = GUIDANCE_CONTENT[type];

  if (!guidance) {
    return null;
  }

  // Replace link placeholder in text
  let textParts: (string | React.ReactElement)[] = [guidance.text];

  if (guidance.linkText && guidance.linkTo) {
    const parts = guidance.text.split(guidance.linkText);
    textParts = [
      parts[0],
      <Link key="link" to={guidance.linkTo} className={styles.link}>
        {guidance.linkText}
      </Link>,
      parts[1],
    ];
  }

  return (
    <div className={styles.box} role="status">
      <p className={styles.text}>{textParts}</p>
    </div>
  );
}
