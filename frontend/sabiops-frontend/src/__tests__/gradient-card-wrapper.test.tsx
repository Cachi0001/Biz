import { render, screen } from '@testing-library/react';
import { GradientCardWrapper, GradientCardVariants } from '../components/ui/gradient-card-wrapper';

describe('GradientCardWrapper Component', () => {
  test('renders children correctly', () => {
    render(
      <GradientCardWrapper>
        <div data-testid="test-content">Test Content</div>
      </GradientCardWrapper>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('applies default gradient classes', () => {
    const { container } = render(
      <GradientCardWrapper>
        <div>Content</div>
      </GradientCardWrapper>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('bg-gradient-to-r');
    expect(wrapper).toHaveClass('from-green-100');
    expect(wrapper).toHaveClass('to-green-200');
    expect(wrapper).toHaveClass('rounded-xl');
    expect(wrapper).toHaveClass('p-1');
  });

  test('applies custom gradient properties', () => {
    const { container } = render(
      <GradientCardWrapper
        gradientFrom="from-blue-100"
        gradientTo="to-purple-200"
        gradientDirection="bg-gradient-to-br"
        borderRadius="rounded-lg"
        padding="p-2"
      >
        <div>Content</div>
      </GradientCardWrapper>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('bg-gradient-to-br');
    expect(wrapper).toHaveClass('from-blue-100');
    expect(wrapper).toHaveClass('to-purple-200');
    expect(wrapper).toHaveClass('rounded-lg');
    expect(wrapper).toHaveClass('p-2');
  });

  test('applies custom className', () => {
    const { container } = render(
      <GradientCardWrapper className="custom-class shadow-lg">
        <div>Content</div>
      </GradientCardWrapper>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
    expect(wrapper).toHaveClass('shadow-lg');
  });

  test('inner container has correct classes', () => {
    render(
      <GradientCardWrapper
        innerBackground="bg-gray-50"
        innerBorderRadius="rounded-md"
      >
        <div data-testid="inner-content">Content</div>
      </GradientCardWrapper>
    );

    const innerContainer = screen.getByTestId('inner-content').parentElement;
    expect(innerContainer).toHaveClass('bg-gray-50');
    expect(innerContainer).toHaveClass('rounded-md');
  });

  test('passes through additional props', () => {
    const { container } = render(
      <GradientCardWrapper data-testid="wrapper" role="region">
        <div>Content</div>
      </GradientCardWrapper>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveAttribute('data-testid', 'wrapper');
    expect(wrapper).toHaveAttribute('role', 'region');
  });
});

describe('GradientCardVariants', () => {
  test('primary variant has correct gradient colors', () => {
    const PrimaryCard = GradientCardVariants.primary;
    const { container } = render(
      <PrimaryCard>
        <div>Primary Content</div>
      </PrimaryCard>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('from-green-100');
    expect(wrapper).toHaveClass('to-green-200');
  });

  test('secondary variant has correct gradient colors', () => {
    const SecondaryCard = GradientCardVariants.secondary;
    const { container } = render(
      <SecondaryCard>
        <div>Secondary Content</div>
      </SecondaryCard>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('from-blue-100');
    expect(wrapper).toHaveClass('to-blue-200');
  });

  test('accent variant has correct gradient colors', () => {
    const AccentCard = GradientCardVariants.accent;
    const { container } = render(
      <AccentCard>
        <div>Accent Content</div>
      </AccentCard>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('from-green-200');
    expect(wrapper).toHaveClass('to-teal-200');
  });

  test('warning variant has correct gradient colors', () => {
    const WarningCard = GradientCardVariants.warning;
    const { container } = render(
      <WarningCard>
        <div>Warning Content</div>
      </WarningCard>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('from-orange-100');
    expect(wrapper).toHaveClass('to-orange-200');
  });

  test('success variant has correct gradient colors', () => {
    const SuccessCard = GradientCardVariants.success;
    const { container } = render(
      <SuccessCard>
        <div>Success Content</div>
      </SuccessCard>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('from-emerald-100');
    expect(wrapper).toHaveClass('to-emerald-200');
  });

  test('neutral variant has correct gradient colors', () => {
    const NeutralCard = GradientCardVariants.neutral;
    const { container } = render(
      <NeutralCard>
        <div>Neutral Content</div>
      </NeutralCard>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('from-gray-100');
    expect(wrapper).toHaveClass('to-gray-200');
  });

  test('premium variant has correct gradient colors', () => {
    const PremiumCard = GradientCardVariants.premium;
    const { container } = render(
      <PremiumCard>
        <div>Premium Content</div>
      </PremiumCard>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('from-purple-100');
    expect(wrapper).toHaveClass('to-purple-200');
  });

  test('variants accept additional props', () => {
    const PrimaryCard = GradientCardVariants.primary;
    render(
      <PrimaryCard className="extra-class" data-testid="variant-test">
        <div>Content</div>
      </PrimaryCard>
    );

    const wrapper = screen.getByTestId('variant-test');
    expect(wrapper).toHaveClass('extra-class');
    expect(wrapper).toHaveAttribute('data-testid', 'variant-test');
  });
});