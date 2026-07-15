import type { Meta, StoryObj } from '@storybook/angular';
import { Shell } from './shell';

const meta: Meta<Shell> = {
  component: Shell,
  title: 'Shell',
};
export default meta;

type Story = StoryObj<Shell>;

export const Primary: Story = {
  args: {},
};
