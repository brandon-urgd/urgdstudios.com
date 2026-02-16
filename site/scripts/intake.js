/**
 * Intake Form Submission Handler
 * Handles client-side validation, API submission, guidance box display, and feature flag checks
 */

(function() {
  'use strict';

  // Configuration
  const config = window.URGD_CONFIG || { intakeFormEnabled: false, apiBaseUrl: 'https://urgdstudios.com' };

  // DOM Elements
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');
  const successAlert = document.getElementById('success-alert');
  const errorAlert = document.getElementById('error-alert');
  const errorHeading = document.getElementById('error-heading');
  const errorMessage = document.getElementById('error-message');
  const guidanceContainer = document.getElementById('guidance-container');
  const flagOffFallback = document.getElementById('flag-off-fallback');

  const nameInput = document.getElementById('intake-name');
  const emailInput = document.getElementById('intake-email');
  const typeInput = document.getElementById('intake-type');
  const messageInput = document.getElementById('intake-message');

  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const typeError = document.getElementById('type-error');
  const messageError = document.getElementById('message-error');

  if (!form || !submitBtn) {
    return; // Elements not present on this page
  }

  // Feature flag check
  if (!config.intakeFormEnabled) {
    form.hidden = true;
    flagOffFallback.hidden = false;
    return;
  }

  // Guidance box content per type
  const guidanceContent = {
    'bug-report': `
      <div class="guidance-box">
        <p>A few things that help us investigate:</p>
        <ul>
          <li>Which app were you using?</li>
          <li>What were you trying to do?</li>
          <li>What happened instead?</li>
          <li>Steps to reproduce (optional)</li>
        </ul>
      </div>
    `,
    'abuse-report': `
      <div class="guidance-box guidance-box--sensitive">
        <p>Your report will be reviewed by our team. Please describe what happened, including any relevant details like which app or page was involved.</p>
      </div>
    `,
    'privacy-question': `
      <div class="guidance-box guidance-box--sensitive">
        <p>You may find your answer in our <a href="/privacy/" target="_blank" rel="noopener noreferrer">Privacy Policy<span class="sr-only"> (opens in new tab)</span></a>. If you still have a question, describe it below and we'll respond.</p>
      </div>
    `
  };

  // Type change handler — show/hide guidance box
  typeInput.addEventListener('change', () => {
    const type = typeInput.value;
    // Clear previous content
    guidanceContainer.textContent = '';
    
    if (guidanceContent[type]) {
      // Parse the static HTML content safely
      const parser = new DOMParser();
      const doc = parser.parseFromString(guidanceContent[type], 'text/html');
      // Move all body child nodes to the guidance container
      Array.from(doc.body.childNodes).forEach(node => {
        guidanceContainer.appendChild(node);
      });
    }
  });

  // Validation helpers
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function clearErrors() {
    [nameError, emailError, typeError, messageError].forEach(el => {
      el.hidden = true;
      el.textContent = '';
    });

    [nameInput, emailInput, typeInput, messageInput].forEach(el => {
      el.classList.remove('form-input--error');
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
    });
  }

  function showFieldError(input, errorEl, message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
    input.classList.add('form-input--error');
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', errorEl.id);
  }

  function validateForm() {
    clearErrors();
    let isValid = true;
    let firstInvalidField = null;

    // Name
    const name = nameInput.value.trim();
    if (!name || name.length < 1 || name.length > 200) {
      showFieldError(nameInput, nameError, 'Please enter your name.');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = nameInput;
    }

    // Email
    const email = emailInput.value.trim();
    if (!email || !validateEmail(email) || email.length > 200) {
      showFieldError(emailInput, emailError, 'Please enter a valid email address.');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = emailInput;
    }

    // Type
    const type = typeInput.value;
    if (!type) {
      showFieldError(typeInput, typeError, 'Please select a reason for reaching out.');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = typeInput;
    }

    // Message
    const message = messageInput.value.trim();
    if (!message || message.length < 1) {
      showFieldError(messageInput, messageError, 'Please enter a message.');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = messageInput;
    } else if (message.length > 5000) {
      showFieldError(messageInput, messageError, 'Your message is too long. Please keep it under 5,000 characters.');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = messageInput;
    }

    // Focus first invalid field
    if (!isValid && firstInvalidField) {
      firstInvalidField.focus();
    }

    return isValid;
  }

  function showSuccessAlert() {
    form.hidden = true;
    successAlert.hidden = false;
    errorAlert.hidden = true;
    successAlert.focus();
  }

  function showErrorAlert(heading, message) {
    errorHeading.textContent = heading;
    
    // Clear previous content
    errorMessage.textContent = '';
    
    // Parse message for mailto links and create DOM elements
    if (message.includes('<a href="mailto:')) {
      const parts = message.split(/(<a href="mailto:[^"]+">.*?<\/a>)/);
      parts.forEach(part => {
        if (part.startsWith('<a href="mailto:')) {
          // Extract email and text from the link
          const emailMatch = part.match(/mailto:([^"]+)/);
          const textMatch = part.match(/>([^<]+)<\/a>/);
          if (emailMatch && textMatch) {
            const link = document.createElement('a');
            link.href = `mailto:${emailMatch[1]}`;
            link.textContent = textMatch[1];
            errorMessage.appendChild(link);
          }
        } else if (part) {
          errorMessage.appendChild(document.createTextNode(part));
        }
      });
    } else {
      errorMessage.textContent = message;
    }
    
    errorAlert.hidden = false;
    successAlert.hidden = true;
    errorAlert.focus();
  }

  function setSubmitting(isSubmitting) {
    if (isSubmitting) {
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.textContent = 'Sending...';
    } else {
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
      submitBtn.textContent = 'Send';
    }
  }

  async function submitForm(e) {
    e.preventDefault();

    // Hide any previous alerts
    successAlert.hidden = true;
    errorAlert.hidden = true;

    // Validate
    if (!validateForm()) {
      return;
    }

    // Collect form data
    const formData = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      type: typeInput.value,
      message: messageInput.value.trim()
    };

    setSubmitting(true);

    try {
      const response = await fetch(`${config.apiBaseUrl}/v1/intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.message) {
          showSuccessAlert();
        } else {
          throw new Error('Invalid response format');
        }
      } else if (response.status === 429) {
        showErrorAlert(
          'Too many messages',
          'You\'ve sent several messages recently. Please wait a few minutes and try again, or reach us at <a href="mailto:admin@urgdstudios.com">admin@urgdstudios.com</a>.'
        );
        setSubmitting(false);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      showErrorAlert(
        'Something went wrong',
        'We weren\'t able to send your message. Please try again, or reach us directly at <a href="mailto:admin@urgdstudios.com">admin@urgdstudios.com</a>.'
      );
      setSubmitting(false);
    }
  }

  // Page show handler (handles back/forward cache)
  function resetFormState() {
    form.hidden = false;
    successAlert.hidden = true;
    errorAlert.hidden = true;
    setSubmitting(false);
    clearErrors();
  }

  // Event listeners
  form.addEventListener('submit', submitForm);
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      resetFormState();
    }
  });
})();
