import { render, screen } from '@testing-library/react';
import { AllTheProviders } from '@/__test__/test-utils';
import { ResponsibilityDisclaimer } from './ResponsibilityDisclaimer';

function renderWithIntl(component: React.ReactElement) {
  return render(component, {
    wrapper: ({ children }) => AllTheProviders({ children, locale: 'en' }),
  });
}

describe('ResponsibilityDisclaimer', () => {
  it('displays heading and text', () => {
    renderWithIntl(<ResponsibilityDisclaimer />);

    expect(screen.getByText(/Important Notice/i)).toBeInTheDocument();
    expect(screen.getByText(/These numbers are randomly generated/i)).toBeInTheDocument();
  });

  it('has warning styling', () => {
    const { container } = renderWithIntl(<ResponsibilityDisclaimer />);

    const disclaimerDiv = container.firstChild;
    expect(disclaimerDiv).toHaveClass('bg-warning/10', 'border-warning');
  });

  it('is always visible (not optional)', () => {
    renderWithIntl(<ResponsibilityDisclaimer />);

    const disclaimer = screen.getByText(/Important Notice/i).closest('div');
    expect(disclaimer).toBeVisible();
  });
});
