/**
 * Command Center labels registry.
 * All user-facing strings in one place — no hardcoded strings in components.
 */

export const labels = {

  // ── Login ──────────────────────────────────────────────────────────────────
  login: {
    title: 'Command Center',
    subtitle: 'ur/gd Studios Administration',
    signInButton: 'Sign In',
    signingInButton: 'Signing in...',
    forgotPassword: 'Forgot password?',
    logoAlt: 'ur/gd Studios logo',
    formAriaLabel: 'Sign in to Command Center',
    emailLabel: 'Email',
    emailPlaceholder: 'your@email.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Your password',
  },

  // ── New Password (FORCE_CHANGE_PASSWORD challenge) ────────────────────────
  newPassword: {
    heading: 'Set a new password',
    description: 'Your account requires a new password before you can continue.',
    newPasswordLabel: 'New password',
    confirmPasswordLabel: 'Confirm new password',
    submitButton: 'Set Password',
    submittingButton: 'Setting password...',
  },

  // ── Forgot Password ────────────────────────────────────────────────────────
  forgotPassword: {
    step1Heading: 'Reset your password',
    step1Description: "Enter your email address and we'll send you a verification code.",
    emailLabel: 'Email',
    sendCodeButton: 'Send Code',
    sendingCodeButton: 'Sending code...',
    backToSignIn: 'Back to Sign In',
    step2Heading: 'Check your email',
    step2Description: (email: string) => `Enter the code sent to ${email}`,
    codeLabel: 'Verification code',
    codePlaceholder: '123456',
    newPasswordLabel: 'New password',
    confirmPasswordLabel: 'Confirm new password',
    resetButton: 'Reset Password',
    resettingButton: 'Resetting...',
    sendCodeAgain: 'Send a new code',
    successMessage: 'Password reset. Please sign in with your new password.',
  },

  // ── Sidebar ────────────────────────────────────────────────────────────────
  sidebar: {
    navAriaLabel: 'Command Center navigation',
    messagesLink: 'Messages',
    signOut: 'Sign Out',
    themeToggleToDark: 'Switch to dark theme',
    themeToggleToLight: 'Switch to light theme',
    logoAlt: 'ur/gd Studios logo',
  },

  // ── Dashboard ──────────────────────────────────────────────────────────────
  dashboard: {
    pageTitle: 'Messages',
    noMessages: 'No messages yet.',
    noResults: 'No messages match your filters.',
    clearFilters: 'Clear filters',
    messageCount: (count: number) => `${count} message${count === 1 ? '' : 's'}`,
    filteredCount: (count: number) =>
      `${count} message${count === 1 ? '' : 's'} match your filters`,
    loadingAriaLabel: 'Loading messages',
  },

  // ── Filter Bar ─────────────────────────────────────────────────────────────
  filters: {
    categoryLabel: 'Category',
    statusLabel: 'Status',
    searchLabel: 'Search',
    searchPlaceholder: 'Search messages...',
    searchAriaLabel: 'Search messages',
    allCategories: 'All Categories',
    allStatuses: 'All Statuses',
    categories: {
      'general-inquiry': 'General',
      'feature-request': 'Feature Request',
      'bug-report': 'Bug Report',
      'privacy-question': 'Privacy',
      'report-abuse': 'Abuse Report',
    } as Record<string, string>,
    statuses: {
      new: 'New',
      'in-progress': 'In Progress',
      closed: 'Closed',
    } as Record<string, string>,
  },

  // ── Message Table ──────────────────────────────────────────────────────────
  table: {
    caption: 'Contact form messages',
    colDate: 'Date',
    colCategory: 'Category',
    colFrom: 'From',
    colPreview: 'Preview',
    colStatus: 'Status',
    colActionsHidden: 'Actions',
    rowAriaLabel: (name: string, category: string, status: string) =>
      `Message from ${name}, ${category}, ${status}`,
    deleteRowAriaLabel: (name: string) => `Delete message from ${name}`,
  },

  // ── Message Detail Modal ───────────────────────────────────────────────────
  detail: {
    closeButton: 'Close',
    fromLabel: 'From:',
    submittedLabel: 'Submitted:',
    replyHistoryHeading: 'Reply History',
    notFound: 'This message was not found. It may have been deleted or expired.',
    deleteButton: 'Delete',
  },

  // ── Status Control ─────────────────────────────────────────────────────────
  statusControl: {
    ariaLabel: 'Message status',
    new: 'New',
    inProgress: 'In Progress',
    closed: 'Closed',
    updatedAnnouncement: (status: string) => `Status updated to ${status}`,
  },

  // ── Reply Compose ──────────────────────────────────────────────────────────
  reply: {
    replyButton: 'Reply',
    cancelLink: 'Cancel',
    sendButton: 'Send',
    sendingButton: 'Sending...',
    textareaAriaLabel: (name: string) => `Reply to ${name}`,
    textareaPlaceholder: 'Write your reply...',
    historyItemAriaLabel: (date: string) => `Reply sent ${date}`,
    sentLabel: 'Sent',
    toLabel: 'To:',
  },

  // ── Confirm Dialog ─────────────────────────────────────────────────────────
  confirmDelete: {
    heading: 'Delete this message?',
    body: 'This cannot be undone.',
    cancelButton: 'Cancel',
    deleteButton: 'Delete',
    deletingButton: 'Deleting...',
  },

  // ── Toast Notifications ────────────────────────────────────────────────────
  toasts: {
    replySent: (email: string) => `Reply sent to ${email}`,
    messageDeleted: 'Message deleted',
    dismissAriaLabel: 'Dismiss notification',
  },

  // ── Errors ─────────────────────────────────────────────────────────────────
  errors: {
    incorrectCredentials: 'Incorrect email or password.',
    tooManyAttempts: 'Too many failed attempts. Try again later.',
    accountNotConfirmed: 'Account not confirmed. Contact the administrator.',
    passwordResetRequired:
      'Password reset required. Use the "Forgot password?" link below.',
    unableToConnect: 'Unable to connect. Check your internet connection.',
    invalidCode: 'Invalid or expired code. Request a new code.',
    passwordsDoNotMatch: 'Passwords do not match.',
    passwordPolicyViolation:
      'Password does not meet requirements. Use at least 8 characters with uppercase, lowercase, number, and symbol.',
    loadFailed: 'Something went wrong. Try again.',
    statusUpdateFailed: 'Failed to update status. Try again.',
    replyFailed: 'Failed to send reply. Your message has not been sent.',
    replyUnavailable: 'Reply is not available.',
    deleteFailed: 'Failed to delete message. Try again.',
    messageNotFound:
      'This message was not found. It may have been deleted or expired.',
    messageAlreadyDeleted:
      'Message not found. It may have already been deleted.',
    sessionExpired: 'Your session has expired. Please sign in again.',
    networkError: 'Unable to connect. Check your internet connection.',
    generic: 'Something went wrong. Try again.',
    retry: 'Retry',
  },

  // ── Applications Page ──────────────────────────────────────────────────────
  applications: {
    commandCenter: {
      name: 'ur/gd Command Center',
      description:
        'The admin dashboard for urgdstudios.com. Manage contact form submissions, update status, and reply via email — all without opening the AWS Console.',
      status: 'Live',
    },
  },

  // ── Empty States ───────────────────────────────────────────────────────────
  emptyState: {
    noMessagesHeading: 'No messages yet',
    noMessagesDescription: 'Contact form submissions will appear here.',
    noFilterResultsHeading: 'No results',
    noFilterResultsDescription: 'No messages match your current filters.',
    clearFiltersAction: 'Clear filters',
    errorHeading: 'Something went wrong',
    errorDescription: 'Unable to load messages. Check your connection.',
    retryAction: 'Try again',
  },

  // ── Accessibility ──────────────────────────────────────────────────────────
  a11y: {
    skipToContent: 'Skip to main content',
    sidebarToggleOpen: 'Open navigation menu',
    sidebarToggleClose: 'Close navigation menu',
    tableLoadingAriaLabel: 'Loading messages',
    dismissAlertAriaLabel: 'Dismiss alert',
  },

} as const;

export type Labels = typeof labels;

// ── Helper Functions ──────────────────────────────────────────────────────────

export function getCategoryLabel(type: string): string {
  return labels.filters.categories[type] ?? type;
}

export function getStatusLabel(status: string): string {
  return labels.filters.statuses[status] ?? status;
}

export function formatDateShort(timestamp: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));
}

export function formatDateLong(timestamp: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));
}

export function formatDateWithTime(timestamp: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}
