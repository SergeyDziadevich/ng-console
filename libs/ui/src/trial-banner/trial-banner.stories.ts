import type { Meta, StoryObj } from '@storybook/angular';
import { TrialBanner } from './trial-banner';

const meta: Meta<TrialBanner> = {
  component: TrialBanner,
  title: 'TrialBanner',
};
export default meta;

type Story = StoryObj<TrialBanner>;

export const Primary: Story = {
  args: {},
};
